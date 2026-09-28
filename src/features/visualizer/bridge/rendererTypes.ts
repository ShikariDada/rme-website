import type { VisualizerMaterial } from "@visualizer/engine";

/**
 * Bridge types between React UI (src/features/visualizer) and the rendering
 * engine (packages/visualizer-engine). THIS IS THE CONTRACT — the UI agent and
 * the engine agent both code against these shapes; do not change them without
 * updating docs/CONTRACTS.md.
 */

/** Everything the GPU needs for one surface, derived from project state. */
export interface SurfaceRenderState {
  surfaceId: string;
  /** Room-normalized quad, CW order TL,TR,BR,BL. */
  planeQuad: { x: number; y: number }[];
  /** Plane unit-square → image homography (engine computes inverse internally). */
  H: number[]; // 9 values row-major
  /** mm per plane unit (calibration or approximate). */
  mmPerUnitX: number;
  mmPerUnitY: number;
  scaleMode: "calibrated" | "approximate";
  /** Mask bitmap reference (ImageBitmap/HTMLCanvasElement), same orientation as room. */
  maskSource: TexImageSource;
  /** Illumination map (from engine computeIlluminationMap), RGBA. */
  illumSource: TexImageSource | null;
  material: VisualizerMaterial;
  layout: {
    type: "straight" | "running-half" | "running-third" | "diagonal";
    rotationDeg: number;
    originUmm: number;
    originVmm: number;
  };
  grout: {
    enabled: boolean;
    colorRgb: [number, number, number];
    widthMm: number;
    approximateWidthPx: number;
  };
  render: {
    shadingStrength: number;
    highlightStrength: number;
    exposureAdjust: number;
    featherPx: number;
  };
  z: number;
  enabled: boolean;
}

export interface LoadedMaterialAtlas {
  release(): void;
}

export interface EngineCapabilities {
  webgl2: boolean;
  maxTextureSize: number;
  maxAnisotropy: number;
  renderer: string;
}

export interface ContextLossHandlers {
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

/**
 * Imperative renderer facade. React commits semantic state; this class
 * handles GPU resources and never triggers React re-renders.
 */
export interface IVisualizerRenderer {
  readonly capabilities: EngineCapabilities;
  /** Set/replace the room image (working-resolution bitmap). */
  setRoom(source: TexImageSource, widthPx: number, heightPx: number): void;
  /** Load or replace a material's texture atlas; returns a dispose handle. */
  setMaterialAtlas(
    materialId: string,
    faceSources: TexImageSource[],
    cols?: number,
    rows?: number
  ): Promise<LoadedMaterialAtlas>;
  /** Full scene update (diffing is internal). */
  setSurfaces(states: SurfaceRenderState[]): void;
  /** Compare-mode split: 0..1, or null to disable. */
  setCompareSplit(split: number | null): void;
  requestRender(): void;
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  dispose(): void;
}

/** High-resolution export (spec §32): same normalized scene, separate pass. */
export interface IExportRenderer {
  render(options: {
    surfaceStates: SurfaceRenderState[];
    roomSource: TexImageSource;
    roomWidthPx: number;
    roomHeightPx: number;
    targetLongEdge: number;
    compareSplit: number | null;
    onProgress?: (fraction: number) => void;
  }): Promise<Blob>;
}
