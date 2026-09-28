/**
 * Device capability detection (visualizer spec §23, §19.3).
 * WebGPU does NOT require crossOriginIsolated; only wasm threads do — and we
 * run single-threaded wasm, so no COOP/COEP is needed (keeps third-party
 * embeds safe, spec §24).
 */

export interface DeviceCapability {
  hasWebGPU: boolean;
  webgpuAdapter: Promise<boolean>;
  crossOriginIsolated: boolean;
  deviceMemoryGB: number | undefined;
}

export function detectCapability(): DeviceCapability {
  if (typeof navigator === "undefined") {
    return {
      hasWebGPU: false,
      webgpuAdapter: Promise.resolve(false),
      crossOriginIsolated: false,
      deviceMemoryGB: undefined,
    };
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const hasWebGPU = "gpu" in navigator;
  const webgpuAdapter = (async () => {
    if (!hasWebGPU) return false;
    try {
      const gpu = (navigator as Navigator & { gpu: { requestAdapter(): Promise<unknown> } }).gpu;
      const adapter = await gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  })();
  return {
    hasWebGPU,
    webgpuAdapter,
    crossOriginIsolated:
      typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : false,
    deviceMemoryGB: nav.deviceMemory,
  };
}
