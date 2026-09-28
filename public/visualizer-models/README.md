# Visualizer model artifacts — NOT committed

This directory is intentionally empty in the repository. The visualizer's
**Smart Select** (promptable segmentation) needs self-hosted ONNX model
artifacts that are too large to commit and whose license/provenance must be
re-verified by a human before production use.

## What goes here

```
public/visualizer-models/mobile-sam/
  encoder.onnx      # MobileSAM TinyViT image encoder (runs once per photo)
  decoder.onnx      # MobileSAM prompt encoder + mask decoder (per tap)
  PROVENANCE.json   # written automatically by the prep script
```

## How to populate

```bash
node scripts/ai/prepare-models.mjs \
  --encoder-url  <URL of reviewed encoder.onnx> \
  --decoder-url  <URL of reviewed decoder.onnx>
```

The script also copies the ONNX Runtime Web wasm/jsep assets from
`node_modules/onnxruntime-web/dist/` into `public/visualizer-wasm/`, which
**is** required for any AI use and is cheap to regenerate.

## License summary (re-verify at the exact commit before shipping)

| Artifact | License | Source |
|---|---|---|
| MobileSAM code + weights + ONNX exports | Apache-2.0 | https://github.com/ChaoningZhang/MobileSAM |
| onnxruntime-web | MIT | https://github.com/microsoft/onnxruntime |
| SAM 2.1 (alternative candidate) | Apache-2.0 (code AND checkpoints) | https://github.com/facebookresearch/sam2 |
| Depth Anything V2 **Small** (future depth assist only) | Apache-2.0 | https://github.com/DepthAnything/Depth-Anything-V2 |
| Depth Anything V2 Base/Large/Giant | CC-BY-NC-4.0 — **NOT usable commercially** | same repo |

## Until artifacts exist

The visualizer automatically runs in **manual mode only** (`verifyArtifacts()`
fails → Smart Select UI is hidden). Manual polygon + brush editing is the
deterministic core and is always available (spec §0.5, §10.1).
