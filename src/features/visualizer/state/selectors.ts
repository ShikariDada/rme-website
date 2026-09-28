import {
  applyH,
  homographyFromQuad,
  calibrationFromImagePoints,
  scaleFromCalibrationLine,
  approximateScale,
  validateQuad,
  type Point,
} from "@visualizer/engine";
import type { VisualizerMaterial } from "@visualizer/engine";
import type { VisualizerProject, VisualizerSurface } from "../state/types";
import type { SurfaceRenderState } from "../bridge/rendererTypes";

/**
 * Derives GPU render state from project state (the bridge between React and
 * the engine). Pure — unit tested in tests/unit/visualizer-state.test.ts.
 */

export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.72, 0.7, 0.66];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export interface MaskIllumSources {
  maskSources: Record<string, TexImageSource | undefined>;
  illumSources: Record<string, TexImageSource | null>;
}

export function buildSurfaceRenderStates(
  project: VisualizerProject,
  materials: Map<string, VisualizerMaterial>,
  sources: MaskIllumSources
): SurfaceRenderState[] {
  const out: SurfaceRenderState[] = [];
  project.surfaces.forEach((surface, index) => {
    if (!surface.materialId) return;
    const material = materials.get(surface.materialId);
    if (!material) return;

    const quad = surface.planeQuad.map((p) => ({ x: p.x, y: p.y })) as Point[];
    if (!validateQuad(quad).ok) return;

    let H: number[];
    try {
      H = homographyFromQuad(quad);
    } catch {
      return; // degenerate — skip until user corrects
    }

    // Scale: calibration (mm from a user-measured line) or approximate.
    let mmPerUnitX: number;
    let mmPerUnitY: number;
    try {
      if (surface.calibration && surface.layout.scaleMode === "calibrated") {
        const line = calibrationFromImagePoints(
          H,
          surface.calibration.p1,
          surface.calibration.p2,
          surface.calibration.realLengthMm,
          surface.calibration.quality
        );
        const scale = scaleFromCalibrationLine(line);
        mmPerUnitX = scale.mmPerUnitX;
        mmPerUnitY = scale.mmPerUnitY;
      } else {
        const scale = approximateScale(
          surface.layout.approximateTilesAcross ?? 4,
          material.widthMm
        );
        mmPerUnitX = scale.mmPerUnitX;
        mmPerUnitY = scale.mmPerUnitY;
      }
    } catch {
      mmPerUnitX = approximateScale(4, material.widthMm).mmPerUnitX;
      mmPerUnitY = mmPerUnitX;
    }

    // Map layout type to engine-supported patterns (v1 set).
    const layoutType =
      surface.layout.type === "straight" ||
      surface.layout.type === "running-half" ||
      surface.layout.type === "running-third" ||
      surface.layout.type === "diagonal"
        ? surface.layout.type
        : "straight";

    const groutWidthMm =
      surface.layout.scaleMode === "calibrated"
        ? surface.grout.widthMm ?? 3
        : Math.max(
            1,
            (surface.grout.approximateWidthPx ?? 4) *
              (mmPerUnitX / Math.max(project.room.widthPx, 1)) *
              3
          );

    out.push({
      surfaceId: surface.id,
      planeQuad: surface.planeQuad,
      H,
      mmPerUnitX,
      mmPerUnitY,
      scaleMode:
        surface.calibration && surface.layout.scaleMode === "calibrated"
          ? "calibrated"
          : "approximate",
      maskSource: sources.maskSources[surface.maskAssetId] as TexImageSource,
      illumSource: sources.illumSources[surface.id] ?? null,
      material,
      layout: {
        type: layoutType,
        rotationDeg: surface.layout.rotationDeg,
        originUmm: surface.layout.originU * mmPerUnitX,
        originVmm: surface.layout.originV * mmPerUnitY,
      },
      grout: {
        enabled: surface.grout.enabled,
        colorRgb: hexToRgb01(surface.grout.color),
        widthMm: groutWidthMm,
        approximateWidthPx: surface.grout.approximateWidthPx ?? 4,
      },
      render: {
        shadingStrength: surface.render.shadingStrength,
        highlightStrength: surface.render.highlightStrength,
        exposureAdjust: surface.render.exposureAdjust,
        featherPx: surface.render.featherPx,
      },
      z: index,
      enabled: true,
    });
  });
  return out;
}

/** Convenience: image point normalized + y-flip safety for handle inputs. */
export function applyPlaneInverse(
  H: number[],
  imagePoint: { x: number; y: number }
): Point {
  return applyH(H, imagePoint);
}

export function surfaceSummary(surface: VisualizerSurface): string {
  return `${surface.name} (${surface.type})`;
}
