import type { Point } from "@visualizer/engine";

/**
 * Visualizer project/scene model (visualizer spec §9).
 * Serializable, versioned for migration. Editor state must NEVER live only in
 * React component state — this object is the source of truth.
 */

export interface VisualizerPoint {
  x: number;
  y: number;
}

export type SurfaceType = "floor" | "wall" | "counter" | "other";

export interface VisualizerSurface {
  id: string;
  name: string;
  type: SurfaceType;

  /** Visible boundary in room-normalized coordinates (0..1). */
  polygon?: VisualizerPoint[];

  /** Opaque id of the mask bitmap (IndexedDB/OPFS ref), rasterized at working res. */
  maskAssetId: string;
  /** In-memory mask version — bump to invalidate renderer texture. */
  maskVersion: number;

  /** Projective mapping quad, clockwise order TL,TR,BR,BL, room-normalized. */
  planeQuad: [VisualizerPoint, VisualizerPoint, VisualizerPoint, VisualizerPoint];

  calibration?: {
    p1: VisualizerPoint; // image-space point
    p2: VisualizerPoint;
    realLengthMm: number;
    quality: "user-measured" | "known-object" | "approximate";
  };

  materialId?: string;

  layout: {
    type: "straight" | "running-half" | "running-third" | "diagonal" | "herringbone" | "chevron" | "custom";
    rotationDeg: number;
    originU: number; // pattern origin offset in plane units
    originV: number;
    scaleMode: "calibrated" | "approximate";
    /** approximate mode: how many tile widths span the plane's U axis */
    approximateTilesAcross?: number;
  };

  grout: {
    color: string; // hex
    widthMm?: number; // calibrated mode
    approximateWidthPx?: number; // approximate mode
    enabled: boolean;
  };

  render: {
    shadingStrength: number; // 0..1.2
    highlightStrength: number; // 0..1
    exposureAdjust: number; // EV, -1..1
    featherPx: number;
  };
}

export interface CompareState {
  enabled: boolean;
  split: number; // 0..1
  /** Alternative layout/grout/material overrides for the B side. */
  alternativeMaterialId?: string;
  alternativeLayoutType?: VisualizerSurface["layout"]["type"];
  alternativeGroutColor?: string;
}

export interface VisualizerProject {
  version: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;

  room: {
    /** OPFS/IndexedDB asset id of the original photo blob. */
    originalAssetId: string;
    widthPx: number;
    heightPx: number;
    orientation: number;
  };

  surfaces: VisualizerSurface[];
  selectedSurfaceId?: string;

  compare?: CompareState;
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function createEmptySurface(type: SurfaceType = "floor"): VisualizerSurface {
  // Default plane quad: a plausible mid-room floor trapezoid.
  const quad: [VisualizerPoint, VisualizerPoint, VisualizerPoint, VisualizerPoint] =
    type === "wall"
      ? [
          { x: 0.1, y: 0.1 },
          { x: 0.9, y: 0.1 },
          { x: 0.9, y: 0.55 },
          { x: 0.1, y: 0.55 },
        ]
      : [
          { x: 0.05, y: 0.55 },
          { x: 0.95, y: 0.6 },
          { x: 0.95, y: 0.95 },
          { x: 0.05, y: 0.95 },
        ];
  return {
    id: newId("surf"),
    name: type === "wall" ? "Wall" : "Floor",
    type,
    maskAssetId: newId("mask"),
    maskVersion: 0,
    planeQuad: quad,
    layout: {
      type: "running-half",
      rotationDeg: 0,
      originU: 0,
      originV: 0,
      scaleMode: "approximate",
      approximateTilesAcross: 4,
    },
    grout: {
      color: "#b8b2a6",
      widthMm: 3,
      approximateWidthPx: 4,
      enabled: true,
    },
    render: {
      shadingStrength: 0.85,
      highlightStrength: 0.6,
      exposureAdjust: 0,
      featherPx: 1.5,
    },
  };
}
