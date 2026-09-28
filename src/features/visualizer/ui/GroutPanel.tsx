"use client";

import { FieldLabel, Input, Checkbox } from "@/components/ui/Input";
import type { VisualizerAction } from "../state/visualizerReducer";
import type { VisualizerSurface } from "../state/types";

const PRESET_COLORS = [
  { value: "#d8d3c8", label: "Off-white" },
  { value: "#b8b2a6", label: "Light grey" },
  { value: "#8f8a80", label: "Medium grey" },
  { value: "#565248", label: "Dark grey" },
  { value: "#c4b294", label: "Warm beige" },
];

/** Grout controls (spec §15): material-space width, restrained palette. */
export function GroutPanel({
  surface,
  dispatch,
  calibrated,
}: {
  surface: VisualizerSurface;
  dispatch: React.Dispatch<VisualizerAction>;
  calibrated: boolean;
}) {
  function patchGrout(patch: Partial<VisualizerSurface["grout"]>, coalesce?: string) {
    dispatch({
      type: "UPDATE_SURFACE",
      surfaceId: surface.id,
      patch: { grout: { ...surface.grout, ...patch } },
      coalesce,
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="grout-enabled"
          checked={surface.grout.enabled}
          onChange={(e) => patchGrout({ enabled: e.target.checked })}
        />
        <label htmlFor="grout-enabled" className="text-sm font-medium">
          Show grout joints
        </label>
      </div>

      {surface.grout.enabled && (
        <>
          <div className="mt-4">
            <FieldLabel htmlFor="grout-color">Colour</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.label}
                  aria-pressed={surface.grout.color === c.value}
                  onClick={() => patchGrout({ color: c.value })}
                  className={`h-11 w-11 rounded-full border-2 ${
                    surface.grout.color === c.value ? "border-accent" : "border-border"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
              <label className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border px-3 text-sm">
                Custom
                <input
                  type="color"
                  aria-label="Custom grout colour"
                  value={surface.grout.color}
                  onChange={(e) => patchGrout({ color: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border-none bg-transparent p-0"
                />
              </label>
            </div>
          </div>

          <div className="mt-4">
            {calibrated ? (
              <>
                <FieldLabel htmlFor="grout-width" hint="Real millimetres, rendered in perspective">
                  Grout width: {surface.grout.widthMm ?? 3} mm
                </FieldLabel>
                <Input
                  id="grout-width"
                  type="range"
                  min={0}
                  max={8}
                  step={0.5}
                  value={surface.grout.widthMm ?? 3}
                  onChange={(e) => patchGrout({ widthMm: Number(e.target.value) }, `gw-${surface.id}`)}
                  className="px-0"
                />
              </>
            ) : (
              <>
                <FieldLabel htmlFor="grout-width-px" hint="Approximate — calibrate for millimetre widths">
                  Grout width: {surface.grout.approximateWidthPx ?? 4} px
                </FieldLabel>
                <Input
                  id="grout-width-px"
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={surface.grout.approximateWidthPx ?? 4}
                  onChange={(e) => patchGrout({ approximateWidthPx: Number(e.target.value) }, `gwp-${surface.id}`)}
                  className="px-0"
                />
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            We avoid pure black or pure white joints — they read as synthetic in previews.
          </p>
        </>
      )}
    </div>
  );
}
