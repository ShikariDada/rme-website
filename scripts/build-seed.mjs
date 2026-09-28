#!/usr/bin/env node
/**
 * Builds content/seed/*.json — the local demo dataset that runs the site
 * before Sanity is configured.
 *
 * ALL DATA IN HERE IS DEMO/SAMPLE CONTENT: business facts, prices, stock and
 * claims are structurally complete placeholders that the owner MUST replace
 * with verified facts (docs/OWNER_FACTS.md). Nothing here is a real claim.
 *
 * Run: npm run build:seed
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "content", "seed");
mkdirSync(OUT, { recursive: true });

const NOW = "2026-09-18T10:30:00+05:30";
const DAY = (d) => `2026-09-${String(d).padStart(2, "0")}T10:30:00+05:30`;

const write = (name, data) => {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2));
  console.log("wrote content/seed/" + name);
};

/* ------------------------------- settings ------------------------------- */
write("settings.json", {
  businessName: "Rajasthan Marble Enterprises",
  shortName: "RME",
  logo: null,
  phone: "+919219733022",
  phoneDisplay: "+91 92197 33022",
  whatsappNumber: "+919219733022",
  quoteEmail: "quotes@rajasthanmarble.example",
  address: {
    line1: "Rajasthan Marble Enterprises",
    line2: "",
    locality: "Goverdhan Chauraha",
    city: "Mathura",
    state: "Uttar Pradesh",
    postalCode: "281001",
    country: "IN",
  },
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Rajasthan+Marble+Enterprises+Goverdhan+Chauraha+Mathura+281001",
  businessProfileUrl: "",
  hours: [
    { day: "monday", closed: true },
    { day: "tuesday", opens: "10:00", closes: "20:00", closed: false },
    { day: "wednesday", opens: "10:00", closes: "20:00", closed: false },
    { day: "thursday", opens: "10:00", closes: "20:00", closed: false },
    { day: "friday", opens: "10:00", closes: "20:00", closed: false },
    { day: "saturday", opens: "10:00", closes: "20:00", closed: false },
    { day: "sunday", opens: "11:00", closes: "18:00", closed: false },
  ],
  priceTaxLabel: "inclusive",
  defaultQuoteResponseCopy:
    "We usually respond to quote requests within one business day during showroom hours.",
  socialLinks: [],
  seoDefaultTitle: "Rajasthan Marble Enterprises — Marble, Tiles & Granite in Mathura",
  seoDefaultDescription:
    "Browse tiles, marble and granite with honest prices and stock status, calculate quantity, preview in your own room and get a fast quote from our Mathura showroom.",
});

/* -------------------------------- brands -------------------------------- */
write("brands.json", [
  {
    id: "brand-varmora",
    name: "Varmora",
    slug: "varmora",
    logo: null,
    description:
      "Varmora Granito is one of India's large tile and ceramic brands. Our showroom stocks a curated range of Varmora vitrified tiles and wall tiles for immediate inspection.",
    officialUrl: "https://varmora.com/",
    isFeatured: true,
    // DEMO VALUE: the owner must obtain written dealer authorisation before
    // this claim is shown publicly. Flip to false until confirmed.
    isAuthorizedDealerClaimAllowed: true,
    authorizationEvidenceNote:
      "DEMO SEED — the owner must still obtain written Varmora authorisation and asset permission before launch.",
    assetUsageApproved: true, // DEMO VALUE: owner confirmation still required (see note above)
    sortOrder: 1,
  },
  {
    id: "brand-house",
    name: "House Selection",
    slug: "house-selection",
    description:
      "Curated by our team: materials we confidently recommend for local homes and projects, sourced from vetted manufacturers.",
    isFeatured: false,
    isAuthorizedDealerClaimAllowed: false,
    assetUsageApproved: true,
    sortOrder: 2,
  },
]);

/* ------------------------------ categories ------------------------------ */
const categories = [
  {
    id: "cat-tiles",
    name: "Tiles & Vitrified",
    slug: "tiles",
    materialType: "tile",
    heroImage: { url: "/textures/marble-bianco-face-1.png", alt: "Polished marble-look vitrified tile surface", kind: "product", rightsStatus: "owned" },
    summary:
      "Vitrified, ceramic and porcelain tiles in every size from 300x600 wall tiles to 1200x2400 slabs — with honest per-square-foot prices and live stock states.",
    priceGuide: [
      { label: "Ceramic wall tiles (300x600)", min: 28, max: 45, unit: "sq_ft", lastUpdated: DAY(15) },
      { label: "Vitrified floor tiles (600x600)", min: 40, max: 70, unit: "sq_ft", lastUpdated: DAY(15) },
      { label: "Large-format marble-look (600x1200 and up)", min: 60, max: 180, unit: "sq_ft", lastUpdated: DAY(15) },
    ],
    seo: { title: "Tiles in Mathura — Prices, Sizes & Stock | Rajasthan Marble Enterprises" },
  },
  {
    id: "cat-marble",
    name: "Marble",
    slug: "marble",
    materialType: "marble",
    heroImage: { url: "/textures/marble-emperador-face-1.png", alt: "Brown marble slab with light veining", kind: "product", rightsStatus: "owned" },
    summary:
      "Natural Indian marble slabs, sold by the slab with honest lot-variation guidance. Every slab is unique — see it in the showroom before you buy.",
    priceGuide: [
      { label: "Indian marble (Makrana, Kotah belt)", min: 90, max: 220, unit: "sq_ft", lastUpdated: DAY(12) },
      { label: "Premium imported-look Indian marble", min: 200, max: 420, unit: "sq_ft", lastUpdated: DAY(12) },
    ],
  },
  {
    id: "cat-granite",
    name: "Granite",
    slug: "granite",
    materialType: "granite",
    heroImage: { url: "/textures/granite-steel-grey-face-1.png", alt: "Speckled steel grey granite surface", kind: "product", rightsStatus: "owned" },
    summary:
      "Hard-wearing granite for kitchens, stairs and facades. Prices vary by slab thickness and lot — current ranges are listed with each product.",
    priceGuide: [
      { label: "Common Indian granite (18–20 mm slabs)", min: 80, max: 190, unit: "sq_ft", lastUpdated: DAY(14) },
    ],
  },
];
write("categories.json", categories);

