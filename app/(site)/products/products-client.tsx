"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Primitives";
import { Input } from "@/components/ui/Input";
import { ProductGrid, EmptyResults } from "@/components/catalogue/ProductCard";
import { FilterSheet, ZeroResultsTracker } from "@/components/catalogue/FilterSheet";
import { ActiveFilterChips } from "@/components/catalogue/ActiveFilterChips";
import { SortSelect } from "@/components/catalogue/SortSelect";
import { Pagination } from "@/components/catalogue/Pagination";
import {
 applyCatalogue,
 filtersToSearchParams,
 parseFilters,
 type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { buildChips, buildFacetGroups, materialLabel } from "@/lib/catalogue/facets";
import type { Application, Brand, Product } from "@/lib/types";

/**
 * Client-driven catalogue (works in both the server build and the static
 * export): filter state lives entirely in the URL, read via
 * useSearchParams() and re-renders from the pure filters helpers. The server
 * page only supplies the raw catalogue data.
 */
export function ProductsClient({
 allProducts,
 applications,
 brands,
}: {
 allProducts: Product[];
 applications: Application[];
 brands: Brand[];
}) {
 const searchParams = useSearchParams();
 const router = useRouter();
 // usePathname() is basePath-relative; Next adds the base for router navigation.
 const pathname = usePathname();

 const state = useMemo(() => parseFilters(searchParams), [searchParams]);
 const groups = useMemo(
 () => buildFacetGroups(allProducts, applications, brands),
 [allProducts, applications, brands]
 );
 const { items, total, page, pageCount } = useMemo(
 () => applyCatalogue(allProducts, state),
 [allProducts, state]
 );
 const chips = useMemo(() => buildChips(state, groups), [state, groups]);

 const hrefFor = useCallback(
 (next: CatalogueFilterState): string => {
  const qs = filtersToSearchParams(next).toString();
  return qs ? `${pathname}?${qs}` : pathname;
 },
 [pathname]
 );

 const updateUrl = useCallback(
 (
  next: CatalogueFilterState,
  method: "push" | "replace" = "push"
 ): void => {
  router[method](hrefFor(next), { scroll: false });
 },
 [router, hrefFor]
 );

 const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault();
 const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
 updateUrl({ ...state, q: q || undefined, page: 1 });
 };

 return (
 <>
  <Container className="pb-4 pt-6 md:pt-8">
  <h1 className="text-2xl md:text-3xl">{materialLabel(state.material)}</h1>
  <p className="mt-1 text-sm text-text-muted">
   Prices and stock status verified regularly. Confirm current
   availability with us before ordering.
  </p>
  </Container>

  <div className="sticky top-16 z-30 border-b border-border bg-bg md:top-17">
  <Container className="py-2 md:flex md:h-14 md:items-center md:gap-3 md:py-0">
   <div className="flex flex-col gap-2 md:contents">
   <form
    action="/products"
    method="get"
    role="search"
    onSubmit={handleSearch}
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
