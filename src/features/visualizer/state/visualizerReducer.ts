import type { VisualizerProject, VisualizerSurface, SurfaceType } from "./types";
import { createEmptySurface, newId } from "./types";
import { createCommandHistory, type CommandHistory } from "./history";

/**
 * Visualizer reducer (visualizer spec §26): project state + undo/redo via
 * command history. Mask bitmaps live OUTSIDE React in maskRegistry; the
 * project references them by id + maskVersion.
 */

export type VisualizerAction =
  | { type: "SET_PROJECT"; project: VisualizerProject }
  | { type: "SET_ROOM"; assetId: string; widthPx: number; heightPx: number; name: string }
  | { type: "ADD_SURFACE"; surfaceType: SurfaceType }
  | { type: "REMOVE_SURFACE"; surfaceId: string }
  | { type: "SELECT_SURFACE"; surfaceId: string }
  | { type: "UPDATE_SURFACE"; surfaceId: string; patch: Partial<VisualizerSurface>; coalesce?: string }
  | { type: "SET_COMPARE"; compare: VisualizerProject["compare"] }
  | { type: "UNDO" }
  | { type: "REDO" };

export interface VisualizerState {
  project: VisualizerProject | null;
  /** Revision counter — bumps on every committed change so effects can sync. */
  revision: number;
}

/** Mask canvases, keyed by maskAssetId. Managed outside the reducer. */
const maskRegistry = new Map<string, HTMLCanvasElement>();

export function registerMask(id: string, canvas: HTMLCanvasElement): void {
  maskRegistry.set(id, canvas);
}
export function getMaskCanvas(id: string): HTMLCanvasElement | undefined {
  return maskRegistry.get(id);
}
export function deleteMask(id: string): void {
  maskRegistry.delete(id);
}
export function bumpMaskVersion(surface: VisualizerSurface): VisualizerSurface {
  return { ...surface, maskVersion: surface.maskVersion + 1 };
}

let history: CommandHistory<VisualizerProject> | null = null;

function ensureHistory(project: VisualizerProject): CommandHistory<VisualizerProject> {
  history ??= createCommandHistory(project);
  return history;
}

export function createInitialState(): VisualizerState {
  return { project: null, revision: 0 };
}

export function visualizerReducer(
  state: VisualizerState,
  action: VisualizerAction
): VisualizerState {
  switch (action.type) {
    case "SET_PROJECT": {
      history = createCommandHistory(action.project);
      return { project: action.project, revision: state.revision + 1 };
    }

    case "SET_ROOM": {
      if (!state.project) return state;
      const project: VisualizerProject = {
        ...state.project,
        name: action.name,
        updatedAt: new Date().toISOString(),
        room: {
          ...state.project.room,
          originalAssetId: action.assetId,
          widthPx: action.widthPx,
          heightPx: action.heightPx,
        },
      };
      ensureHistory(project).push(project);
      return { project, revision: state.revision + 1 };
    }

    case "ADD_SURFACE": {
      if (!state.project) return state;
      const surface = createEmptySurface(action.surfaceType);
      const project: VisualizerProject = {
        ...state.project,
        surfaces: [...state.project.surfaces, surface],
        selectedSurfaceId: surface.id,
        updatedAt: new Date().toISOString(),
      };
      ensureHistory(project).push(project);
      return { project, revision: state.revision + 1 };
    }

    case "REMOVE_SURFACE": {
      if (!state.project) return state;
      const remaining = state.project.surfaces.filter((s) => s.id !== action.surfaceId);
      const project: VisualizerProject = {
        ...state.project,
        surfaces: remaining,
        selectedSurfaceId:
          state.project.selectedSurfaceId === action.surfaceId
            ? remaining[0]?.id
            : state.project.selectedSurfaceId,
        updatedAt: new Date().toISOString(),
      };
      ensureHistory(project).push(project);
      return { project, revision: state.revision + 1 };
    }

    case "SELECT_SURFACE":
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, selectedSurfaceId: action.surfaceId },
      };

    case "UPDATE_SURFACE": {
      if (!state.project) return state;
      const project: VisualizerProject = {
        ...state.project,
        surfaces: state.project.surfaces.map((s) =>
          s.id === action.surfaceId ? { ...s, ...action.patch } : s
        ),
        updatedAt: new Date().toISOString(),
      };
      ensureHistory(project).push(project, action.coalesce);
      return { project, revision: state.revision + 1 };
    }

    case "SET_COMPARE":
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, compare: action.compare ?? undefined },
      };

    case "UNDO": {
      if (!state.project || !history) return state;
      const prev = history.undo();
      if (!prev) return state;
      return { project: prev, revision: state.revision + 1 };
    }

    case "REDO": {
      if (!state.project || !history) return state;
      const next = history.redo();
      if (!next) return state;
      return { project: next, revision: state.revision + 1 };
    }
  }
}

export function surfaceById(project: VisualizerProject, id?: string): VisualizerSurface | undefined {
  if (!id) return undefined;
  return project.surfaces.find((s) => s.id === id);
}
