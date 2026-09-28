#!/usr/bin/env node
/**
 * Generates all demo imagery deterministically with zero dependencies:
 *  - product material faces (albedo textures) at physical aspect ratios
 *  - three synthetic sample rooms with KNOWN plane quads + exclusion masks
 *    (for the visualizer preset rooms)
 *  - default OG image
 *
 * Everything is procedurally drawn (no copyrighted sources). Owner must
 * replace these with real authorised product photography — see docs.
 *
 * Run: npm run generate:assets
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
const TEX = join(OUT, "textures");
const ROOMS = join(OUT, "rooms");
const BRAND = join(OUT, "brand");
for (const d of [TEX, ROOMS, BRAND]) mkdirSync(d, { recursive: true });

/* ---------------- PNG encoder (RGBA, filter 0) ---------------- */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
/** Encode an RGBA Uint8Array (w*h*4, row-major, origin top-left) to PNG. */
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.subarray(y * w * 4, (y + 1) * w * 4).forEach((v, i) => {
      raw[y * (w * 4 + 1) + 1 + i] = v;
    });
  }
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------------- deterministic noise ---------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeValueNoise(seed) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const grad = (hash, x, y) => {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return function noise(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    const x1 = grad(aa, xf, yf) * (1 - u) + grad(ba, xf - 1, yf) * u;
    const x2 = grad(ab, xf, yf - 1) * (1 - u) + grad(bb, xf - 1, yf - 1) * u;
    return x1 * (1 - v) + x2 * v; // roughly -1..1
  };
}
function fbm(noise, x, y, octaves = 4, lac = 2, gain = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mixColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

/* ---------------- canvas helpers (RGBA buffers) ---------------- */
class Raster {
  constructor(w, h, fill = [255, 255, 255, 255]) {
    this.w = w; this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
    if (fill) this.fillRect(0, 0, w, h, fill);
  }
  setPx(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = c[3] ?? 255;
  }
  fillRect(x0, y0, w, h, c) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.setPx(x, y, c);
  }
  fillTriangle(v0, v1, v2, colorFn) {
    const minX = Math.max(0, Math.floor(Math.min(v0[0], v1[0], v2[0])));
    const maxX = Math.min(this.w - 1, Math.ceil(Math.max(v0[0], v1[0], v2[0])));
    const minY = Math.max(0, Math.floor(Math.min(v0[1], v1[1], v2[1])));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(v0[1], v1[1], v2[1])));
    const area = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const total = area(v0, v1, v2);
    if (Math.abs(total) < 1e-9) return;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const p = [x + 0.5, y + 0.5];
        const w0 = area(v1, v2, p) / total;
        const w1 = area(v2, v0, p) / total;
        const w2 = area(v0, v1, p) / total;
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
          const u = w1 * v2[2] !== undefined ? v0[2] * w0 + v1[2] * w1 + v2[2] * w2 : 0;
          this.setPx(x, y, colorFn(u, x, y));
        }
      }
    }
  }
  fillQuad(quad, colorFn) {
    // quad = [[x,y],...] any convex quad
    const [q0, q1, q2, q3] = quad;
    this.fillTriangle([q0[0], q0[1], 0], [q1[0], q1[1], 1], [q2[0], q2[1], 2], (u, x, y) => {
      // ignore barycentric colors; colorFn receives pixel
      return colorFn(x / this.w, y / this.h, x, y);
    });
    this.fillTriangle([q0[0], q0[1], 0], [q2[0], q2[1], 2], [q3[0], q3[1], 3], (u, x, y) =>
      colorFn(x / this.w, y / this.h, x, y)
    );
  }
  strokeSegment(x0, y0, x1, y1, c, width = 1) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0)) * 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(lerp(x0, x1, t));
      const y = Math.round(lerp(y0, y1, t));
      for (let dy = 0; dy < width; dy++)
        for (let dx = 0; dx < width; dx++) this.setPx(x + dx, y + dy, c);
    }
  }
  save(file) {
    writeFileSync(file, encodePNG(this.w, this.h, this.data));
    console.log("wrote", file.replace(ROOT, ""));
  }
}

/* ---------------- material texture generators ---------------- */

