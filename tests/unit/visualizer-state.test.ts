import { describe, expect, it } from "vitest";
import { createCommandHistory } from "@/src/features/visualizer/state/history";
import {
  visualizerReducer,
  createInitialState,
} from "@/src/features/visualizer/state/visualizerReducer";
import { buildSurfaceRenderStates, hexToRgb01 } from "@/src/features/visualizer/state/selectors";
import { applyH } from "@visualizer/engine";
import type { VisualizerProject, VisualizerSurface } from "@/src/features/visualizer/state/types";
import { createEmptySurface } from "@/src/features/visualizer/state/types";
import type { VisualizerMaterial } from "@visualizer/engine";

function makeProject(surfaces?: VisualizerSurface[]): VisualizerProject {
  const s = surfaces ?? [createEmptySurface("floor")];
  return {
    version: 1,
    id: "proj-1",
    createdAt: "2026-09-20T00:00:00Z",
    updatedAt: "2026-09-20T00:00:00Z",
    name: "Test",
    room: { originalAssetId: "asset-1", widthPx: 1000, heightPx: 800, orientation: 0 },
    surfaces: s,
    selectedSurfaceId: s[0].id,
  };
}

const material: VisualizerMaterial = {
  id: "vm-test",
  sku: "SKU-1",
  slug: "test-tile",
  name: "Test Tile",
  kind: "vitrified-tile",
  widthMm: 600,
  heightMm: 1200,
  finish: "matte",
  faces: [{ id: "f1", albedoUrl: "/x.png", previewUrl: "/x.png" }],
  variationMode: "random-faces",
  rotationPolicy: "quarter-turns",
  allowMirror: true,
  supportedLayouts: ["straight"],
  productPagePath: "/product/test-tile",
  visualizerReady: true,
};

describe("command history", () => {
  it("push/undo/redo round-trips", () => {
    const h = createCommandHistory(0);
    h.push(1);
    h.push(2);
    expect(h.canUndo()).toBe(true);
    expect(h.undo()).toBe(1);
    expect(h.undo()).toBe(0);
    expect(h.canUndo()).toBe(false);
    expect(h.redo()).toBe(1);
    expect(h.canRedo()).toBe(true);
    expect(h.redo()).toBe(2);
    expect(h.canRedo()).toBe(false);
  });

  it("coalesces rapid updates under one key into ONE undo step", () => {
    const h = createCommandHistory(0);
    for (let i = 1; i <= 100; i++) h.push(i, "drag");
    expect(h.undo()).toBe(0);
    expect(h.canUndo()).toBe(false);
  });

  it("redo is cleared by a new push", () => {
    const h = createCommandHistory(0);
    h.push(1);
    h.undo();
    h.push(2);
    expect(h.canRedo()).toBe(false);
  });
});

