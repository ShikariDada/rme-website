# In-house visualizer — implementation plan & status

This document records the decision to build the visualizer **in-house** (the
owner explicitly rejected the vendor bake-off route in the older website
spec), the architecture, and the current phase status against the visualizer
build spec (§40 phased implementation).

## Decision record

- **Supersedes:** the vendor-first recommendation in
  `FINAL_Marble_Tile_Retail_Website_Build_Spec` §1.4/§20 (TilesDisplay /
  TilesView / Nirwana bake-off).
- **Hard constraints kept:** no paid SaaS, no external inference APIs, no
  generative image models for SKU application, deterministic renderer,
  manual correction always available, local-first room photos.
- `docs/VISUALIZER_BAKEOFF.md` is intentionally **not** created — there is no
  bake-off to run.

## Architecture (four layers, per spec §3)

```
Layer A  Deterministic GPU compositor   ✅  packages/visualizer-engine/src/renderer/*
         Three.js WebGL2, custom GLSL: room UV → mask → H⁻¹ → plane mm →
         pattern cell/face/grout → atlas sample (textureGrad, analytic
         derivatives) → linear illumination × material → composite
Layer B  Manual geometry + mask editor  ✅  src/features/visualizer/ui/*
         Draggable corner handles (+ numeric-input non-drag alternative),
         add/erase mask brush, multi-surface, undo/redo with drag coalescing
Layer C  Smart Select (MobileSAM)       ⚙️  packages/visualizer-ai/*
         Code-complete, feature-flagged, self-hosted-weights design;
         gracefully hidden until artifacts are deployed (see below)
Layer D  Depth assistance               ❌  deliberately not built (spec Phase 5)
```

## Pure math (unit-tested — 84 vitest tests)

- `geometry/homography.ts` — DLT solve with Hartley normalization, inverse,
  quad validation (crossed/collinear/tiny rejection), round-trip properties.
- `geometry/calibration.ts` — single-line isotropic scale, two-line
  anisotropic scale, approximate tiles-across mode. Truth rules enforced:
  no calibration → UI says **Approximate scale**.
- `patterns/patterns.ts` — straight / running-half / running-third /
  diagonal cell mapping in material millimetre space (GLSL mirrors this
  exactly), grout edge distances, GLSL-compatible mod.
- `materials/materialModel.ts` — spec §6 model, validation gate, finish
  profiles, deterministic face selection (hash, variation modes, rotation
  policy, mirror policy).
- `masks/maskRasterizer.ts` — scanline polygon rasterization, soft brush,
  masked blur, thresholding.
- `lighting/illuminationMap.ts` — deterministic illumination field
  (sRGB→linear luminance, masked box blur, percentile normalization, capped
  shadow residual) — the anti-sticker layer (spec §16).

## Renderer internals (Layer A)

- Fullscreen pass per surface over the room; z-ordered alpha compositing.
- Atlas of product faces with half-texel insets; `textureGrad` sampling with
  analytic mm-space derivatives → correct anisotropic mips on oblique floors.
- Grout in material space with fwidth anti-aliasing (follows perspective).
- Explicit sRGB↔linear; illumination field modulates material, residual term
  carries soft shadows.
- WebGL context loss/restore with full state rebuild; complete texture/
  geometry/material disposal; rAF-coalesced dirty-flag rendering.
- Export: separate hidden canvas at up to 2560px (clamped to GPU limits and
  source size), same normalized state, JPEG; design-card mode composes a
  margin strip with SKU names and an approximate/calibrated notice.

## What is verified (production build, real browser)

- Upload/preset room flow, corner dragging, material application, layout and
  grout changes, undo/redo, mask exclusion of occluders (sofa/rug), export of
  image and design card, quote CTA with SKUs, approximate-scale labelling.

## Smart Select (Layer C) — shipping posture

Code-complete: capability detection, self-hosted ORT wasm paths, worker
inference (encoder once per image, decoder per prompt), OPFS model cache,
progress reporting, hard fallback to manual mode. **It stays hidden** until
the owner runs:

```bash
node scripts/ai/prepare-models.mjs --encoder-url <...> --decoder-url <...>
```

after reviewing `docs/MODEL_LICENSES.md` (MobileSAM: Apache-2.0). The spec's
own gate (§47) requires a real-room benchmark before calling it
production-ready — that requires physical devices and labelled masks.

## Deliberately not built in v1 (spec §43)

3D room builder, AR/SLAM, server GPU inference, generative restyling,
photogrammetric measurement, ray tracing, cloud sync, automatic WhatsApp
image attachment via `wa.me`.

## Known demo-mode limitations (by design)

- Preset-room masks load on first render; manual brush editing available.
- Single calibration line = isotropic scale (documented approximation);
  strongly skewed planes reduce accuracy.
- Compare mode uses a static 50% split in the current shell.
- V2 patterns (herringbone, chevron, bookmatch) are flag-gated off.
