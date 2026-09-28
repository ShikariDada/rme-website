import type { Metadata } from "next";
import { Container } from "@/components/ui/Primitives";
import { Input } from "@/components/ui/Input";
import { ProductGrid, EmptyResults } from "@/components/catalogue/ProductCard";
import { FilterSheet, ZeroResultsTracker } from "@/components/catalogue/FilterSheet";
import { ActiveFilterChips, type ActiveFilterChip } from "@/components/catalogue/ActiveFilterChips";
import { SortSelect } from "@/components/catalogue/SortSelect";
import { Pagination } from "@/components/catalogue/Pagination";
import type { FilterGroupDef } from "@/components/catalogue/FilterGroup";
import {
  applyCatalogue,
  catalogueIndexPolicy,
  filtersToSearchParams,
  parseFilters,
  PRICE_BANDS,
  slugOf,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { contentSource } from "@/lib/data";
import { availabilityLabel } from "@/lib/pricing/format";
import { normalizeQuery, sizeAliasesFor } from "@/lib/search/synonyms";
import { pageMetadata } from "@/lib/seo/metadata";
import type {
  Application,
  Brand,
  FilterOption,
  MaterialType,
  Product,
} from "@/lib/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const MATERIAL_LABELS: Record<MaterialType, string> = {
  tile: "Tiles",
  marble: "Marble",
  granite: "Granite",
  quartz: "Quartz",
  sanitaryware: "Sanitaryware",
  adhesive: "Adhesives & care",
  other: "Products",
};

function materialLabel(material?: string): string {
  if (!material) return "All products";
  return MATERIAL_LABELS[material as MaterialType] ?? "Products";
}

function materialDescription(material?: string): string {
  const label = material ? materialLabel(material).toLowerCase() : null;
  return label
    ? `Browse ${label} by size, finish, colour and price band. Transparent per-sq-ft pricing and honest stock status, verified regularly.`
    : "Browse tiles, marble and granite by size, finish, colour and price band. Transparent pricing and honest stock status, verified regularly.";
}

function toURLSearchParams(raw: RawSearchParams): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      for (const v of value) sp.append(key, v);
    } else if (typeof value === "string") {
      sp.append(key, value);
    }
  }
  return sp;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const state = parseFilters(toURLSearchParams(raw));
  const policy = catalogueIndexPolicy(state);
  return pageMetadata({
    title: `${materialLabel(state.material)} — sizes, finishes & prices`,
    description: materialDescription(state.material),
    path: "/products",
    noindex: Boolean(state.q) || !policy.index,
  });
}

const SIZE_FACETS = ["600x600", "600x1200", "800x1600", "900x1800", "1200x2400"];
const AVAILABILITY_ORDER: Product["availability"]["status"][] = [
  "ready_stock",
  "limited",
  "order_basis",
  "unavailable",
];

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function priceForBand(p: Product): number | null {
  switch (p.pricing.mode) {
    case "exact":
    case "from":
      return typeof p.pricing.amount === "number" ? p.pricing.amount : null;
    case "range":
      return typeof p.pricing.min === "number" ? p.pricing.min : null;
    default:
      return null;
  }
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Facet counts are scanned over the unfiltered active list so the sheet always
 * shows the full catalogue composition, matching the URL filter semantics.
 */
function buildFacetGroups(
  products: Product[],
  applications: Application[],
  brands: Brand[]
): FilterGroupDef[] {
  const active = products.filter((p) => p.status === "active");
  const brandCounts = new Map<string, number>();
  const brandNames = new Map<string, string>();
  const roomCounts = new Map<string, number>();
  const finishCounts = new Map<string, number>();
  const lookCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const availabilityCounts = new Map<string, number>();
  const bandCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();
  const sizeNorm = SIZE_FACETS.map((s) => normalizeQuery(s));

  for (const p of active) {
    if (p.brandName) {
      const slug = slugOf(p.brandName);
      bump(brandCounts, slug);
      if (!brandNames.has(slug)) brandNames.set(slug, p.brandName);
    }
    for (const room of p.applicationSlugs) bump(roomCounts, room);
    if (p.tile) {
      const aliases = sizeAliasesFor(p.tile.widthMm, p.tile.heightMm).map(normalizeQuery);
      sizeNorm.forEach((norm, i) => {
        if (aliases.includes(norm)) bump(sizeCounts, SIZE_FACETS[i]);
      });
    }
    for (const f of p.finish) bump(finishCounts, f);
    for (const l of p.look) bump(lookCounts, l);
    for (const c of p.colorFamily) bump(colorCounts, c);
    bump(availabilityCounts, p.availability.status);
    const price = priceForBand(p);
    if (price !== null) {
      for (const band of PRICE_BANDS) {
        if (
          (band.min === undefined || price >= band.min) &&
          (band.max === undefined || price < band.max)
        ) {
          bump(bandCounts, band.value);
        }
      }
    }
  }

  const byCount = (counts: Map<string, number>, label: (v: string) => string): FilterOption[] =>
    [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, label: label(value), count }));

  return [
    {
      key: "brand",
      title: "Brand",
      options: [...brandCounts.entries()]
        .sort((a, b) => (brandNames.get(a[0]) ?? a[0]).localeCompare(brandNames.get(b[0]) ?? b[0]))
        .map(([slug, count]) => ({ value: slug, label: brandNames.get(slug) ?? slug, count })),
    },
    {
      key: "room",
      title: "Room",
      options: applications
        .filter((a) => (roomCounts.get(a.slug) ?? 0) > 0)
        .map((a) => ({ value: a.slug, label: a.name, count: roomCounts.get(a.slug) ?? 0 })),
    },
    {
      key: "size",
      title: "Size",
      options: SIZE_FACETS.map((s) => ({
        value: s,
        label: `${s.slice(0, 3)} × ${s.slice(4)} mm`,
        count: sizeCounts.get(s) ?? 0,
      })),
    },
    { key: "finish", title: "Finish", options: byCount(finishCounts, titleCase) },
    { key: "look", title: "Look", options: byCount(lookCounts, titleCase) },
    { key: "color", title: "Colour", options: byCount(colorCounts, titleCase) },
    {
      key: "availability",
      title: "Availability",
      options: AVAILABILITY_ORDER.filter((s) => availabilityCounts.has(s)).map((s) => ({
        value: s,
        label: availabilityLabel({ status: s }),
        count: availabilityCounts.get(s) ?? 0,
      })),
    },
    {
      key: "priceBand",
      title: "Price band",
      options: PRICE_BANDS.map((b) => ({
        value: b.value,
        label: b.label,
        count: bandCounts.get(b.value) ?? 0,
      })),
    },
  ];
}

