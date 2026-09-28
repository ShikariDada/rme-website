/**
 * Content QA audit (website spec §12.5 validation). Run: npm run audit:content
 * Reads content/seed/*.json (structure identical to Sanity documents).
 * Exit code 1 when ERRORS found; --strict treats warnings as errors too.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

interface Warnings {
  errors: string[];
  warnings: string[];
}

const ROOT = resolve(process.cwd());
const SEED = join(ROOT, "content", "seed");
const PUBLIC = join(ROOT, "public");
const STALE_DAYS = 30;

function load<T>(name: string): T {
  return JSON.parse(readFileSync(join(SEED, name), "utf8")) as T;
}

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / 86_400_000;
}

function textureFileExists(url: string | undefined): boolean {
  if (!url || !url.startsWith("/")) return false;
  const p = join(PUBLIC, url);
  try {
    return existsSync(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}

function auditProducts(products: { [k: string]: unknown }[]): Warnings {
  const w: Warnings = { errors: [], warnings: [] };
  const skus = new Map<string, number>();
  const slugs = new Map<string, number>();
  const allSlugs = new Set(products.map((p) => String(p.slug)));

  products.forEach((p, i) => {
    const id = String(p.sku ?? p.slug ?? `#${i}`);
    skus.set(String(p.sku), (skus.get(String(p.sku)) ?? 0) + 1);
    slugs.set(String(p.slug), (slugs.get(String(p.slug)) ?? 0) + 1);

    const pricing = (p.pricing ?? {}) as Record<string, unknown>;
    const mode = String(pricing.mode ?? "quote");
    const age = daysSince(pricing.updatedAt as string | undefined);
    if (age !== null && age > STALE_DAYS) {
      w.warnings.push(`product ${id}: price not verified for ${Math.round(age)} days`);
    }
    const amount = Number(pricing.amount ?? 0);
    if (mode === "exact" && !(amount > 0)) {
      w.errors.push(`product ${id}: mode "exact" needs amount > 0`);
    }
    if (mode === "from" && !(amount > 0)) {
      w.errors.push(`product ${id}: mode "from" needs amount > 0`);
    }
    if (mode === "range") {
      const min = Number(pricing.min ?? 0);
      const max = Number(pricing.max ?? 0);
      if (!(min > 0)) w.errors.push(`product ${id}: mode "range" needs min > 0`);
      if (!(max >= min && max > 0)) w.errors.push(`product ${id}: mode "range" needs max ≥ min`);
    }

    const availability = (p.availability ?? {}) as Record<string, unknown>;
    if (!availability.verifiedAt) {
      w.warnings.push(`product ${id}: stock state never verified`);
    }

    const images = (p.images ?? []) as { alt?: string; rightsStatus?: string; url?: string }[];
    images.forEach((img, j) => {
      if (!img.alt || img.alt.trim() === "") {
        w.errors.push(`product ${id}: image ${j} has empty alt text`);
      }
      if (img.rightsStatus === "unknown") {
        w.errors.push(`product ${id}: image ${j} rightsStatus is "unknown" — resolve before publish`);
      }
    });

    if (p.materialType === "tile") {
      const tile = p.tile as Record<string, unknown> | undefined;
      const wMm = Number(tile?.widthMm ?? 0);
      const hMm = Number(tile?.heightMm ?? 0);
      if (!(wMm > 0) || !(hMm > 0)) {
        w.warnings.push(`product ${id}: tile missing physical dimensions`);
      }
    }

    if (p.visualizerMaterialId) {
      const tile = p.tile as Record<string, unknown> | undefined;
      const okDims = Number(tile?.widthMm ?? 0) > 0 && Number(tile?.heightMm ?? 0) > 0;
      if (!okDims) {
        w.errors.push(`product ${id}: visualizerMaterialId set but physical size unknown`);
      }
      const firstImg = images[0]?.url;
      if (!textureFileExists(firstImg)) {
        w.warnings.push(`product ${id}: visualizer texture file missing on disk: ${firstImg ?? "(none)"}`);
      }
    }

    for (const rel of (p.relatedProductSlugs ?? []) as string[]) {
      if (!allSlugs.has(rel)) {
        w.warnings.push(`product ${id}: relatedProductSlug "${rel}" does not exist`);
      }
    }
  });

  for (const [sku, n] of skus) if (n > 1) w.errors.push(`duplicate SKU: ${sku} (×${n})`);
  for (const [slug, n] of slugs) if (n > 1) w.errors.push(`duplicate slug: ${slug} (×${n})`);
  return w;
}

function auditGuides(guides: { [k: string]: unknown }[]): Warnings {
  const w: Warnings = { errors: [], warnings: [] };
  for (const g of guides) {
    if (!g.updatedAt) w.errors.push(`guide ${String(g.slug)}: missing updatedAt`);
    if (!g.excerpt || String(g.excerpt).trim() === "") {
      w.warnings.push(`guide ${String(g.slug)}: missing excerpt`);
    }
    const body = g.body as unknown[] | undefined;
    if (!body || body.length === 0) w.errors.push(`guide ${String(g.slug)}: empty body`);
  }
  return w;
}

function auditFaqs(faqs: { [k: string]: unknown }[]): Warnings {
  const w: Warnings = { errors: [], warnings: [] };
  for (const f of faqs) {
    if (!f.answer || String(f.answer).trim() === "") {
      w.errors.push(`faq ${String(f.id ?? f.question)}: empty answer`);
    }
  }
  return w;
}

function auditBrands(brands: { [k: string]: unknown }[]): Warnings {
  const w: Warnings = { errors: [], warnings: [] };
  for (const b of brands) {
    if (b.isAuthorizedDealerClaimAllowed === true && b.assetUsageApproved !== true) {
      w.errors.push(
        `brand ${String(b.slug)}: authorised-dealer claim enabled without assetUsageApproved — obtain written confirmation first`
      );
    }
  }
  return w;
}

function main() {
  const strict = process.argv.includes("--strict");
  const errors: string[] = [];
  const warnings: string[] = [];

  const products = load<{ [k: string]: unknown }[]>("products.json");
  const productAudit = auditProducts(products);
  errors.push(...productAudit.errors);
  warnings.push(...productAudit.warnings);

  const guideAudit = auditGuides(load<{ [k: string]: unknown }[]>("guides.json"));
  errors.push(...guideAudit.errors);
  warnings.push(...guideAudit.warnings);

  const faqAudit = auditFaqs(load<{ [k: string]: unknown }[]>("faqs.json"));
  errors.push(...faqAudit.errors);
  warnings.push(...faqAudit.warnings);

  const brandAudit = auditBrands(load<{ [k: string]: unknown }[]>("brands.json"));
  errors.push(...brandAudit.errors);
  warnings.push(...brandAudit.warnings);

  console.log(`Content audit: ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const e of errors) console.error("  ERROR  ", e);
  for (const w of warnings) console.warn("  WARNING", w);

  const fail = errors.length > 0 || (strict && warnings.length > 0);
  process.exit(fail ? 1 : 0);
}

main();
