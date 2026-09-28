# THIRD-PARTY NOTICES

Software and assets used at runtime, with their required attributions.

## JavaScript dependencies (shipped to the browser)

- **three.js** — MIT License — © 2010-2026 three.js authors — https://github.com/mrdoob/three.js
- **onnxruntime-web** (only when Smart Select artifacts are deployed) — MIT License — © Microsoft Corporation — https://github.com/microsoft/onnxruntime
- **react / react-dom** — MIT License — © Meta Platforms, Inc. — https://github.com/facebook/react
- **next** — MIT License — © Vercel, Inc. — https://github.com/vercel/next.js

Full license texts are available in `node_modules/<package>/LICENSE`.

## Models (only when deployed via scripts/ai/prepare-models.mjs)

- **MobileSAM** ONNX artifacts — Apache-2.0 — https://github.com/ChaoningZhang/MobileSAM
  Provenance is recorded in `public/visualizer-models/mobile-sam/PROVENANCE.json`.

## Demo assets

All demo imagery in `public/textures/`, `public/rooms/` and `public/brand/`
is **generated procedurally** by `scripts/generate-demo-assets.mjs` (no
third-party sources, no scraped photography). Owner-supplied product
photography replaces it before launch and carries its own rights records
(`rightsStatus` on every image in the content model).

## Regenerating this file

Re-run the review before each production release: bump the version pins in
`docs/MODEL_LICENSES.md`, re-check licenses at the pinned commits, and update
the lists above.
