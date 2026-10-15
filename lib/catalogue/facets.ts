/**
 * Catalogue facet/chip builders and material labels (spec §10).
 *
 * Pure helpers shared by the /products server page and the client catalogue
 * (products-client.tsx). Must not import server-only modules — in static
 * export mode everything here also runs in the browser.
 */

import type { FilterGroupDef } from "@/components/catalogue/FilterGroup";
import type { ActiveFilterChip } from "@/components/catalogue/ActiveFilterChips";
import {
  PRICE_BANDS,
  filtersToSearchParams,
  slugOf,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { STATIC_BASE_PATH } from "@/lib/static";
import { availabilityLabel } from "@/lib/pricing/format";
import { normalizeQuery, sizeAliasesFor } from "@/lib/search/synonyms";
import type {
  Application,
  Brand,
  FilterOption,
  MaterialType,
  Product,
} from "@/lib/types";

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  tile: "Tiles",
  marble: "Marble",
  granite: "Granite",
  quartz: "Quartz",
  sanitaryware: "Sanitaryware",
  adhesive: "Adhesives & care",
  other: "Products",
};

export function materialLabel(material?: string): string {
  if (!material) return "All products";
  return MATERIAL_LABELS[material as MaterialType] ?? "Products";
}

export function materialDescription(material?: string): string {
  const label = material ? materialLabel(material).toLowerCase() : null;
  return label
    ? `Browse ${label} by size, finish, colour and price band. Transparent per-sq-ft pricing and honest stock status, verified regularly.`
    : "Browse tiles, marble and granite by size, finish, colour and price band. Transparent pricing and honest stock status, verified regularly.";
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
export function buildFacetGroups(
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

/**
 * Chips are plain <a> links (track-only onClick, work without JS). On GitHub
 * Pages those anchors bypass the router, so they carry the explicit static
 * basePath ("" in the normal server build).
 */
export function buildChips(
  state: CatalogueFilterState,
  groups: FilterGroupDef[]
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const productsHref = `${STATIC_BASE_PATH}/products`;
  const hrefFor = (next: CatalogueFilterState): string => {
    const qs = filtersToSearchParams(next).toString();
    return qs ? `${productsHref}?${qs}` : productsHref;
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