function genMarbleFaces({ name, w, h, seedBase, base, vein, faces, veinScale = 3.2, veinSharp = 9, warm = 0 }) {
  for (let f = 0; f < faces; f++) {
    const r = new Raster(w, h);
    const noise = makeValueNoise(seedBase + f * 100);
    const noise2 = makeValueNoise(seedBase + f * 100 + 7);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        const wx = u * veinScale + fbm(noise2, u * 4 + 10, v * 4) * 0.9;
        const wv = fbm(noise, wx, v * veinScale * (h / w), 5);
        const s = Math.sin(wv * Math.PI * 2.4 + f * 2.1);
        let veinT = Math.pow(clamp01(1 - Math.abs(s)), veinSharp);
        veinT = clamp01(veinT * 1.15 - 0.02);
        const grain = fbm(noise, u * 22 + f * 3, v * 22, 3) * 0.5 + 0.5;
        let col = mixColor(base, vein, veinT);
        col = col.map((c) => c * (0.94 + grain * 0.12 + warm * (1 - v)));
        r.setPx(x, y, [col[0], col[1], col[2], 255]);
      }
    }
    r.save(join(TEX, `${name}-face-${f + 1}.png`));
  }
}

function genGraniteFaces({ name, w, h, seedBase, base, speckColors, faces, density = 0.06 }) {
  for (let f = 0; f < faces; f++) {
    const r = new Raster(w, h, base);
    const rand = mulberry32(seedBase + f * 131);
    const noise = makeValueNoise(seedBase + f * 17);
    const n = Math.floor(w * h * density);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rand() * w), y = Math.floor(rand() * h);
      const size = rand() < 0.85 ? 1 : 2;
      const c = speckColors[Math.floor(rand() * speckColors.length)];
      for (let dy = 0; dy < size; dy++)
        for (let dx = 0; dx < size; dx++) r.setPx(x + dx, y + dy, c);
    }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const g = 1 + fbm(noise, x / 60, y / 60, 3) * 0.08;
        r.data[i] *= g; r.data[i + 1] *= g; r.data[i + 2] *= g;
      }
    r.save(join(TEX, `${name}-face-${f + 1}.png`));
  }
}

function genConcreteFaces({ name, w, h, seedBase, base, faces }) {
  for (let f = 0; f < faces; f++) {
    const r = new Raster(w, h);
    const noise = makeValueNoise(seedBase + f * 55);
    const noise2 = makeValueNoise(seedBase + f * 55 + 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        const n = fbm(noise, u * 5, v * 5, 4) * 0.5 + 0.5;
        const fine = fbm(noise2, u * 40, v * 40, 2) * 0.5 + 0.5;
        const shade = 0.86 + n * 0.2 + fine * 0.07;
        r.setPx(x, y, [base[0] * shade, base[1] * shade, base[2] * shade, 255]);
      }
    r.save(join(TEX, `${name}-face-${f + 1}.png`));
  }
}

function genWoodFaces({ name, w, h, seedBase, light, dark, faces }) {
  for (let f = 0; f < faces; f++) {
    const r = new Raster(w, h);
    const noise = makeValueNoise(seedBase + f * 91);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        const perturb = fbm(noise, u * 3, v * 1.2, 3) * 2.4;
        const rings = Math.sin((v * 26 + perturb) * Math.PI);
        const t = clamp01(0.5 + rings * 0.5);
        const fine = fbm(noise, u * 6 + 40, v * 90, 2) * 0.5 + 0.5;
        const col = mixColor(light, dark, t * 0.75 + fine * 0.25).map(
          (c) => c * (0.95 + fine * 0.1)
        );
        r.setPx(x, y, [col[0], col[1], col[2], 255]);
      }
    r.save(join(TEX, `${name}-face-${f + 1}.png`));
  }
}

/* ---------------- sample rooms ---------------- */

/**
 * Rooms are drawn with known geometry. The same quads are written to
 * preset-rooms.json (normalized coords, CW order TL,TR,BR,BL) and used by the
 * visualizer preset mode. Masks are white = apply material, black = keep room.
 */

