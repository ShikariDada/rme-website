import type { Product, SiteSettings } from "@/lib/types";
import { getPriceDisplay, priceUpdatedAt, taxSuffix } from "@/lib/pricing/format";

export function PriceBlock({
  product,
  settings,
}: {
  product: Product;
  settings: SiteSettings;
}) {
  const price = getPriceDisplay(product);
  const tax = taxSuffix(product, settings);
  const updatedAt = priceUpdatedAt(product);

  return (
    <section aria-label="Price">
      <p className="text-xl font-semibold">{price.primary}</p>
      {/* Quote mode shows the honest guidance line only — no tax/date framing. */}
      {!price.isQuote && (
        <>
          {price.secondary && (
            <p className="mt-0.5 text-sm text-text-muted">{price.secondary}</p>
          )}
          {tax && <p className="mt-0.5 text-sm text-text-muted">{tax}</p>}
          {updatedAt && (
            <p className="mt-1 text-xs text-text-muted">Price checked {updatedAt}</p>
          )}
        </>
      )}
    </section>
  );
}
