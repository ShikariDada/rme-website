import * as THREE from "three";

/** Atlas sampling uses at most 8x anisotropy (spec §22.4). */
const MAX_ATLAS_ANISOTROPY = 8;
const DEFAULT_FACE_CELL_PX = 512;

export type TextureSlotKind = "mask" | "illum";

export function textureSlotId(surfaceId: string, kind: TextureSlotKind): string {
  return `${surfaceId}:${kind}`;
}

export interface AtlasEntry {
  materialId: string;
  texture: THREE.CanvasTexture;
  cols: number;
  rows: number;
  /** Half-texel of one face cell in face-cell UV — atlas sampling inset. */
  inset: THREE.Vector2;
  refs: number;
  firstSourceRef: TexImageSource | null;
}

interface SlotEntry {
  sourceRef: TexImageSource;
  texture: THREE.Texture;
}

interface TextureOptions {
  mipmaps: boolean;
}

function sourceDimensions(source: TexImageSource): { width: number; height: number } {
  if ("displayWidth" in source && "displayHeight" in source) {
    return { width: source.displayWidth, height: source.displayHeight };
  }
  if ("width" in source && "height" in source) {
    return { width: source.width, height: source.height };
  }
  return { width: 0, height: 0 };
}

function toCanvasSource(source: TexImageSource): CanvasImageSource {
  // Faces arrive as HTMLImageElement/ImageBitmap/HTMLCanvasElement in practice;
  // TexImageSource's remaining members (ImageData, VideoFrame) are not
  // drawable, so this cast only widens the drawImage parameter type.
  return source as CanvasImageSource;
}

function buildAtlas(
  faceSources: TexImageSource[],
  colsOverride: number | undefined,
  rowsOverride: number | undefined,
  maxTextureSize: number
): { canvas: HTMLCanvasElement; cols: number; rows: number; inset: THREE.Vector2 } {
  const faceCount = Math.max(1, faceSources.length);
  let cols =
    colsOverride !== undefined && colsOverride >= 1
      ? Math.floor(colsOverride)
      : Math.ceil(Math.sqrt(faceCount));
  let rows =
    rowsOverride !== undefined && rowsOverride >= 1 ? Math.floor(rowsOverride) : Math.ceil(faceCount / cols);
  cols = Math.max(1, cols);
  rows = Math.max(1, rows);

  let cellWidth = 0;
  let cellHeight = 0;
  for (const face of faceSources) {
    const dims = sourceDimensions(face);
    cellWidth = Math.max(cellWidth, dims.width);
    cellHeight = Math.max(cellHeight, dims.height);
  }
  if (cellWidth <= 0) cellWidth = DEFAULT_FACE_CELL_PX;
  if (cellHeight <= 0) cellHeight = DEFAULT_FACE_CELL_PX;
  // Never exceed the device texture limit across the whole grid.
  cellWidth = Math.max(1, Math.min(cellWidth, Math.floor(maxTextureSize / cols)));
  cellHeight = Math.max(1, Math.min(cellHeight, Math.floor(maxTextureSize / rows)));

  const canvas = document.createElement("canvas");
  canvas.width = cols * cellWidth;
  canvas.height = rows * cellHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("TextureManager: 2D context unavailable while building atlas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  faceSources.forEach((face, index) => {
    const cellX = index % cols;
    const cellY = Math.floor(index / cols);
    ctx.drawImage(toCanvasSource(face), cellX * cellWidth, cellY * cellHeight, cellWidth, cellHeight);
  });
  // Half-texel inset of one face cell keeps atlas sampling (and its mip
  // derivatives) inside the cell — no bleeding from neighbours (spec §22.4).
  return { canvas, cols, rows, inset: new THREE.Vector2(0.5 / cellWidth, 0.5 / cellHeight) };
}

/**
 * Owns every GPU texture of a renderer instance (spec §22.5 hygiene):
 * room, per-surface mask/illumination slots (re-uploaded only when the
 * TexImageSource reference changes) and refcounted material atlases.
 */
export class TextureManager {
  private readonly maxAnisotropy: number;
  private readonly maxTextureSize: number;
  private roomTexture: THREE.Texture | null = null;
  private roomSourceRef: TexImageSource | null = null;
  private readonly slots = new Map<string, SlotEntry>();
  private readonly atlases = new Map<string, AtlasEntry>();
  private neutralIllumTexture: THREE.DataTexture | null = null;
  private emptyMaskTexture: THREE.DataTexture | null = null;

  constructor(maxAnisotropy: number, maxTextureSize: number) {
    this.maxAnisotropy = Math.max(1, maxAnisotropy);
    this.maxTextureSize = Math.max(1, maxTextureSize);
  }

  setRoom(source: TexImageSource): THREE.Texture {
    if (this.roomTexture && this.roomSourceRef === source) return this.roomTexture;
    this.roomTexture?.dispose();
    this.roomTexture = this.createTexture(source, { mipmaps: true });
    this.roomSourceRef = source;
    return this.roomTexture;
  }

