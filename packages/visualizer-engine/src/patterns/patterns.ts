/**
 * Pattern engine — reference implementation of the tile-cell mapping that the
 * GLSL shader mirrors exactly (visualizer spec §13).
 *
 * Pattern calculation happens in MATERIAL/world coordinates (millimetres)
 * BEFORE homography — never in destination screen space — so joints follow
 * perspective correctly.
 *
 * v1 layouts: straight, running-half, running-third, diagonal (straight at
 * 45°). v2 (feature-flagged): herringbone, chevron, bookmatch.
 */

export type LayoutType =
  | "straight"
  | "running-half"
  | "running-third"
  | "diagonal"
  | "herringbone"
  | "chevron";

export const V1_LAYOUTS: LayoutType[] = [
  "straight",
  "running-half",
  "running-third",
  "diagonal",
];

export interface PatternConfig {
  layout: LayoutType;
  /** Whole-pattern rotation in degrees (diagonal = straight at 45). */
  rotationDeg: number;
  /** Pattern origin offset in millimetres (for nudging joint placement). */
  originUmm: number;
  originVmm: number;
}

export interface TileSizeMm {
  widthMm: number;
  heightMm: number;
}

export interface PatternUniforms {
  rotationRad: number;
  rowOffset: number; // 0 | 0.5 | 1/3 (fraction of tile width per row)
  offsetModulus: number; // 2 for half, 3 for third, 1 = no offset
}

export function patternUniforms(config: PatternConfig): PatternUniforms {
  const rotationDeg =
    config.layout === "diagonal" ? config.rotationDeg + 45 : config.rotationDeg;
  const offsets: Record<LayoutType, { rowOffset: number; modulus: number }> = {
    straight: { rowOffset: 0, modulus: 1 },
    diagonal: { rowOffset: 0, modulus: 1 },
    "running-half": { rowOffset: 0.5, modulus: 2 },
    "running-third": { rowOffset: 1 / 3, modulus: 3 },
    herringbone: { rowOffset: 0, modulus: 1 },
    chevron: { rowOffset: 0, modulus: 1 },
  };
  return {
    rotationRad: (rotationDeg * Math.PI) / 180,
    rowOffset: offsets[config.layout].rowOffset,
    offsetModulus: offsets[config.layout].modulus,
  };
}

/** mod that behaves like GLSL mod() (result has the sign of the divisor). */
function glslMod(x: number, y: number): number {
  return x - y * Math.floor(x / y);
}

export interface CellEvaluation {
  cellX: number;
  cellY: number;
  /** Local position within the tile cell, 0..1. */
  localU: number;
  localV: number;
  /** Distance from the cell edge along each axis, in mm (≥0 inside the tile). */
  edgeDistUmm: number;
  edgeDistVmm: number;
  /** Deterministic per-cell hash input for face selection. */
  hashSeedX: number;
  hashSeedY: number;
}

/**
 * Map a point in material millimetre space to its tile cell.
 * `mm` are plane-space millimetres after applying patternUniforms rotation
 * (the shader rotates; this reference receives pre-rotated coordinates when
 * called from tests — pass rotationDeg: 0 there, or use evaluatePattern).
 */
export function cellAt(
  mmU: number,
  mmV: number,
  tile: TileSizeMm,
  config: PatternConfig,
  uniforms: PatternUniforms
): CellEvaluation {
  const { widthMm: W, heightMm: H } = tile;
  if (!(W > 0) || !(H > 0)) throw new Error("Tile dimensions must be positive");

  const cos = Math.cos(uniforms.rotationRad);
  const sin = Math.sin(uniforms.rotationRad);
  // Rotate material space (centered at origin offset), then translate origin.
  const ru = mmU - config.originUmm;
  const rv = mmV - config.originVmm;
  const u = ru * cos - rv * sin;
  const v = ru * sin + rv * cos;

  const row = Math.floor(v / H);
  const offset = uniforms.offsetModulus > 1
    ? uniforms.rowOffset * glslMod(row, uniforms.offsetModulus) * W
    : 0;

  const uu = u + offset;
  const cellX = Math.floor(uu / W);
  const cellY = row;
  const localU = uu / W - cellX;
  const localV = v / H - cellY;

  return {
    cellX,
    cellY,
    localU,
    localV,
    edgeDistUmm: Math.min(localU, 1 - localU) * W,
    edgeDistVmm: Math.min(localV, 1 - localV) * H,
    hashSeedX: cellX,
    hashSeedY: cellY,
  };
}

/** Convenience: rotate + cellAt in one call (matches the shader pipeline). */
export function evaluatePattern(
  mmU: number,
  mmV: number,
  tile: TileSizeMm,
  config: PatternConfig
): CellEvaluation {
  return cellAt(mmU, mmV, tile, config, patternUniforms(config));
}

/** Is a fragment inside grout given edge distances and grout width? */
export function isGrout(cell: CellEvaluation, groutWidthMm: number): boolean {
  if (groutWidthMm <= 0) return false;
  return cell.edgeDistUmm < groutWidthMm / 2 || cell.edgeDistVmm < groutWidthMm / 2;
}

/**
 * Whole-pattern rotation constraint: for a 45° diagonal the effective tile
 * footprint in material space changes; the shader must sample the pattern in
 * rotated space (handled by cellAt) — this helper only reports the rotation
 * for UI display.
 */
export function effectiveRotationDeg(config: PatternConfig): number {
  return config.layout === "diagonal" ? config.rotationDeg + 45 : config.rotationDeg;
}
