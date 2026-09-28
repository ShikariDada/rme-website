"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import {
  SORT_OPTIONS,
  filtersToSearchParams,
  type CatalogueFilterState,
  type SortKey,
} from "@/lib/catalogue/filters";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

export function SortSelect({
  state,
  className,
  showLabel = false,
}: {
  state: CatalogueFilterState;
  className?: string;
  showLabel?: boolean;
}) {
  const router = useRouter();
  const id = useId();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sort = e.target.value as SortKey;
    track("filter_apply", {
      filter_name: "sort",
      filter_value: sort,
      source_surface: "sort-select",
    });
    const qs = filtersToSearchParams({ ...state, sort, page: 1 }).toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor={id}
        className={cn("shrink-0 text-sm text-text-muted", !showLabel && "sr-only")}
      >
        Sort products
      </label>
      {/* key remounts the uncontrolled select so it reflects server-confirmed state */}
      <Select
        id={id}
        key={state.sort}
        defaultValue={state.sort}
        onChange={handleChange}
        className="h-11 w-full text-sm sm:w-48"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
