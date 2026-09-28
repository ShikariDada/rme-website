"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { VisualizerMaterial } from "@visualizer/engine";
import { computeIlluminationMap } from "@visualizer/engine";
import { RendererClient } from "../bridge/rendererClient";
import { registerMask, getMaskCanvas } from "../state/visualizerReducer";
import { buildSurfaceRenderStates } from "../state/selectors";
import {
  visualizerReducer,
  createInitialState,
  type VisualizerAction,
} from "../state/visualizerReducer";
import type { VisualizerProject, VisualizerSurface } from "../state/types";
import { createEmptySurface, newId } from "../state/types";
import { loadProject, saveProject, putBlob, getBlob, deleteProject } from "../storage/projectsDb";
import { saveBlob, loadBlob, deleteBlob } from "../storage/opfs";
import { sharePreview, downloadBlob } from "../share/nativeShare";
import { whatsappShareHref, SHARE_INSTRUCTION } from "../share/whatsapp";
import { visualizerOpen, visualizerProductSelected, visualizerExport, visualizerQuoteClick } from "../analytics/visualizerEvents";
import { RoomPicker } from "./RoomPicker";
import { ProductDrawer } from "./ProductDrawer";
import { SurfacePanel } from "./SurfacePanel";
import { PatternPanel } from "./PatternPanel";
import { GroutPanel } from "./GroutPanel";
import { CalibrationPanel } from "./CalibrationPanel";
import { ExportSheet } from "./ExportSheet";
import { CapabilityNotice } from "./CapabilityNotice";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Visualizer shell (visualizer spec §30): full-height editor, canvas-first,
 * bottom-sheet controls on mobile. All GPU work is imperative; React commits
 * semantic state only.
 */

export interface ShellProps {
  materials: VisualizerMaterial[];
  settings: { whatsappNumber: string; phone: string };
  initialMaterialId?: string;
}

type PanelId = "tile" | "surface" | "layout" | "grout" | "compare" | "export" | "projects" | null;

const WORKING_LONG_EDGE = 1440;

