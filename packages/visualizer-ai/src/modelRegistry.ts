/**
 * Model registry (visualizer spec §19, §21).
 * Artifacts are self-hosted at /visualizer-models/ and populated by
 * scripts/ai/prepare-models.mjs. The registry records license + provenance
 * for every artifact; nothing is fetched from third-party hosts at runtime.
 */

export type ModelId = "mobilesam-encoder" | "mobilesam-decoder";

export interface ModelDescriptor {
  id: ModelId;
  url: string;
  bytes?: number;
  sha256?: string;
  license: "Apache-2.0";
  source: string;
  /** wasm/js assets ORT needs when running this model (served same-origin). */
  runtimeAssets: string[];
}

export const MODEL_REGISTRY: Record<ModelId, ModelDescriptor> = {
  "mobilesam-encoder": {
    id: "mobilesam-encoder",
    url: "/visualizer-models/mobile-sam/encoder.onnx",
    license: "Apache-2.0",
    source: "https://github.com/ChaoningZhang/MobileSAM (export via scripts/export_onnx_model.py)",
    runtimeAssets: [
      "/visualizer-wasm/ort-wasm-simd-threaded.jsep.wasm",
      "/visualizer-wasm/ort-wasm-simd-threaded.jsep.mjs",
    ],
  },
  "mobilesam-decoder": {
    id: "mobilesam-decoder",
    url: "/visualizer-models/mobile-sam/decoder.onnx",
    license: "Apache-2.0",
    source: "https://github.com/ChaoningZhang/MobileSAM (export via scripts/export_onnx_model.py)",
    runtimeAssets: [
      "/visualizer-wasm/ort-wasm-simd-threaded.jsep.wasm",
      "/visualizer-wasm/ort-wasm-simd-threaded.jsep.mjs",
    ],
  },
};

export interface ArtifactAvailability {
  available: boolean;
  missing: string[];
}

/** HEAD-check every artifact; the UI uses this to hide Smart Select gracefully. */
export async function verifyArtifacts(): Promise<ArtifactAvailability> {
  const missing: string[] = [];
  const urls = [
    ...Object.values(MODEL_REGISTRY).map((m) => m.url),
    ...MODEL_REGISTRY["mobilesam-encoder"].runtimeAssets,
  ];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) missing.push(url);
      } catch {
        missing.push(url);
      }
    })
  );
  return { available: missing.length === 0, missing };
}
