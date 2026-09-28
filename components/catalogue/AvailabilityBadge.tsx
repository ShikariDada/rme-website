import type { Product } from "@/lib/types";
import { availabilityLabel } from "@/lib/pricing/format";
import { Badge } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils";

/** Availability badge (spec §11.2): broad states only, honest labels. */
export function AvailabilityBadge({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const tone =
    product.availability.status === "ready_stock"
      ? "success"
      : product.availability.status === "limited"
        ? "accent"
        : product.availability.status === "unavailable"
          ? "warn"
          : "muted";
  return (
    <Badge tone={tone} className={className}>
      {availabilityLabel(product.availability)}
    </Badge>
  );
}
