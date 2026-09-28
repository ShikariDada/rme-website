import Link from "next/link";
import {
  filtersToSearchParams,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { cn } from "@/lib/utils";

function pageHref(state: CatalogueFilterState, page: number): string {
  const qs = filtersToSearchParams({ ...state, page }).toString();
  return qs ? `/products?${qs}` : "/products";
}

const linkClass =
  "inline-flex h-11 min-w-[44px] items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-surface-muted";
const disabledClass =
  "inline-flex h-11 items-center rounded-md px-3 text-sm text-text-muted/60";

export function Pagination({
  state,
  page,
  pageCount,
  className,
}: {
  state: CatalogueFilterState;
  page: number;
  pageCount: number;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  const showNumbers = pageCount <= 7;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-center gap-2", className)}
    >
      {page > 1 ? (
        <Link
          href={pageHref(state, page - 1)}
          className={linkClass}
          aria-label="Previous page"
        >
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Previous
        </span>
      )}

      {showNumbers ? (
        pages.map((p) =>
          p === page ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-white"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={pageHref(state, p)}
              className={linkClass}
              aria-label={`Page ${p}`}
            >
              {p}
            </Link>
          )
        )
      ) : (
        <span className="px-2 text-sm text-text-muted">
          Page {page} of {pageCount}
        </span>
      )}

      {page < pageCount ? (
        <Link
          href={pageHref(state, page + 1)}
          className={linkClass}
          aria-label="Next page"
        >
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          Next
        </span>
      )}
    </nav>
  );
}
