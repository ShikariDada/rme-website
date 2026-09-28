import { describe, expect, it } from "vitest";
import {
  applyCatalogue,
  catalogueIndexPolicy,
  filtersToSearchParams,
  parseFilters,
  slugOf,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { normalizeQuery, sizeAliasesFor } from "@/lib/search/synonyms";
import type { Product } from "@/lib/types";

function p(slug: string, over: Partial<Product> = {}): Product {
  return {
    id: slug,
    name: slug,
    slug,
    sku: slug.toUpperCase(),
    materialType: "tile",
    categorySlugs: ["tiles"],
    applicationSlugs: [],
    status: "active",
    featured: false,
    newArrival: false,
    pricing: { mode: "exact", currency: "INR", unit: "sq_ft", amount: 50, updatedAt: "" },
    availability: { status: "ready_stock" },
    images: [],
    colorFamily: [],
    look: [],
    finish: [],
    ...over,
  } as Product;
}

const catalogue = [
  p("bianco-gloss", { name: "Bianco Gloss 600x1200", brandName: "Varmora", look: ["marble"], finish: ["gloss"], tile: { widthMm: 600, heightMm: 1200, use: ["floor", "wall"] }, pricing: { mode: "exact", currency: "INR", unit: "sq_ft", amount: 68, updatedAt: "" }, featured: true }),
  p("ivory-matt", { name: "Ivory Matt 600x600", brandName: "House", look: ["solid"], finish: ["matt"], tile: { widthMm: 600, heightMm: 600, use: ["floor"] }, pricing: { mode: "exact", currency: "INR", unit: "sq_ft", amount: 42, updatedAt: "" } }),
  p("marble-slab", { name: "Makrana Marble", materialType: "marble", categorySlugs: ["marble"], look: ["marble"], finish: ["polished"], pricing: { mode: "range", currency: "INR", unit: "sq_ft", min: 120, max: 220, updatedAt: "" } }),
  p("quote-slab", { name: "Onyx Slab", materialType: "marble", categorySlugs: ["marble"], pricing: { mode: "quote", currency: "INR", unit: "sq_ft", updatedAt: "" } }),
  p("hidden-item", { status: "hidden" }),
];

const empty: CatalogueFilterState = {
  brand: [], room: [], size: [], finish: [], look: [], color: [],
  use: [], availability: [], priceBand: [], page: 1, sort: "recommended",
};

describe("search synonyms", () => {
  it("maps 2x4 to 600x1200", () => {
    expect(normalizeQuery("2x4 tiles")).toBe("600x1200 tiles");
    expect(normalizeQuery("2x2")).toBe("600x600");
    expect(normalizeQuery("matt")).toBe("matt");
  });

  it("maps feet-shorthand for mm sizes", () => {
    expect(normalizeQuery("2x4")).toBe("600x1200");
    expect(normalizeQuery("4x8")).toBe("1200x2400");
  });

  it("sizeAliasesFor generates both orientations", () => {
    const aliases = sizeAliasesFor(600, 1200);
    expect(aliases).toContain("600x1200");
    expect(aliases).toContain("1200x600");
    expect(aliases).toContain("2x4");
  });
});

describe("catalogue filters", () => {
  it("parses multi-value search params", () => {
    const sp = new URLSearchParams("material=tile&finish=gloss&finish=matt&size=600x1200&sort=price-asc&page=2");
    const s = parseFilters(sp);
    expect(s.material).toBe("tile");
    expect(s.finish).toEqual(["gloss", "matt"]);
    expect(s.sort).toBe("price-asc");
    expect(s.page).toBe(2);
  });

  it("round-trips through search params", () => {
    const s = { ...empty, material: "tile", finish: ["gloss"], sort: "price-desc" as const };
    const sp = filtersToSearchParams(s);
    const back = parseFilters(sp);
    expect(back.material).toBe("tile");
    expect(back.finish).toEqual(["gloss"]);
    expect(back.sort).toBe("price-desc");
  });

  it("filters by material, finish, look and brand", () => {
    const s = { ...empty, material: "marble" };
    expect(applyCatalogue(catalogue, s).items.map((i) => i.slug)).toEqual(["marble-slab", "quote-slab"]);
    const s2 = { ...empty, finish: ["gloss"] };
    expect(applyCatalogue(catalogue, s2).items.map((i) => i.slug)).toEqual(["bianco-gloss"]);
    const s3 = { ...empty, look: ["marble"] };
    expect(applyCatalogue(catalogue, s3).items.map((i) => i.slug)).toEqual(["bianco-gloss", "marble-slab"]);
    const s4 = { ...empty, brand: [slugOf("Varmora")] };
    expect(applyCatalogue(catalogue, s4).items.map((i) => i.slug)).toEqual(["bianco-gloss"]);
  });

  it("hides non-active products", () => {
    expect(applyCatalogue(catalogue, empty).total).toBe(4);
  });

  it("size filter uses aliases (2x4 finds 600x1200)", () => {
    const s = { ...empty, size: ["2x4"] };
    expect(applyCatalogue(catalogue, s).items.map((i) => i.slug)).toEqual(["bianco-gloss"]);
  });

  it("price bands exclude quote-mode items", () => {
    const s = { ...empty, priceBand: ["under-50"] };
    const r = applyCatalogue(catalogue, s);
    expect(r.items.map((i) => i.slug)).toEqual(["ivory-matt"]);
  });

  it("sorts by price low-to-high with quote items last", () => {
    const s = { ...empty, sort: "price-asc" as const };
    const r = applyCatalogue(catalogue, s);
    const prices = r.items.map((i) => i.pricing.mode === "exact" ? i.pricing.amount ?? Infinity : i.pricing.mode === "range" ? i.pricing.min ?? Infinity : Infinity);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("paginates", () => {
    const many = Array.from({ length: 30 }, (_, i) => p(`tile-${i}`));
    const r = applyCatalogue(many, { ...empty, page: 3 });
    expect(r.total).toBe(30);
    expect(r.pageCount).toBe(3);
    expect(r.items).toHaveLength(6);
  });

  it("q search matches SKU and name", () => {
    const r = applyCatalogue(catalogue, { ...empty, q: "makrana" });
    expect(r.items.map((i) => i.slug)).toEqual(["marble-slab"]);
  });

  it("index policy: single facet indexable, multi-facet noindex", () => {
    expect(catalogueIndexPolicy(empty).index).toBe(true);
    expect(catalogueIndexPolicy({ ...empty, material: "tile" }).index).toBe(true);
    expect(catalogueIndexPolicy({ ...empty, material: "tile", finish: ["gloss"] }).index).toBe(false);
    expect(catalogueIndexPolicy({ ...empty, q: "x" }).index).toBe(false);
    expect(catalogueIndexPolicy({ ...empty, page: 2 }).index).toBe(false);
  });
});
