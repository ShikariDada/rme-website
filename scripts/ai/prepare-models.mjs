#!/usr/bin/env node
/**
 * Prepares self-hosted visualizer AI artifacts (visualizer spec §4.3, §21).
 *
 *  1. Copies the onnxruntime-web wasm/jsep assets into public/visualizer-wasm/
 *  2. Downloads MobileSAM ONNX artifacts (encoder + decoder) into
 *     public/visualizer-models/mobile-sam/ from URLs you provide
 *  3. Writes PROVENANCE.json recording source + license + date
 *
 * MobileSAM is Apache-2.0 (code AND weights). The official repo has no
 * prebuilt ONNX files — export them yourself with the repo's
 * `scripts/export_onnx_model.py --checkpoint weights/mobile_sam.pt
 *  --model-type vit_t` (encoder export additionally needed for TinyViT), or
 * supply URLs of exports you have reviewed. RE-VERIFY THE LICENSE AT THE
 * EXACT COMMIT before production use.
 *
 * Usage:
 *   node scripts/ai/prepare-models.mjs \
 *     --encoder-url  https://.../encoder.onnx \
 *     --decoder-url  https://.../decoder.onnx
 */
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WASM_OUT = join(ROOT, "public", "visualizer-wasm");
const MODEL_OUT = join(ROOT, "public", "visualizer-models", "mobile-sam");

function copyRuntimeAssets() {
  mkdirSync(WASM_OUT, { recursive: true });
  const dist = join(ROOT, "node_modules", "onnxruntime-web", "dist");
  const files = ["ort-wasm-simd-threaded.jsep.wasm", "ort-wasm-simd-threaded.jsep.mjs"];
  for (const f of files) {
    const src = join(dist, f);
    if (!existsSync(src)) {
      console.error(`Missing ${src} — install onnxruntime-web first (npm install).`);
      process.exit(1);
    }
    copyFileSync(src, join(WASM_OUT, f));
    console.log("copied", f, "→ public/visualizer-wasm/");
  }
}

async function download(url, dest) {
  console.log("downloading", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  console.log(`wrote ${dest} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
  return buf.length;
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const encoderUrl = getArg("--encoder-url");
  const decoderUrl = getArg("--decoder-url");

  copyRuntimeAssets();

  if (!encoderUrl || !decoderUrl) {
    console.log(
      "\nNo model URLs provided — Smart Select will remain gracefully unavailable\n" +
        "(the visualizer works fully in manual mode). Provide URLs to enable it:\n" +
        "  node scripts/ai/prepare-models.mjs --encoder-url <url> --decoder-url <url>\n"
    );
    writeFileSync(
      join(MODEL_OUT, "PROVENANCE.json"),
      JSON.stringify(
        {
          populated: false,
          note: "Run scripts/ai/prepare-models.mjs with --encoder-url/--decoder-url to populate artifacts.",
          license: "Apache-2.0",
          sourceRepo: "https://github.com/ChaoningZhang/MobileSAM",
          checkedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
    return;
  }

  mkdirSync(MODEL_OUT, { recursive: true });
  const encoderBytes = await download(encoderUrl, join(MODEL_OUT, "encoder.onnx"));
  const decoderBytes = await download(decoderUrl, join(MODEL_OUT, "decoder.onnx"));

  writeFileSync(
    join(MODEL_OUT, "PROVENANCE.json"),
    JSON.stringify(
      {
        populated: true,
        fetchedAt: new Date().toISOString(),
        license: "Apache-2.0",
        sourceRepo: "https://github.com/ChaoningZhang/MobileSAM",
        encoder: { url: encoderUrl, bytes: encoderBytes },
        decoder: { url: decoderUrl, bytes: decoderBytes },
        note: "Re-verify the MobileSAM license and export provenance at the exact commit before production release.",
      },
      null,
      2
    )
  );
  console.log("\nSmart Select artifacts ready. The visualizer will pick them up automatically.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
