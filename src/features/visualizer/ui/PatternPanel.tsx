"use client";

import { FieldLabel, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { VisualizerAction } from "../state/visualizerReducer";
import type { VisualizerSurface } from "../state/types";
import type { VisualizerMaterial } from "@visualizer/engine";

const LAYOUTS: { value: VisualizerSurface["layout"]["type"]; label: string }[] = [
  { value: "straight", label: "Straight (stack)" },
  { value: "running-half", label: "Running bond ½" },
  { value: "running-third", label: "Running bond ⅓" },
  { value: "diagonal", label: "Diagonal 45°" },
];

/**
 * Layout + scale controls (spec §13, §12). Uncalibrated = "Approximate scale"
 * with a tiles-across slider; calibrated shows the measured state.
 */
export function PatternPanel({
  surface,
  material,
  dispatch,
}: {
  surface: VisualizerSurface;
  material?: VisualizerMaterial;
  dispatch: React.Dispatch<VisualizerAction>;
}) {
  const calibrated = surface.layout.scaleMode === "calibrated" && Boolean(surface.calibration);

  function patchLayout(patch: Partial<VisualizerSurface["layout"]>, coalesce?: string) {
    dispatch({ type: "UPDATE_SURFACE", surfaceId: surface.id, patch: { layout: { ...surface.layout, ...patch } }, coalesce });
  }

  return (
    <div>
      <FieldLabel htmlFor="layout-type">Laying pattern</FieldLabel>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Laying pattern">
        {LAYOUTS.map((l) => (
          <Button
            key={l.value}
            size="sm"
            variant={surface.layout.type === l.value ? "primary" : "secondary"}
            onClick={() => patchLayout({ type: l.value })}
          >
            {l.label}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        <FieldLabel htmlFor="layout-rotation" hint="Rotates the whole pattern on the surface">
          Pattern rotation: {surface.layout.rotationDeg}°
        </FieldLabel>
        <Input
          id="layout-rotation"
          type="range"
          min={0}
          max={90}
          step={15}
          value={surface.layout.rotationDeg}
          onChange={(e) => patchLayout({ rotationDeg: Number(e.target.value) }, `rot-${surface.id}`)}
          className="px-0"
        />
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface-muted/50 p-3">
        <p className="text-sm font-medium">
          {calibrated ? "Calibrated scale" : "Approximate scale"}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {calibrated
            ? "Tile size is set from your measured line. Accuracy depends on how precisely you marked it."
            : "Tiles keep their true aspect ratio, but the absolute size is not measured. Calibrate with a known length for realistic sizing."}
        </p>
        {!calibrated && (
          <div className="mt-3">
            <FieldLabel htmlFor="tiles-across" hint="How many tile widths span the surface">
              Tiles across: {surface.layout.approximateTilesAcross ?? 4}
            </FieldLabel>
            <Input
              id="tiles-across"
              type="range"
              min={1}
              max={12}
              step={0.5}
              value={surface.layout.approximateTilesAcross ?? 4}
              onChange={(e) => patchLayout({ approximateTilesAcross: Number(e.target.value) }, `ta-${surface.id}`)}
              className="px-0"
            />
            {material && (
              <p className="mt-1 text-xs text-text-muted">
                Product size: {material.widthMm}×{material.heightMm} mm — aspect ratio is always exact.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
