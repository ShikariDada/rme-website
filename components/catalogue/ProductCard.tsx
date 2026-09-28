import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { availabilityLabel, getPriceDisplay } from "@/lib/pricing/format";
import { Badge } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils";

/**
 * Product card (spec §9.6): image, brand, name, size, finish, honest price,
 * broad stock state. Tap target: whole card is the link; WhatsApp quick
 * action is rendered by the page when appropriate.
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
    ? `${product.tile.widthMm}×${product.tile.heightMm} mm`
    : product.stone?.slabSizeText;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow duration-200 hover:shadow-md focus-visible:shadow-md",
        className
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {img && (
          <Image
            src={img.url}
            alt={img.alt}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        )}
        {product.newArrival && (
          <span className="absolute left-2 top-2">
            <Badge tone="accent">New</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {product.brandName ?? brandFallback(product.materialType)}
        </p>
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">{product.name}</h3>
        <p className="text-sm text-text-muted">
          {[size, product.finish[0]].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className="text-[15px] font-semibold">{price.primary}</p>
          <span
            className={cn(
              "shrink-0 text-xs",
              availabilityToneClass(product.availability.status)
            )}
          >
            {availabilityLabel(product.availability)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function brandFallback(materialType: string): string {
  const names: Record<string, string> = {
    tile: "Tile",
    marble: "Marble",
    granite: "Granite",
    quartz: "Quartz",
    sanitaryware: "Sanitaryware",
    adhesive: "Adhesive",
    other: "Surface",
  };
  return names[materialType] ?? "Product";
}

function availabilityToneClass(status: Product["availability"]["status"]): string {
  switch (status) {
    case "ready_stock":
      return "text-[var(--color-success)]";
    case "limited":
      return "text-accent";
    case "order_basis":
      return "text-text-muted";
    case "unavailable":
      return "text-[var(--color-danger)]";
  }
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
        "grid gap-3 grid-cols-2 md:gap-4",
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
