import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { availabilityLabel, getPriceDisplay } from "@/lib/pricing/format";
import { cn } from "@/lib/utils";

/**
 * Product card (design §4): borderless on paper, 4:3 full-bleed image with
 * near-square corners, one hairline stock badge, name / meta / per-sqft price
 * hierarchy. Hover = subtle lift + the single allowed shadow + bronze name
 * underline. Entire card is one link; no icon buttons.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: Product;
  priority?: boolean;
  className?: string;
}) {
  const price = getPriceDisplay(product);
  const img = product.images[0];
  const size = product.tile
    ? `${product.tile.widthMm}×${product.tile.heightMm}`
    : product.stone?.slabSizeText;
  const meta = [size, product.finish[0] ? titleCase(product.finish[0]) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-sm transition-[transform,box-shadow] duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(23,21,18,0.06)] focus-visible:shadow-[0_2px_8px_rgba(23,21,18,0.06)]",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-surface-muted">
        {img && (
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        )}
        <span className="absolute left-2 top-2">
          <StockBadge product={product} />
        </span>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-text group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4 group-hover:decoration-1">
          {product.name}
        </h3>
        <p className="mt-1 text-[13px] text-text-muted">{meta}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-2.5">
          <p className="tnum text-[15px] font-medium text-text">{price.primary}</p>
          {price.secondary && (
            <p className="tnum text-xs text-text-muted">{price.secondary}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Single hairline badge, near-square — design §4. */
function StockBadge({ product }: { product: Product }) {
  const status = product.availability.status;
  const label =
    status === "ready_stock"
      ? "In stock"
      : status === "limited"
        ? "Low stock"
        : status === "order_basis"
          ? "Made to order"
          : availabilityLabel(product.availability);
  const dot =
    status === "ready_stock"
      ? "bg-[var(--color-success)]"
      : status === "limited"
        ? "bg-[var(--color-danger)]"
        : "bg-text-muted";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-text">
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

function titleCase(v: string): string {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export function ProductGrid({
  products,
  columns = 4,
}: {
  products: Product[];
  columns?: 3 | 4;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        "md:grid-cols-3"
      )}
    >
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard product={p} priority={i < 4} className="h-full" />
        </li>
      ))}
    </ul>
  );
}

export function EmptyResults({ query }: { query?: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-8 text-center md:p-12">
      <h2 className="text-lg font-display">
        {query ? `No results for “${query}”` : "No products match these filters"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
        Try fewer filters, a common size like 600x1200, or ask us on WhatsApp —
        we may have what you need in the showroom even if it is not listed yet.
      </p>
    </div>
  );
}