describe("visualizer reducer", () => {
  it("SET_PROJECT then UPDATE_SURFACE then UNDO restores previous quad", () => {
    let state = createInitialState();
    const project = makeProject();
    state = visualizerReducer(state, { type: "SET_PROJECT", project });
    const original = project.surfaces[0].planeQuad;

    const moved = structuredClone(original);
    moved[0] = { x: 0.3, y: 0.5 };
    state = visualizerReducer(state, {
      type: "UPDATE_SURFACE",
      surfaceId: project.surfaces[0].id,
      patch: { planeQuad: moved },
    });
    expect(state.project!.surfaces[0].planeQuad[0].x).toBeCloseTo(0.3);

    state = visualizerReducer(state, { type: "UNDO" });
    expect(state.project!.surfaces[0].planeQuad).toEqual(original);

    state = visualizerReducer(state, { type: "REDO" });
    expect(state.project!.surfaces[0].planeQuad[0].x).toBeCloseTo(0.3);
  });

  it("drag coalescing collapses into a single undo entry", () => {
    let state = createInitialState();
    const project = makeProject();
    state = visualizerReducer(state, { type: "SET_PROJECT", project });
    const original = project.surfaces[0].planeQuad;
    const surfaceId = project.surfaces[0].id;

    for (let i = 1; i <= 20; i++) {
      const quad = structuredClone(original);
      quad[0] = { x: 0.1 + i * 0.01, y: 0.55 };
      state = visualizerReducer(state, {
        type: "UPDATE_SURFACE",
        surfaceId,
        patch: { planeQuad: quad },
        coalesce: `drag-${surfaceId}`,
      });
    }
    expect(state.project!.surfaces[0].planeQuad[0].x).toBeCloseTo(0.3);
    state = visualizerReducer(state, { type: "UNDO" });
    expect(state.project!.surfaces[0].planeQuad).toEqual(original);
  });

  it("maskVersion bumps via UPDATE_SURFACE patch", () => {
    let state = createInitialState();
    const project = makeProject();
    state = visualizerReducer(state, { type: "SET_PROJECT", project });
    state = visualizerReducer(state, {
      type: "UPDATE_SURFACE",
      surfaceId: project.surfaces[0].id,
      patch: { maskVersion: project.surfaces[0].maskVersion + 1 },
    });
    expect(state.project!.surfaces[0].maskVersion).toBe(1);
  });

  it("ADD/REMOVE_SURFACE manage selection", () => {
    let state = createInitialState();
    state = visualizerReducer(state, { type: "SET_PROJECT", project: makeProject() });
    const first = state.project!.surfaces[0].id;
    state = visualizerReducer(state, { type: "ADD_SURFACE", surfaceType: "wall" });
    expect(state.project!.surfaces).toHaveLength(2);
    expect(state.project!.selectedSurfaceId).not.toBe(first);
    const second = state.project!.selectedSurfaceId!;
    state = visualizerReducer(state, { type: "REMOVE_SURFACE", surfaceId: second });
    expect(state.project!.surfaces).toHaveLength(1);
    expect(state.project!.selectedSurfaceId).toBe(first);
  });
});

describe("selectors → render state", () => {
  it("maps quad corners through H exactly and derives scale", () => {
    const project = makeProject();
    const surface = project.surfaces[0];
    surface.materialId = "vm-test";
    const states = buildSurfaceRenderStates(project, new Map([["vm-test", material]]), {
      maskSources: { [surface.maskAssetId]: {} as unknown as TexImageSource },
      illumSources: { [surface.id]: null },
    });
    expect(states).toHaveLength(1);
    const rs = states[0];
    // H maps unit square corners to the quad (TL,TR,BR,BL)
    const corners = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    corners.forEach((c, i) => {
      const out = applyH(rs.H, c);
      expect(out.x).toBeCloseTo(surface.planeQuad[i].x, 6);
      expect(out.y).toBeCloseTo(surface.planeQuad[i].y, 6);
    });
    // approximate scale: tilesAcross(4) * widthMm(600)
    expect(rs.mmPerUnitX).toBe(2400);
    expect(rs.scaleMode).toBe("approximate");
    expect(rs.grout.colorRgb).toHaveLength(3);
  });

  it("skips surfaces without material or with degenerate quads", () => {
    const project = makeProject();
    project.surfaces[0].planeQuad = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ];
    project.surfaces[0].materialId = "vm-test";
    const states = buildSurfaceRenderStates(project, new Map([["vm-test", material]]), {
      maskSources: {},
      illumSources: {},
    });
    expect(states).toHaveLength(0);

    const project2 = makeProject();
    project2.surfaces[0].materialId = undefined;
    expect(
      buildSurfaceRenderStates(project2, new Map([["vm-test", material]]), { maskSources: {}, illumSources: {} })
    ).toHaveLength(0);
  });
});

describe("hexToRgb01", () => {
  it("converts colours and tolerates junk", () => {
    expect(hexToRgb01("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb01("#ffffff")).toEqual([1, 1, 1]);
    expect(hexToRgb01("#b8b2a6")[0]).toBeCloseTo(0.722, 2);
    expect(hexToRgb01("not-a-color").length).toBe(3);
  });
});