function drawLivingRoom() {
  const W = 1600, H = 1200;
  const r = new Raster(W, H, [214, 208, 198, 255]);
  const noise = makeValueNoise(4242);
  // back wall with warm gradient
  const wallY = 660;
  for (let y = 0; y < wallY; y++)
    for (let x = 0; x < W; x++) {
      const t = y / wallY;
      const lightFromWindow = clamp01(1 - Math.abs(x - 1240) / 520) * 0.22;
      const c = [206 + t * 26 + lightFromWindow * 120, 200 + t * 22 + lightFromWindow * 110, 190 + t * 18 + lightFromWindow * 90];
      r.setPx(x, y, [c[0], c[1], c[2], 255]);
    }
  // window on the wall
  r.fillRect(1080, 120, 340, 420, [235, 238, 240, 255]);
  for (let i = 0; i < 6; i++) r.fillRect(1080, 120 + i * 70, 340, 3, [168, 172, 176, 255]);
  r.fillRect(1080 + 168, 120, 4, 420, [168, 172, 176, 255]);
  // skirting
  r.fillRect(0, wallY - 26, W, 26, [232, 228, 220, 255]);
  r.fillRect(0, wallY - 2, W, 3, [178, 172, 162, 255]);
  // floor quad (far edge y=660 flat, near edge y=H)
  const floorQuad = [[0, 660], [W, 700], [W, H], [0, H]];
  for (let y = 655; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const depth = (y - 660) / (H - 660); // 0 far → 1 near
      const base = 148 + depth * 34;
      const g = noise(x / 90, y / 90) * 6;
      r.setPx(x, y, [base + 26 + g, base + 22 + g, base + 16 + g, 255]);
    }
  }
  // converging plank joints
  const vp = [800, 668];
  for (let i = 0; i <= 16; i++) {
    const xb = (i / 16) * W;
    r.strokeSegment(lerp(vp[0], xb, 0.12), lerp(vp[1], 700, 0.12), xb, H, [120, 112, 100, 255], 2);
  }
  for (let j = 1; j < 5; j++) {
    const y = 660 + Math.pow(j / 5, 1.6) * (H - 660);
    r.fillRect(0, y, W, 2, [120, 112, 100, 255]);
  }
  // rug on floor
  const rug = [[420, 800], [1180, 820], [1240, 1130], [360, 1100]];
  r.fillQuad(rug, (u, v, x, y) => {
    const n = noise(x / 22, y / 22) * 10;
    return [176 + n, 118 + n, 96 + n, 255];
  });
  r.fillQuad([[420, 800], [1180, 820], [1170, 845], [424, 828]], () => [150, 96, 78, 255]);
  // sofa occluding bottom-left of floor
  const sofa = [[40, 830], [660, 830], [660, H], [40, H]];
  r.fillQuad(sofa, (u, v) => {
    const c = lerp(148, 128, v);
    return [c, c + 8, c + 18, 255];
  });
  r.fillRect(60, 850, 580, 90, [162, 158, 172, 255]); // backrest
  for (let i = 0; i < 3; i++) r.fillRect(70 + i * 190, 960, 170, 110, [140, 146, 160, 255]); // cushions
  r.fillRect(40, 1080, 620, 26, [96, 92, 104, 255]); // base shadow
  // coffee table shadow + legs
  r.fillQuad([[840, 980], [1120, 990], [1100, 1120], [820, 1100]], (u, v) => [90 - v * 20, 84 - v * 18, 76 - v * 16, 255]);
  r.fillQuad([[880, 1000], [1080, 1008], [1064, 1088], [864, 1078]], () => [214, 206, 190, 255]);

  const floorMask = new Raster(W, H, [0, 0, 0, 255]);
  floorMask.fillQuad(floorQuad, () => [255, 255, 255, 255]);
  floorMask.fillQuad(rug, () => [0, 0, 0, 255]);
  floorMask.fillQuad(sofa, () => [0, 0, 0, 255]);
  floorMask.fillQuad([[840, 980], [1120, 990], [1100, 1120], [820, 1100]], () => [0, 0, 0, 255]);

  const wallMask = new Raster(W, H, [0, 0, 0, 255]);
  wallMask.fillRect(0, 0, W, wallY - 26, [255, 255, 255, 255]);
  wallMask.fillRect(1080, 120, 340, 420, [0, 0, 0, 255]); // window excluded

  return {
    image: { w: W, h: H, raster: r },
    surfaces: [
      {
        id: "floor", name: "Floor", type: "floor",
        planeQuad: floorQuad.map(([x, y]) => [x / W, y / H]),
        calibration: { p1: [0.02, 0.98], p2: [0.5, 0.985], realLengthMm: 4200 },
      },
      {
        id: "back-wall", name: "Back wall", type: "wall",
        planeQuad: [[0, 0], [1, 0], [1, (wallY - 26) / H], [0, (wallY - 26) / H]],
      },
    ],
    masks: { floor: floorMask, "back-wall": wallMask },
  };
}

