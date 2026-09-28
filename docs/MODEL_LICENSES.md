# MODEL LICENSES (visualizer spec §21)

Reviewed: 2026-09-20. **Re-verify every entry at the exact commit/tag before
any production release** — repositories and model terms change.

> "Open weights" does not automatically mean commercial use is permitted.
> Code license and weight license are tracked separately.

| Component | Version pinned | Code license | Weights/checkpoints | Source | Notes |
|---|---|---|---|---|---|
| MobileSAM | repo @ 2026-05 (last push) | Apache-2.0 | Apache-2.0 (weights in-repo) | https://github.com/ChaoningZhang/MobileSAM | Primary Smart Select candidate. No official prebuilt ONNX — export via repo script; treat exports as Apache-2.0 derivatives of the model. |
| SAM 2.1 (candidate B) | 2.1 checkpoints | Apache-2.0 | Apache-2.0 — README states "The SAM 2 model checkpoints, SAM 2 demo code … and SAM 2 training code are licensed under Apache 2.0" | https://github.com/facebookresearch/sam2 | Heavier in-browser; benchmark before choosing over MobileSAM. |
| Depth Anything V2 Small | V2-Small | Apache-2.0 | **Apache-2.0 (Small ONLY)** | https://github.com/DepthAnything/Depth-Anything-V2 | Small is commercial-safe; Base/Large/Giant are CC-BY-NC-4.0 and MUST NOT be used. Phase 5 only, behind flag. |
| onnxruntime-web | 1.30.0 | MIT | n/a | https://github.com/microsoft/onnxruntime | Runtime only, no weights. |
| three.js | 0.186.0 | MIT | n/a | https://github.com/mrdoob/three.js | Rendering engine. |
| Next.js / React | 16.3.5 / 19.3.0 | MIT | n/a | vercel/next.js, facebook/react | |
| Tailwind CSS | 4.3.3 | MIT | n/a | github.com/tailwindlabs/tailwindcss | |
| Resend (SDK) | 6.28.1 | MIT | n/a | github.com/resend/resend-node | Transactional email. |

## Rules for this project

1. Every model/weight file ships with a `PROVENANCE.json` (written by
   `scripts/ai/prepare-models.mjs`) recording source, license and fetch date.
2. No model whose **weight** license is unclear may be bundled, even if the
   code repo is permissive.
3. No weights are downloaded from random third-party forks when an official
   source exists; community ONNX exports must be reviewed file-by-file and
   recorded in `docs/THIRD_PARTY_NOTICES.md`.
4. Copying GPU/A100 benchmark numbers into mobile acceptance criteria is
   forbidden — measure on our own target device set (spec §19.2).
