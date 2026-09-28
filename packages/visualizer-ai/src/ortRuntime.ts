/**
 * ONNX Runtime Web bootstrap (visualizer spec §4.3, §19.3).
 * Dynamic import only — never evaluated during a Next.js build or on pages
 * that don't invoke Smart Select. wasm assets are served same-origin from
 * /visualizer-wasm/ (copied by scripts/ai/prepare-models.mjs).
 */

type OrtModule = typeof import("onnxruntime-web/webgpu");

let ortPromise: Promise<OrtModule> | null = null;

export function loadOrt(): Promise<OrtModule> {
  ortPromise ??= (async () => {
    const ort = await import("onnxruntime-web/webgpu");
    ort.env.wasm.wasmPaths = "/visualizer-wasm/";
    // No COOP/COEP on this site → single-threaded wasm fallback.
    ort.env.wasm.numThreads = 1;
    ort.env.logLevel = "error";
    return ort;
  })();
  return ortPromise;
}

export type ExecutionProvider = "webgpu" | "wasm";

/** Create a session preferring webgpu, falling back to wasm on failure. */
export async function createSession(
  modelBuffer: ArrayBuffer,
  preferred: ExecutionProvider = "webgpu"
): Promise<{ session: import("onnxruntime-web/webgpu").InferenceSession; provider: ExecutionProvider }> {
  const ort = await loadOrt();
  if (preferred === "webgpu") {
    try {
      const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ["webgpu"],
      });
      return { session, provider: "webgpu" };
    } catch {
      // fall through to wasm
    }
  }
  const session = await ort.InferenceSession.create(modelBuffer, {
    executionProviders: ["wasm"],
  });
  return { session, provider: "wasm" };
}

/** Simple OPFS cache for model buffers (falls back to memory). */
const memoryCache = new Map<string, ArrayBuffer>();

export async function fetchModelBuffer(
  url: string,
  onProgress?: (fraction: number) => void
): Promise<ArrayBuffer> {
  const cached = memoryCache.get(url);
  if (cached) return cached;

  try {
    if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle("model-cache", { create: true });
      const name = url.replace(/[^a-z0-9.]+/gi, "_");
      const handle = await dir.getFileHandle(name).catch(() => null);
      if (handle) {
        const file = await (handle as FileSystemFileHandle).getFile();
        const buf = await file.arrayBuffer();
        memoryCache.set(url, buf);
        onProgress?.(1);
        return buf;
      }
    }
  } catch {
    // cache miss → stream normally
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Model fetch failed: ${url} (${res.status})`);
  const total = Number(res.headers.get("content-length") ?? 0);
  if (!res.body || !total) {
    const buf = await res.arrayBuffer();
    onProgress?.(1);
    memoryCache.set(url, buf);
    return buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(received / total);
  }
  const buf = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.length;
  }
  const result = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  // Best-effort OPFS write for next time.
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle("model-cache", { create: true });
      const name = url.replace(/[^a-z0-9.]+/gi, "_");
      const fileHandle = await dir.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(result);
      await writable.close();
    }
  } catch {
    // storage full → skip caching
  }
  memoryCache.set(url, result);
  return result;
}