function drawBathroom() {
  const W = 1600, H = 1200;
  const r = new Raster(W, H, [222, 224, 222, 255]);
  const noise = makeValueNoise(777);
  const wallY = 700;
  for (let y = 0; y < wallY; y++)
    for (let x = 0; x < W; x++) {
      const t = y / wallY;
      const c = 208 + t * 24;
      r.setPx(x, y, [c, c + 3, c + 1, 255]);
    }
  // mirror
  r.fillRect(200, 120, 420, 320, [180, 196, 204, 255]);
  r.fillRect(200, 120, 420, 14, [150, 160, 166, 255]);
  r.strokeSegment(230, 150, 520, 400, [225, 234, 238, 255], 8);
  // vanity shadow band + light from top-right
  for (let y = 0; y < wallY; y++)
    for (let x = 1200; x < W; x++) {
      const i = (y * W + x) * 4;
      r.data[i] = Math.min(255, r.data[i] + 26);
      r.data[i + 1] += 24; r.data[i + 2] += 20;
    }
  r.fillRect(0, wallY - 22, W, 22, [240, 240, 238, 255]);
  // floor
  const floorQuad = [[0, 700], [W, 720], [W, H], [0, H]];
  for (let y = 695; y < H; y++)
    for (let x = 0; x < W; x++) {
      const depth = (y - 700) / (H - 700);
      const base = 150 + depth * 62;
      const g = noise(x / 70, y / 70) * 5;
      r.setPx(x, y, [base + g, base + g + 2, base + g + 4, 255]);
    }
  const vp = [800, 708];
  for (let i = 0; i <= 12; i++) {
    const xb = (i / 12) * W;
    r.strokeSegment(lerp(vp[0], xb, 0.1), lerp(vp[1], 720, 0.1), xb, H, [116, 118, 120, 255], 2);
  }
  // vanity occluder (left)
  const vanity = [[120, 690], [640, 700], [640, H], [120, H]];
  r.fillQuad(vanity, (u, v) => {
    const c = lerp(232, 210, v);
    return [c, c, c - 6, 255];
  });
  r.fillQuad([[140, 720], [620, 728], [620, 790], [140, 786]], () => [120, 150, 158, 255]); // basin top
  r.fillRect(300, 560, 160, 140, [218, 222, 220, 255]); // pedestal hint
  // WC occluder (right)
  const wc = [[1180, 880], [1400, 890], [1400, H], [1180, H]];
  r.fillQuad(wc, () => [238, 240, 240, 255]);
  r.fillQuad([[1210, 820], [1370, 828], [1368, 900], [1208, 892]], () => [245, 246, 246, 255]);
  r.fillRect(1240, 700, 100, 130, [242, 243, 243, 255]);

  const floorMask = new Raster(W, H, [0, 0, 0, 255]);
  floorMask.fillQuad(floorQuad, () => [255, 255, 255, 255]);
  floorMask.fillQuad(vanity, () => [0, 0, 0, 255]);
  floorMask.fillQuad(wc, () => [0, 0, 0, 255]);
  floorMask.fillRect(300, 560, 160, 200, [0, 0, 0, 255]);

  const wallMask = new Raster(W, H, [0, 0, 0, 255]);
  wallMask.fillRect(0, 0, W, wallY - 22, [255, 255, 255, 255]);
  wallMask.fillRect(200, 120, 420, 320, [0, 0, 0, 255]); // mirror excluded
  wallMask.fillRect(300, 560, 160, 120, [0, 0, 0, 255]); // pedestal on wall? keep floor-only
  wallMask.fillRect(1240, 560, 100, 122, [0, 0, 0, 255]); // cistern

  return {
    image: { w: W, h: H, raster: r },
    surfaces: [
      {
        id: "floor", name: "Floor", type: "floor",
        planeQuad: floorQuad.map(([x, y]) => [x / W, y / H]),
        calibration: { p1: [0.55, 0.95], p2: [0.95, 0.97], realLengthMm: 2100 },
      },
      {
        id: "back-wall", name: "Back wall", type: "wall",
        planeQuad: [[0, 0], [1, 0], [1, (wallY - 22) / H], [0, (wallY - 22) / H]],
      },
    ],
    masks: { floor: floorMask, "back-wall": wallMask },
  };
}

