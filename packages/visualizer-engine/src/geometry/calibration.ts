import type { Point } from "./homography";
import { applyH, inverseH, type Homography } from "./homography";

/**
 * Metric calibration (visualizer spec §12).
 *
 * TRUTH RULE: a 2D photo plus a quad gives perspective, not real-world scale.
 * Absolute scale exists only after the user supplies a known physical length
 * ON the target plane. Before that, the UI must say "Approximate scale".
 *
 * APPROXIMATION NOTE: with a single calibration line we derive one isotropic
 * mm-per-unit factor in plane space. On strongly skewed planes the true
 * metric is anisotropic; the optional second line refines the second axis.
 */

export interface CalibrationLine {
  p1: Point; // in plane unit-square coordinates (from H⁻¹)
  p2: Point;
  realLengthMm: number;
  quality: "user-measured" | "known-object" | "approximate";
}

export interface PlaneScale {
  mode: "calibrated" | "approximate";
  /** Millimetres per plane-unit along each axis. */
  mmPerUnitX: number;
  mmPerUnitY: number;
  quality?: CalibrationLine["quality"];
}

export class CalibrationError extends Error {}

/**
 * Single-line calibration → isotropic scale.
 * realLengthMm is the physical length of the segment p1→p2 on the plane.
 */
export function scaleFromCalibrationLine(line: CalibrationLine): PlaneScale {
  if (!Number.isFinite(line.realLengthMm) || line.realLengthMm <= 0) {
    throw new CalibrationError("Enter a real, positive length for the measured line");
  }
  const len = Math.hypot(line.p2.x - line.p1.x, line.p2.y - line.p1.y);
  if (len < 1e-9) {
    throw new CalibrationError(
      "The two tapped points are at the same position — tap two ends of a real line"
    );
  }
  const mmPerUnit = line.realLengthMm / len;
  return {
    mode: "calibrated",
    mmPerUnitX: mmPerUnit,
    mmPerUnitY: mmPerUnit,
    quality: line.quality,
  };
}

/**
 * Two-line calibration: the first line defines the X-axis scale, the second
 * the Y-axis scale. Each line must be roughly parallel to its axis in plane
 * space (within tolerance) or the result would silently mislead.
 */
export function scaleFromTwoLines(
  lineX: CalibrationLine,
  lineY: CalibrationLine,
  axisToleranceDeg = 20
): PlaneScale {
  const x = scaleFromCalibrationLine(lineX);
  const y = scaleFromCalibrationLine(lineY);
  const angle = (l: CalibrationLine) =>
    (Math.atan2(l.p2.y - l.p1.y, l.p2.x - l.p1.x) * 180) / Math.PI;
  const ax = Math.abs(angle(lineX));
  const ay = Math.abs(angle(lineY));
  const xOk = Math.min(ax, 180 - ax) <= axisToleranceDeg;
  const yOk = Math.abs(ay - 90) <= axisToleranceDeg;
  if (!xOk || !yOk) {
    throw new CalibrationError(
      "Draw the first line along the tile width and the second along the tile height"
    );
  }
  return {
    mode: "calibrated",
    mmPerUnitX: x.mmPerUnitX,
    mmPerUnitY: y.mmPerUnitY,
    quality: lineX.quality,
  };
}

/**
 * Approximate (uncalibrated) scale from a "tiles across the surface" choice.
 * The slider stores how many tile widths should span the plane's U axis; the
 * aspect-correct tile size still comes from product metadata.
 */
export function approximateScale(tilesAcross: number, tileWidthMm: number): PlaneScale {
  if (!Number.isFinite(tilesAcross) || tilesAcross <= 0) {
    throw new CalibrationError("Invalid tile-count setting");
  }
  const mmPerUnit = tilesAcross * tileWidthMm;
  return { mode: "approximate", mmPerUnitX: mmPerUnit, mmPerUnitY: mmPerUnit };
}

/** Convert a calibration line drawn in IMAGE space into plane space via H⁻¹. */
export function calibrationFromImagePoints(
  H: Homography, // plane unit-square → image
  p1Image: Point,
  p2Image: Point,
  realLengthMm: number,
  quality: CalibrationLine["quality"]
): CalibrationLine {
  const Hinv = inverseH(H);
  return {
    p1: applyH(Hinv, p1Image),
    p2: applyH(Hinv, p2Image),
    realLengthMm,
    quality,
  };
}

/** Physical length of a segment on the plane, in millimetres, given a scale. */
export function planeDistanceMm(p1: Point, p2: Point, scale: PlaneScale): number {
  const dx = (p2.x - p1.x) * scale.mmPerUnitX;
  const dy = (p2.y - p1.y) * scale.mmPerUnitY;
  return Math.hypot(dx, dy);
}
