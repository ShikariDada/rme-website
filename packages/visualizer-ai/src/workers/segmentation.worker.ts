import { MobileSamSegmenter, type PromptPoint } from "../segmentation/mobileSam";

/**
 * Dedicated inference worker (visualizer spec §19.4): model download,
 * encoding and refinement never block the UI thread. Protocol is plain
 * postMessage with transferable buffers.
 */

export type SegmentWorkerRequest =
  | { type: "init" }
  | { type: "set-image"; bitmap: ImageBitmap }
  | { type: "segment"; reqId: number; points: PromptPoint[]; imageW: number; imageH: number }
  | { type: "dispose" };

export type SegmentWorkerResponse =
  | { type: "progress"; phase: "fetch-encoder" | "fetch-decoder" | "compile"; fraction: number }
  | { type: "ready"; provider: "webgpu" | "wasm" }
  | { type: "init-failed"; message: string }
  | { type: "mask"; reqId: number; mask: Uint8ClampedArray; width: number; height: number }
  | { type: "segment-failed"; reqId: number; message: string }
  | { type: "disposed" };

let segmenter: MobileSamSegmenter | null = null;

/** Worker-scope postMessage (2-arg transfer form) under DOM typings. */
const ctx = self as unknown as {
  postMessage(message: unknown, transfer?: Transferable[]): void;
  onmessage: ((event: MessageEvent<SegmentWorkerRequest>) => void) | null;
};

ctx.onmessage = async (event: MessageEvent<SegmentWorkerRequest>) => {
  const msg = event.data;
  try {
    switch (msg.type) {
      case "init": {
        if (segmenter) {
          ctx.postMessage({ type: "ready", provider: segmenter.executionProvider } satisfies SegmentWorkerResponse);
          return;
        }
        try {
          segmenter = await MobileSamSegmenter.create((phase, fraction) =>
            ctx.postMessage({ type: "progress", phase, fraction } satisfies SegmentWorkerResponse)
          );
          ctx.postMessage({ type: "ready", provider: segmenter.executionProvider } satisfies SegmentWorkerResponse);
        } catch (err) {
          segmenter = null;
          ctx.postMessage({
            type: "init-failed",
            message: err instanceof Error ? err.message : "Model init failed",
          } satisfies SegmentWorkerResponse);
        }
        return;
      }
      case "set-image": {
        if (!segmenter) throw new Error("Call init first");
        await segmenter.setImage(msg.bitmap);
        return;
      }
      case "segment": {
        if (!segmenter) throw new Error("Call init first");
        const result = await segmenter.segment(msg.points, msg.imageW, msg.imageH);
        ctx.postMessage(
          {
            type: "mask",
            reqId: msg.reqId,
            mask: result.mask,
            width: result.width,
            height: result.height,
          } satisfies SegmentWorkerResponse,
          [result.mask.buffer]
        );
        return;
      }
      case "dispose": {
        await segmenter?.dispose();
        segmenter = null;
        ctx.postMessage({ type: "disposed" } satisfies SegmentWorkerResponse);
        return;
      }
    }
  } catch (err) {
    if (msg.type === "segment") {
      ctx.postMessage({
        type: "segment-failed",
        reqId: msg.reqId,
        message: err instanceof Error ? err.message : "Segmentation failed",
      } satisfies SegmentWorkerResponse);
    } else if (msg.type === "set-image") {
      ctx.postMessage({
        type: "init-failed",
        message: err instanceof Error ? err.message : "Image encoding failed",
      } satisfies SegmentWorkerResponse);
    }
  }
};