function drawKitchen() {
  const W = 1600, H = 1200;
  const r = new Raster(W, H, [228, 224, 216, 255]);
  const noise = makeValueNoise(2024);
  const wallY = 680;
  for (let y = 0; y < wallY; y++)
    for (let x = 0; x < W; x++) {
      const c = 216 + (y / wallY) * 20;
      r.setPx(x, y, [c, c - 2, c - 8, 255]);
    }
  // upper cabinets
  r.fillRect(80, 60, 620, 300, [196, 190, 178, 255]);
  for (let i = 0; i < 3; i++) r.fillRect(90 + i * 208, 70, 196, 280, [204, 198, 186, 255]);
  // counter band
  r.fillRect(60, 380, 660, 60, [88, 86, 84, 255]);
  r.fillRect(60, 440, 660, 240, [172, 168, 160, 255]); // lower cabinets (occlude wall)
  for (let i = 0; i < 3; i++) {
    r.fillRect(80 + i * 216, 456, 188, 208, [180, 176, 168, 255]);
    r.strokeSegment(120 + i * 216, 540, 200 + i * 216, 540, [120, 116, 108, 255], 4);
  }
  // window
  r.fillRect(1200, 100, 300, 380, [238, 240, 240, 255]);
  r.fillRect(1344, 100, 6, 380, [170, 172, 172, 255]);
  // floor
  const floorQuad = [[0, 680], [W, 710], [W, H], [0, H]];
  for (let y = 676; y < H; y++)
    for (let x = 0; x < W; x++) {
      const depth = (y - 680) / (H - 680);
      const base = 160 + depth * 38;
      const g = noise(x / 80, y / 80) * 6;
      r.setPx(x, y, [base + 14 + g, base + 10 + g, base + 4 + g, 255]);
    }
  const vp = [760, 688];
  for (let i = 0; i <= 10; i++) {
    const xb = (i / 10) * W;
    r.strokeSegment(lerp(vp[0], xb, 0.12), lerp(vp[1], 710, 0.12), xb, H, [126, 116, 102, 255], 2);
  }
  // island occluder
  const island = [[760, 850], [1380, 880], [1360, H], [720, H]];
  r.fillQuad(island, (u, v) => {
    const c = lerp(226, 200, v);
    return [c, c - 2, c - 8, 255];
  });
  r.fillQuad([[748, 838], [1392, 866], [1388, 906], [744, 884]], () => [64, 62, 60, 255]); // countertop

  const floorMask = new Raster(W, H, [0, 0, 0, 255]);
  floorMask.fillQuad(floorQuad, () => [255, 255, 255, 255]);
  floorMask.fillQuad(island, () => [0, 0, 0, 255]);
  const wallMask = new Raster(W, H, [0, 0, 0, 255]);
  wallMask.fillRect(0, 0, W, wallY - 2, [255, 255, 255, 255]);
  wallMask.fillRect(1200, 100, 300, 380, [0, 0, 0, 255]);
  wallMask.fillRect(60, 60, 660, 620, [0, 0, 0, 255]); // cabinets + counter excluded

  return {
    image: { w: W, h: H, raster: r },
    surfaces: [
      {
        id: "floor", name: "Floor", type: "floor",
        planeQuad: floorQuad.map(([x, y]) => [x / W, y / H]),
        calibration: { p1: [0.05, 0.97], p2: [0.42, 0.98], realLengthMm: 3600 },
      },
      {
        id: "back-wall", name: "Back wall splash", type: "wall",
        planeQuad: [[740 / W, 60 / H], [1180 / W, 60 / H], [1180 / W, 430 / H], [740 / W, 430 / H]],
      },
    ],
    masks: { floor: floorMask, "back-wall": wallMask },
  };
}

/* ---------------- generate everything ---------------- */

console.log("Generating demo assets (deterministic, procedural)...");