function buildChips(
  state: CatalogueFilterState,
  groups: FilterGroupDef[]
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const hrefFor = (next: CatalogueFilterState): string => {
    const qs = filtersToSearchParams(next).toString();
    return qs ? `/products?${qs}` : "/products";
  };

  if (state.q) {
    chips.push({
      label: `Search: “${state.q}”`,
      href: hrefFor({ ...state, q: undefined, page: 1 }),
      filterName: "q",
      filterValue: state.q,
    });
  }
  if (state.material) {
    chips.push({
      label: `Material: ${materialLabel(state.material)}`,
      href: hrefFor({ ...state, material: undefined, page: 1 }),
      filterName: "material",
      filterValue: state.material,
    });
  }
  for (const group of groups) {
    const selected = state[group.key];
    for (const value of selected) {
      const option = group.options.find((o) => o.value === value);
      const next: CatalogueFilterState = { ...state, page: 1 };
      next[group.key] = selected.filter((v) => v !== value);
      chips.push({
        label: `${group.title}: ${option?.label ?? value}`,
        href: hrefFor(next),
        filterName: group.key,
        filterValue: value,
      });
    }
  }
  return chips;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const state = parseFilters(toURLSearchParams(raw));
  const [products, applications, brands] = await Promise.all([
    contentSource.getProducts(),
    contentSource.getApplications(),
    contentSource.getBrands(),
  ]);
  const groups = buildFacetGroups(products, applications, brands);
  const { items, total, page, pageCount } = applyCatalogue(products, state);
  const chips = buildChips(state, groups);

  return (
    <>
      <Container className="pb-4 pt-6 md:pt-8">
        <h1 className="text-2xl md:text-3xl">{materialLabel(state.material)}</h1>
        <p className="mt-1 text-sm text-text-muted">
          Prices and stock status verified regularly — confirm current
          availability with us before ordering.
        </p>
      </Container>

      <div className="sticky top-16 z-30 border-b border-border bg-bg md:top-[68px]">
        <Container className="py-2 md:flex md:h-14 md:items-center md:gap-3 md:py-0">
          <div className="flex flex-col gap-2 md:contents">
            <form
              action="/products"
              method="get"
              role="search"
              className="flex h-11 min-w-0 flex-1 items-center"
            >
              {state.material && (
                <input type="hidden" name="material" value={state.material} />
              )}
              <label htmlFor="catalogue-search" className="sr-only">
                Search products
              </label>
              <Input
                id="catalogue-search"
                type="search"
                name="q"
                defaultValue={state.q ?? ""}
                placeholder="Search"
                className="h-11 min-w-0 flex-1 rounded-r-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-r-md border border-l-0 border-border bg-surface-muted text-text-muted hover:bg-accent-soft hover:text-accent"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </form>
            <div className="flex items-center justify-between gap-3 md:contents">
              <FilterSheet state={state} groups={groups} />
              <SortSelect state={state} className="w-44 shrink-0 md:hidden" />
            </div>
          </div>
        </Container>
      </div>

      {chips.length > 0 && (
        <Container className="pt-4">
          <ActiveFilterChips chips={chips} />
        </Container>
      )}

      <Container className="pb-10 pt-4 md:pb-16">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p role="status" className="text-sm text-text-muted">
            {total} {total === 1 ? "product" : "products"}
          </p>
          <SortSelect state={state} showLabel className="hidden md:flex" />
        </div>

        {state.q && total === 0 && <ZeroResultsTracker query={state.q} />}
        {total === 0 ? (
          <EmptyResults query={state.q} />
        ) : (
          <>
            <ProductGrid products={items} columns={4} />
            <Pagination
              state={state}
              page={page}
              pageCount={pageCount}
              className="mt-8"
            />
          </>
        )}
      </Container>
    </>
  );
}
