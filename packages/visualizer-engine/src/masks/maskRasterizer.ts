import type { Point } from "../geometry/homography";

/**
 * Mask rasterization + brush painting (visualizer spec §10.3, §18).
 * Works on plain { data: Uint8ClampedArray, width, height } buffers so it is
 * testable in Node and usable with ImageData in the browser.
 */

export interface MaskBuffer {
  data: Uint8ClampedArray; // single-channel in [0..255], length = width*height
  width: number;
  height: number;
}

export function createMask(width: number, height: number, fill = 0): MaskBuffer {
  const data = new Uint8ClampedArray(width * height);
  if (fill) data.fill(fill);
  return { data, width, height };
}

/**
 * Scanline rasterization of a polygon (in pixel coordinates) into the mask.
 * value 255 = material may appear; 0 = room stays.
 */
export function rasterizePolygon(mask: MaskBuffer, pointsPx: Point[], add: boolean): void {
  if (pointsPx.length < 3) return;
  const value = add ? 255 : 0;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pointsPx) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(mask.height - 1, Math.ceil(maxY));
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0, j = pointsPx.length - 1; i < pointsPx.length; j = i++) {
      const a = pointsPx[i];
      const b = pointsPx[j];
      if (a.y > cy !== b.y > cy) {
        xs.push(((b.x - a.x) * (cy - a.y)) / (b.y - a.y) + a.x);
      }
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const sx = Math.max(0, Math.ceil(xs[k] - 0.5));
      const ex = Math.min(mask.width - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = sx; x <= ex; x++) mask.data[y * mask.width + x] = value;
    }
  }
}

/** Paint a soft circular brush stamp (add = erase=false paints in, true... naming: `add` true paints white). */
export function brushStamp(
  mask: MaskBuffer,
  cx: number,
  cy: number,
  radiusPx: number,
  add: boolean,
  hardness = 0.6
): void {
  const x0 = Math.max(0, Math.floor(cx - radiusPx));
  const x1 = Math.min(mask.width - 1, Math.ceil(cx + radiusPx));
  const y0 = Math.max(0, Math.floor(cy - radiusPx));
  const y1 = Math.min(mask.height - 1, Math.ceil(cy + radiusPx));
  const r = Math.max(1, radiusPx);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r) continue;
      // Soft edge: full opacity inside hardness, falls to 0 at r.
      const t = d / r;
      const alpha = t <= hardness ? 1 : 1 - (t - hardness) / (1 - hardness);
      const i = y * mask.width + x;
      if (add) {
        mask.data[i] = Math.max(mask.data[i], 255 * alpha);
      } else {
        mask.data[i] = Math.min(mask.data[i], 255 * (1 - alpha));
      }
    }
  }
}

/**
 * Separable box blur (approximates gaussian) over the mask. Returns a new
 * buffer; the input is not modified. Used for edge feathering and (in
 * lighting) the illumination field.
 */
export function blurMask(mask: MaskBuffer, radiusPx: number, passes = 2): MaskBuffer {
  if (radiusPx < 1) return { data: new Uint8ClampedArray(mask.data), width: mask.width, height: mask.height };
  let a = createMask(mask.width, mask.height);
  a.data.set(mask.data);
  let b = createMask(mask.width, mask.height);
  for (let p = 0; p < passes; p++) {
    boxBlurPass(a, b, radiusPx, true);
    boxBlurPass(b, a, radiusPx, false);
  }
  return a;
}

function boxBlurPass(src: MaskBuffer, dst: MaskBuffer, r: number, horizontal: boolean): void {
  const w = src.width;
  const h = src.height;
  const span = 2 * r + 1;
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const xx = Math.min(w - 1, Math.max(0, x + k));
          sum += src.data[y * w + xx];
        }
        dst.data[y * w + x] = sum / span;
      }
    }
  } else {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const yy = Math.min(h - 1, Math.max(0, y + k));
          sum += src.data[yy * w + x];
        }
        dst.data[y * w + x] = sum / span;
      }
    }
  }
}

/** Threshold a blurred mask back to hard edges with a soft band. */
export function thresholdMask(mask: MaskBuffer, low = 64, high = 192): void {
  for (let i = 0; i < mask.data.length; i++) {
    const v = mask.data[i];
    mask.data[i] = v <= low ? 0 : v >= high ? 255 : ((v - low) / (high - low)) * 255;
  }
}