// Tiles: 600x1200 marble (2:1)
genMarbleFaces({ name: "marble-bianco", w: 1024, h: 512, seedBase: 1001, base: [232, 228, 218], vein: [148, 156, 168], faces: 4 });
// Emperador-style brown marble 800x1600 (2:1)
genMarbleFaces({ name: "marble-emperador", w: 1024, h: 512, seedBase: 2002, base: [122, 88, 62], vein: [218, 200, 178], faces: 4, veinScale: 2.4, veinSharp: 6 });
// Green marble 600x1200
genMarbleFaces({ name: "marble-emerald", w: 1024, h: 512, seedBase: 3003, base: [66, 92, 80], vein: [208, 214, 196], faces: 3, veinScale: 3.8, veinSharp: 12 });
// Granite 600x600 (1:1)
genGraniteFaces({ name: "granite-steel-grey", w: 1024, h: 1024, seedBase: 4004, base: [52, 54, 58], speckColors: [[210, 210, 214], [120, 122, 128], [70, 74, 82], [168, 170, 176]], faces: 2 });
genGraniteFaces({ name: "granite-desert-brown", w: 1024, h: 1024, seedBase: 5005, base: [188, 178, 160], speckColors: [[92, 84, 70], [130, 122, 106], [232, 226, 210], [60, 56, 48]], faces: 2 });
// Concrete 600x600
genConcreteFaces({ name: "porcelain-concrete", w: 1024, h: 1024, seedBase: 6006, base: [156, 156, 152], faces: 2 });
// Ivory vitrified 600x600
genConcreteFaces({ name: "vitrified-ivory", w: 1024, h: 1024, seedBase: 7007, base: [224, 216, 200], faces: 2 });
// Wood-look 300x900 (1:3)
genWoodFaces({ name: "wood-oak", w: 340, h: 1024, seedBase: 8008, light: [196, 158, 112], dark: [138, 100, 64], faces: 2 });
// Outdoor anti-skid beige 600x1200
genConcreteFaces({ name: "outdoor-antiskid", w: 1024, h: 512, seedBase: 9009, base: [186, 172, 148], faces: 2 });
// Kitchen wall gloss 300x600
genConcreteFaces({ name: "wall-gloss-grey", w: 512, h: 1024, seedBase: 1010, base: [214, 222, 218], faces: 1 });

// Rooms
const presets = [];
const rooms = [
  ["living-room", drawLivingRoom()],
  ["bathroom", drawBathroom()],
  ["kitchen", drawKitchen()],
];
for (const [id, room] of rooms) {
  room.image.raster.save(join(ROOMS, `${id}.png`));
  const surfaces = [];
  for (const s of room.surfaces) {
    room.masks[s.id].save(join(ROOMS, `${id}-${s.id}-mask.png`));
    surfaces.push({
      id: s.id,
      name: s.name,
      type: s.type,
      planeQuad: s.planeQuad,
      maskUrl: `/rooms/${id}-${s.id}-mask.png`,
      ...(s.calibration
        ? {
            calibration: {
              p1: s.calibration.p1,
              p2: s.calibration.p2,
              realLengthMm: s.calibration.realLengthMm,
              quality: "user-measured",
            },
          }
        : {}),
    });
  }
  presets.push({ id, name: id.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "), image: `/rooms/${id}.png`, width: room.image.w, height: room.image.h, surfaces });
}
writeFileSync(join(ROOMS, "preset-rooms.json"), JSON.stringify(presets, null, 2));
console.log("wrote", "public/rooms/preset-rooms.json");

// OG default image: dark marble band
{
  const W = 1200, H = 630;
  const og = new Raster(W, H, [30, 28, 26, 255]);
  const noise = makeValueNoise(31337);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const wx = (x / W) * 3.2 + fbm(noise, x / 400 + 8, y / 400) * 0.8;
      const wv = fbm(noise, wx, (y / W) * 3.2, 5);
      const s = Math.sin(wv * Math.PI * 2.2);
      const veinT = Math.pow(clamp01(1 - Math.abs(s)), 10);
      const c = mixColor([30, 28, 26], [168, 158, 142], veinT * 0.85 + 0.04);
      og.setPx(x, y, [c[0], c[1], c[2], 255]);
    }
  og.fillRect(40, 40, W - 80, H - 80, [0, 0, 0, 0]);
  for (let x = 40; x < W - 40; x++) { og.setPx(x, 40, [200, 188, 168, 255]); og.setPx(x, H - 41, [200, 188, 168, 255]); }
  for (let y = 40; y < H - 40; y++) { og.setPx(40, y, [200, 188, 168, 255]); og.setPx(W - 41, y, [200, 188, 168, 255]); }
  og.save(join(BRAND, "og-default.png"));
}

console.log("Done.");
