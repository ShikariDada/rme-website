/**
 * Material model for visualizer-ready products (visualizer spec §6).
 * Projected from site products by the website's lib/visualizer/materials.ts.
 */

export type FinishType =
  | "matte"
  | "satin"
  | "gloss"
  | "polished"
  | "honed"
  | "textured"
  | "unknown";

export type MaterialKind =
  | "ceramic-tile"
  | "vitrified-tile"
  | "porcelain-tile"
  | "marble-tile"
  | "marble-slab"
  | "granite-tile"
  | "granite-slab"
  | "quartz";

export type VariationMode =
  | "single"
  | "random-faces"
  | "sequential-faces"
  | "directional"
  | "bookmatch-pair";

export type RotationPolicy = "fixed" | "180-only" | "quarter-turns" | "free";

export interface MaterialFace {
  id: string;
  albedoUrl: string;
  previewUrl: string;
  normalUrl?: string;
  roughnessUrl?: string;
  aoUrl?: string;
  weight?: number;
}

export interface VisualizerMaterial {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand?: string;
  kind: MaterialKind;

  /** Physical dimensions. NEVER inferred from pixels. */
  widthMm: number;
  heightMm: number;
  thicknessMm?: number;

  finish: FinishType;
  defaultGroutMm?: number;
  recommendedGroutMm?: { min: number; max: number };

  faces: MaterialFace[];

  variationMode: VariationMode;
  rotationPolicy: RotationPolicy;
  allowMirror: boolean;
  supportedLayouts: string[];

  // Retail metadata
  pricePerSqFt?: number;
  coveragePerBoxSqFt?: number;
  piecesPerBox?: number;
  availability?: "in-stock" | "limited" | "order" | "unknown";
  productPagePath: string;

  // Visualizer QA
  visualizerReady: boolean;
  colorCheckedAt?: string;
  captureBatch?: string;
}

/** Hard validation (spec §6): a product is not exposed unless all are true. */
export function isVisualizerReady(m: VisualizerMaterial): boolean {
  return (
    m.visualizerReady === true &&
    m.widthMm > 0 &&
    m.heightMm > 0 &&
    m.faces.length > 0 &&
    m.faces.every((f) => Boolean(f.albedoUrl)) &&
    m.rotationPolicy !== undefined &&
    m.variationMode !== undefined
  );
}

/* ------------------------- finish profiles (§17) ------------------------- */

export interface FinishProfile {
  diffuseStrength: number;
  shadowStrength: number;
  highlightRetention: number;
  roughness: number;
  normalStrength: number;
}

export const FINISH_PROFILES: Record<FinishType, FinishProfile> = {
  matte: { diffuseStrength: 1.0, shadowStrength: 1.0, highlightRetention: 0.06, roughness: 1.0, normalStrength: 0 },
  satin: { diffuseStrength: 1.0, shadowStrength: 1.0, highlightRetention: 0.16, roughness: 0.7, normalStrength: 0 },
  gloss: { diffuseStrength: 1.0, shadowStrength: 0.95, highlightRetention: 0.32, roughness: 0.35, normalStrength: 0 },
  polished: { diffuseStrength: 1.0, shadowStrength: 0.9, highlightRetention: 0.42, roughness: 0.22, normalStrength: 0 },
  honed: { diffuseStrength: 1.0, shadowStrength: 1.0, highlightRetention: 0.12, roughness: 0.8, normalStrength: 0 },
  textured: { diffuseStrength: 1.0, shadowStrength: 1.08, highlightRetention: 0.05, roughness: 1.0, normalStrength: 0.6 },
  unknown: { diffuseStrength: 1.0, shadowStrength: 1.0, highlightRetention: 0.1, roughness: 0.9, normalStrength: 0 },
};

export function siteFinishToFinishType(finish: string): FinishType {
  const f = finish.toLowerCase();
  if (f.includes("polish")) return "polished";
  if (f.includes("gloss")) return "gloss";
  if (f.includes("satin")) return "satin";
  if (f.includes("textur") || f.includes("rustic") || f.includes("anti-skid")) return "textured";
  if (f.includes("honed")) return "honed";
  if (f.includes("matt")) return "matte";
  return "unknown";
}

/* ------------------------ face selection (§14) --------------------------- */

/**
 * Deterministic integer hash of (a, b, seed). Same inputs → same face, so a
 * re-render reproduces the exact same result (renderer is deterministic).
 */
export function hashCell(a: number, b: number, seed: number): number {
  let h = seed >>> 0;
  h = Math.imul(h ^ (a | 0), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h ^ (b | 0), 0x27d4eb2f);
  h ^= h >>> 15;
  return h >>> 0;
}

export interface FaceSelection {
  faceIndex: number;
  rotationDeg: 0 | 90 | 180 | 270;
  mirror: boolean;
}

export function selectFace(
  cellX: number,
  cellY: number,
  seed: number,
  material: Pick<VisualizerMaterial, "variationMode" | "rotationPolicy" | "allowMirror">,
  faceCount: number
): FaceSelection {
  const hash = hashCell(cellX, cellY, seed);
  let faceIndex: number;
  switch (material.variationMode) {
    case "single":
      faceIndex = 0;
      break;
    case "sequential-faces":
      faceIndex = faceCount > 0 ? (((cellX + cellY) % faceCount) + faceCount) % faceCount : 0;
      break;
    case "directional":
      faceIndex = 0; // directional materials never rotate/mirror randomly
      break;
    case "bookmatch-pair":
      faceIndex = faceCount > 1 ? (Math.abs(cellX % 2) as number) : 0;
      break;
    case "random-faces":
    default:
      faceIndex = faceCount > 0 ? hash % faceCount : 0;
      break;
  }

  let rotationDeg: 0 | 90 | 180 | 270 = 0;
  if (material.variationMode !== "directional") {
    switch (material.rotationPolicy) {
      case "180-only":
        rotationDeg = hash % 2 === 0 ? 0 : 180;
        break;
      case "quarter-turns":
        rotationDeg = ((hash >>> 3) % 4) * 90 as 0 | 90 | 180 | 270;
        break;
      case "free":
        rotationDeg = ((hash >>> 3) % 4) * 90 as 0 | 90 | 180 | 270;
        break;
      case "fixed":
      default:
        rotationDeg = 0;
        break;
    }
  }

  const mirror =
    material.allowMirror &&
    material.variationMode !== "directional" &&
    ((hash >>> 7) & 1) === 1;

  return { faceIndex, rotationDeg, mirror };
}