/* ----------------------------- applications ----------------------------- */
write("applications.json", [
  { id: "app-bathroom", name: "Bathroom", slug: "bathroom", kind: "room", description: "Anti-slip flooring considerations and easy-clean wall tiles for Indian bathrooms.", recommendedMaterialTypes: ["tile", "granite"] },
  { id: "app-kitchen", name: "Kitchen", slug: "kitchen", kind: "room", description: "Stain-resistant floors and splashback-friendly wall tiles.", recommendedMaterialTypes: ["tile", "granite"] },
  { id: "app-living-room", name: "Living Room", slug: "living-room", kind: "room", description: "Large-format marble-look vitrified tiles and premium natural stone.", recommendedMaterialTypes: ["tile", "marble"] },
  { id: "app-bedroom", name: "Bedroom", slug: "bedroom", kind: "room", description: "Warm wood-look tiles and smooth vitrified floors.", recommendedMaterialTypes: ["tile"] },
  { id: "app-outdoor", name: "Outdoor & Parking", slug: "outdoor", kind: "use-case", description: "Textured, weather-resistant surfaces for terraces, parking and pathways.", recommendedMaterialTypes: ["tile", "granite"] },
  { id: "app-elevation", name: "Elevation & Facade", slug: "elevation", kind: "surface", description: "Exterior elevation tiles that hold up to Mathura sun and dust.", recommendedMaterialTypes: ["tile"] },
]);

/* ------------------------------- products ------------------------------- */
let n = 0;
const products = [];

function product(def) {
  n += 1;
  const id = `prod-${String(n).padStart(3, "0")}`;
  const images = (def.images ?? []).map((im) => ({
    alt: `${def.name} — ${im.kind === "texture" ? "tile surface texture" : "product photo"}`,
    rightsStatus: "owned", // DEMO: procedural asset. Owner replaces with authorised photography.
    source: "demo-generated",
    ...im,
  }));
  products.push({
    id,
    status: "active",
    newArrival: false,
    featured: false,
    relatedProductSlugs: [],
    categorySlugs: [def.materialType === "tile" ? "tiles" : def.materialType],
    ...def,
    images,
    pricing: { currency: "INR", updatedAt: def.pricing.updatedAt ?? NOW, ...def.pricing },
    availability: { status: "ready_stock", ...def.availability },
  });
}

const t = (path, kind = "product") => ({ url: path, kind, width: 1024, height: 512 });

