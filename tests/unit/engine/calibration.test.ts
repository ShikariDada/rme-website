import { describe, expect, it } from "vitest";
import {
  approximateScale,
  calibrationFromImagePoints,
  homographyFromQuad,
  planeDistanceMm,
  scaleFromCalibrationLine,
  scaleFromTwoLines,
  CalibrationError,
} from "@visualizer/engine";

describe("calibration", () => {
  it("single line yields isotropic mm-per-unit", () => {
    const scale = scaleFromCalibrationLine({
      p1: { x: 0, y: 0 },
      p2: { x: 1, y: 0 },
      realLengthMm: 4000,
      quality: "user-measured",
    });
    expect(scale.mode).toBe("calibrated");
    expect(scale.mmPerUnitX).toBeCloseTo(4000);
    expect(scale.mmPerUnitY).toBeCloseTo(4000);
  });

  it("rejects zero-length lines and non-positive lengths", () => {
    expect(() =>
      scaleFromCalibrationLine({ p1: { x: 0.5, y: 0.5 }, p2: { x: 0.5, y: 0.5 }, realLengthMm: 100, quality: "user-measured" })
    ).toThrow(CalibrationError);
    expect(() =>
      scaleFromCalibrationLine({ p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 }, realLengthMm: 0, quality: "user-measured" })
    ).toThrow(CalibrationError);
  });

  it("two-line calibration requires axis-aligned lines", () => {
    const goodX = { p1: { x: 0.1, y: 0.8 }, p2: { x: 0.9, y: 0.8 }, realLengthMm: 3200, quality: "user-measured" as const };
    const goodY = { p1: { x: 0.2, y: 0.6 }, p2: { x: 0.2, y: 0.9 }, realLengthMm: 1200, quality: "user-measured" as const };
    const s = scaleFromTwoLines(goodX, goodY);
    expect(s.mmPerUnitX).toBeCloseTo(4000);
    expect(s.mmPerUnitY).toBeCloseTo(4000);

    const diagonal = { p1: { x: 0.1, y: 0.1 }, p2: { x: 0.9, y: 0.9 }, realLengthMm: 1000, quality: "user-measured" as const };
    expect(() => scaleFromTwoLines(diagonal, goodY)).toThrow(CalibrationError);
  });

  it("approximate scale derives from tiles-across", () => {
    const s = approximateScale(4, 600);
    expect(s.mode).toBe("approximate");
    expect(s.mmPerUnitX).toBe(2400);
  });

  it("converts image-space calibration points through H⁻¹", () => {
    const quad = [
      { x: 0.0, y: 0.5 },
      { x: 1.0, y: 0.5 },
      { x: 1.0, y: 1.0 },
      { x: 0.0, y: 1.0 },
    ];
    const H = homographyFromQuad(quad);
    // image-space line along the near edge y=1, x from 0..1
    const line = calibrationFromImagePoints(H, { x: 0, y: 1 }, { x: 1, y: 1 }, 4200, "user-measured");
    // In plane space that edge is exactly length 1 → mmPerUnit = 4200
    const scale = scaleFromCalibrationLine(line);
    expect(scale.mmPerUnitX).toBeCloseTo(4200, 4);
  });

  it("planeDistanceMm respects anisotropic scale", () => {
    const d = planeDistanceMm({ x: 0, y: 0 }, { x: 1, y: 1 }, { mode: "calibrated", mmPerUnitX: 3000, mmPerUnitY: 4000 });
    expect(d).toBeCloseTo(5000);
  });
});
