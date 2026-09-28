import { describe, expect, it } from "vitest";
import {
  cellAt,
  effectiveRotationDeg,
  evaluatePattern,
  isGrout,
  patternUniforms,
  type PatternConfig,
} from "@visualizer/engine";

const tile = { widthMm: 600, heightMm: 1200 };
const base: PatternConfig = { layout: "straight", rotationDeg: 0, originUmm: 0, originVmm: 0 };

describe("pattern engine", () => {
  it("straight layout: cell indices and local UVs", () => {
    const c = evaluatePattern(700, 1500, tile, base);
    expect(c.cellX).toBe(1); // 700/600 → floor 1
    expect(c.cellY).toBe(1); // 1500/1200 → floor 1
    expect(c.localU).toBeCloseTo(700 / 600 - 1, 9);
    expect(c.localV).toBeCloseTo(1500 / 1200 - 1, 9);
  });

  it("handles negative coordinates without seam artifacts", () => {
    const c = evaluatePattern(-10, -10, tile, base);
    expect(c.cellX).toBe(-1);
    expect(c.localU).toBeCloseTo(590 / 600, 9);
    expect(c.localV).toBeCloseTo(1190 / 1200, 9);
  });

  it("running-half offsets every second row by half a tile", () => {
    const cfg: PatternConfig = { ...base, layout: "running-half" };
    const row0 = evaluatePattern(599, 10, tile, cfg);
    const row1 = evaluatePattern(599, 1250, tile, cfg);
    expect(row0.cellX).toBe(0);
    // Row 1 is shifted right by 300mm → x=599 lands in cell 1 with localU≈0.498
    expect(row1.cellX).toBe(1);
    expect(row1.localU).toBeCloseTo(899 / 600 - 1, 9);
    // Continuity across the row seam: vertical joint positions shift exactly
    // half a tile, which is the definition of running bond.
    const seamA = evaluatePattern(300, 1199.9, tile, cfg);
    const seamB = evaluatePattern(300, 1200.1, tile, cfg);
    expect(seamA.cellX).toBe(0);
    expect(seamB.cellX).toBe(1);
    expect(seamB.localU).toBeCloseTo(0, 6);
  });

  it("running-third offsets by a third per row with modulo 3", () => {
    const cfg: PatternConfig = { ...base, layout: "running-third" };
    const u = patternUniforms(cfg);
    expect(u.rowOffset).toBeCloseTo(1 / 3);
    expect(u.offsetModulus).toBe(3);
  });

  it("diagonal applies 45° rotation", () => {
    const cfg: PatternConfig = { ...base, layout: "diagonal" };
    expect(effectiveRotationDeg(cfg)).toBe(45);
    const u = patternUniforms(cfg);
    expect(u.rotationRad).toBeCloseTo(Math.PI / 4);
    // A point along the 45° axis maps onto the tile axis
    const c = evaluatePattern(1000, 1000, tile, cfg);
    expect(c.cellY).toBeGreaterThanOrEqual(0);
  });

  it("grout detection near edges", () => {
    const c = evaluatePattern(1, 600, tile, base); // 1mm from left edge
    expect(isGrout(c, 4)).toBe(true);
    const mid = evaluatePattern(300, 600, tile, base);
    expect(isGrout(mid, 4)).toBe(false);
  });

  it("is deterministic for the same input", () => {
    const a = evaluatePattern(123.45, 678.9, tile, base);
    const b = evaluatePattern(123.45, 678.9, tile, base);
    expect(a).toEqual(b);
  });

  it("pattern origin offset shifts the grid", () => {
    const shifted: PatternConfig = { ...base, originUmm: 150 };
    const c = evaluatePattern(160, 10, tile, shifted);
    expect(c.cellX).toBe(0); // (160-150)/600 → cell 0
    const c2 = evaluatePattern(140, 10, tile, shifted);
    expect(c2.cellX).toBe(-1); // (140-150)/600 → -10/600 → floor -1
  });
});