export default function VisualizerShell({ materials, settings, initialMaterialId }: ShellProps) {
  const [state, dispatch] = useReducer(visualizerReducer, undefined, createInitialState);
  const project = state.project;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<RendererClient | null>(null);
  const [capabilities, setCapabilities] = useState<{ maxTextureSize: number } | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const [editMode, setEditMode] = useState<"none" | "handles" | "brush-add" | "brush-erase">("none");
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [compare, setCompare] = useState(false);

  const materialMap = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials]
  );
  const atlasCache = useRef(new Map<string, { release(): void }>());
  const maskCanvases = useRef(new Map<string, HTMLCanvasElement>());

  // --- renderer init ------------------------------------------------------
  useEffect(() => {
    visualizerOpen("visualizer-route");
    let disposed = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handlers = {
      onContextLost: () => setStatus("Graphics context lost — state saved, restoring…"),
      onContextRestored: () => {
        setStatus(null);
        renderRef.current?.();
      },
    };

    RendererClient.create(canvas, handlers)
      .then((client) => {
        if (disposed) {
          client.dispose();
          return;
        }
        rendererRef.current = client;
        setCapabilities({ maxTextureSize: client.capabilities.maxTextureSize });
        onResize();
      })
      .catch(() => {
        setInitError("This browser can't run the 3D preview editor.");
      });

    return () => {
      disposed = true;
      rendererRef.current?.dispose();
      rendererRef.current = null;
      for (const atlas of atlasCache.current.values()) atlas.release();
      atlasCache.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onResize = useCallback(() => {
    const wrap = wrapRef.current;
    const renderer = rendererRef.current;
    if (!wrap || !renderer) return;
    const rect = wrap.getBoundingClientRect();
    renderer.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onResize]);

  // --- scene sync ----------------------------------------------------------
  const renderRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!project || !rendererRef.current?.ready) return;

    // Ensure every used material has an atlas.
    for (const surface of project.surfaces) {
      if (!surface.materialId || atlasCache.current.has(surface.materialId)) continue;
      const material = materialMap.get(surface.materialId);
      if (!material) continue;
      setBusy(`Loading ${material.name}…`);
      Promise.all(material.faces.map((f) => createImageBitmapFromUrl(f.albedoUrl)))
        .then(async (bitmaps) => {
          const cols = Math.ceil(Math.sqrt(bitmaps.length));
          const rows = Math.ceil(bitmaps.length / cols);
          const atlas = await rendererRef.current!.setMaterialAtlas(material.id, bitmaps, cols, rows);
          atlasCache.current.set(material.id, atlas);
          bitmaps.forEach((b) => b.close());
          renderRef.current();
        })
        .catch(() => setStatus(`Could not load texture for ${material.name}.`))
        .finally(() => setBusy(null));
    }

    renderRef.current = () => {
      const renderer = rendererRef.current;
      if (!project || !renderer?.ready) return;
      const maskSources: Record<string, TexImageSource> = {};
      const illumSources: Record<string, TexImageSource | null> = {};
      for (const surface of project.surfaces) {
        const canvas2d = maskCanvases.current.get(surface.maskAssetId);
        if (canvas2d) {
          maskSources[surface.maskAssetId] = canvas2d;
          if (!illumSources[surface.id]) {
            illumSources[surface.id] = computeIlluminationFromRoomCanvas(surface, project);
          }
        }
      }
      const states = buildSurfaceRenderStates(project, materialMap, {
        maskSources,
        illumSources,
      });
      void renderer.setSurfaces(states);
      void renderer.setCompareSplit(compare ? 0.5 : null);
      renderer.requestRender();
    };
    renderRef.current();
  }, [project, materialMap, compare, state.revision]);

  // --- room loading ---------------------------------------------------------
  const loadOwnPhoto = useCallback(async (file: File) => {
    setBusy("Reading photo…");
    try {
      const bitmap = await createImageBitmap(file);
      const longEdge = Math.min(
        WORKING_LONG_EDGE,
        rendererRef.current?.capabilities.maxTextureSize ?? 4096
      );
      const { canvas, ctx, width, height } = downscale(bitmap, longEdge);
      registerRoomCanvas(canvas);
      const assetId = await saveBlob("rooms", `${newId("room")}.png`, await canvasToBlob(canvas));
      const originalId = await putBlob(file);
      const surface = createEmptySurface("floor");
      registerMask(surface.maskAssetId, canvas2dPlaceholder(width, height));
      const blank = document.createElement("canvas");
      blank.width = width;
      blank.height = height;
      maskCanvases.current.set(surface.maskAssetId, blank);
      const project: VisualizerProject = {
        version: 1,
        id: newId("proj"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: file.name.replace(/\.[a-z]+$/i, "").slice(0, 40) || "My room",
        room: {
          originalAssetId: originalId,
          widthPx: width,
          heightPx: height,
          orientation: 0,
        },
        surfaces: [surface],
        selectedSurfaceId: surface.id,
      };
      dispatch({ type: "SET_PROJECT", project });
      await rendererRef.current?.setRoom(canvas, width, height);
      setEditMode("handles");
    } catch {
      setStatus("Could not read that image — try a JPG or PNG photo.");
    } finally {
      setBusy(null);
    }
  }, []);

  const loadPresetRoom = useCallback(async (presetId: string) => {
    setBusy("Preparing sample room…");
    try {
      const res = await fetch("/rooms/preset-rooms.json");
      const presets = (await res.json()) as PresetRoom[];
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) throw new Error("missing preset");
      const bitmap = await createImageBitmapFromUrl(preset.image);
      const { canvas, width, height } = drawToCanvas(bitmap, bitmap.width, bitmap.height);
      registerRoomCanvas(canvas);
      const surfaces: VisualizerSurface[] = preset.surfaces.map((ps) => {
        const surface = createEmptySurface(ps.type === "wall" ? "wall" : "floor");
        surface.name = ps.name;
        surface.planeQuad = ps.planeQuad.map((q) => ({ x: q[0], y: q[1] })) as VisualizerSurface["planeQuad"];
        if (ps.calibration) {
          surface.calibration = {
            p1: { x: ps.calibration.p1[0], y: ps.calibration.p1[1] },
            p2: { x: ps.calibration.p2[0], y: ps.calibration.p2[1] },
            realLengthMm: ps.calibration.realLengthMm,
            quality: "user-measured",
          };
          surface.layout.scaleMode = "calibrated";
        }
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = width;
        maskCanvas.height = height;
        const mctx = maskCanvas.getContext("2d")!;
        // mask images are white=material, black=room → convert to mask canvas alpha
        void mctx;
        maskCanvases.current.set(surface.maskAssetId, maskCanvas);
        loadMaskIntoCanvas(maskCanvas, ps.maskUrl, surface).then(() => {
          dispatch({ type: "UPDATE_SURFACE", surfaceId: surface.id, patch: { maskVersion: surface.maskVersion + 1 } });
        });
        return surface;
      });
      const project: VisualizerProject = {
        version: 1,
        id: newId("proj"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: preset.name,
        room: { originalAssetId: "preset", widthPx: width, heightPx: height, orientation: 0 },
        surfaces,
        selectedSurfaceId: surfaces[0]?.id,
      };
      dispatch({ type: "SET_PROJECT", project });
      await rendererRef.current?.setRoom(canvas, width, height);
      // Preselect material from PDP deep link.
      if (initialMaterialId && materialMap.has(initialMaterialId)) {
        selectMaterial(surfaces[0]?.id, initialMaterialId);
      }
      setEditMode("handles");
    } catch {
      setStatus("Could not load the sample room.");
    } finally {
      setBusy(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMaterialId, materialMap]);

  // --- material selection ---------------------------------------------------
  const selectMaterial = useCallback(
    (surfaceId: string | undefined, materialId: string) => {
      if (!surfaceId) return;
      dispatch({ type: "UPDATE_SURFACE", surfaceId, patch: { materialId }, coalesce: `mat-${surfaceId}` });
      const material = materialMap.get(materialId);
      if (material) visualizerProductSelected(material.sku);
      setPanel(null);
    },
    [materialMap]
  );

  // --- handle dragging (imperative, committed on pointerup) ------------------
  const dragState = useRef<{
    handleIndex: number;
    surfaceId: string;
    quad: [Pt, Pt, Pt, Pt];
  } | null>(null);

  function handlePointerDown(surface: VisualizerSurface, index: number) {
    return (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = {
        handleIndex: index,
        surfaceId: surface.id,
        quad: [...surface.planeQuad],
      };
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    const wrap = wrapRef.current;
    if (!drag || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = clamp01((e.clientX - rect.left) / rect.width);
    const y = clamp01((e.clientY - rect.top) / rect.height);
    drag.quad[drag.handleIndex] = { x, y };
    updateHandleOverlay(drag.surfaceId, drag.quad);
  }

  function handlePointerUp() {
    const drag = dragState.current;
    if (!drag) return;
    dispatch({
      type: "UPDATE_SURFACE",
      surfaceId: drag.surfaceId,
      patch: { planeQuad: drag.quad },
      coalesce: `drag-${drag.surfaceId}`,
    });
    dragState.current = null;
  }

  // brush painting
  const brushState = useRef<{ surfaceId: string; last: Pt | null } | null>(null);
  function canvasPointerDown(e: React.PointerEvent) {
    if (!editMode.startsWith("brush") || !project) return;
    const surface = project.surfaces.find((s) => s.id === project.selectedSurfaceId);
    if (!surface) return;
    const mask = maskCanvases.current.get(surface.maskAssetId);
    const wrap = wrapRef.current;
    if (!mask || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * mask.width;
    const y = ((e.clientY - rect.top) / rect.height) * mask.height;
    brushStampOnMask(mask, x, y, editMode === "brush-add");
    brushState.current = { surfaceId: surface.id, last: { x, y } };
  }
  function canvasPointerMoveBrush(e: React.PointerEvent) {
    const brush = brushState.current;
    if (!brush || !project) return;
    const surface = project.surfaces.find((s) => s.id === brush.surfaceId);
    const mask = surface ? maskCanvases.current.get(surface.maskAssetId) : undefined;
    const wrap = wrapRef.current;
    if (!surface || !mask || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * mask.width;
    const y = ((e.clientY - rect.top) / rect.height) * mask.height;
    brushStampOnMask(mask, x, y, editMode === "brush-add");
  }
  function canvasPointerUpBrush() {
    const brush = brushState.current;
    if (!brush || !project) return;
    const surface = project.surfaces.find((s) => s.id === brush.surfaceId);
    if (surface) {
      dispatch({
        type: "UPDATE_SURFACE",
        surfaceId: surface.id,
        patch: { maskVersion: surface.maskVersion + 1 },
        coalesce: `brush-${surface.id}`,
      });
    }
    brushState.current = null;
  }

  // --- save/share/export ----------------------------------------------------
  const selectedSurface = project?.surfaces.find((s) => s.id === project.selectedSurfaceId);

  const exportPreview = useCallback(
    async (mode: "image" | "card"): Promise<Blob | null> => {
      if (!project) return null;
      setBusy("Rendering high-resolution preview…");
      try {
        const { ExportRenderer } = await import("@visualizer/engine");
        const roomCanvas = roomCanvasRef;
        if (!roomCanvas) throw new Error("no room");
        const maskSources: Record<string, TexImageSource> = {};
        const illumSources: Record<string, TexImageSource | null> = {};
        for (const surface of project.surfaces) {
          const mc = maskCanvases.current.get(surface.maskAssetId);
          if (mc) {
            maskSources[surface.maskAssetId] = mc;
            illumSources[surface.id] = computeIlluminationFromRoomCanvas(surface, project);
          }
        }
        const states = buildSurfaceRenderStates(project, materialMap, { maskSources, illumSources });
        const exporter = new (ExportRenderer as unknown as new () => {
          render(o: {
            surfaceStates: typeof states;
            roomSource: TexImageSource;
            roomWidthPx: number;
            roomHeightPx: number;
            targetLongEdge: number;
            compareSplit: number | null;
          }): Promise<Blob>;
        })();
        // The engine ExportRenderer owns its GPU resources and releases them
        // internally after each render (spec §32.2).
        const blob = await exporter.render({
          surfaceStates: states,
          roomSource: roomCanvas,
          roomWidthPx: project.room.widthPx,
          roomHeightPx: project.room.heightPx,
          targetLongEdge: 2560,
          compareSplit: compare ? 0.5 : null,
        });
        if (mode === "card") {
          return await composeDesignCard(blob, project, materialMap);
        }
        visualizerExport();
        return blob;
      } catch (e) {
        console.error("export-failed:", e instanceof Error ? e.message : String(e));
        setStatus("Export failed — try a slightly smaller preview.");
        return null;
      } finally {
        setBusy(null);
      }
    },
    [project, materialMap, compare]
  );

  async function doShare() {
    const blob = await exportPreview("image");
    if (!blob) return;
    visualizerExport();
    const result = await sharePreview(blob, "room-preview.jpg", "Room preview generated on the showroom site.");
    if (result === "unsupported") {
      downloadBlob(blob, "room-preview.jpg");
      setStatus(SHARE_INSTRUCTION);
    }
  }

  async function doSave() {
    if (!project) return;
    await saveProject(project);
    setStatus("Saved locally on this device.");
  }

  async function doQuote() {
    if (!project) return;
    const skus = new Set<string>();
    const names = new Set<string>();
    for (const s of project.surfaces) {
      const m = s.materialId ? materialMap.get(s.materialId) : undefined;
      if (m) {
        skus.add(m.sku);
        names.add(m.name);
      }
    }
    visualizerQuoteClick([...skus][0]);
    window.open(whatsappShareHref({ productNames: [...names], skus: [...skus] }, settings.whatsappNumber), "_blank", "noopener");
  }

  // expose render fn for context restore
  useEffect(() => {
    renderRef.current();
  }, [state.revision, compare]);

  const handleOverlay = useRef<HTMLDivElement>(null);
  function updateHandleOverlay(surfaceId: string, quad: [Pt, Pt, Pt, Pt]) {
    const overlay = handleOverlay.current;
    if (!overlay || overlay.dataset.surfaceId !== surfaceId) return;
    const handles = overlay.querySelectorAll<HTMLElement>("[data-handle]");
    handles.forEach((el, i) => {
      const p = quad[i];
      if (!p) return;
      el.style.left = `${p.x * 100}%`;
      el.style.top = `${p.y * 100}%`;
    });
  }

  if (initError) {
    return (
      <CapabilityNotice
        message={initError}
        whatsappNumber={settings.whatsappNumber}
      />
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-bg">
      {/* Top bar */}
      <div className="flex h-14 items-center gap-2 border-b border-border bg-surface px-3">
        <Button variant="text" onClick={() => window.history.back()} aria-label="Back">
          ←
        </Button>
        <input
          className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1 text-sm font-medium hover:bg-surface-muted"
          value={project?.name ?? "Visualizer"}
          onChange={(e) =>
            project && dispatch({ type: "SET_ROOM", assetId: project.room.originalAssetId, widthPx: project.room.widthPx, heightPx: project.room.heightPx, name: e.target.value })
          }
          aria-label="Project name"
          disabled={!project}
        />
        <Button
          variant="text"
          aria-label="Undo"
          disabled={!project}
          onClick={() => dispatch({ type: "UNDO" })}
        >
          ↶
        </Button>
        <Button variant="text" aria-label="Redo" disabled={!project} onClick={() => dispatch({ type: "REDO" })}>
          ↷
        </Button>
        <Button variant="text" onClick={() => setPanel("projects")} aria-label="Saved projects">
          ☰
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 touch-none bg-[#141311]"
        onPointerDown={canvasPointerDown}
        onPointerMove={(e) => {
          handlePointerMove(e);
          canvasPointerMoveBrush(e);
        }}
        onPointerUp={() => {
          handlePointerUp();
          canvasPointerUpBrush();
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* Corner handles overlay */}
        {project && editMode === "handles" && selectedSurface && (
          <div
            ref={handleOverlay}
            data-surface-id={selectedSurface.id}
            className="pointer-events-none absolute inset-0"
          >
            {selectedSurface.planeQuad.map((p, i) => (
              <button
                key={i}
                data-handle={i}
                type="button"
                aria-label={`Drag corner ${i + 1}. Use number inputs in the Surface panel for keyboard control.`}
                onPointerDown={handlePointerDown(selectedSurface, i)}
                className="pointer-events-auto absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full active:cursor-grabbing"
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
              >
                <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent/80 shadow" />
              </button>
            ))}
          </div>
        )}

        {busy && (
          <div className="absolute inset-x-0 top-2 mx-auto w-fit rounded-full bg-black/70 px-4 py-1.5 text-sm text-white" role="status">
            {busy}
          </div>
        )}
        {status && !busy && (
          <div className="absolute inset-x-0 bottom-2 mx-auto w-fit max-w-[92%] rounded-md bg-black/70 px-4 py-1.5 text-center text-sm text-white" role="status">
            {status}
          </div>
        )}

        {!project && (
          <div className="absolute inset-0 overflow-y-auto bg-bg/95 p-4">
            <RoomPicker onUseOwnPhoto={loadOwnPhoto} onUsePreset={loadPresetRoom} />
          </div>
        )}
      </div>

      {/* Bottom rail */}
      <div className="border-t border-border bg-surface pb-safe-bar">
        <div className="grid grid-cols-5 gap-1 px-2 pt-1.5 md:hidden">
          <RailButton label="Tile" onClick={() => setPanel("tile")} disabled={!project} />
          <RailButton label="Surface" onClick={() => setPanel("surface")} disabled={!project} />
          <RailButton label="Layout" onClick={() => setPanel("layout")} disabled={!project} />
          <RailButton label="Grout" onClick={() => setPanel("grout")} disabled={!project} />
          <RailButton label="Share" onClick={() => setPanel("export")} disabled={!project} />
        </div>
        <div className="hidden items-center gap-2 px-3 py-2 md:flex">
          <Button variant="secondary" onClick={() => setPanel("tile")} disabled={!project}>Tile</Button>
          <Button variant="secondary" onClick={() => setPanel("surface")} disabled={!project}>Surface</Button>
          <Button variant="secondary" onClick={() => setPanel("layout")} disabled={!project}>Layout</Button>
          <Button variant="secondary" onClick={() => setPanel("grout")} disabled={!project}>Grout</Button>
          <Button variant={compare ? "primary" : "secondary"} onClick={() => setCompare((c) => !c)} disabled={!project}>
            Compare
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={doSave} disabled={!project}>Save</Button>
            <Button onClick={doShare} disabled={!project}>Save / Share</Button>
            <Button variant="whatsapp" onClick={doQuote} disabled={!project}>Get quote</Button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <Dialog open={panel === "tile"} onClose={() => setPanel(null)} title="Choose a tile" variant="sheet">
        <ProductDrawer
          materials={materials}
          selectedId={selectedSurface?.materialId}
          onSelect={(id) => selectMaterial(selectedSurface?.id, id)}
        />
      </Dialog>

      <Dialog open={panel === "surface"} onClose={() => setPanel(null)} title="Surface" variant="sheet">
        {project && (
          <SurfacePanel
            project={project}
            dispatch={dispatch}
            editMode={editMode}
            setEditMode={setEditMode}
            maskCanvases={maskCanvases.current}
            onQuadChange={(surfaceId, quad) =>
              dispatch({ type: "UPDATE_SURFACE", surfaceId, patch: { planeQuad: quad } })
            }
          />
        )}
      </Dialog>

      <Dialog open={panel === "layout"} onClose={() => setPanel(null)} title="Layout & scale" variant="sheet">
        {selectedSurface && (
          <PatternPanel
            surface={selectedSurface}
            material={selectedSurface.materialId ? materialMap.get(selectedSurface.materialId) : undefined}
            dispatch={dispatch}
          />
        )}
        {selectedSurface && (
          <div className="mt-4 border-t border-border pt-4">
            <CalibrationPanel
              surface={selectedSurface}
              dispatch={dispatch}
              onCalibrated={() => setStatus("Calibrated — scale set from your measurement.")}
            />
          </div>
        )}
      </Dialog>

      <Dialog open={panel === "grout"} onClose={() => setPanel(null)} title="Grout" variant="sheet">
        {selectedSurface && (
          <GroutPanel
            surface={selectedSurface}
            dispatch={dispatch}
            calibrated={selectedSurface.layout.scaleMode === "calibrated" && Boolean(selectedSurface.calibration)}
          />
        )}
      </Dialog>

      <Dialog open={panel === "export"} onClose={() => setPanel(null)} title="Save / Share" variant="sheet">
        <ExportSheet
          onShare={doShare}
          onSaveImage={async () => {
            const blob = await exportPreview("image");
            if (blob) downloadBlob(blob, "room-preview.jpg");
          }}
          onSaveCard={async () => {
            const blob = await exportPreview("card");
            if (blob) downloadBlob(blob, "room-preview-card.jpg");
          }}
          onQuote={doQuote}
          hasMaterial={Boolean(selectedSurface?.materialId)}
        />
      </Dialog>

      <Dialog open={panel === "projects"} onClose={() => setPanel(null)} title="Saved projects" variant="sheet">
        <ProjectsPanel
          onOpen={async (id) => {
            const p = await loadProject(id);
            if (p) {
              dispatch({ type: "SET_PROJECT", project: p });
              const roomBlob = p.room.originalAssetId === "preset" ? null : await loadBlob(p.room.originalAssetId);
              if (roomBlob) {
                const bitmap = await createImageBitmap(roomBlob);
                const { canvas } = drawToCanvas(bitmap, p.room.widthPx, p.room.heightPx);
                registerRoomCanvas(canvas);
                await rendererRef.current?.setRoom(canvas, p.room.widthPx, p.room.heightPx);
                for (const surface of p.surfaces) {
                  const blank = document.createElement("canvas");
                  blank.width = p.room.widthPx;
                  blank.height = p.room.heightPx;
                  maskCanvases.current.set(surface.maskAssetId, blank);
                }
              }
              setPanel(null);
              setStatus("Project restored. Masks start cleared after a reload — adjust if needed.");
            }
          }}
          onDelete={async (id) => {
            const p = await loadProject(id);
            if (p) {
              await deleteProject(id);
              if (p.room.originalAssetId !== "preset") {
                await deleteBlob(p.room.originalAssetId);
              }
            }
          }}
        />
      </Dialog>

      <p className="sr-only" aria-live="polite">
        {compare ? "Compare mode on" : ""}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* helpers + subcomponents kept local to the shell file set            */

type Pt = { x: number; y: number };

interface PresetRoom {
  id: string;
  name: string;
  image: string;
  width: number;
  height: number;
  surfaces: {
    id: string;
    name: string;
    type: string;
    planeQuad: number[][];
    maskUrl: string;
    calibration?: { p1: number[]; p2: number[]; realLengthMm: number; quality: string };
  }[];
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

let roomCanvasRef: HTMLCanvasElement | null = null;
function registerRoomCanvas(canvas: HTMLCanvasElement): void {
  roomCanvasRef = canvas;
}

function drawToCanvas(source: ImageBitmap, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, width, height);
  return { canvas, ctx, width, height };
}

function downscale(bitmap: ImageBitmap, maxLongEdge: number) {
  const scale = Math.min(1, maxLongEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(2, Math.round(bitmap.width * scale));
  const height = Math.max(2, Math.round(bitmap.height * scale));
  return drawToCanvas(bitmap, width, height);
}

async function createImageBitmapFromUrl(url: string): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9)
  );
}

function registerMaskCanvas(surface: VisualizerSurface, width: number, height: number): void {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  maskCanvases_global.set(surface.maskAssetId, canvas);
}

function canvas2dPlaceholder(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Module-level registry shared with the shell's render sync.
const maskCanvases_global = new Map<string, HTMLCanvasElement>();

function brushStampOnMask(mask: HTMLCanvasElement, x: number, y: number, add: boolean): void {
  const ctx = mask.getContext("2d")!;
  const r = Math.max(8, Math.round(Math.min(mask.width, mask.height) * 0.03));
  ctx.save();
  ctx.globalCompositeOperation = add ? "source-over" : "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();
  ctx.restore();
}

async function loadMaskIntoCanvas(target: HTMLCanvasElement, url: string, surface: VisualizerSurface): Promise<void> {
  const bitmap = await createImageBitmapFromUrl(url);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Convert luminance to alpha (white = keep material).
  for (let i = 0; i < data.data.length; i += 4) {
    const lum = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
    data.data[i] = 255;
    data.data[i + 1] = 255;
    data.data[i + 2] = 255;
    data.data[i + 3] = lum;
  }
  ctx.putImageData(data, 0, 0);
  const tctx = target.getContext("2d")!;
  tctx.clearRect(0, 0, target.width, target.height);
  tctx.drawImage(canvas, 0, 0);
  surface.maskVersion += 1;
  maskCanvases_global.set(surface.maskAssetId, target);
}

function computeIlluminationFromRoomCanvas(
  surface: VisualizerSurface,
  project: VisualizerProject
): HTMLCanvasElement | null {
  const room = roomCanvasRef;
  if (!room) return null;
  const w = 256;
  const h = Math.max(2, Math.round((room.height / room.width) * w));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sctx = small.getContext("2d")!;
  sctx.drawImage(room, 0, 0, w, h);
  const roomData = sctx.getImageData(0, 0, w, h);

  const maskSmall = document.createElement("canvas");
  maskSmall.width = w;
  maskSmall.height = h;
  const maskCanvas = getMaskCanvas(surface.maskAssetId) ?? maskCanvases_global.get(surface.maskAssetId);
  if (maskCanvas) {
    const mctx = maskSmall.getContext("2d")!;
    mctx.drawImage(maskCanvas, 0, 0, w, h);
  }
  const maskData = maskSmall.getContext("2d")!.getImageData(0, 0, w, h);

  const illum = computeIlluminationMap(
    { data: roomData.data, width: w, height: h },
    { data: maskData.data, width: w, height: h },
    0.55,
    6
  );
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  const img = octx.createImageData(w, h);
  img.data.set(illum.data);
  octx.putImageData(img, 0, 0);
  return out;
}

async function composeDesignCard(
  imageBlob: Blob,
  project: VisualizerProject,
  materialMap: Map<string, VisualizerMaterial>
): Promise<Blob> {
  const img = await createImageBitmap(imageBlob);
  const margin = Math.round(img.height * 0.08);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height + margin;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, img.height, canvas.width, margin);
  ctx.fillStyle = "#1e1d1a";
  const fontSize = Math.max(14, Math.round(margin * 0.32));
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  const names = new Set<string>();
  const skus = new Set<string>();
  for (const s of project.surfaces) {
    const m = s.materialId ? materialMap.get(s.materialId) : undefined;
    if (m) {
      names.add(m.name);
      skus.add(m.sku);
    }
  }
  const calibrated = project.surfaces.some((s) => s.calibration && s.layout.scaleMode === "calibrated");
  const label = [
    [...names].slice(0, 2).join(" · "),
    [...skus].slice(0, 2).join(", "),
    calibrated ? "Calibrated preview" : "Approximate scale preview",
  ]
    .filter(Boolean)
    .join("   |   ");
  ctx.fillText(label, fontSize, img.height + margin * 0.6);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("card encode failed"))), "image/jpeg", 0.92)
  );
}

function RailButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[48px] flex-col items-center justify-center rounded-md text-xs font-medium",
        "text-text hover:bg-surface-muted disabled:opacity-40"
      )}
    >
      {label}
    </button>
  );
}

function ProjectsPanel({
  onOpen,
  onDelete,
}: {
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [projects, setProjects] = useState<VisualizerProject[] | null>(null);
  useEffect(() => {
    void (async () => {
      const { listProjects } = await import("../storage/projectsDb");
      setProjects(await listProjects());
    })();
  }, []);

  if (projects === null) return <p className="text-sm text-text-muted">Loading…</p>;
  if (projects.length === 0)
    return (
      <p className="text-sm text-text-muted">
        No saved projects yet. Projects save to this device only — clearing browser data removes them.
      </p>
    );
  return (
    <ul className="space-y-2">
      {projects.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{p.name}</p>
            <p className="text-xs text-text-muted">
              Updated {new Date(p.updatedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="secondary" size="sm" onClick={() => onOpen(p.id)}>
              Open
            </Button>
            <Button variant="text" size="sm" onClick={() => onDelete(p.id)} aria-label={`Delete ${p.name}`}>
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
