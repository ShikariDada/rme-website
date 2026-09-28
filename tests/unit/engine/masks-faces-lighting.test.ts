import { describe, expect, it } from "vitest";
import {
  blurMask,
  brushStamp,
  createMask,
  rasterizePolygon,
  selectFace,
  hashCell,
  computeIlluminationMap,
  FINISH_PROFILES,
} from "@visualizer/engine";

describe("mask rasterizer", () => {
  const w = 40;
  const h = 30;

  it("rasterizes a convex polygon with scanline fill", () => {
    const mask = createMask(w, h);
    rasterizePolygon(
      mask,
      [
        { x: 5, y: 5 },
        { x: 20, y: 5 },
        { x: 20, y: 20 },
        { x: 5, y: 20 },
      ],
      true
    );
    expect(mask.data[10 * w + 12]).toBe(255); // inside
    expect(mask.data[2 * w + 12]).toBe(0); // above
    expect(mask.data[10 * w + 2]).toBe(0); // left
  });

  it("erase mode clears region", () => {
    const mask = createMask(w, h, 255);
    rasterizePolygon(
      mask,
      [
        { x: 10, y: 10 },
        { x: 15, y: 10 },
        { x: 15, y: 15 },
        { x: 10, y: 15 },
      ],
      false
    );
    expect(mask.data[12 * w + 12]).toBe(0);
    expect(mask.data[5 * w + 5]).toBe(255);
  });

  it("brush stamp paints a soft circle", () => {
    const mask = createMask(w, h);
    brushStamp(mask, 20, 15, 5, true);
    expect(mask.data[15 * w + 20]).toBe(255); // center
    expect(mask.data[15 * w + 20 + 4]).toBeGreaterThan(0); // mid-radius
    expect(mask.data[15 * w + 20 + 10]).toBe(0); // outside
  });

  it("blurMask smooths hard edges and preserves size", () => {
    const mask = createMask(w, h);
    rasterizePolygon(
      mask,
      [
        { x: 10, y: 10 },
        { x: 30, y: 10 },
        { x: 30, y: 20 },
        { x: 10, y: 20 },
      ],
      true
    );
    const blurred = blurMask(mask, 2);
    expect(blurred.width).toBe(w);
    expect(blurred.height).toBe(h);
    // Interior stays high, outside stays low, edge is intermediate.
    expect(blurred.data[15 * w + 20]).toBeGreaterThan(200);
    expect(blurred.data[5 * w + 20]).toBeLessThan(20);
    expect(blurred.data[10 * w + 20]).toBeGreaterThan(0);
    expect(blurred.data[10 * w + 20]).toBeLessThan(255);
  });
});

describe("face selection", () => {
  it("is deterministic for identical cells", () => {
    const a = selectFace(3, 4, 42, { variationMode: "random-faces", rotationPolicy: "quarter-turns", allowMirror: true }, 4);
    const b = selectFace(3, 4, 42, { variationMode: "random-faces", rotationPolicy: "quarter-turns", allowMirror: true }, 4);
    expect(a).toEqual(b);
  });

  it("spreads faces across cells", () => {
    const seen = new Set<number>();
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        seen.add(selectFace(x, y, 7, { variationMode: "random-faces", rotationPolicy: "fixed", allowMirror: false }, 4).faceIndex);
      }
    }
    expect(seen.size).toBe(4);
  });

  it("single mode never varies and fixed policy never rotates", () => {
    for (let i = 0; i < 20; i++) {
      const s = selectFace(i, i, 9, { variationMode: "single", rotationPolicy: "fixed", allowMirror: false }, 4);
      expect(s.faceIndex).toBe(0);
      expect(s.rotationDeg).toBe(0);
      expect(s.mirror).toBe(false);
    }
  });

  it("directional mode never rotates or mirrors", () => {
    for (let i = 0; i < 20; i++) {
      const s = selectFace(i, 0, 11, { variationMode: "directional", rotationPolicy: "quarter-turns", allowMirror: true }, 3);
      expect(s.rotationDeg).toBe(0);
      expect(s.mirror).toBe(false);
    }
  });

  it("sequential mode walks faces in order", () => {
    const s0 = selectFace(0, 0, 1, { variationMode: "sequential-faces", rotationPolicy: "fixed", allowMirror: false }, 3);
    const s1 = selectFace(1, 0, 1, { variationMode: "sequential-faces", rotationPolicy: "fixed", allowMirror: false }, 3);
    const s2 = selectFace(0, 1, 1, { variationMode: "sequential-faces", rotationPolicy: "fixed", allowMirror: false }, 3);
    expect([s0.faceIndex, s1.faceIndex, s2.faceIndex]).toEqual([0, 1, 1]);
  });

  it("hashCell is stable and well-distributed", () => {
    expect(hashCell(10, 20, 5)).toBe(hashCell(10, 20, 5));
    const set = new Set<number>();
    for (let i = 0; i < 100; i++) set.add(hashCell(i, i * 3, 99));
    expect(set.size).toBeGreaterThan(95);
  });
});

describe("illumination map", () => {
  it("produces neutral output for empty masks", () => {
    const room = { data: new Uint8ClampedArray(16 * 16 * 4).fill(128), width: 16, height: 16 };
    const mask = createMask(16, 16);
    const map = computeIlluminationMap(room, mask);
    expect(map.data[0 + 1]).toBe(128); // neutral residual
  });

  it("bright regions get higher field values than dark ones", () => {
    const w = 32;
    const h = 32;
    const room = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const v = x < w / 2 ? 60 : 220;
        room.data[i] = v;
        room.data[i + 1] = v;
        room.data[i + 2] = v;
        room.data[i + 3] = 255;
      }
    }
    const mask = createMask(w, h, 255);
    const map = computeIlluminationMap(room, mask, 0.5, 2);
    const left = map.data[(5 * w + 5) * 4]; // dark side
    const right = map.data[(5 * w + 26) * 4]; // bright side
    expect(right).toBeGreaterThan(left);
  });
});

describe("finish profiles", () => {
  it("polished retains more highlight than matte", () => {
    expect(FINISH_PROFILES.polished.highlightRetention).toBeGreaterThan(
      FINISH_PROFILES.matte.highlightRetention
    );
  });
});
