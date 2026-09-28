import type { InferenceSession, Tensor } from "onnxruntime-web/webgpu";
import { createSession, fetchModelBuffer, type ExecutionProvider } from "../ortRuntime";
import { MODEL_REGISTRY } from "../modelRegistry";

/**
 * MobileSAM promptable segmentation (visualizer spec §19).
 * Two-session split: the TinyViT encoder runs ONCE per image; the prompt
 * encoder + mask decoder runs per tap refinement. Deterministic given the
 * same image + prompts. The mask is a SUGGESTION — manual correction is
 * always available (spec §0.4); no "AI perfect" language anywhere.
 *
 * Input convention (MobileSAM): 1024×1024 RGB, mean [123.675, 116.28, 103.53],
 * std [58.395, 57.12, 57.375], coordinates in 0..1024 space.
 */

const INPUT_SIZE = 1024;
const MEAN = [123.675, 116.28, 103.53];
const STD = [58.395, 57.12, 57.375];

export interface PromptPoint {
  /** normalized 0..1 image coordinates */
  x: number;
  y: number;
  /** 1 = include, 0 = exclude */
  label: 0 | 1;
}

export interface SegmentationMask {
  mask: Uint8ClampedArray;
  width: number;
  height: number;
}

export class MobileSamSegmenter {
  private encoder: InferenceSession | null = null;
  private decoder: InferenceSession | null = null;
  private provider: ExecutionProvider = "wasm";
  private imageEmbedding: Record<string, Tensor> | null = null;

  static async create(
    onProgress?: (phase: "fetch-encoder" | "fetch-decoder" | "compile", fraction: number) => void
  ): Promise<MobileSamSegmenter> {
    const seg = new MobileSamSegmenter();
    const encoderBuf = await fetchModelBuffer(MODEL_REGISTRY["mobilesam-encoder"].url, (f) =>
      onProgress?.("fetch-encoder", f)
    );
    const decoderBuf = await fetchModelBuffer(MODEL_REGISTRY["mobilesam-decoder"].url, (f) =>
      onProgress?.("fetch-decoder", f)
    );
    onProgress?.("compile", 0.1);
    const enc = await createSession(encoderBuf, "webgpu");
    seg.encoder = enc.session;
    seg.provider = enc.provider;
    onProgress?.("compile", 0.7);
    const dec = await createSession(decoderBuf, enc.provider);
    seg.decoder = dec.session;
    onProgress?.("compile", 1);
    return seg;
  }

  get executionProvider(): ExecutionProvider {
    return this.provider;
  }

  /** Encode the image once. imageBitmap any size — resized/padded to 1024². */
  async setImage(imageBitmap: ImageBitmap): Promise<void> {
    if (!this.encoder) throw new Error("MobileSAM not initialized");
    const rgba = await this.rasterizeTo1024(imageBitmap);
    const input = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
    for (let i = 0, px = 0; i < rgba.length; i += 4, px++) {
      input[px] = (rgba[i] - MEAN[0]) / STD[0];
      input[INPUT_SIZE * INPUT_SIZE + px] = (rgba[i + 1] - MEAN[1]) / STD[1];
      input[2 * INPUT_SIZE * INPUT_SIZE + px] = (rgba[i + 2] - MEAN[2]) / STD[2];
    }
    const ort = await import("onnxruntime-web/webgpu");
    const results = await this.encoder.run({
      images: new ort.Tensor("float32", input, [1, 3, INPUT_SIZE, INPUT_SIZE]),
    });
    // MobileSAM ONNX export exposes the embedding as "image_embeddings" (+ pe).
    this.imageEmbedding = results;
  }

  async segment(points: PromptPoint[], imageW: number, imageH: number): Promise<SegmentationMask> {
    if (!this.decoder || !this.imageEmbedding) throw new Error("Set an image first");
    if (points.length === 0) throw new Error("At least one prompt point is required");
    const ort = await import("onnxruntime-web/webgpu");

    const coords = new Float32Array(points.length * 2);
    const labels = new Float32Array(points.length);
    points.forEach((p, i) => {
      coords[i * 2] = Math.min(INPUT_SIZE - 1, Math.max(0, p.x * INPUT_SIZE));
      coords[i * 2 + 1] = Math.min(INPUT_SIZE - 1, Math.max(0, p.y * INPUT_SIZE));
      labels[i] = p.label;
    });

    const feeds: Record<string, Tensor> = {
      image_embeddings: this.imageEmbedding.image_embeddings,
      image_pe: this.imageEmbedding.image_pe,
      point_coords: new ort.Tensor("float32", coords, [1, points.length, 2]),
      point_labels: new ort.Tensor("float32", labels, [1, points.length]),
      mask_input: new ort.Tensor("float32", new Float32Array(256 * 256), [1, 1, 256, 256]),
      has_mask_input: new ort.Tensor("float32", new Float32Array(1), [1]),
    };

    const results = await this.decoder.run(feeds);
    const logits = results.masks as Tensor;
    const data = logits.data as Float32Array;
    // logits: [1, 1, 256, 256] — threshold at 0, bilinear upsample to image size.
    const out = new Uint8ClampedArray(imageW * imageH);
    const LOG = 256;
    for (let y = 0; y < imageH; y++) {
      const sy = Math.min(LOG - 1, Math.max(0, ((y / imageH) * LOG) | 0));
      for (let x = 0; x < imageW; x++) {
        const sx = Math.min(LOG - 1, Math.max(0, ((x / imageW) * LOG) | 0));
        out[y * imageW + x] = data[sy * LOG + sx] > 0 ? 255 : 0;
      }
    }
    return { mask: out, width: imageW, height: imageH };
  }

  async dispose(): Promise<void> {
    await this.encoder?.release();
    await this.decoder?.release();
    this.encoder = null;
    this.decoder = null;
    this.imageEmbedding = null;
  }

  private async rasterizeTo1024(bitmap: ImageBitmap): Promise<Uint8ClampedArray> {
    const canvas = document.createElement("canvas");
    canvas.width = INPUT_SIZE;
    canvas.height = INPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    // Stretch to 1024² (MobileSAM convention uses resize, not letterbox).
    ctx.drawImage(bitmap, 0, 0, INPUT_SIZE, INPUT_SIZE);
    const data = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;
    return new Uint8ClampedArray(data);
  }
}
