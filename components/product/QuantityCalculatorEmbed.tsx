"use client";

import { useRef, useState } from "react";
import {
  CalculatorInputError,
  MAX_DIMENSION_FT,
  calculateStoneQuantity,
  calculateTileQuantity,
  formatSqFt,
  toFeet,
  type LengthUnit,
  type StoneQuantityResult,
  type TileQuantityResult,
} from "@/lib/calculator/quantity";
import { FieldError, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

type Mode = "area" | "dimensions";

interface SurfaceRow {
  id: number;
  length: string;
  width: string;
  unit: LengthUnit;
}

interface RowFieldErrors {
  length?: string;
  width?: string;
}

interface CalculatorErrors {
  area?: string;
  rows?: Record<number, RowFieldErrors>;
  wastage?: string;
  form?: string;
}

type CalcResult =
  | { kind: "tile"; data: TileQuantityResult }
  | { kind: "stone"; data: StoneQuantityResult };

const UNITS: { value: LengthUnit; label: string }[] = [
  { value: "ft", label: "ft" },
  { value: "in", label: "in" },
  { value: "m", label: "m" },
  { value: "cm", label: "cm" },
];

const STONE_TYPES = new Set(["marble", "granite", "quartz"]);

export function QuantityCalculatorEmbed({
  coverageSqFtPerBox,
  tilesPerBox,
  materialType,
}: {
  coverageSqFtPerBox?: number;
  tilesPerBox?: number;
  materialType: string;
}) {
  const isStone = STONE_TYPES.has(materialType);
  const [mode, setMode] = useState<Mode>("area");
  const [area, setArea] = useState("");
  const [rows, setRows] = useState<SurfaceRow[]>([
    { id: 0, length: "", width: "", unit: "ft" },
  ]);
  // Kept as raw text so partial edits (e.g. clearing the field) never become NaN.
  const [wastage, setWastage] = useState("10");
  const [errors, setErrors] = useState<CalculatorErrors>({});
  const [result, setResult] = useState<CalcResult | null>(null);
  const startedRef = useRef(false);
  const nextRowIdRef = useRef(1);
  const wastageNum = Number(wastage);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      track("calculator_start", {
        source_surface: "product-page",
        page_type: "pdp",
      });
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setResult(null);
  }

  function updateRow(id: number, patch: Partial<Omit<SurfaceRow, "id">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: nextRowIdRef.current++, length: "", width: "", unit: "ft" },
    ]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function dimensionError(raw: string, unit: LengthUnit): string | undefined {
    if (raw.trim() === "") return "Required";
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return "Enter a positive number";
    if (toFeet(n, unit) > MAX_DIMENSION_FT) return "Unrealistically large";
    return undefined;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: CalculatorErrors = {};

    if (mode === "area") {
      const n = Number(area);
      if (area.trim() === "" || !Number.isFinite(n) || n <= 0) {
        nextErrors.area = "Enter a positive area in sq ft";
      }
    } else {
      if (rows.length === 0) {
        nextErrors.form = "Add at least one surface";
      } else {
        const rowErrors: Record<number, RowFieldErrors> = {};
        for (const row of rows) {
          const err: RowFieldErrors = {};
          const lengthError = dimensionError(row.length, row.unit);
          const widthError = dimensionError(row.width, row.unit);
          if (lengthError) err.length = lengthError;
          if (widthError) err.width = widthError;
          if (err.length || err.width) rowErrors[row.id] = err;
        }
        if (Object.keys(rowErrors).length > 0) nextErrors.rows = rowErrors;
      }
    }

    const w = wastageNum;
    if (wastage.trim() === "" || !Number.isFinite(w) || w < 0 || w > 20) {
      nextErrors.wastage = "Enter a value between 0 and 20";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setResult(null);
      return;
    }

    try {
      const rowsInput =
        mode === "dimensions"
          ? rows.map((r) => ({
              length: Number(r.length),
              width: Number(r.width),
              unit: r.unit,
            }))
          : undefined;

      if (isStone) {
        const data = calculateStoneQuantity({
          ...(mode === "area"
            ? { areaSqFt: Number(area) }
            : { rows: rowsInput }),
          wastagePercent: w,
        });
        setResult({ kind: "stone", data });
      } else {
        const data = calculateTileQuantity({
          ...(mode === "area" ? { areaSqFt: Number(area) } : { rows: rowsInput }),
          wastagePercent: w,
          coverageSqFtPerBox,
          tilesPerBox,
        });
        setResult({ kind: "tile", data });
      }
      setErrors({});
      track("calculator_complete", {
        source_surface: "product-page",
        page_type: "pdp",
      });
    } catch (err) {
      if (err instanceof CalculatorInputError) {
        setErrors({ form: err.message });
        setResult(null);
      } else {
        throw err;
      }
    }
  }

  const modeButtonClass = (active: boolean) =>
    cn(
      "inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors",
      active
        ? "bg-accent text-white"
        : "text-text-muted hover:bg-surface-muted hover:text-text"
    );

  return (
    <section aria-labelledby="quantity-calculator-heading">
      <h2 id="quantity-calculator-heading" className="text-xl md:text-2xl">
        Estimate your quantity
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-4 max-w-xl">
        <div
          role="group"
          aria-label="Calculation mode"
          className="inline-flex rounded-md border border-border p-0.5"
        >
          <button
            type="button"
            aria-pressed={mode === "area"}
            onClick={() => switchMode("area")}
            className={modeButtonClass(mode === "area")}
          >
            By area
          </button>
          <button
            type="button"
            aria-pressed={mode === "dimensions"}
            onClick={() => switchMode("dimensions")}
            className={modeButtonClass(mode === "dimensions")}
          >
            By dimensions
          </button>
        </div>

        {!isStone && (coverageSqFtPerBox !== undefined || tilesPerBox !== undefined) && (
          <p className="mt-3 text-sm text-text-muted">
            {[
              tilesPerBox !== undefined
                ? `${tilesPerBox} ${tilesPerBox === 1 ? "tile" : "tiles"} per box`
                : null,
              coverageSqFtPerBox !== undefined
                ? `${coverageSqFtPerBox} sq ft coverage per box`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {mode === "area" ? (
            <div>
              <label htmlFor="calc-area" className="mb-1.5 block text-sm font-medium">
                Total area (sq ft)
              </label>
              <div className="relative">
                <Input
                  id="calc-area"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={area}
                  onChange={(e) => {
                    markStarted();
                    setArea(e.target.value);
                  }}
                  aria-describedby={errors.area ? "calc-area-error" : undefined}
                  aria-invalid={errors.area ? true : undefined}
                  className="pr-14"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted"
                >
                  sq ft
                </span>
              </div>
              <FieldError id="calc-area-error" message={errors.area} />
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div
                  key={row.id}
                  className="rounded-md border border-border bg-surface-muted/40 p-3"
                >
                  <p className="mb-2 text-sm font-medium">Surface {i + 1}</p>
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`calc-row-${row.id}-length`}
                        className="sr-only"
                      >
                        Surface {i + 1} length
                      </label>
                      <Input
                        id={`calc-row-${row.id}-length`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder="Length"
                        value={row.length}
                        onChange={(e) => {
                          markStarted();
                          updateRow(row.id, { length: e.target.value });
                        }}
                        aria-describedby={
                          errors.rows?.[row.id]?.length
                            ? `calc-row-${row.id}-length-error`
                            : undefined
                        }
                        aria-invalid={errors.rows?.[row.id]?.length ? true : undefined}
                      />
                      <FieldError
                        id={`calc-row-${row.id}-length-error`}
                        message={errors.rows?.[row.id]?.length}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`calc-row-${row.id}-width`}
                        className="sr-only"
                      >
                        Surface {i + 1} width
                      </label>
                      <Input
                        id={`calc-row-${row.id}-width`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder="Width"
                        value={row.width}
                        onChange={(e) => {
                          markStarted();
                          updateRow(row.id, { width: e.target.value });
                        }}
                        aria-describedby={
                          errors.rows?.[row.id]?.width
                            ? `calc-row-${row.id}-width-error`
                            : undefined
                        }
                        aria-invalid={errors.rows?.[row.id]?.width ? true : undefined}
                      />
                      <FieldError
                        id={`calc-row-${row.id}-width-error`}
                        message={errors.rows?.[row.id]?.width}
                      />
                    </div>
                    <div className="w-20 shrink-0">
                      <label htmlFor={`calc-row-${row.id}-unit`} className="sr-only">
                        Surface {i + 1} unit
                      </label>
                      <Select
                        id={`calc-row-${row.id}-unit`}
                        value={row.unit}
                        onChange={(e) => {
                          markStarted();
                          updateRow(row.id, { unit: e.target.value as LengthUnit });
                        }}
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Remove surface ${i + 1}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-danger"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addRow}>
                Add surface
              </Button>
            </div>
          )}

          <div>
            <label htmlFor="calc-wastage" className="mb-1.5 block text-sm font-medium">
              Wastage — planning estimate (%)
            </label>
            <div className="flex items-center gap-3">
              <Input
                id="calc-wastage"
                type="number"
                inputMode="numeric"
                min={0}
                max={20}
                step={1}
                value={wastage}
                onChange={(e) => {
                  markStarted();
                  setWastage(e.target.value);
                }}
                aria-describedby={errors.wastage ? "calc-wastage-error" : undefined}
                aria-invalid={errors.wastage ? true : undefined}
                className="w-24"
              />
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={Number.isFinite(wastageNum) ? Math.min(Math.max(wastageNum, 0), 20) : 0}
                onChange={(e) => {
                  markStarted();
                  setWastage(e.target.value);
                }}
                aria-label="Wastage percentage slider"
                className="h-11 flex-1 accent-[var(--color-accent)]"
              />
            </div>
            <FieldError id="calc-wastage-error" message={errors.wastage} />
          </div>

          {errors.form && (
            <p role="alert" className="text-sm text-danger">
              {errors.form}
            </p>
          )}

          <Button type="submit" variant="primary">
            Calculate
          </Button>
        </div>
      </form>

      {result && (
        <div className="mt-4 max-w-xl rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Estimated quantity
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-muted">
              Required area (incl. {wastageNum}% wastage)
            </dt>
            <dd className="font-medium">
              {formatSqFt(result.data.requiredAreaSqFt)} sq ft
            </dd>
            {result.kind === "tile" && result.data.boxes !== undefined && (
              <>
                <dt className="text-text-muted">Boxes</dt>
                <dd className="font-medium">{result.data.boxes}</dd>
              </>
            )}
            {result.kind === "tile" && result.data.tiles !== undefined && (
              <>
                <dt className="text-text-muted">Tiles</dt>
                <dd className="font-medium">{result.data.tiles}</dd>
              </>
            )}
            {result.kind === "tile" &&
              result.data.coveragePurchasedSqFt !== undefined && (
                <>
                  <dt className="text-text-muted">Coverage purchased</dt>
                  <dd className="font-medium">
                    {formatSqFt(result.data.coveragePurchasedSqFt)} sq ft
                  </dd>
                </>
              )}
          </dl>
          <p className="mt-3 text-xs text-text-muted">
            Planning estimate only — confirm the final quantity with your
            installer or showroom.
          </p>
        </div>
      )}
    </section>
  );
}
