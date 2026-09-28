import type { Product } from "@/lib/types";
import { normalizeQuery, scoreMatch, sizeAliasesFor } from "@/lib/search/synonyms";

/**
 * URL-driven catalogue filters (spec §10). State lives entirely in the URL so
 * filtered views are shareable; the server renders results from searchParams.
 */

export type SortKey = "recommended" | "price-asc" | "price-desc" | "newest";

export interface CatalogueFilterState {
  q?: string;
  material?: string;
  brand: string[];
  room: string[];
  size: string[];
  finish: string[];
  look: string[];
  color: string[];
  use: string[];
  availability: string[];
  priceBand: string[];
  page: number;
  sort: SortKey;
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
];

export const PRICE_BANDS: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "under-50", label: "Under ₹50 / sq ft", max: 50 },
  { value: "50-100", label: "₹50–₹100 / sq ft", min: 50, max: 100 },
  { value: "100-150", label: "₹100–₹150 / sq ft", min: 100, max: 150 },
  { value: "150-plus", label: "₹150+ / sq ft", min: 150 },
];

const MULTI_KEYS = [
  "brand",
  "room",
  "size",
  "finish",
  "look",
  "color",
  "use",
  "availability",
  "priceBand",
] as const;

type MultiKey = (typeof MULTI_KEYS)[number];

export function parseFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): CatalogueFilterState {
  const get = (key: string): string[] => {
    const v = sp instanceof URLSearchParams ? sp.getAll(key) : sp[key];
    if (!v) return [];
    const list = Array.isArray(v) ? v : [v];
    return list.flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);
  };
  const one = (key: string): string | undefined => get(key)[0];
  const q = one("q");
  const sortRaw = one("sort") as SortKey | undefined;
  const pageRaw = parseInt(one("page") ?? "1", 10);
  return {
    q: q || undefined,
    material: one("material"),
    brand: get("brand"),
    room: get("room"),
    size: get("size"),
    finish: get("finish"),
    look: get("look"),
    color: get("color"),
    use: get("use"),
    availability: get("availability"),
    priceBand: get("priceBand"),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 200) : 1,
    sort:
      sortRaw && SORT_OPTIONS.some((o) => o.value === sortRaw)
        ? sortRaw
        : "recommended",
  };
}

/** Serialize state back to a query string (empty values skipped, stable order). */
export function filtersToSearchParams(state: CatalogueFilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.q) sp.set("q", state.q);
  if (state.material) sp.set("material", state.material);
  for (const key of MULTI_KEYS) {
    for (const v of state[key]) sp.append(key, v);
  }
  if (state.sort !== "recommended") sp.set("sort", state.sort);
  if (state.page > 1) sp.set("page", String(state.page));
  return sp;
}

/** Number of active filter values (excluding q/sort/page). */
export function countActiveFilters(state: CatalogueFilterState): number {
  return MULTI_KEYS.reduce((n, key) => n + state[key].length, 0) + (state.material ? 1 : 0);
}

function priceForSort(p: Product): number | null {
  const pr = p.pricing;
  switch (pr.mode) {
    case "exact":
      return pr.amount ?? null;
    case "from":
      return pr.amount ?? null;
    case "range":
      return pr.min ?? null;
    default:
      return null;
  }
}

function matchesPriceBand(p: Product, bandValue: string): boolean {
  const band = PRICE_BANDS.find((b) => b.value === bandValue);
  if (!band) return true;
  const price = priceForSort(p);
  if (price === null) return false; // quote-mode items have no band
  if (band.min !== undefined && price < band.min) return false;
  if (band.max !== undefined && price >= band.max) return false;
  return true;
}

export function matchesFilters(p: Product, state: CatalogueFilterState): boolean {
  if (state.material && p.materialType !== state.material) return false;
  if (state.brand.length && (!p.brandName || !state.brand.includes(slugOf(p.brandName)))) return false;
  if (state.room.length && !state.room.some((r) => p.applicationSlugs.includes(r))) return false;
  if (state.size.length) {
    const aliases = p.tile ? sizeAliasesFor(p.tile.widthMm, p.tile.heightMm) : [];
    const norm = state.size.map((s) => normalizeQuery(s));
    if (!norm.some((n) => aliases.some((a) => normalizeQuery(a) === n))) return false;
  }
  if (state.finish.length && !state.finish.some((f) => p.finish.includes(f))) return false;
  if (state.look.length && !state.look.some((l) => p.look.includes(l))) return false;
  if (state.color.length && !state.color.some((c) => p.colorFamily.includes(c))) return false;
  if (state.use.length) {
    const use = p.tile?.use ?? [];
    const ok = state.use.some((u) =>
      u === "both" ? use.includes("floor") && use.includes("wall") : use.includes(u as "floor" | "wall")
    );
    if (!ok) return false;
  }
  if (state.availability.length && !state.availability.includes(p.availability.status)) return false;
  if (state.priceBand.length && !state.priceBand.some((b) => matchesPriceBand(p, b))) return false;
  return true;
}

export function slugOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface CatalogueResults {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
}

export const PAGE_SIZE = 12;

export function applyCatalogue(
  products: Product[],
  state: CatalogueFilterState
): CatalogueResults {
  let items = products.filter((p) => p.status === "active");
  if (state.q) {
    const nq = normalizeQuery(state.q);
    const scored = items
      .map((p) => ({
        p,
        score: scoreMatch(nq, {
          name: p.name,
          sku: p.sku,
          brandName: p.brandName,
          materialType: p.materialType,
          sizeAliases: p.tile ? sizeAliasesFor(p.tile.widthMm, p.tile.heightMm) : [],
          keywords: [...p.finish, ...p.look, ...p.colorFamily, ...(p.stone?.origin ? [p.stone.origin] : [])],
        }),
      }))
      .filter((x) => x.score > 0);
    items = scored.sort((a, b) => b.score - a.score).map((x) => x.p);
  }
  items = items.filter((p) => matchesFilters(p, state));

  if (!state.q) {
    switch (state.sort) {
      case "price-asc":
        items = [...items].sort((a, b) => (priceForSort(a) ?? Infinity) - (priceForSort(b) ?? Infinity));
        break;
      case "price-desc":
        items = [...items].sort((a, b) => (priceForSort(b) ?? -Infinity) - (priceForSort(a) ?? -Infinity));
        break;
      case "newest":
        items = [...items].sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
        break;
      case "recommended":
        items = [...items].sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
    }
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(state.page, pageCount);
  const start = (page - 1) * PAGE_SIZE;
  return { items: items.slice(start, start + PAGE_SIZE), total, page, pageCount };
}

/**
 * Canonical / indexing policy (spec §10.1 + §22.1): the unfiltered catalogue,
 * single-material views and single-facet views are indexable; anything richer
 * or a query search should be noindexed/canonicalized away.
 */
export function catalogueIndexPolicy(state: CatalogueFilterState): {
  index: boolean;
  reason: string;
} {
  const facetCount =
    countActiveFilters(state) +
    (state.q ? 1 : 0) +
    (state.sort !== "recommended" ? 1 : 0) +
    (state.page > 1 ? 1 : 0);
  if (facetCount === 0) return { index: true, reason: "clean" };
  if (facetCount === 1 && !state.q && state.page <= 1 && state.sort === "recommended") {
    return { index: true, reason: "single-facet" };
  }
  return { index: false, reason: "multi-facet-or-search" };
}
