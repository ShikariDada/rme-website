import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { availabilityLabel, getPriceDisplay } from "@/lib/pricing/format";
import { cn } from "@/lib/utils";

/**
 * Product card (design §4, somanyceramics.com card language): rounded photo
 * plate with a slow image zoom on hover, floating status badge, bold name,
 * quiet meta line, tabular price hierarchy. Whole card is one link.
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
        "group flex flex-col transition-transform duration-500 ease-out-expo",
        "hover:-translate-y-1.5",
        className
      )}
    >
      <div className="relative aspect-43 w-full overflow-hidden rounded-md bg-surface-muted shadow-card transition-shadow duration-500 ease-out-expo group-hover:shadow-raise">
        {img && (
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3">
          <StockBadge product={product} />
        </span>
        {product.newArrival && (
          <span className="absolute right-3 top-3 inline-flex h-6 items-center rounded-pill bg-ink/85 px-2.5 text-11 font-semibold uppercase tracking-badge text-white">
            New
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-4">
        <h3 className="line-clamp-2 text-15 font-semibold leading-snug text-text">
          {product.name}
        </h3>
        <p className="mt-1 text-13 text-text-muted">{meta}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-2.5">
          <p className="tnum text-15 font-bold text-text">{price.primary}</p>
          {price.secondary && (
            <p className="tnum text-xs text-text-muted">{price.secondary}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Frosted pill badge over the photograph; one per card. */
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
      ? "bg-success"
      : status === "limited"
        ? "bg-danger"
        : "bg-text-muted";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface/95 px-2.5 py-1 text-11 font-semibold uppercase tracking-badge text-text shadow-card backdrop-blur-sm">
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
      data-reveal-grid=""
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12",
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
    <div className="rounded-lg border border-border bg-surface p-8 text-center md:p-12">
      <h2 className="text-xl">
        {query ? `No results for “${query}”` : "No products match these filters"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
        Try fewer filters, a common size like 600x1200, or ask us on WhatsApp.
        we may have what you need in the showroom even if it is not listed yet.
      </p>
    </div>
  );
}
