/**
 * Homography math (visualizer spec §11).
 *
 * A homography maps points between two planes in projective space. For the
 * visualizer: source = material/plane coordinate space (unit square),
 * destination = the four projected corners in the room photograph.
 *
 * Pure, dependency-free, unit-tested. The GPU shader receives the inverse
 * mapping so every destination fragment computes its own material coordinate
 * — no CPU raster-warping per edit.
 */

export interface Point {
  x: number;
  y: number;
}

/** 3x3 homogeneous matrix, row-major, h[8] (h33) normalized to 1. */
export type Homography = number[];

export class DegenerateQuadError extends Error {}

const EPS = 1e-9;

/** Solve an n×n linear system with partial pivoting. Returns null if singular. */
function solveLinearSystem(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < EPS) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    for (let row = col + 1; row < n; row++) {
      const f = a[row][col] / a[col][col];
      for (let k = col; k < n; k++) a[row][k] -= f * a[col][k];
      b[row] -= f * b[col];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let s = b[row];
    for (let k = row + 1; k < n; k++) s -= a[row][k] * x[k];
    x[row] = s / a[row][row];
  }
  return x;
}

/** Translate/scale points to centroid + mean distance sqrt(2) (Hartley normalization). */
function normalizePoints(pts: Point[]): { pts: Point[]; T: Homography } {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p.x, 0) / n;
  const cy = pts.reduce((s, p) => s + p.y, 0) / n;
  const meanDist = pts.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / n;
  const scale = meanDist < EPS ? 1 : Math.SQRT2 / meanDist;
  return {
    pts: pts.map((p) => ({ x: (p.x - cx) * scale, y: (p.y - cy) * scale })),
    T: [scale, 0, -cx * scale, 0, scale, -cy * scale, 0, 0, 1],
  };
}

export function applyH(H: Homography, p: Point): Point {
  const [a, b, c, d, e, f, g, h] = H;
  const w = g * p.x + h * p.y + H[8];
  return { x: (a * p.x + b * p.y + c) / w, y: (d * p.x + e * p.y + f) / w };
}

/**
 * Solve the homography from four point correspondences src[i] → dst[i]
 * (each set of 4 must be in the SAME cyclic order, non-collinear).
 * Throws DegenerateQuadError on crossed/near-collinear/tiny quads.
 */
export function solveHomography(src: Point[], dst: Point[]): Homography {
  if (src.length !== 4 || dst.length !== 4) {
    throw new DegenerateQuadError("Exactly 4 point correspondences are required");
  }
  validateQuad(src, "source");
  validateQuad(dst, "destination");

  const ns = normalizePoints(src);
  const nd = normalizePoints(dst);

  // DLT: for each correspondence, two equations:
  //   [x y 1 0 0 0 -u·x -u·y] · h = u
  //   [0 0 0 x y 1 -v·x -v·y] · h = v
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = ns.pts[i];
    const { x: u, y: v } = nd.pts[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solveLinearSystem(A, b);
  if (!h) throw new DegenerateQuadError("Singular correspondence system");

  const Hn: Homography = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  // Full mapping: src → T_s → normalized src → Hn → normalized dst → T_d⁻¹ → dst
  const Hnorm = multiplyH(inverseH(nd.T), Hn);
  const Hfull = multiplyH(Hnorm, ns.T);
  // Renormalize so h33 = 1 (finite homography guard).
  const s = Hfull[8];
  if (Math.abs(s) < EPS) throw new DegenerateQuadError("Degenerate homography");
  return Hfull.map((v) => v / s);
}

export function multiplyH(A: Homography, B: Homography): Homography {
  const out = new Array<number>(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
    }
  }
  return out;
}

/** Invert via the adjugate over the determinant; renormalizes h33 to 1. */
export function inverseH(H: Homography): Homography {
  const [a, b, c, d, e, f, g, h, i] = H;
  const A = e * i - f * h;
  const B = c * h - b * i;
  const C = b * f - c * e;
  const D = f * g - d * i;
  const E = a * i - c * g;
  const F = c * d - a * f;
  const G = d * h - e * g;
  const Hh = b * g - a * h;
  const I = a * e - b * d;
  const det = a * A + b * D + c * G;
  if (Math.abs(det) < EPS) throw new DegenerateQuadError("Homography is singular");
  const inv = [A, B, C, D, E, F, G, Hh, I].map((v) => v / det);
  const s = inv[8];
  if (Math.abs(s) < EPS) throw new DegenerateQuadError("Inverse homography maps to infinity");
  return inv.map((v) => v / s);
}

export interface QuadValidation {
  ok: boolean;
  reason?: string;
  area: number;
}

/** Convexity + minimum area + minimum edge checks for a cyclic quad. */
export function validateQuad(quad: Point[], label = "quad"): QuadValidation {
  if (quad.length !== 4) return { ok: false, reason: `${label} must have 4 points`, area: 0 };
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const p = quad[i];
    const q = quad[(i + 1) % 4];
    area += p.x * q.y - q.x * p.y;
  }
  area = Math.abs(area) / 2;
  if (area < 1e-8) return { ok: false, reason: `${label} area too small`, area };

  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const p0 = quad[i];
    const p1 = quad[(i + 1) % 4];
    const p2 = quad[(i + 2) % 4];
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
    const s = Math.sign(cross);
    if (s !== 0) {
      if (sign === 0) sign = s;
      else if (s !== sign) return { ok: false, reason: `${label} is crossed (non-convex)`, area };
    }
    const edgeLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (edgeLen < 1e-6) return { ok: false, reason: `${label} has a zero-length edge`, area };
  }
  return { ok: true, area };
}

/**
 * Homography from the material unit square to a destination quad given in
 * cyclic order TL, TR, BR, BL. This is the plane→image mapping.
 */
export function homographyFromQuad(quad: Point[]): Homography {
  const unitSquare: Point[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
  return solveHomography(unitSquare, quad);
}

/** Convert a 3x3 row-major matrix to a column-major Float32Array for GLSL mat3. */
export function hToGLSL(H: Homography): Float32Array {
  const [a, b, c, d, e, f, g, h, i] = H;
  return new Float32Array([a, d, g, b, e, h, c, f, i]);
}
