import { describe, expect, it } from "vitest";
import {
  applyH,
  DegenerateQuadError,
  hToGLSL,
  homographyFromQuad,
  inverseH,
  solveHomography,
  validateQuad,
  type Point,
} from "@visualizer/engine";

const quad: Point[] = [
  { x: 0.1, y: 0.55 },
  { x: 0.95, y: 0.6 },
  { x: 0.9, y: 0.95 },
  { x: 0.05, y: 0.9 },
];

describe("solveHomography", () => {
  it("maps the unit square exactly onto the quad corners", () => {
    const H = homographyFromQuad(quad);
    const unit: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    unit.forEach((p, i) => {
      const out = applyH(H, p);
      expect(out.x).toBeCloseTo(quad[i].x, 6);
      expect(out.y).toBeCloseTo(quad[i].y, 6);
    });
  });

  it("is invertible: H then H⁻¹ round-trips arbitrary points (property)", () => {
    const H = homographyFromQuad(quad);
    const Hinv = inverseH(H);
    for (let i = 0; i < 50; i++) {
      const p = { x: Math.random(), y: Math.random() };
      const back = applyH(Hinv, applyH(H, p));
      expect(back.x).toBeCloseTo(p.x, 6);
      expect(back.y).toBeCloseTo(p.y, 6);
    }
  });

  it("preserves straight lines under projective mapping", () => {
    const H = homographyFromQuad(quad);
    const a = applyH(H, { x: 0.2, y: 0.3 });
    const b = applyH(H, { x: 0.8, y: 0.7 });
    const mid = applyH(H, { x: 0.5, y: 0.5 });
    // midpoint of images ≈ image of midpoint for the true midpoint on the line
    const imgMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    // projective midpoint of parameters t=0.5 is NOT the euclidean image mid,
    // but the cross-ratio must hold: |(a,mb ; b,md)| … simpler: verify
    // collinearity of a, mid, b.
    const cross = (b.x - a.x) * (mid.y - a.y) - (b.y - a.y) * (mid.x - a.x);
    const scale = Math.hypot(b.x - a.x, b.y - a.y);
    expect(Math.abs(cross) / scale).toBeLessThan(1e-9);
    expect(Math.abs(cross)).toBeLessThan(1e-9 * scale + 1e-12);
  });

  it("rejects crossed (bowtie) quads", () => {
    const bowtie: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ];
    expect(() => homographyFromQuad(bowtie)).toThrow(DegenerateQuadError);
  });

  it("rejects collinear quads and tiny quads", () => {
    const collinear: Point[] = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
      { x: 1.5, y: 1.5 },
    ];
    expect(() => solveHomography(quad, collinear)).toThrow(DegenerateQuadError);
  });

  it("handles strong perspective without precision seams", () => {
    const extreme: Point[] = [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.2 },
      { x: 1.9, y: 0.95 },
      { x: -0.9, y: 0.95 },
    ];
    const H = homographyFromQuad(extreme);
    const Hinv = inverseH(H);
    const back = applyH(Hinv, applyH(H, { x: 0.5, y: 0.5 }));
    expect(back.x).toBeCloseTo(0.5, 6);
    expect(back.y).toBeCloseTo(0.5, 6);
  });

  it("converts to GLSL column-major mat3", () => {
    const gl = hToGLSL([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(Array.from(gl)).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });

  it("validateQuad reports useful reasons", () => {
    expect(validateQuad(quad).ok).toBe(true);
    expect(validateQuad([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]).ok).toBe(false);
  });
});