  getRoom(): THREE.Texture | null {
    return this.roomTexture;
  }

  /**
   * Per-surface slot textures: a new GPU texture is created only when the
   * TexImageSource reference differs from the last one seen for this slot.
   */
  getSlotTexture(slotId: string, source: TexImageSource | null, kind: TextureSlotKind): THREE.Texture {
    if (source === null) {
      return kind === "illum" ? this.getNeutralIllum() : this.getEmptyMask();
    }
    const existing = this.slots.get(slotId);
    if (existing && existing.sourceRef === source) return existing.texture;
    if (existing) existing.texture.dispose();
    const texture = this.createTexture(source, { mipmaps: false });
    this.slots.set(slotId, { sourceRef: source, texture });
    return texture;
  }

  /** Dispose slot textures that no longer belong to any composed surface. */
  pruneSlots(keep: Set<string>): void {
    for (const [slotId, entry] of this.slots) {
      if (!keep.has(slotId)) {
        entry.texture.dispose();
        this.slots.delete(slotId);
      }
    }
  }

  getAtlas(materialId: string): AtlasEntry | undefined {
    return this.atlases.get(materialId);
  }

  acquireAtlas(materialId: string, faceSources: TexImageSource[], cols?: number, rows?: number): AtlasEntry {
    const existing = this.atlases.get(materialId);
    if (existing && (faceSources.length === 0 || existing.firstSourceRef === faceSources[0])) {
      existing.refs += 1;
      return existing;
    }
    if (existing) {
      // Same material re-uploaded with new sources: replace outright. Handles
      // for the old entry release to zero without touching the new one.
      existing.texture.dispose();
      this.atlases.delete(materialId);
    }
    const built = buildAtlas(faceSources, cols, rows, this.maxTextureSize);
    const texture = new THREE.CanvasTexture(built.canvas);
    texture.flipY = false;
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(MAX_ATLAS_ANISOTROPY, this.maxAnisotropy);
    texture.needsUpdate = true;
    const entry: AtlasEntry = {
      materialId,
      texture,
      cols: built.cols,
      rows: built.rows,
      inset: built.inset,
      refs: 1,
      firstSourceRef: faceSources.length > 0 ? faceSources[0] : null,
    };
    this.atlases.set(materialId, entry);
    return entry;
  }

  releaseEntry(entry: AtlasEntry): void {
    entry.refs -= 1;
    if (entry.refs > 0) return;
    entry.texture.dispose();
    if (this.atlases.get(entry.materialId) === entry) this.atlases.delete(entry.materialId);
  }

  /** Context restore: force re-upload of every live GPU texture. */
  markAllForReupload(): void {
    if (this.roomTexture) this.roomTexture.needsUpdate = true;
    for (const entry of this.slots.values()) entry.texture.needsUpdate = true;
    for (const entry of this.atlases.values()) entry.texture.needsUpdate = true;
    if (this.neutralIllumTexture) this.neutralIllumTexture.needsUpdate = true;
    if (this.emptyMaskTexture) this.emptyMaskTexture.needsUpdate = true;
  }

  dispose(): void {
    this.roomTexture?.dispose();
    this.roomTexture = null;
    this.roomSourceRef = null;
    for (const entry of this.slots.values()) entry.texture.dispose();
    this.slots.clear();
    for (const entry of this.atlases.values()) entry.texture.dispose();
    this.atlases.clear();
    this.neutralIllumTexture?.dispose();
    this.neutralIllumTexture = null;
    this.emptyMaskTexture?.dispose();
    this.emptyMaskTexture = null;
  }

  private createTexture(source: TexImageSource, options: TextureOptions): THREE.Texture {
    const texture = new THREE.Texture(source);
    // flipY = false: the vertex shader owns the y orientation so every texture
    // shares the raw orientation of the room photo.
    texture.flipY = false;
    // sRGB <-> linear conversion happens in our shaders (spec §16.3).
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = options.mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    texture.generateMipmaps = options.mipmaps;
    if (options.mipmaps) texture.anisotropy = Math.min(MAX_ATLAS_ANISOTROPY, this.maxAnisotropy);
    texture.needsUpdate = true;
    return texture;
  }

  private getNeutralIllum(): THREE.DataTexture {
    if (!this.neutralIllumTexture) {
      // field = 1.0 (255), residual = 1.0 (128) — illuminationMap.ts neutral.
      const data = new Uint8Array([255, 128, 0, 255]);
      this.neutralIllumTexture = this.createDataTexture(data);
    }
    return this.neutralIllumTexture;
  }

  private getEmptyMask(): THREE.DataTexture {
    if (!this.emptyMaskTexture) {
      this.emptyMaskTexture = this.createDataTexture(new Uint8Array([0, 0, 0, 0]));
    }
    return this.emptyMaskTexture;
  }

  private createDataTexture(data: Uint8Array): THREE.DataTexture {
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    texture.flipY = false;
    texture.colorSpace = THREE.NoColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }
}
