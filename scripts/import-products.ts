/**
 * Bulk product importer (website spec §13). Run with:
 *   npm run import:products -- [--dry-run] [--create-missing-taxonomies] [path/to/file.csv]
 *
 * - Validates EVERY row before any mutation; reports invalid rows with line numbers.
 * - Idempotent upsert by SKU.
 * - Blank price cells never create ₹0 — missing price data → pricing.mode "quote".
 * - Editorial fields (description/care) are only touched when columns are present.
 * - Requires NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 *   SANITY_API_WRITE_TOKEN. Without them the script exits with instructions.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

interface ImportContext {
  brandSlugs: Set<string>;
  categorySlugs: Set<string>;
  applicationSlugs: Set<string>;
  allowCreateMissing: boolean;
}

const PRICE_MODES = new Set(["exact", "from", "range", "quote"]);
const UNITS = new Set(["sq_ft", "box", "piece", "slab", "set"]);
const TAX_LABELS = new Set(["inclusive", "exclusive", "varies"]);
const AVAILABILITIES = new Set(["ready_stock", "limited", "order_basis", "unavailable"]);
const MATERIALS = new Set(["tile", "marble", "granite", "quartz", "sanitaryware", "adhesive", "other"]);

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

/** Pure row validation — unit tested. Returns a list of error strings. */
export function validateRow(row: Record<string, string>, ctx: ImportContext): string[] {
  const errors: string[] = [];
  const req = (key: string, label: string) => {
    if (!row[key] || row[key].trim().length === 0) errors.push(`${label} is required`);
  };
  req("sku", "sku");
  req("name", "name");
  req("slug", "slug");

  if (row.slug && !/^[a-z0-9-]+$/.test(row.slug)) {
    errors.push("slug must be lowercase kebab-case");
  }
  if (row.price_mode && !PRICE_MODES.has(row.price_mode)) {
    errors.push(`price_mode must be one of ${[...PRICE_MODES].join(", ")}`);
  }
  if (row.material_type && !MATERIALS.has(row.material_type)) {
    errors.push(`material_type must be one of ${[...MATERIALS].join(", ")}`);
  }
  if (row.price_unit && !UNITS.has(row.price_unit)) {
    errors.push(`price_unit must be one of ${[...UNITS].join(", ")}`);
  }
  if (row.tax_label && !TAX_LABELS.has(row.tax_label)) {
    errors.push(`tax_label must be one of ${[...TAX_LABELS].join(", ")}`);
  }
  if (row.availability && !AVAILABILITIES.has(row.availability)) {
    errors.push(`availability must be one of ${[...AVAILABILITIES].join(", ")}`);
  }

  const num = (v: string | undefined) => (v && v.trim() !== "" ? Number(v) : undefined);
  const width = num(row.size_width_mm);
  const height = num(row.size_height_mm);
  if ((width !== undefined && width <= 0) || (height !== undefined && height <= 0)) {
    errors.push("tile dimensions must be positive");
  }
  if (width !== undefined && height === undefined) errors.push("size_height_mm missing (both required together)");
  if (height !== undefined && width === undefined) errors.push("size_width_mm missing (both required together)");

  // Price coherence — blank price cells fall back to quote mode (never ₹0).
  const mode = row.price_mode || "quote";
  const amount = num(row.price_amount);
  const min = num(row.price_min);
  const max = num(row.price_max);
  if (mode === "exact" && (amount === undefined || amount <= 0)) {
    errors.push("price_mode exact requires a positive price_amount");
  }
  if (mode === "from" && (amount === undefined || amount <= 0)) {
    errors.push("price_mode from requires a positive price_amount");
  }
  if (mode === "range") {
    if (min === undefined || min <= 0) errors.push("price_mode range requires a positive price_min");
    if (max === undefined || max < (min ?? 0)) errors.push("price_max must be ≥ price_min");
  }

  const coverage = num(row.coverage_sqft_per_box);
  const tilesPerBox = num(row.tiles_per_box);
  if (tilesPerBox !== undefined && (coverage === undefined || coverage <= 0)) {
    errors.push("coverage_sqft_per_box (positive) is required when tiles_per_box is set");
  }

  const tax = (key: string) => key;
  void tax;

  const brandRef = row.brand ? (ctx.brandSlugs.has(row.brand) ? "ok" : ctx.allowCreateMissing ? "create" : "missing") : "none";
  if (brandRef === "missing") errors.push(`unknown brand slug: ${row.brand}`);
  if (row.category) {
    for (const c of row.category.split(";").map((x) => x.trim()).filter(Boolean)) {
      if (!ctx.categorySlugs.has(c) && !ctx.allowCreateMissing) errors.push(`unknown category slug: ${c}`);
    }
  }
  if (row.applications) {
    for (const a of row.applications.split(";").map((x) => x.trim()).filter(Boolean)) {
      if (!ctx.applicationSlugs.has(a) && !ctx.allowCreateMissing) errors.push(`unknown application slug: ${a}`);
    }
  }
  return errors;
}

function slugifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface SanityDoc {
  _type: string;
  _id: string;
  [key: string]: unknown;
}

export function rowToSanityDocs(
  row: Record<string, string>,
  ctx: ImportContext
): { product: SanityDoc; missingTaxonomies: { type: string; slug: string; name: string }[] } {
  const missingTaxonomies: { type: string; slug: string; name: string }[] = [];
  const num = (v: string | undefined) => (v && v.trim() !== "" ? Number(v) : undefined);

  const mode = row.price_mode || "quote";
  const pricing: Record<string, unknown> = {
    _type: "object",
    mode,
    currency: "INR",
    unit: row.price_unit || "sq_ft",
    updatedAt: row.price_updated_at || new Date().toISOString(),
  };
  if (mode === "exact" || mode === "from") pricing.amount = num(row.price_amount);
  if (mode === "range") {
    pricing.min = num(row.price_min);
    pricing.max = num(row.price_max);
  }
  if (row.tax_label) pricing.taxLabel = row.tax_label;

  const brandSlug = row.brand ? slugifyName(row.brand) : undefined;
  if (brandSlug && !ctx.brandSlugs.has(brandSlug)) {
    missingTaxonomies.push({ type: "brand", slug: brandSlug, name: row.brand });
  }
  const categorySlugs = (row.category ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  for (const c of categorySlugs) {
    if (!ctx.categorySlugs.has(c)) missingTaxonomies.push({ type: "category", slug: c, name: c });
  }
  const appSlugs = (row.applications ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  for (const a of appSlugs) {
    if (!ctx.applicationSlugs.has(a)) missingTaxonomies.push({ type: "application", slug: a, name: a });
  }

  const product: SanityDoc = {
    _type: "product",
    _id: `import-${row.sku}`,
    name: row.name,
    slug: { _type: "slug", current: row.slug },
    sku: row.sku,
    status: "active",
    featured: false,
    newArrival: false,
    materialType: row.material_type || "tile",
    pricing,
    availability: {
      _type: "object",
      status: row.availability || "order_basis",
      ...(row.stock_verified_at ? { verifiedAt: row.stock_verified_at } : {}),
    },
    images: [] as unknown[],
    colorFamily: row.color ? row.color.split(";").map((s) => s.trim()).filter(Boolean) : [],
    look: row.look ? row.look.split(";").map((s) => s.trim()).filter(Boolean) : [],
    finish: row.finish ? row.finish.split(";").map((s) => s.trim()).filter(Boolean) : [],
  };

  if (brandSlug) product.brand = { _type: "reference", _ref: `brand-${brandSlug}` };
  if (categorySlugs.length > 0) {
    product.categories = categorySlugs.map((c) => ({ _type: "reference", _ref: `category-${c}` }));
  }
  if (appSlugs.length > 0) {
    product.applications = appSlugs.map((a) => ({ _type: "reference", _ref: `application-${a}` }));
  }
  if (row.size_width_mm && row.size_height_mm) {
    product.tile = {
      _type: "object",
      widthMm: Number(row.size_width_mm),
      heightMm: Number(row.size_height_mm),
      ...(row.thickness_mm ? { thicknessMm: Number(row.thickness_mm) } : {}),
      ...(row.body_type ? { bodyType: row.body_type } : {}),
      use: ["floor"],
      ...(num(row.tiles_per_box) !== undefined ? { tilesPerBox: num(row.tiles_per_box) } : {}),
      ...(num(row.coverage_sqft_per_box) !== undefined
        ? { coverageSqFtPerBox: num(row.coverage_sqft_per_box) }
        : {}),
    };
  }
  if (row.manufacturer_url) product.manufacturerProductUrl = row.manufacturer_url;
  if (row.image_1) {
    product.images = [
      {
        _type: "object",
        _key: "img1",
        alt: row.name,
        kind: "product",
        rightsStatus: "unknown", // uploader must set explicitly after asset upload
        asset: { _type: "reference", _ref: row.image_1 },
      },
    ];
  }

  return { product, missingTaxonomies };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const allowCreate = args.includes("--create-missing-taxonomies");
  const fileArg = args.find((a) => !a.startsWith("--")) ?? "content/PRODUCT_TEMPLATE.csv";
  const csvPath = resolve(process.cwd(), fileArg);

  if (!existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }
  const { headers, rows } = parseCsv(readFileSync(csvPath, "utf8"));
  const required = ["sku", "name", "slug"];
  const missingHeaders = required.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    console.error(`CSV is missing required headers: ${missingHeaders.join(", ")}`);
    process.exit(1);
  }

  if (!dryRun) {
    if (
      !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
      !process.env.SANITY_API_WRITE_TOKEN
    ) {
      console.error(
        "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN, or use --dry-run."
      );
      process.exit(1);
    }
  }

  // In dry-run mode taxonomy slugs are unknown → accept everything except
  // when --create-missing-taxonomies is absent, in which case we still want a
  // meaningful local check. For real runs, fetch the slugs from Sanity.
  const ctx: ImportContext = {
    brandSlugs: new Set(),
    categorySlugs: new Set(["tiles", "marble", "granite"]),
    applicationSlugs: new Set([
      "bathroom", "kitchen", "living-room", "bedroom", "outdoor", "elevation",
    ]),
    allowCreateMissing: allowCreate || dryRun,
  };

  if (!dryRun) {
    try {
      const { createClient } = await import("@sanity/client");
      const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-01-01",
        token: process.env.SANITY_API_WRITE_TOKEN,
        useCdn: false,
      });
      const brands: { slug: { current: string } }[] = await client.fetch(`*[_type == "brand"]{slug}`);
      brands.forEach((b) => ctx.brandSlugs.add(b.slug.current));
    } catch (err) {
      console.error("Could not fetch taxonomies from Sanity:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  let valid = 0;
  const invalid: { line: number; errors: string[] }[] = [];
  const documents: SanityDoc[] = [];
  const missingTaxonomies: { type: string; slug: string; name: string }[] = [];

  rows.forEach((row, idx) => {
    const line = idx + 2; // +1 header, +1 one-based
    const errors = validateRow(row, ctx);
    if (errors.length > 0) {
      invalid.push({ line, errors });
      return;
    }
    valid += 1;
    const { product, missingTaxonomies: missing } = rowToSanityDocs(row, ctx);
    documents.push(product);
    missingTaxonomies.push(...missing);
  });

  console.log(`Rows: ${rows.length} | valid: ${valid} | invalid: ${invalid.length}`);
  for (const bad of invalid) {
    console.error(`  line ${bad.line}: ${bad.errors.join("; ")}`);
  }
  const uniqueMissing = new Map(missingTaxonomies.map((m) => [`${m.type}:${m.slug}`, m]));
  for (const m of uniqueMissing.values()) {
    console.warn(`  missing ${m.type}: ${m.slug} ${allowCreate ? "(will be created)" : ""}`);
  }

  if (dryRun) {
    console.log("Dry run — no changes written.");
    process.exit(invalid.length > 0 ? 1 : 0);
  }
  if (invalid.length > 0) {
    console.error("Fix invalid rows before importing.");
    process.exit(1);
  }
  if (uniqueMissing.size > 0 && !allowCreate) {
    console.error("Missing taxonomies — rerun with --create-missing-taxonomies (development only) or create them first.");
    process.exit(1);
  }

  const { createClient } = await import("@sanity/client");
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-01-01",
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
  });

  let created = 0;
  let updated = 0;
  const tx = client.transaction();
  for (const doc of documents) {
    const existing: { _id: string } | null = await client.fetch(
      `*[_type == "product" && sku == $sku][0]{_id}`,
      { sku: (doc.sku as string) ?? "" }
    );
    if (existing) {
      updated += 1;
      tx.patch(existing._id, { set: doc });
    } else {
      created += 1;
      tx.create(doc);
    }
  }
  if (allowCreate) {
    for (const m of uniqueMissing.values()) {
      tx.create({
        _type: m.type,
        _id: `${m.type}-${m.slug}`,
        name: m.name,
        slug: { _type: "slug", current: m.slug },
      });
    }
  }
  await tx.commit();
  console.log(`Import complete: ${created} created, ${updated} updated.`);
  console.log("Remember: set image rightsStatus and alt text in the Studio before publishing.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
