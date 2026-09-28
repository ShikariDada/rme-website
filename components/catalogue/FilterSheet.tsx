"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  FilterGroup,
  type FacetKey,
  type FilterGroupDef,
} from "@/components/catalogue/FilterGroup";
import {
  countActiveFilters,
  filtersToSearchParams,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

const FACET_KEYS: FacetKey[] = [
  "brand",
  "room",
  "size",
  "finish",
  "look",
  "color",
  "availability",
  "priceBand",
];

export function FilterSheet({
  state,
  groups,
}: {
  state: CatalogueFilterState;
  groups: FilterGroupDef[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Draft mirrors URL state so toggles feel instant; re-synced when the server
  // confirms the pushed URL.
  const [draft, setDraft] = useState(state);
  useEffect(() => {
    setDraft(state);
  }, [state]);

  const activeCount = countActiveFilters(state);

  function push(next: CatalogueFilterState) {
    const qs = filtersToSearchParams(next).toString();
    startTransition(() => {
      router.push(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  function handleToggle(key: FacetKey, value: string, checked: boolean) {
    const values = checked
      ? [...draft[key], value]
      : draft[key].filter((v) => v !== value);
    track("filter_apply", {
      filter_name: key,
      filter_value: value,
      source_surface: "filter-sheet",
    });
    const nextDraft: CatalogueFilterState = { ...draft };
    nextDraft[key] = values;
    setDraft(nextDraft);
    const next: CatalogueFilterState = { ...state, page: 1 };
    next[key] = values;
    push(next);
  }

  function clearAll() {
    const cleared: CatalogueFilterState = {
      q: state.q,
      material: undefined,
      brand: [],
      room: [],
      size: [],
      finish: [],
      look: [],
      color: [],
      use: [],
      availability: [],
      priceBand: [],
      page: 1,
      sort: state.sort,
    };
    track("filter_apply", {
      filter_name: "clear-all",
      source_surface: "filter-sheet",
    });
    setDraft(cleared);
    push(cleared);
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="h-11 shrink-0 px-3"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />
        </svg>
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold leading-none text-white">
            {activeCount}
          </span>
        )}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        variant="sheet"
      >
        <div className={cn("space-y-6", isPending && "pointer-events-none opacity-60")}>
          {groups.map((group) => (
            <FilterGroup
              key={group.key}
              group={group}
              selected={draft[group.key]}
              onToggle={handleToggle}
            />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          {activeCount > 0 ? (
            <Button variant="text" onClick={clearAll}>
              Clear all
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <Button onClick={() => setOpen(false)}>Show results</Button>
        </div>
      </Dialog>
    </>
  );
}

/**
 * Rendered by the results page only when a query is present and zero products
 * match — the page itself stays a server component that fires no tracking.
 */
export function ZeroResultsTracker({ query }: { query: string }) {
  useEffect(() => {
    if (query) {
      track("search_zero_results", { source_surface: "products" });
    }
  }, [query]);
  return null;
}