// ---- Varmora marble-look vitrified ----
product({
  name: "Bianco Carrara Gloss Vitrified Tile 600x1200",
  slug: "bianco-carrara-gloss-600x1200",
  sku: "VMT-BCG-6012",
  familyKey: "bianco-carrara",
  brandId: "brand-varmora",
  brandName: "Varmora",
  materialType: "tile",
  applicationSlugs: ["living-room", "bedroom"],
  featured: true,
  pricing: { mode: "exact", unit: "sq_ft", amount: 68, boxAmount: 1054, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [t("/textures/marble-bianco-face-1.png", "texture"), t("/textures/marble-bianco-face-2.png", "closeup")],
  colorFamily: ["white", "grey"],
  look: ["marble"],
  finish: ["gloss"],
  tile: { widthMm: 600, heightMm: 1200, thicknessMm: 9, bodyType: "GVT", use: ["floor", "wall"], tilesPerBox: 2, coverageSqFtPerBox: 15.5, faces: 4 },
  description: [
    { _type: "block", style: "normal", children: [{ text: "A bright marble-look vitrified tile with soft grey veining on a polished gloss surface. The most popular choice for living rooms in our showroom — it reads like marble at a vitrified tile price." }] },
    { _type: "callout", variant: "info", text: "Printed marble effect. Natural marble, by definition, varies more from piece to piece — see our marble category if you want the real thing." },
  ],
  relatedProductSlugs: ["bianco-carrara-matt-600x1200", "emperador-brown-polished-800x1600"],
  visualizerMaterialId: "vm-bianco-gloss",
});

product({
  name: "Bianco Carrara Matt Vitrified Tile 600x1200",
  slug: "bianco-carrara-matt-600x1200",
  sku: "VMT-BCM-6012",
  familyKey: "bianco-carrara",
  brandId: "brand-varmora",
  brandName: "Varmora",
  materialType: "tile",
  applicationSlugs: ["living-room", "kitchen", "bathroom"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 66, boxAmount: 1023, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [t("/textures/marble-bianco-face-3.png", "texture")],
  colorFamily: ["white", "grey"],
  look: ["marble"],
  finish: ["matt"],
  tile: { widthMm: 600, heightMm: 1200, thicknessMm: 9, bodyType: "GVT", use: ["floor", "wall"], tilesPerBox: 2, coverageSqFtPerBox: 15.5, faces: 4 },
  description: [{ _type: "block", style: "normal", children: [{ text: "The matt version of our best-selling Bianco Carrara — calmer under interior lighting and more forgiving of water spots. Commonly used across full homes." }] }],
  relatedProductSlugs: ["bianco-carrara-gloss-600x1200"],
  visualizerMaterialId: "vm-bianco-matt",
});

product({
  name: "Emperador Brown Polished Tile 800x1600",
  slug: "emperador-brown-polished-800x1600",
  sku: "VMT-EBP-8016",
  brandId: "brand-varmora",
  brandName: "Varmora",
  materialType: "tile",
  applicationSlugs: ["living-room"],
  featured: true,
  newArrival: true,
  pricing: { mode: "exact", unit: "sq_ft", amount: 118, boxAmount: 3258, taxLabel: "inclusive" },
  availability: { status: "limited", publicNote: "Two boxes remain in current batch", verifiedAt: DAY(17) },
  images: [t("/textures/marble-emperador-face-1.png", "texture")],
  colorFamily: ["brown", "beige"],
  look: ["marble"],
  finish: ["polished"],
  tile: { widthMm: 800, heightMm: 1600, thicknessMm: 9, bodyType: "GVT", use: ["floor", "wall"], tilesPerBox: 2, coverageSqFtPerBox: 27.55, faces: 4 },
  description: [{ _type: "block", style: "normal", children: [{ text: "Large-format warm brown marble-look tile with dramatic light veining. Makes a statement floor; needs a flat subfloor and two-person handling." }] }],
  visualizerMaterialId: "vm-emperador",
});

product({
  name: "Emerald Green Polished Tile 600x1200",
  slug: "emerald-green-polished-600x1200",
  sku: "VMT-EGP-6012",
  brandId: "brand-varmora",
  brandName: "Varmora",
  materialType: "tile",
  applicationSlugs: ["living-room", "elevation"],
  pricing: { mode: "from", unit: "sq_ft", amount: 128, taxLabel: "inclusive" },
  availability: { status: "order_basis", verifiedAt: DAY(12) },
  images: [t("/textures/marble-emerald-face-1.png", "texture")],
  colorFamily: ["green"],
  look: ["marble"],
  finish: ["polished"],
  tile: { widthMm: 600, heightMm: 1200, thicknessMm: 9, bodyType: "GVT", use: ["floor", "wall"], tilesPerBox: 2, coverageSqFtPerBox: 15.5, faces: 3 },
  description: [{ _type: "block", style: "normal", children: [{ text: "Deep green marble effect with fine light veining. Popular as an accent wall behind TVs and in pooja rooms." }] }],
  visualizerMaterialId: "vm-emerald",
});

product({
  name: "Portoro Black Gold Tile 800x1600",
  slug: "portoro-black-gold-800x1600",
  sku: "VMT-PBG-8016",
  brandId: "brand-varmora",
  brandName: "Varmora",
  materialType: "tile",
  applicationSlugs: ["living-room", "elevation"],
  pricing: { mode: "from", unit: "sq_ft", amount: 155, taxLabel: "inclusive" },
  availability: { status: "order_basis", verifiedAt: DAY(12) },
  images: [{ url: "/textures/granite-steel-grey-face-2.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["black", "gold"],
  look: ["marble"],
  finish: ["polished"],
  tile: { widthMm: 800, heightMm: 1600, thicknessMm: 9, bodyType: "GVT", use: ["wall"], tilesPerBox: 2, coverageSqFtPerBox: 27.55 },
  description: [{ _type: "block", style: "normal", children: [{ text: "Black base with metallic gold-toned veining — a luxury accent wall tile. Order basis: 10–12 days from confirmation." }] }],
});

product({
  name: "Onyx Ice Gloss Tile 600x1200",
  slug: "onyx-ice-gloss-600x1200",
  sku: "VMT-OIG-6012",
  brandId: "brand-varmora",
  brandName: "Varmora",
  materialType: "tile",
  applicationSlugs: ["bathroom", "living-room"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 72, boxAmount: 1116, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [{ url: "/textures/marble-emerald-face-2.png", kind: "texture", width: 1024, height: 512 }],
  colorFamily: ["white", "beige"],
  look: ["marble"],
  finish: ["gloss"],
  tile: { widthMm: 600, heightMm: 1200, thicknessMm: 9, bodyType: "GVT", use: ["wall", "floor"], tilesPerBox: 2, coverageSqFtPerBox: 15.5 },
});

// ---- House selection vitrified/ceramic ----
product({
  name: "Ivory Matt Vitrified Floor Tile 600x600",
  slug: "ivory-matt-vitrified-600x600",
  sku: "HSE-IVM-6060",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["bedroom", "kitchen", "living-room"],
  featured: true,
  pricing: { mode: "exact", unit: "sq_ft", amount: 42, boxAmount: 651, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [{ url: "/textures/vitrified-ivory-face-1.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["beige", "ivory"],
  look: ["solid"],
  finish: ["matt"],
  tile: { widthMm: 600, heightMm: 600, thicknessMm: 8, bodyType: "Vitrified", use: ["floor"], tilesPerBox: 4, coverageSqFtPerBox: 15.5 },
  description: [{ _type: "block", style: "normal", children: [{ text: "The workhorse floor tile of Indian homes: warm ivory tone, matt finish, easy to clean and kind to budgets. Also a common rental-property choice." }] }],
  relatedProductSlugs: ["concrete-grey-matt-600x600"],
  visualizerMaterialId: "vm-ivory",
});

product({
  name: "Concrete Grey Matt Tile 600x600",
  slug: "concrete-grey-matt-600x600",
  sku: "HSE-CGM-6060",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["living-room", "kitchen"],
  pricing: { mode: "range", unit: "sq_ft", min: 45, max: 55, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(16) },
  images: [{ url: "/textures/porcelain-concrete-face-1.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["grey"],
  look: ["concrete"],
  finish: ["matt"],
  tile: { widthMm: 600, heightMm: 600, thicknessMm: 8, bodyType: "Vitrified", use: ["floor"], tilesPerBox: 4, coverageSqFtPerBox: 15.5 },
  description: [{ _type: "block", style: "normal", children: [{ text: "Cement-look tile in a soft grey. Range pricing: the exact rate depends on the batch in stock — ask us for today's figure." }] }],
  visualizerMaterialId: "vm-concrete",
});

product({
  name: "Steel Grey Gloss Floor Tile 600x600",
  slug: "steel-grey-gloss-600x600",
  sku: "HSE-SGG-6060",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["kitchen", "outdoor"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 52, boxAmount: 806, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(15) },
  images: [{ url: "/textures/granite-steel-grey-face-1.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["grey", "black"],
  look: ["stone"],
  finish: ["gloss"],
  tile: { widthMm: 600, heightMm: 600, thicknessMm: 8, bodyType: "Vitrified", use: ["floor"], tilesPerBox: 4, coverageSqFtPerBox: 15.5 },
  visualizerMaterialId: "vm-steel-grey-tile",
});

product({
  name: "Desert Brown Rustic Tile 600x600",
  slug: "desert-brown-rustic-600x600",
  sku: "HSE-DBR-6060",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["outdoor", "kitchen"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 44, boxAmount: 682, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(15) },
  images: [{ url: "/textures/granite-desert-brown-face-1.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["brown"],
  look: ["stone"],
  finish: ["textured"],
  tile: { widthMm: 600, heightMm: 600, thicknessMm: 8, bodyType: "Vitrified", use: ["floor"], tilesPerBox: 4, coverageSqFtPerBox: 15.5 },
  visualizerMaterialId: "vm-desert-brown",
});

product({
  name: "Oak Wood-Look Strip Tile 300x900",
  slug: "oak-wood-look-300x900",
  sku: "HSE-OWL-3090",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["bedroom", "living-room"],
  featured: true,
  newArrival: true,
  pricing: { mode: "exact", unit: "sq_ft", amount: 89, boxAmount: 801, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [{ url: "/textures/wood-oak-face-1.png", kind: "texture", width: 340, height: 1024 }],
  colorFamily: ["brown", "beige"],
  look: ["wood"],
  finish: ["matt"],
  tile: { widthMm: 300, heightMm: 900, thicknessMm: 8, bodyType: "GVT", use: ["floor"], tilesPerBox: 3, coverageSqFtPerBox: 8.71 },
  description: [{ _type: "block", style: "normal", children: [{ text: "Wood-grain porcelain strip tile — the warmth of timber with tile maintenance. Lay in a running bond with a 2 mm joint." }] }],
  visualizerMaterialId: "vm-oak",
});

product({
  name: "Outdoor Anti-Skid Beige Tile 600x1200",
  slug: "outdoor-anti-skid-beige-600x1200",
  sku: "HSE-OAB-6012",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["outdoor", "elevation"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 58, boxAmount: 899, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(14) },
  images: [{ url: "/textures/outdoor-antiskid-face-1.png", kind: "texture", width: 1024, height: 512 }],
  colorFamily: ["beige", "brown"],
  look: ["stone"],
  finish: ["textured"],
  tile: { widthMm: 600, heightMm: 1200, thicknessMm: 9, bodyType: "GVT", use: ["floor"], tilesPerBox: 2, coverageSqFtPerBox: 15.5 },
  description: [
    { _type: "block", style: "normal", children: [{ text: "Textured-surface tile for terraces, balconies and parking areas. The embossed finish improves grip when wet." }] },
    { _type: "callout", variant: "warn", text: "We describe the surface finish honestly; we do not publish certified slip-rating values unless the manufacturer documents them for the batch." },
  ],
  visualizerMaterialId: "vm-outdoor",
});

product({
  name: "Kitchen Wall Gloss Grey Tile 300x600",
  slug: "kitchen-wall-gloss-grey-300x600",
  sku: "HSE-KWG-3060",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["kitchen", "bathroom"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 32, boxAmount: 158, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [{ url: "/textures/wall-gloss-grey-face-1.png", kind: "texture", width: 512, height: 1024 }],
  colorFamily: ["grey", "white"],
  look: ["solid"],
  finish: ["gloss"],
  tile: { widthMm: 300, heightMm: 600, thicknessMm: 7, bodyType: "Ceramic", use: ["wall"], tilesPerBox: 8, coverageSqFtPerBox: 15.5 },
  visualizerMaterialId: "vm-wall-grey",
});

product({
  name: "XL Slab Grey Polished 1200x2400",
  slug: "xl-slab-grey-polished-1200x2400",
  sku: "HSE-XLG-1224",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["living-room"],
  pricing: { mode: "from", unit: "sq_ft", amount: 165, taxLabel: "exclusive" },
  availability: { status: "order_basis", verifiedAt: DAY(12) },
  images: [{ url: "/textures/porcelain-concrete-face-2.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["grey"],
  look: ["concrete", "stone"],
  finish: ["polished"],
  tile: { widthMm: 1200, heightMm: 2400, thicknessMm: 11, bodyType: "Porcelain slab", use: ["floor", "wall"], tilesPerBox: 1, coverageSqFtPerBox: 31 },
  description: [{ _type: "block", style: "normal", children: [{ text: "Two-metre porcelain slab with near-invisible joints. Professional handling and adhesive system required — ask us about laying service." }] }],
  visualizerMaterialId: "vm-xl-slab",
});

product({
  name: "Terracotta Matt Tile 600x600",
  slug: "terracotta-matt-600x600",
  sku: "HSE-TCM-6060",
  brandId: "brand-house",
  brandName: "House Selection",
  materialType: "tile",
  applicationSlugs: ["outdoor", "kitchen"],
  pricing: { mode: "exact", unit: "sq_ft", amount: 38, boxAmount: 590, taxLabel: "inclusive" },
  availability: { status: "limited", publicNote: "Batch-dependent shade — inspect before purchase", verifiedAt: DAY(10) },
  images: [{ url: "/textures/granite-desert-brown-face-2.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["brown", "terracotta"],
  look: ["solid"],
  finish: ["matt"],
  tile: { widthMm: 600, heightMm: 600, thicknessMm: 8, bodyType: "Ceramic", use: ["floor"], tilesPerBox: 4, coverageSqFtPerBox: 15.5 },
});

// ---- Natural marble ----
function stoneProduct(def) {
  product({
    ...def,
    stone: {
      thicknessOptionsMm: def.stone?.thicknessOptionsMm ?? [16, 18, 20],
      slabSizeText: def.stone?.slabSizeText ?? "Cut-size slabs; typical 5×8 ft and up",
      ...def.stone,
    },
  });
}

stoneProduct({
  name: "Makrana White Marble",
  slug: "makrana-white-marble",
  sku: "NAT-MKW-SLAB",
  materialType: "marble",
  applicationSlugs: ["living-room", "bathroom"],
  featured: true,
  pricing: { mode: "range", unit: "sq_ft", min: 120, max: 220, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(16) },
  images: [{ url: "/textures/marble-bianco-face-2.png", kind: "texture", width: 1024, height: 512 }],
  colorFamily: ["white"],
  look: ["marble"],
  finish: ["polished", "honed"],
  stone: { origin: "Makrana, Rajasthan", variationNote: "Strong lot-to-lot variation in veining and base tone — select your actual slab in the showroom." },
  description: [{ _type: "block", style: "normal", children: [{ text: "The classic Indian white marble used in heritage buildings for centuries. Softer than vitrified tile and develops a living patina; needs periodic polishing." }] }],
});

stoneProduct({
  name: "Indian Statuario Marble",
  slug: "indian-statuario-marble",
  sku: "NAT-INS-SLAB",
  materialType: "marble",
  applicationSlugs: ["living-room"],
  pricing: { mode: "range", unit: "sq_ft", min: 250, max: 400, taxLabel: "exclusive" },
  availability: { status: "order_basis", verifiedAt: DAY(12) },
  images: [{ url: "/textures/marble-bianco-face-4.png", kind: "texture", width: 1024, height: 512 }],
  colorFamily: ["white", "grey"],
  look: ["marble"],
  finish: ["polished"],
  stone: { origin: "Rajasthan belt", variationNote: "Bookmatch pairs selected on request; veining direction matters for layout." },
});

stoneProduct({
  name: "Rainforest Brown Marble",
  slug: "rainforest-brown-marble",
  sku: "NAT-RFB-SLAB",
  materialType: "marble",
  applicationSlugs: ["bathroom", "elevation"],
  pricing: { mode: "range", unit: "sq_ft", min: 95, max: 150, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(12) },
  images: [{ url: "/textures/marble-emperador-face-3.png", kind: "texture", width: 1024, height: 512 }],
  colorFamily: ["brown"],
  look: ["marble"],
  finish: ["polished", "honed"],
  stone: { origin: "Bidasar, Rajasthan", variationNote: "Dramatic branch-like veining; every slab is distinct." },
});

stoneProduct({
  name: "Pink Onyx Marble",
  slug: "pink-onyx-marble",
  sku: "NAT-PKO-SLAB",
  materialType: "marble",
  applicationSlugs: ["living-room"],
  pricing: { mode: "quote", unit: "sq_ft" },
  availability: { status: "order_basis", verifiedAt: DAY(12) },
  images: [{ url: "/textures/marble-emperador-face-4.png", kind: "texture", width: 1024, height: 512 }],
  colorFamily: ["pink", "beige"],
  look: ["marble"],
  finish: ["polished"],
  stone: { origin: "Imported lots — ask for current stock", variationNote: "Price varies strongly by lot, translucency and size. Backlit panel work quoted separately." },
});

// ---- Natural granite ----
stoneProduct({
  name: "Black Galaxy Granite",
  slug: "black-galaxy-granite",
  sku: "NAT-BGG-SLAB",
  materialType: "granite",
  applicationSlugs: ["kitchen"],
  featured: true,
  pricing: { mode: "range", unit: "sq_ft", min: 140, max: 190, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(17) },
  images: [{ url: "/textures/granite-steel-grey-face-1.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["black"],
  look: ["stone"],
  finish: ["polished"],
  stone: { origin: "Ongole belt, Andhra Pradesh", variationNote: "Density of golden flecks varies by lot." },
});

stoneProduct({
  name: "Steel Grey Granite",
  slug: "steel-grey-granite",
  sku: "NAT-SGG-SLAB",
  materialType: "granite",
  applicationSlugs: ["kitchen", "outdoor"],
  pricing: { mode: "range", unit: "sq_ft", min: 85, max: 120, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(17) },
  images: [{ url: "/textures/granite-steel-grey-face-2.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["grey"],
  look: ["stone"],
  finish: ["polished", "flamed"],
  stone: { origin: "Andhra Pradesh", variationNote: "Flamed finish recommended for outdoor steps." },
});

stoneProduct({
  name: "Kashmir White Granite",
  slug: "kashmir-white-granite",
  sku: "NAT-KWG-SLAB",
  materialType: "granite",
  applicationSlugs: ["kitchen", "bathroom"],
  pricing: { mode: "range", unit: "sq_ft", min: 130, max: 180, taxLabel: "inclusive" },
  availability: { status: "limited", verifiedAt: DAY(13) },
  images: [{ url: "/textures/vitrified-ivory-face-2.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["white", "grey"],
  look: ["stone"],
  finish: ["polished"],
  stone: { origin: "Tamil Nadu", variationNote: "Occasional garnet spots; slab selection recommended." },
});

stoneProduct({
  name: "Tan Brown Granite",
  slug: "tan-brown-granite",
  sku: "NAT-TBR-SLAB",
  materialType: "granite",
  applicationSlugs: ["kitchen", "outdoor"],
  pricing: { mode: "range", unit: "sq_ft", min: 90, max: 130, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(13) },
  images: [{ url: "/textures/granite-desert-brown-face-1.png", kind: "texture", width: 1024, height: 1024 }],
  colorFamily: ["brown", "black"],
  look: ["stone"],
  finish: ["polished"],
  stone: { origin: "Rajasthan / Telangana belt" },
});

// ---- Adhesives & consumables ----
product({
  name: "High-Polymer Tile Adhesive (Grey) 20 kg",
  slug: "high-polymer-tile-adhesive-grey-20kg",
  sku: "ACC-ADH-20KG",
  materialType: "adhesive",
  applicationSlugs: [],
  pricing: { mode: "exact", unit: "piece", amount: 380, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [],
  colorFamily: ["grey"],
  look: [],
  finish: [],
  description: [{ _type: "block", style: "normal", children: [{ text: "C2-class polymer-modified adhesive suitable for large-format vitrified tiles up to 1200x2400 on prepared substrates. Coverage depends on notched trowel size." }] }],
});

product({
  name: "Stain-Proof Epoxy Grout (Kit)",
  slug: "epoxy-grout-kit",
  sku: "ACC-EPO-KIT",
  materialType: "adhesive",
  applicationSlugs: ["kitchen", "bathroom"],
  pricing: { mode: "exact", unit: "set", amount: 850, taxLabel: "inclusive" },
  availability: { status: "ready_stock", verifiedAt: DAY(18) },
  images: [],
  colorFamily: ["white", "grey"],
  look: [],
  finish: [],
  description: [{ _type: "block", style: "normal", children: [{ text: "Three-part epoxy grout kit for kitchens, bathrooms and outdoor joints. Resists staining and is the standard pairing with marble-look large formats." }] }],
});

write("products.json", products);

/* ------------------------------- projects ------------------------------- */
write("projects.json", [
  {
    id: "proj-001",
    title: "Showroom display — Bianco living-room floor set",
    slug: "showroom-bianco-living-floor",
    projectType: "commercial",
    locationLabel: "Our showroom, Mathura",
    summary:
      "A full-scale floor display in our showroom laid with the Bianco Carrara 600x1200 in running bond, so you can walk on the material before deciding. Sample display imagery — replace with real project photography once available.",
    images: [{ url: "/rooms/living-room.png", alt: "Living room floor display with marble-look tiles", kind: "installed", width: 1600, height: 1200, rightsStatus: "owned", source: "demo-generated" }],
    productSlugs: ["bianco-carrara-gloss-600x1200", "bianco-carrara-matt-600x1200"],
    clientPermissionConfirmed: true,
    featured: true,
  },
  {
    id: "proj-002",
    title: "Showroom display — bathroom wall & floor combination",
    slug: "showroom-bathroom-combination",
    projectType: "commercial",
    locationLabel: "Our showroom, Mathura",
    summary:
      "Demonstration bathroom combining an anti-skid style floor with a gloss wall tile, showing grout colour choices under warm lighting. Sample display imagery.",
    images: [{ url: "/rooms/bathroom.png", alt: "Bathroom display with wall and floor tiles", kind: "installed", width: 1600, height: 1200, rightsStatus: "owned", source: "demo-generated" }],
    productSlugs: ["kitchen-wall-gloss-grey-300x600", "outdoor-anti-skid-beige-600x1200"],
    clientPermissionConfirmed: true,
    featured: true,
  },
  {
    id: "proj-003",
    title: "Showroom display — kitchen floor & splashback pairing",
    slug: "showroom-kitchen-pairing",
    projectType: "commercial",
    locationLabel: "Our showroom, Mathura",
    summary:
      "Kitchen vignette pairing the concrete-grey floor tile with a simple gloss wall tile and granite counter suggestion. Sample display imagery.",
    images: [{ url: "/rooms/kitchen.png", alt: "Kitchen display with grey floor tiles", kind: "installed", width: 1600, height: 1200, rightsStatus: "owned", source: "demo-generated" }],
    productSlugs: ["concrete-grey-matt-600x600", "kitchen-wall-gloss-grey-300x600", "steel-grey-granite"],
    clientPermissionConfirmed: true,
    featured: false,
  },
]);

/* -------------------------------- guides -------------------------------- */
const guides = [
  {
    id: "guide-tile-size",
    title: "Tile size guide for Indian rooms",
    slug: "tile-size-guide-indian-rooms",
    excerpt: "Which tile size suits which room, what 2x2 and 2x4 actually mean, and where large formats pay off — and where they don't.",
    categorySlugs: ["tiles"],
    productSlugs: ["bianco-carrara-gloss-600x1200", "ivory-matt-vitrified-600x600", "xl-slab-grey-polished-1200x2400"],
    authorLabel: "Showroom editorial team",
    publishedAt: DAY(8),
    updatedAt: DAY(8),
    body: [
      { _type: "block", style: "normal", children: [{ text: "Indian tile shops use a shorthand that confuses everyone the first time. \"2x2\" means 2 feet by 2 feet — 600x600 mm. \"2x4\" is 600x1200 mm. Once you can translate, choosing a size becomes a design and budget question instead of a vocabulary test." }] },
      { _type: "block", style: "h2", children: [{ text: "What each size does best" }] },
      { _type: "table", head: ["Size", "Common name", "Best for", "Watch out for"], rows: [
        ["300x600 mm", "1x2 wall tile", "Bathroom and kitchen walls", "More joints; keep grout colour consistent"],
        ["600x600 mm", "2x2", "Bedrooms, budget floors", "Can look busy in very large rooms"],
        ["600x1200 mm", "2x4", "Living rooms, full-home floors", "Needs a flatter subfloor; plan door levels"],
        ["800x1600 mm", "4x8 quarter", "Premium living floors", "Two-person handling, higher wastage on small rooms"],
        ["1200x2400 mm", "XL slab", "Feature walls, seamless floors", "Professional laying and adhesive system required"],
      ] },
      { _type: "block", style: "h2", children: [{ text: "Practical rules we give customers every day" }] },
      { _type: "list", items: [
        { _type: "block", style: "normal", children: [{ text: "Bigger tiles = fewer joints = an airier room, but the subfloor must be flat or you will see lippage under raking light." }] },
        { _type: "block", style: "normal", children: [{ text: "In bathrooms, smaller floor tiles (or textured 600x600) handle slopes toward the drain better than one giant slab." }] },
        { _type: "block", style: "normal", children: [{ text: "Marble-look prints read better across a full tile, so large formats suit dramatic veining; small formats suit plain tones." }] },
        { _type: "block", style: "normal", children: [{ text: "Diagonal or herringbone layouts increase cutting wastage — plan 12–15% instead of the usual 8–10%." }] },
      ] },
      { _type: "block", style: "normal", children: [{ text: "Bring your room measurements to the showroom (or use our tile calculator) and we will show the same design in two or three sizes so the difference is obvious." }] },
    ],
  },
  {
    id: "guide-vitrified-vs-ceramic-vs-stone",
    title: "Vitrified vs ceramic vs natural stone",
    slug: "vitrified-vs-ceramic-vs-natural-stone",
    excerpt: "The honest differences that matter in an Indian home: water absorption, maintenance, feel underfoot and lifetime cost.",
    categorySlugs: ["tiles", "marble", "granite"],
    productSlugs: ["ivory-matt-vitrified-600x600", "makrana-white-marble", "black-galaxy-granite"],
    authorLabel: "Showroom editorial team",
    publishedAt: DAY(7),
    updatedAt: DAY(7),
    body: [
      { _type: "block", style: "normal", children: [{ text: "Customers ask this daily, and the honest answer is: none of the three is universally better — they fail differently. Here is the comparison we draw on the counter." }] },
      { _type: "table", head: ["", "Vitrified / porcelain tile", "Ceramic tile", "Natural marble", "Granite"], rows: [
        ["Water absorption", "Very low", "Higher — walls mainly", "Low but porous without sealing", "Very low"],
        ["Scratch behaviour", "Good", "Moderate", "Soft — will scratch and polish out", "Excellent"],
        ["Looks", "Consistent print", "Consistent", "Every slab unique", "Every slab unique"],
        ["Maintenance", "Mop and go", "Mop and go", "Periodic polishing/sealing", "Low; seal once"],
        ["Lifetime cost", "Low", "Lowest", "Highest", "Moderate"],
      ] },
      { _type: "block", style: "h2", children: [{ text: "How we frame the decision" }] },
      { _type: "list", items: [
        { _type: "block", style: "normal", children: [{ text: "Rental or budget build: vitrified 600x600 is the pragmatic answer." }] },
        { _type: "block", style: "normal", children: [{ text: "Forever home, willing to maintain: marble is a living material many families love for decades." }] },
        { _type: "block", style: "normal", children: [{ text: "Kitchens and stairs: granite or full-body vitrified; both shrug off decades of traffic." }] },
        { _type: "block", style: "normal", children: [{ text: "Want the marble look without the upkeep: printed marble-look vitrified at a fraction of the price." }] },
      ] },
      { _type: "callout", variant: "info", text: "Technical claims vary by specific product and batch. We publish manufacturer-documented figures only — ask to see the datasheet for anything we quote." },
    ],
  },
  {
    id: "guide-quantity-wastage",
    title: "How many boxes do I need? Quantity and wastage, explained",
    slug: "how-many-boxes-tile-quantity-wastage",
    excerpt: "A no-nonsense method to estimate tile boxes, why wastage is 8–12% for most rooms and more for diagonal layouts, plus our calculator.",
    categorySlugs: ["tiles"],
    productSlugs: ["bianco-carrara-gloss-600x1200"],
    authorLabel: "Showroom editorial team",
    publishedAt: DAY(6),
    updatedAt: DAY(6),
    body: [
      { _type: "block", style: "normal", children: [{ text: "Under-order and you risk a shade mismatch from a different batch; over-order and you waste money. The method below is what our counter staff actually use." }] },
      { _type: "block", style: "h2", children: [{ text: "The method" }] },
      { _type: "list", ordered: true, items: [
        { _type: "block", style: "normal", children: [{ text: "Measure each floor/wall as length × width; add the areas of every surface together." }] },
        { _type: "block", style: "normal", children: [{ text: "Add wastage: 8–10% for straight layouts in regular rooms, 12–15% for diagonal, herringbone, many doorways, or very small rooms." }] },
        { _type: "block", style: "normal", children: [{ text: "Divide by the box coverage (printed on every product page here) and round UP to whole boxes." }] },
        { _type: "block", style: "normal", children: [{ text: "Keep one spare box per home after laying — future repairs will not match a new batch." }] },
      ] },
      { _type: "block", style: "normal", children: [{ text: "Example: a 15 ft × 12 ft living room is 180 sq ft. At 10% wastage you need 198 sq ft. The Bianco Carrara 600x1200 covers 15.5 sq ft per box, so 198 / 15.5 = 12.8 → 13 boxes." }] },
      { _type: "callout", variant: "warn", text: "Odd-shaped rooms, patterns and site conditions change the numbers. Treat the calculator as a planning estimate and confirm the final order with your installer or with us." },
      { _type: "block", style: "normal", children: [{ text: "Our tile calculator does all of this for any product on the site, including the per-box figures for that exact tile." }] },
    ],
  },
];
write("guides.json", guides);

/* --------------------------------- faqs --------------------------------- */
write("faqs.json", [
  { id: "faq-1", question: "Are your prices per square foot or per box?", answer: "Both, where it makes sense. Tile prices are shown per square foot with the per-box figure alongside; slabs are per square foot; consumables per piece or set. All prices carry the date they were last verified.", scope: "site", sortOrder: 1 },
  { id: "faq-2", question: "Is the listed price what I will actually pay?", answer: "Tiles with an exact price are current showroom rates including GST. Materials with a range (many natural stones) vary by lot and thickness — we confirm the exact figure when you pick your slab.", scope: "site", sortOrder: 2 },
  { id: "faq-3", question: "What does 'Ready stock' mean?", answer: "It is in our godown today and you can take delivery or inspect it immediately. 'Limited' means the current batch is nearly gone, and 'Order basis' means we order it from the manufacturer, typically within 10–12 days.", scope: "site", sortOrder: 3 },
  { id: "faq-4", question: "Do you deliver? What is the delivery area?", answer: "We deliver around Mathura city and nearby towns through local transport — the exact charge depends on distance and quantity. Ask on WhatsApp with your location for a firm figure.", scope: "site", sortOrder: 4 },
  { id: "faq-5", question: "Can I get samples before deciding?", answer: "Yes — visit the showroom and take tile samples. For slabs we mark your chosen lot. There is no sample charge for standard tiles; for premium slabs we may ask for a refundable deposit.", scope: "site", sortOrder: 5 },
  { id: "faq-6", question: "Why does natural marble/stone look different from the photo?", answer: "Natural stone varies in shade, vein and pattern between lots — no photograph can guarantee the exact grain you receive. We show you the actual slab before cutting; that inspection is the guarantee.", scope: "site", sortOrder: 6 },
  { id: "faq-7", question: "Do you provide installation or a mason reference?", answer: "We can refer experienced local fixers for tiles and stone. Installation is coordinated directly between you and the fixing team; material estimates come from us.", scope: "site", sortOrder: 7 },
  { id: "faq-8", question: "How accurate is the tile calculator?", answer: "It is a planning tool using the box coverage printed for each product. Real wastage depends on room shape and laying pattern — confirm the final quantity with your installer before ordering.", scope: "site", sortOrder: 8 },
]);

/* ------------------------- testimonials & announcements ------------------ */
write("testimonials.json", []);
write("announcements.json", [
  {
    id: "ann-1",
    text: "DEMO announcement — configure a real offer/message in the CMS to show this bar.",
    isActive: false,
  },
]);

console.log(`Seed complete: ${products.length} products.`);
