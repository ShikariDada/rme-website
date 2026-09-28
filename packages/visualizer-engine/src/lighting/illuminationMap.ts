/**
 * Deterministic illumination/shadow extraction (visualizer spec §16).
 *
 * Concept: renderedLinearRGB = materialLinearRGB × illumination.
 * The illumination field is estimated from the ORIGINAL room image inside the
 * surface mask: sRGB → linear luminance → low-frequency field + capped shadow
 * residual → robust normalization. No neural network, fully deterministic.
 *
 * Works on RGBA buffers (ImageData-like) so it is testable in Node and runs
 * cheaply at reduced resolution.
 */

export interface RGBABuffer {
  data: Uint8ClampedArray; // RGBA, length = width*height*4
  width: number;
  height: number;
}

export interface IlluminationMap {
  /** width*height RGBA where R = low-frequency illumination (0..255), G = shadow/highlight residual (0..255, 128 = neutral). */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** sRGB → linear (fast approximation; gamma 2.2 is fine for illumination). */
function srgbToLinear(c: number): number {
  return Math.pow(c / 255, 2.2);
}

export function luminanceLinear(rgba: RGBABuffer, x: number, y: number): number {
  const i = (y * rgba.width + x) * 4;
  return (
    0.2126 * srgbToLinear(rgba.data[i]) +
    0.7152 * srgbToLinear(rgba.data[i + 1]) +
    0.0722 * srgbToLinear(rgba.data[i + 2])
  );
}

/**
 * Compute the illumination map for a surface.
 *
 * @param room    downscaled room image (≤ ~512 px on the long edge is plenty)
 * @param mask    optional surface mask (same size): only masked pixels
 *                contribute and are output; unmasked pixels are neutral 128
 * @param residualStrength  how much of the high-frequency shadow residual to
 *                keep (0..1); 0.55 is a good default
 */
export function computeIlluminationMap(
  room: RGBABuffer,
  mask: { data: Uint8ClampedArray; width: number; height: number } | null,
  residualStrength = 0.55,
  blurRadius = 8
): IlluminationMap {
  const w = room.width;
  const h = room.height;
  if (mask && (mask.width !== w || mask.height !== h)) {
    throw new Error("Mask dimensions must match room buffer");
  }

  // 1. Linear luminance inside the mask (0 elsewhere).
  const lum = new Float32Array(w * h);
  let count = 0;
  for (let i = 0; i < w * h; i++) {
    const inside = !mask || mask.data[i] > 127;
    if (inside) {
      const y = (i / w) | 0;
      const x = i - y * w;
      lum[i] = luminanceLinear(room, x, y);
      count++;
    }
  }
  const out = new Uint8ClampedArray(w * h * 4);
  if (count === 0) {
    for (let i = 0; i < w * h; i++) {
      out[i * 4] = 255;
      out[i * 4 + 1] = 128;
      out[i * 4 + 3] = 255;
    }
    return { data: out, width: w, height: h };
  }

  // 2. Low-frequency field: masked box blur (two passes) with masked renorm.
  const low = new Float32Array(w * h);
  low.set(lum);  for (let pass = 0; pass < 2; pass++) {
    low.set(boxBlurMasked(low, w, h, blurRadius, mask));
  }

  // 3. Robust normalization using percentiles of masked low-frequency values.
  const maskedValues: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask || mask.data[i] > 127) maskedValues.push(low[i]);
  }
  maskedValues.sort((a, b) => a - b);
  const p = (q: number) =>
    maskedValues[Math.min(maskedValues.length - 1, Math.max(0, Math.floor(q * maskedValues.length)))];
  const lo = Math.max(1e-5, p(0.04));
  const hi = Math.max(lo * 1.05, p(0.96));

  // 4. High-frequency residual = lum / low, capped.
  for (let i = 0; i < w * h; i++) {
    const inside = !mask || mask.data[i] > 127;
    if (!inside) {
      out[i * 4] = 255; // neutral illumination
      out[i * 4 + 1] = 128; // neutral residual
      out[i * 4 + 3] = 255;
      continue;
    }
    const L = Math.max(lum[i], 1e-5);
    const base = Math.max(low[i], 1e-5);
    let residual = L / base; // 1 = neutral, <1 = shadow, >1 = highlight
    residual = Math.min(1.45, Math.max(0.55, residual));
    // Normalize field into a usable multiplier range (avoid blowout).
    let field = (low[i] - lo) / (hi - lo); // 0..1-ish
    field = Math.min(1.15, Math.max(0.28, 0.36 + field * 0.86));
    out[i * 4] = Math.round(Math.min(255, field * 255));
    out[i * 4 + 1] = Math.round(Math.min(255, Math.max(0, 1 + (residual - 1) * residualStrength) * 128));
    out[i * 4 + 2] = 0;
    out[i * 4 + 3] = 255;
  }
  return { data: out, width: w, height: h };
}

/** Box blur that ignores unmasked pixels when computing averages. */
function boxBlurMasked(
  src: Float32Array,
  w: number,
  h: number,
  r: number,
  mask: { data: Uint8ClampedArray } | null
): Float32Array {
  const tmp = new Float32Array(w * h);
  // Horizontal
  const mid = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        const i = y * w + xx;
        if (!mask || mask.data[i] > 127) {
          sum += src[i];
          n++;
        }
      }
      mid[y * w + x] = n > 0 ? sum / n : src[y * w + x];
    }
  }
  // Vertical
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        const i = yy * w + x;
        if (!mask || mask.data[i] > 127) {
          sum += mid[i];
          n++;
        }
      }
      tmp[y * w + x] = n > 0 ? sum / n : mid[y * w + x];
    }
  }
  return tmp;
}
