import type { IExportRenderer, SurfaceRenderState } from "../../../../src/features/visualizer/bridge/rendererTypes";
import type { VisualizerMaterial } from "../materials/materialModel";
import { VisualizerRenderer } from "./Renderer";

/** Export never exceeds 4096 on the long edge (spec §32.2). */
const EXPORT_MAX_EDGE_PX = 4096;
const JPEG_QUALITY = 0.92;

function loadFaceImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`failed to load material face ${url}`));
    image.src = url;
  });
}

function atlasGridFor(faceCount: number): { cols: number; rows: number } {
  const n = Math.max(1, faceCount);
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.max(1, Math.ceil(n / cols));
  return { cols, rows };
}

/**
 * High-resolution JPEG export (spec §32): a fresh hidden canvas + renderer per
 * call, room uploaded at full source resolution, single synchronous render,
 * everything disposed in `finally`.
 */
export class ExportRenderer implements IExportRenderer {
  async render(options: {
    surfaceStates: SurfaceRenderState[];
    roomSource: TexImageSource;
    roomWidthPx: number;
    roomHeightPx: number;
    targetLongEdge: number;
    compareSplit: number | null;
    onProgress?: (fraction: number) => void;
  }): Promise<Blob> {
    let renderer: VisualizerRenderer | null = null;
    let canvas: HTMLCanvasElement | null = null;
    try {
      const {
        surfaceStates,
        roomSource,
        roomWidthPx,
        roomHeightPx,
        targetLongEdge,
        compareSplit,
        onProgress,
      } = options;
      canvas = document.createElement("canvas");
      renderer = new VisualizerRenderer(canvas);

      // Target size (spec §32.2): fit the room aspect to targetLongEdge but
      // never upscale beyond the source pixels, and clamp to the GPU limit.
      const longEdge = Math.max(
        1,
        Math.floor(
          Math.min(
            targetLongEdge,
            Math.min(renderer.capabilities.maxTextureSize, EXPORT_MAX_EDGE_PX),
            Math.max(roomWidthPx, roomHeightPx)
          )
        )
      );
      const aspect = roomWidthPx > 0 && roomHeightPx > 0 ? roomWidthPx / roomHeightPx : 1;
      const landscape = roomWidthPx >= roomHeightPx;
      const outWidth = landscape ? longEdge : Math.max(1, Math.round(longEdge * aspect));
      const outHeight = landscape ? Math.max(1, Math.round(longEdge / aspect)) : longEdge;

      renderer.setRoom(roomSource, roomWidthPx, roomHeightPx);
      onProgress?.(0.25);

      // The export contract carries no preloaded atlases — load faces straight
      // from the material's albedo URLs, in faces order so atlas cell index
      // matches the face selection hash.
      const materials = new Map<string, VisualizerMaterial>();
      for (const state of surfaceStates) materials.set(state.material.id, state.material);
      for (const [materialId, material] of materials) {
        const faces = await Promise.all(material.faces.map((face) => loadFaceImage(face.albedoUrl)));
        const { cols, rows } = atlasGridFor(faces.length);
        renderer.setMaterialAtlas(materialId, faces, cols, rows);
      }
      renderer.setSurfaces(surfaceStates);
      onProgress?.(0.7);

      renderer.setCompareSplit(compareSplit);
      renderer.resize(outWidth, outHeight, 1);
      renderer.renderNow();
      onProgress?.(1.0);

      // Snapshot happens at call time, so no preserveDrawingBuffer is needed.
      const exportCanvas: HTMLCanvasElement = canvas;
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
      });
      if (!blob) throw new Error("canvas.toBlob returned no data");
      return blob;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Export failed: ${message}`);
    } finally {
      renderer?.dispose();
    }
  }
}
