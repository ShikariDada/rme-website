import { contentSource } from "@/lib/data";
import {
  isVisualizerReady,
  siteFinishToFinishType,
  type MaterialKind,
  type VisualizerMaterial,
} from "@visualizer/engine";
import type { Product } from "@/lib/types";

/**
 * Projects site products into engine VisualizerMaterials (visualizer spec §6).
 *
 * Local/demo mode: texture faces come from the procedural demo assets via
 * DEMO_TEXTURE_MAP. When Sanity is configured this mapping is replaced by CMS
 * fields (faces[] on the product). A product is only exposed to the
 * visualizer when it has known physical dimensions AND approved face imagery.
 */

interface DemoTextureSet {
  faceUrls: string[];
  kind: MaterialKind;
}

const DEMO_TEXTURE_MAP: Record<string, DemoTextureSet> = {
  "vm-bianco-gloss": { kind: "vitrified-tile", faceUrls: ["/textures/marble-bianco-face-1.png", "/textures/marble-bianco-face-2.png", "/textures/marble-bianco-face-3.png", "/textures/marble-bianco-face-4.png"] },
  "vm-bianco-matt": { kind: "vitrified-tile", faceUrls: ["/textures/marble-bianco-face-3.png", "/textures/marble-bianco-face-1.png", "/textures/marble-bianco-face-4.png", "/textures/marble-bianco-face-2.png"] },
  "vm-emperador": { kind: "vitrified-tile", faceUrls: ["/textures/marble-emperador-face-1.png", "/textures/marble-emperador-face-2.png", "/textures/marble-emperador-face-3.png", "/textures/marble-emperador-face-4.png"] },
  "vm-emerald": { kind: "vitrified-tile", faceUrls: ["/textures/marble-emerald-face-1.png", "/textures/marble-emerald-face-2.png", "/textures/marble-emerald-face-3.png"] },
  "vm-ivory": { kind: "vitrified-tile", faceUrls: ["/textures/vitrified-ivory-face-1.png", "/textures/vitrified-ivory-face-2.png"] },
  "vm-concrete": { kind: "vitrified-tile", faceUrls: ["/textures/porcelain-concrete-face-1.png", "/textures/porcelain-concrete-face-2.png"] },
  "vm-steel-grey-tile": { kind: "vitrified-tile", faceUrls: ["/textures/granite-steel-grey-face-1.png", "/textures/granite-steel-grey-face-2.png"] },
  "vm-desert-brown": { kind: "vitrified-tile", faceUrls: ["/textures/granite-desert-brown-face-1.png", "/textures/granite-desert-brown-face-2.png"] },
  "vm-oak": { kind: "porcelain-tile", faceUrls: ["/textures/wood-oak-face-1.png", "/textures/wood-oak-face-2.png"] },
  "vm-outdoor": { kind: "porcelain-tile", faceUrls: ["/textures/outdoor-antiskid-face-1.png", "/textures/outdoor-antiskid-face-2.png"] },
  "vm-wall-grey": { kind: "ceramic-tile", faceUrls: ["/textures/wall-gloss-grey-face-1.png"] },
  "vm-xl-slab": { kind: "porcelain-tile", faceUrls: ["/textures/porcelain-concrete-face-2.png", "/textures/porcelain-concrete-face-1.png"] },
  "vm-steel-grey-granite": { kind: "granite-slab", faceUrls: ["/textures/granite-steel-grey-face-1.png", "/textures/granite-steel-grey-face-2.png"] },
};

function kindFor(product: Product): MaterialKind {
  if (product.materialType === "marble") return "marble-slab";
  if (product.materialType === "granite") return "granite-slab";
  const body = product.tile?.bodyType?.toLowerCase() ?? "";
  if (body.includes("ceramic")) return "ceramic-tile";
  if (body.includes("porcelain")) return "porcelain-tile";
  return "vitrified-tile";
}

const availabilityMap = {
  ready_stock: "in-stock",
  limited: "limited",
  order_basis: "order",
  unavailable: "unknown",
} as const;

export function productToMaterial(product: Product, textures: DemoTextureSet): VisualizerMaterial {
  const finish = siteFinishToFinishType(product.finish[0] ?? "unknown");
  return {
    id: product.visualizerMaterialId ?? product.sku,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    brand: product.brandName,
    kind: textures.kind ?? kindFor(product),
    widthMm: product.tile?.widthMm ?? 900,
    heightMm: product.tile?.heightMm ?? 1800,
    thicknessMm: product.tile?.thicknessMm,
    finish,
    defaultGroutMm: product.tile && product.tile.widthMm >= 1200 ? 2 : 3,
    recommendedGroutMm: { min: 1.5, max: 5 },
    faces: textures.faceUrls.map((url, i) => ({
      id: `${product.sku}-face-${i + 1}`,
      albedoUrl: url,
      previewUrl: url,
    })),
    variationMode: textures.faceUrls.length > 1 ? "random-faces" : "single",
    rotationPolicy: textures.kind === "porcelain-tile" && product.look.includes("wood") ? "fixed" : "quarter-turns",
    allowMirror: !product.look.includes("wood") && !product.look.includes("marble"),
    supportedLayouts: ["straight", "running-half", "running-third", "diagonal"],
    pricePerSqFt: product.pricing.mode === "exact" ? product.pricing.amount : product.pricing.mode === "from" ? product.pricing.amount : product.pricing.min,
    coveragePerBoxSqFt: product.tile?.coverageSqFtPerBox,
    piecesPerBox: product.tile?.tilesPerBox,
    availability: availabilityMap[product.availability.status],
    productPagePath: `/product/${product.slug}`,
    visualizerReady: true,
    colorCheckedAt: product.pricing.updatedAt,
    captureBatch: "demo-procedural",
  };
}

/** All visualizer-ready materials, for the /visualizer product drawer. */
export async function getVisualizerMaterials(): Promise<VisualizerMaterial[]> {
  const products = await contentSource.getProducts();
  const materials: VisualizerMaterial[] = [];
  for (const p of products) {
    if (p.status !== "active" || !p.visualizerMaterialId) continue;
    const textures = DEMO_TEXTURE_MAP[p.visualizerMaterialId];
    if (!textures) continue;
    const m = productToMaterial(p, textures);
    if (isVisualizerReady(m)) materials.push(m);
  }
  return materials;
}

/** Resolve one material by id or product slug (PDP preselection). */
export async function getVisualizerMaterial(idOrSlug: string): Promise<VisualizerMaterial | null> {
  const materials = await getVisualizerMaterials();
  return (
    materials.find((m) => m.id === idOrSlug || m.slug === idOrSlug || m.sku === idOrSlug) ?? null
  );
}
