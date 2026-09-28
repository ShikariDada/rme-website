"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/Button";
import { FieldError, FieldLabel, Input, Select } from "@/components/ui/Input";
import {
  calculateTileQuantity,
  calculateStoneQuantity,
  CalculatorInputError,
  formatSqFt,
  type DimensionRowInput,
  type LengthUnit,
} from "@/lib/calculator/quantity";
import { track } from "@/lib/analytics/track";

/**
 * Standalone quantity calculator (website spec §19). Deterministic math from
 * lib/calculator/quantity (unit-tested). Planning estimate only.
 */
export function TileCalculator() {
  const [mode, setMode] = useState<"area" | "rows">("area");
  const [areaSqFt, setAreaSqFt] = useState("");
  const [rows, setRows] = useState<DimensionRowInput[]>([
    { length: 12, width: 10, unit: "ft" },
  ]);
  const [wastage, setWastage] = useState("10");
  const [coverage, setCoverage] = useState("");
  const [tilesPerBox, setTilesPerBox] = useState("");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const result = useMemo(() => {
    try {
      const coverageNum = coverage.trim() === "" ? undefined : Number(coverage);
      const tilesPerBoxNum = tilesPerBox.trim() === "" ? undefined : Number(tilesPerBox);
      const input = {
        ...(mode === "area"
          ? { areaSqFt: Number(areaSqFt) }
          : { rows }),
        wastagePercent: Number(wastage),
        ...(coverageNum && coverageNum > 0 ? { coverageSqFtPerBox: coverageNum } : {}),
        ...(tilesPerBoxNum && tilesPerBoxNum > 0 ? { tilesPerBox: tilesPerBoxNum } : {}),
      };
      const r = calculateTileQuantity(input);
      setError(null);
      track("calculator_complete", { source_surface: "calculator", page_type: "calculator" });
      return r;
    } catch (e) {
      setError(e instanceof CalculatorInputError ? e.message : "Check your inputs");
      return null;
    }
  }, [mode, areaSqFt, rows, wastage, coverage, tilesPerBox]);

  function onFirstInput() {
    if (!startedRef.current) {
      startedRef.current = true;
      track("calculator_start", { source_surface: "calculator", page_type: "calculator" });
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <div className="flex gap-2" role="group" aria-label="Input mode">
          <Button
            variant={mode === "area" ? "primary" : "secondary"}
            onClick={() => setMode("area")}
          >
            By total area
          </Button>
          <Button
            variant={mode === "rows" ? "primary" : "secondary"}
            onClick={() => setMode("rows")}
          >
            By room dimensions
          </Button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-surface p-5">
          {mode === "area" ? (
            <div>
              <FieldLabel htmlFor="calc-area" required>
                Total area (sq ft)
              </FieldLabel>
              <Input
                id="calc-area"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                placeholder="180"
                value={areaSqFt}
                onChange={(e) => {
                  onFirstInput();
                  setAreaSqFt(e.target.value);
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_5.5rem_auto] items-end gap-2">
                  <div>
                    <FieldLabel htmlFor={`len-${i}`}>Length</FieldLabel>
                    <Input
                      id={`len-${i}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={row.length}
                      onChange={(e) => {
                        onFirstInput();
                        const next = [...rows];
                        next[i] = { ...row, length: Number(e.target.value) };
                        setRows(next);
                      }}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`wid-${i}`}>Width</FieldLabel>
                    <Input
                      id={`wid-${i}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      value={row.width}
                      onChange={(e) => {
                        onFirstInput();
                        const next = [...rows];
                        next[i] = { ...row, width: Number(e.target.value) };
                        setRows(next);
                      }}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`unit-${i}`}>Unit</FieldLabel>
                    <Select
                      id={`unit-${i}`}
                      value={row.unit}
                      onChange={(e) => {
                        onFirstInput();
                        const next = [...rows];
                        next[i] = { ...row, unit: e.target.value as LengthUnit };
                        setRows(next);
                      }}
                    >
                      <option value="ft">ft</option>
                      <option value="in">inch</option>
                      <option value="m">m</option>
                      <option value="cm">cm</option>
                    </Select>
                  </div>
                  {rows.length > 1 && (
                    <Button
                      variant="text"
                      size="sm"
                      aria-label={`Remove surface ${i + 1}`}
                      onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onFirstInput();
                  setRows([...rows, { length: 0, width: 0, unit: "ft" }]);
                }}
              >
                + Add another surface
              </Button>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="calc-wastage" hint="Planning estimate — not a fixed rule">
                Wastage %
              </FieldLabel>
              <Input
                id="calc-wastage"
                type="number"
                inputMode="decimal"
                min={0}
                max={50}
                step="any"
                value={wastage}
                onChange={(e) => {
                  onFirstInput();
                  setWastage(e.target.value);
                }}
              />
            </div>
            <div>
              <FieldLabel htmlFor="calc-coverage" hint="Optional — printed on every product page">
                Box coverage (sq ft)
              </FieldLabel>
              <Input
                id="calc-coverage"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="15.5"
                value={coverage}
                onChange={(e) => {
                  onFirstInput();
                  setCoverage(e.target.value);
                }}
              />
            </div>
            <div>
              <FieldLabel htmlFor="calc-tpb" hint="Optional">
                Tiles per box
              </FieldLabel>
              <Input
                id="calc-tpb"
                type="number"
                inputMode="decimal"
                min={0}
                step="1"
                placeholder="2"
                value={tilesPerBox}
                onChange={(e) => {
                  onFirstInput();
                  setTilesPerBox(e.target.value);
                }}
              />
            </div>
          </div>
          <FieldError id="calc-error" message={error ?? undefined} />
        </div>
      </div>

      <aside>
        <div className="rounded-lg border border-border bg-surface p-5" aria-live="polite">
          <h2 className="font-display text-lg">Result</h2>
          {result ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">Net area</dt>
                <dd className="font-medium">{formatSqFt(result.netAreaSqFt)} sq ft</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">With {wastage}% wastage</dt>
                <dd className="font-medium">{formatSqFt(result.requiredAreaSqFt)} sq ft</dd>
              </div>
              {result.boxes !== undefined && (
                <div className="flex justify-between gap-2 border-t border-border pt-2">
                  <dt className="text-text-muted">Boxes to buy</dt>
                  <dd className="text-lg font-semibold">{result.boxes}</dd>
                </div>
              )}
              {result.tiles !== undefined && (
                <div className="flex justify-between gap-2">
                  <dt className="text-text-muted">Tiles total</dt>
                  <dd className="font-medium">{result.tiles}</dd>
                </div>
              )}
              {result.coveragePurchasedSqFt !== undefined && (
                <div className="flex justify-between gap-2">
                  <dt className="text-text-muted">Coverage purchased</dt>
                  <dd className="font-medium">{formatSqFt(result.coveragePurchasedSqFt)} sq ft</dd>
                </div>
              )}
              {result.boxes === undefined && (
                <p className="pt-2 text-xs text-text-muted">
                  Add box coverage (from any product page) to see boxes to buy.
                </p>
              )}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-text-muted">Enter your measurements to see the estimate.</p>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4 text-sm">
          <p>
            Planning estimate only. Real wastage depends on room shape, laying
            pattern (diagonal needs more) and site conditions — confirm the
            final order with your installer or with us.
          </p>
        </div>

        <ButtonLink href="/products" variant="secondary" className="mt-4 w-full">
          Browse products with box coverage
        </ButtonLink>
      </aside>
    </div>
  );
}
