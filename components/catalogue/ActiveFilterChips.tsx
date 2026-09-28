"use client";

import { track } from "@/lib/analytics/track";

export interface ActiveFilterChip {
  label: string;
  href: string;
  filterName: string;
  filterValue: string;
}

/**
 * Plain <a> chips (work without JS) that each remove exactly one filter
 * value; the click handler only adds the analytics event.
 */
export function ActiveFilterChips({ chips }: { chips: ActiveFilterChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <a
          key={`${chip.filterName}:${chip.filterValue}`}
          href={chip.href}
          onClick={() =>
            track("filter_apply", {
              filter_name: chip.filterName,
              filter_value: chip.filterValue,
              source_surface: "filter-chips",
            })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm hover:bg-surface-muted"
        >
          {chip.label}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="shrink-0 text-text-muted"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </a>
      ))}
    </div>
  );
}
