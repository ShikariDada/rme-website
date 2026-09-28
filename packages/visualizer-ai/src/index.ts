export {
  detectCapability,
  type DeviceCapability,
} from "./capability";
export {
  MODEL_REGISTRY,
  verifyArtifacts,
  type ModelDescriptor,
  type ModelId,
  type ArtifactAvailability,
} from "./modelRegistry";
export { loadOrt, createSession, fetchModelBuffer, type ExecutionProvider } from "./ortRuntime";
export {
  MobileSamSegmenter,
  type PromptPoint,
  type SegmentationMask,
} from "./segmentation/mobileSam";
export type {
  SegmentWorkerRequest,
  SegmentWorkerResponse,
} from "./workers/segmentation.worker";

/**
 * SmartSelectClient — main-thread facade over the segmentation worker
 * (visualizer spec §47). Returns null whenever anything is unavailable so
 * the deterministic manual core keeps working everywhere (spec §0.5, §13).
 */
export class SmartSelectClient {
  private worker: Worker | null = null;
  private nextReqId = 1;
  private pending = new Map<
    number,
    { resolve: (mask: { mask: Uint8ClampedArray; width: number; height: number }) => void; reject: (e: Error) => void }
  >();
  private progressHandler:
    | ((phase: "fetch-encoder" | "fetch-decoder" | "compile", fraction: number) => void)
    | null = null;

  static async create(
    onProgress?: (phase: "fetch-encoder" | "fetch-decoder" | "compile", fraction: number) => void
  ): Promise<SmartSelectClient | null> {
    try {
      const { verifyArtifacts } = await import("./modelRegistry");
      const availability = await verifyArtifacts();
      if (!availability.available) return null; // artifacts not deployed → manual mode

      const client = new SmartSelectClient();
      client.worker = new Worker(
        new URL("./workers/segmentation.worker.ts", import.meta.url),
        { type: "module" }
      );
      client.progressHandler = onProgress ?? null;
      client.worker.onmessage = (event: MessageEvent) => client.handleMessage(event.data);

      const ready = await new Promise<boolean>((resolve) => {
        const timeout = window.setTimeout(() => resolve(false), 60_000);
        client.readyResolve = (ok) => {
          window.clearTimeout(timeout);
          resolve(ok);
        };
        client.worker!.postMessage({ type: "init" });
      });
      if (!ready) {
        client.dispose();
        return null;
      }
      return client;
    } catch {
      return null;
    }
  }

  private readyResolve: ((ok: boolean) => void) | null = null;

  private handleMessage(data: unknown): void {
    const msg = data as {
      type: string;
      phase?: string;
      fraction?: number;
      provider?: string;
      reqId?: number;
      mask?: Uint8ClampedArray;
      width?: number;
      height?: number;
      message?: string;
    };
    switch (msg.type) {
      case "progress":
        this.progressHandler?.(
          msg.phase as "fetch-encoder" | "fetch-decoder" | "compile",
          msg.fraction ?? 0
        );
        break;
      case "ready":
        this.readyResolve?.(true);
        break;
      case "init-failed":
        this.readyResolve?.(false);
        break;
      case "mask": {
        const entry = this.pending.get(msg.reqId!);
        if (entry) {
          this.pending.delete(msg.reqId!);
          entry.resolve({ mask: msg.mask!, width: msg.width!, height: msg.height! });
        }
        break;
      }
      case "segment-failed": {
        const entry = this.pending.get(msg.reqId!);
        if (entry) {
          this.pending.delete(msg.reqId!);
          entry.reject(new Error(msg.message ?? "Segmentation failed"));
        }
        break;
      }
    }
  }

  get isReady(): boolean {
    return this.worker !== null;
  }

  /** Send the room image to the worker (transfers the bitmap buffer). */
  setImage(bitmap: ImageBitmap): void {
    this.worker?.postMessage({ type: "set-image", bitmap }, [bitmap]);
  }

  segment(
    points: { x: number; y: number; label: 0 | 1 }[],
    imageW: number,
    imageH: number
  ): Promise<{ mask: Uint8ClampedArray; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Smart Select not ready"));
        return;
      }
      const reqId = this.nextReqId++;
      this.pending.set(reqId, { resolve, reject });
      this.worker.postMessage({ type: "segment", reqId, points, imageW, imageH });
    });
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}
