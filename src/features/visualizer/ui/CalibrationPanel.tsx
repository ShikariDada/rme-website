"use client";

import { useState } from "react";
import { FieldLabel, Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { VisualizerAction } from "../state/visualizerReducer";
import type { VisualizerSurface } from "../state/types";
import { CalibrationError } from "@visualizer/engine";

/**
 * Metric calibration (visualizer spec §12): tap two ends of a known line on
 * the surface, enter the real length → scale becomes "calibrated". Until
 * then the UI says Approximate scale.
 */
export function CalibrationPanel({
  surface,
  dispatch,
  onCalibrated,
}: {
  surface: VisualizerSurface;
  dispatch: React.Dispatch<VisualizerAction>;
  onCalibrated: () => void;
}) {
  const [lengthValue, setLengthValue] = useState(
    surface.calibration ? String(surface.calibration.realLengthMm) : ""
  );
  const [unit, setUnit] = useState<"mm" | "cm" | "m">("cm");
  const [error, setError] = useState<string | null>(null);

  const calibrated = surface.calibration && surface.layout.scaleMode === "calibrated";

  function apply() {
    const len = parseFloat(lengthValue);
    if (!Number.isFinite(len) || len <= 0) {
      setError("Enter the measured length of the line");
      return;
    }
    const realLengthMm = unit === "mm" ? len : unit === "cm" ? len * 10 : len * 1000;
    // The tapped points come from the last two handle positions recorded in
    // calibration draft state; for v1 we use the plane quad's bottom edge
    // endpoints unless the user has drafted their own (stored on the surface).
    const p1 = surface.calibration?.p1 ?? { x: surface.planeQuad[0].x, y: surface.planeQuad[0].y };
    const p2 = surface.calibration?.p2 ?? { x: surface.planeQuad[1].x, y: surface.planeQuad[1].y };
    try {
      if (
        !surface.calibration &&
        Math.hypot(p2.x - p1.x, p2.y - p1.y) < 1e-6
      ) {
        throw new CalibrationError("Mark a line first");
      }
      dispatch({
        type: "UPDATE_SURFACE",
        surfaceId: surface.id,
        patch: {
          calibration: {
            p1,
            p2,
            realLengthMm,
            quality: "user-measured",
          },
          layout: { ...surface.layout, scaleMode: "calibrated" },
        },
      });
      setError(null);
      onCalibrated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not calibrate with those points");
    }
  }

  function clearCalibration() {
    dispatch({
      type: "UPDATE_SURFACE",
      surfaceId: surface.id,
      patch: {
        calibration: undefined,
        layout: { ...surface.layout, scaleMode: "approximate" },
      },
    });
    setLengthValue("");
    setError(null);
  }

  return (
    <div>
      <p className="text-sm font-medium">Set real scale</p>
      <p className="mt-1 text-xs text-text-muted">
        Tap two ends of a known length on this surface (a doorway, a counter
        edge, a measured wall run) and enter its real length. Until then the
        preview stays marked <strong>Approximate scale</strong>.
      </p>
      {calibrated && (
        <p className="mt-2 rounded-md bg-accent-soft/60 px-3 py-2 text-xs text-accent">
          Calibrated — {surface.calibration?.realLengthMm} mm reference line.
        </p>
      )}
      <div className="mt-3 grid grid-cols-[1fr_6rem_auto] items-end gap-2">
        <div>
          <FieldLabel htmlFor="cal-length">Real length</FieldLabel>
          <Input
            id="cal-length"
            type="number"
            inputMode="decimal"
            min={1}
            value={lengthValue}
            onChange={(e) => setLengthValue(e.target.value)}
            placeholder="300"
          />
        </div>
        <div>
          <FieldLabel htmlFor="cal-unit">Unit</FieldLabel>
          <Select id="cal-unit" value={unit} onChange={(e) => setUnit(e.target.value as "mm" | "cm" | "m")}>
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
          </Select>
        </div>
        <Button onClick={apply}>Apply</Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {calibrated && (
        <Button variant="text" size="sm" className="mt-2" onClick={clearCalibration}>
          Remove calibration (back to approximate)
        </Button>
      )}
    </div>
  );
}
