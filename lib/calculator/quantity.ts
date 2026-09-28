/**
 * Quantity calculator — deterministic, unit-tested (spec §19 + visualizer §12.3).
 *
 * Rules:
 * - No negative/zero dimensions; sensible maxima.
 * - Round quantities UP (ceil) for purchase units; round currency only for display.
 * - Results are planning estimates; UI must carry the disclaimer.
 */

export type LengthUnit = "ft" | "in" | "m" | "cm";

export const MAX_AREA_SQFT = 1_000_000;
export const MAX_DIMENSION_FT = 10_000;
export const MAX_WASTAGE_PERCENT = 50;

export interface DimensionRowInput {
  length: number;
  width: number;
  unit: LengthUnit;
}

export interface TileQuantityInput {
  /** Net measured area in square feet (mode A) — mutually exclusive with rows. */
  areaSqFt?: number;
  /** Rectangular surfaces (mode B). */
  rows?: DimensionRowInput[];
  wastagePercent: number;
  coverageSqFtPerBox?: number;
  tilesPerBox?: number;
}

export interface TileQuantityResult {
  netAreaSqFt: number;
  requiredAreaSqFt: number;
  boxes?: number;
  coveragePurchasedSqFt?: number;
  tiles?: number;
}

/** Convert a length to feet. 1 ft = 0.3048 m exactly; 1 ft = 12 in. */
export function toFeet(length: number, unit: LengthUnit): number {
  switch (unit) {
    case "ft":
      return length;
    case "in":
      return length / 12;
    case "m":
      return length / 0.3048;
    case "cm":
      return length / 30.48;
  }
}

export function rowAreaSqFt(row: DimensionRowInput): number {
  return toFeet(row.length, row.unit) * toFeet(row.width, row.unit);
}

export class CalculatorInputError extends Error {}

function validatePositive(n: number, name: string): number {
  if (!Number.isFinite(n) || n <= 0) {
    throw new CalculatorInputError(`${name} must be a positive number`);
  }
  return n;
}

/** Sum of rectangular surface areas, validated. */
export function totalAreaSqFtFromRows(rows: DimensionRowInput[]): number {
  let total = 0;
  for (const row of rows) {
    const l = validatePositive(row.length, "Length");
    const w = validatePositive(row.width, "Width");
    const area = rowAreaSqFt({ length: l, width: w, unit: row.unit });
    if (area > MAX_AREA_SQFT) {
      throw new CalculatorInputError("One surface is unrealistically large");
    }
    total += area;
  }
  if (total <= 0) throw new CalculatorInputError("Add at least one surface");
  if (total > MAX_AREA_SQFT) throw new CalculatorInputError("Total area is unrealistically large");
  return total;
}

/**
 * Core tile calculation (spec §19):
 *   requiredArea = A * (1 + w/100)
 *   boxes        = ceil(requiredArea / C)
 *   tiles        = boxes * tilesPerBox
 * Throws CalculatorInputError on invalid inputs; never returns fabricated data.
 */
export function calculateTileQuantity(input: TileQuantityInput): TileQuantityResult {
  let netArea: number;
  if (typeof input.areaSqFt === "number") {
    netArea = validatePositive(input.areaSqFt, "Area");
  } else if (input.rows && input.rows.length > 0) {
    netArea = totalAreaSqFtFromRows(input.rows);
  } else {
    throw new CalculatorInputError("Enter an area or at least one surface");
  }
  if (netArea > MAX_AREA_SQFT) {
    throw new CalculatorInputError("Area is unrealistically large");
  }

  const w = input.wastagePercent;
  if (!Number.isFinite(w) || w < 0 || w > MAX_WASTAGE_PERCENT) {
    throw new CalculatorInputError(
      `Wastage must be between 0 and ${MAX_WASTAGE_PERCENT}%`
    );
  }

  const requiredArea = netArea * (1 + w / 100);

  const result: TileQuantityResult = {
    netAreaSqFt: netArea,
    requiredAreaSqFt: requiredArea,
  };

  const coverage = input.coverageSqFtPerBox;
  if (typeof coverage === "number" && coverage > 0) {
    if (!Number.isFinite(coverage)) {
      throw new CalculatorInputError("Invalid box coverage");
    }
    const boxes = Math.ceil(requiredArea / coverage);
    result.boxes = boxes;
    result.coveragePurchasedSqFt = boxes * coverage;
    if (typeof input.tilesPerBox === "number" && input.tilesPerBox > 0) {
      result.tiles = boxes * input.tilesPerBox;
    }
  }

  return result;
}

export interface StoneQuantityInput {
  areaSqFt?: number;
  rows?: DimensionRowInput[];
  wastagePercent: number;
}

export interface StoneQuantityResult {
  netAreaSqFt: number;
  requiredAreaSqFt: number;
}

/**
 * Natural stone (spec §19): no "boxes" — material area + wastage only.
 */
export function calculateStoneQuantity(input: StoneQuantityInput): StoneQuantityResult {
  const tile = calculateTileQuantity({
    areaSqFt: input.areaSqFt,
    rows: input.rows,
    wastagePercent: input.wastagePercent,
  });
  return { netAreaSqFt: tile.netAreaSqFt, requiredAreaSqFt: tile.requiredAreaSqFt };
}

export function formatSqFt(n: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n);
}
