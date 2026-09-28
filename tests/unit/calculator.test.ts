import { describe, expect, it } from "vitest";
import {
  CalculatorInputError,
  calculateStoneQuantity,
  calculateTileQuantity,
  rowAreaSqFt,
  toFeet,
} from "@/lib/calculator/quantity";

describe("length conversion", () => {
  it("converts units exactly", () => {
    expect(toFeet(1, "ft")).toBe(1);
    expect(toFeet(12, "in")).toBeCloseTo(1, 12);
    expect(toFeet(0.3048, "m")).toBeCloseTo(1, 12);
    expect(toFeet(30.48, "cm")).toBeCloseTo(1, 12);
  });

  it("row area is length × width in sq ft", () => {
    expect(rowAreaSqFt({ length: 10, width: 12, unit: "ft" })).toBe(120);
    expect(rowAreaSqFt({ length: 3, width: 3, unit: "m" })).toBeCloseTo(9 / 0.3048 ** 2, 6);
  });
});

describe("calculateTileQuantity", () => {
  it("mode A: area with wastage and boxes", () => {
    const r = calculateTileQuantity({
      areaSqFt: 180,
      wastagePercent: 10,
      coverageSqFtPerBox: 15.5,
      tilesPerBox: 2,
    });
    expect(r.requiredAreaSqFt).toBeCloseTo(198, 9);
    expect(r.boxes).toBe(13); // ceil(198/15.5) = ceil(12.77) = 13
    expect(r.coveragePurchasedSqFt).toBeCloseTo(201.5, 9);
    expect(r.tiles).toBe(26);
  });

  it("mode B: multiple rows sum before wastage", () => {
    const r = calculateTileQuantity({
      rows: [
        { length: 10, width: 12, unit: "ft" },
        { length: 8, width: 6, unit: "ft" },
      ],
      wastagePercent: 0,
      coverageSqFtPerBox: 20,
    });
    expect(r.netAreaSqFt).toBe(168);
    expect(r.boxes).toBe(9); // ceil(168/20)=8.4 → 9
  });

  it("ceils even for tiny remainders", () => {
    const r = calculateTileQuantity({ areaSqFt: 100, wastagePercent: 0, coverageSqFtPerBox: 33.34 });
    expect(r.boxes).toBe(3); // 100/33.34 = 2.9994 → 3
  });

  it("tiles undefined when tilesPerBox missing", () => {
    const r = calculateTileQuantity({ areaSqFt: 100, wastagePercent: 0, coverageSqFtPerBox: 20 });
    expect(r.tiles).toBeUndefined();
  });

  it("rejects invalid inputs", () => {
    expect(() => calculateTileQuantity({ areaSqFt: 0, wastagePercent: 0 })).toThrow(CalculatorInputError);
    expect(() => calculateTileQuantity({ areaSqFt: -5, wastagePercent: 0 })).toThrow(CalculatorInputError);
    expect(() => calculateTileQuantity({ areaSqFt: 100, wastagePercent: 60 })).toThrow(CalculatorInputError);
    expect(() => calculateTileQuantity({ areaSqFt: 100, wastagePercent: -1 })).toThrow(CalculatorInputError);
    expect(() => calculateTileQuantity({ wastagePercent: 0 })).toThrow(CalculatorInputError);
    expect(() =>
      calculateTileQuantity({ rows: [{ length: 0, width: 10, unit: "ft" }], wastagePercent: 0 })
    ).toThrow(CalculatorInputError);
  });

  it("stone quantity has no box concept", () => {
    const r = calculateStoneQuantity({ areaSqFt: 200, wastagePercent: 12 });
    expect(r.requiredAreaSqFt).toBeCloseTo(224, 9);
    expect("boxes" in r).toBe(false);
  });
});
