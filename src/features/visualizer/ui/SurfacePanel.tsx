"use client";

import { Button } from "@/components/ui/Button";
import { Checkbox, FieldLabel, Input, Select } from "@/components/ui/Input";
import type { VisualizerAction } from "../state/visualizerReducer";
import { registerMask } from "../state/visualizerReducer";
import type { VisualizerProject, VisualizerSurface, SurfaceType } from "../state/types";
import { createEmptySurface } from "../state/types";
import { rasterizePolygon, createMask } from "@visualizer/engine";

export type EditMode = "none" | "handles" | "brush-add" | "brush-erase";

/**
 * Surface panel (spec §10): surface list, plane-quad numeric inputs (the
 * non-drag alternative required by WCAG 2.2), polygon rasterization and
 * mask brush modes + reset.
 */
export function SurfacePanel({
  project,
  dispatch,
  editMode,
  setEditMode,
  maskCanvases,
  onQuadChange,
}: {
  project: VisualizerProject;
  dispatch: React.Dispatch<VisualizerAction>;
  editMode: EditMode;
  setEditMode: (m: EditMode) => void;
  maskCanvases: Map<string, HTMLCanvasElement>;
  onQuadChange: (surfaceId: string, quad: VisualizerSurface["planeQuad"]) => void;
}) {
  const selected = project.surfaces.find((s) => s.id === project.selectedSurfaceId);

  function addSurface(type: SurfaceType) {
    const surface = createEmptySurface(type);
    const canvas = document.createElement("canvas");
    canvas.width = project.room.widthPx;
    canvas.height = project.room.heightPx;
    maskCanvases.set(surface.maskAssetId, canvas);
    registerMask(surface.maskAssetId, canvas);
    // Build an initial mask from the default quad polygon.
    const mask = createMask(project.room.widthPx, project.room.heightPx);
    rasterizePolygon(
      mask,
      surface.planeQuad.map((p) => ({ x: p.x * project.room.widthPx, y: p.y * project.room.heightPx })),
      true
    );
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(project.room.widthPx, project.room.heightPx);
    for (let i = 0; i < mask.data.length; i++) {
      img.data[i * 4] = 255;
      img.data[i * 4 + 1] = 255;
      img.data[i * 4 + 2] = 255;
      img.data[i * 4 + 3] = mask.data[i];
    }
    ctx.putImageData(img, 0, 0);
    dispatch({ type: "ADD_SURFACE", surfaceType: type });
  }

  if (!selected) {
    return (
      <div>
        <p className="text-sm text-text-muted">No surface selected — add one.</p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => addSurface("floor")}>Add floor</Button>
          <Button variant="secondary" onClick={() => addSurface("wall")}>Add wall</Button>
        </div>
      </div>
    );
  }

  const cornerInputs = (
    <div className="mt-2 space-y-3">
      {(["Top left", "Top right", "Bottom right", "Bottom left"] as const).map((label, i) => (
        <div key={label} className="grid grid-cols-[1fr_5rem_5rem] items-end gap-2">
          <span className="text-sm">{label}</span>
          <div>
            <label htmlFor={`cx-${i}`} className="sr-only">{label} X %</label>
            <Input
              id={`cx-${i}`} type="number" min={0} max={100} inputMode="decimal"
              value={Math.round(selected.planeQuad[i].x * 100)}
              onChange={(e) => {
                const quad = [...selected.planeQuad] as VisualizerSurface["planeQuad"];
                quad[i] = { x: Number(e.target.value) / 100, y: quad[i].y };
                onQuadChange(selected.id, quad);
              }}
            />
          </div>
          <div>
            <label htmlFor={`cy-${i}`} className="sr-only">{label} Y %</label>
            <Input
              id={`cy-${i}`} type="number" min={0} max={100} inputMode="decimal"
              value={Math.round(selected.planeQuad[i].y * 100)}
              onChange={(e) => {
                const quad = [...selected.planeQuad] as VisualizerSurface["planeQuad"];
                quad[i] = { x: quad[i].x, y: Number(e.target.value) / 100 };
                onQuadChange(selected.id, quad);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div>
        <FieldLabel htmlFor="surface-select">Surface</FieldLabel>
        <Select
          id="surface-select"
          value={selected.id}
          onChange={(e) => dispatch({ type: "SELECT_SURFACE", surfaceId: e.target.value })}
        >
          {project.surfaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant={editMode === "handles" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setEditMode(editMode === "handles" ? "none" : "handles")}
        >
          {editMode === "handles" ? "Done moving corners" : "Move corners"}
        </Button>
        <Button
          variant={editMode === "brush-add" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setEditMode(editMode === "brush-add" ? "none" : "brush-add")}
        >
          Add to mask
        </Button>
        <Button
          variant={editMode === "brush-erase" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setEditMode(editMode === "brush-erase" ? "none" : "brush-erase")}
        >
          Erase mask (keep furniture)
        </Button>
      </div>

      <fieldset className="mt-4 border-t border-border pt-3">
        <legend className="text-sm font-medium">Corner positions (%)</legend>
        <p className="mt-1 text-xs text-text-muted">
          Keyboard-friendly alternative to dragging the handles.
        </p>
        {cornerInputs}
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button variant="secondary" size="sm" onClick={() => addSurface("floor")}>Add floor</Button>
        <Button variant="secondary" size="sm" onClick={() => addSurface("wall")}>Add wall</Button>
        {project.surfaces.length > 1 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => dispatch({ type: "REMOVE_SURFACE", surfaceId: selected.id })}
          >
            Remove this surface
          </Button>
        )}
      </div>
    </div>
  );
}
