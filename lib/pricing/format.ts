import type {
  Availability,
  Pricing,
  Product,
  SiteSettings,
} from "@/lib/types";
import { contentSource } from "@/lib/data";

/** Formatting helpers for prices, units, availability and dates. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return inr.format(amount);
}

const unitLabels: Record<string, string> = {
  sq_ft: "sq ft",
  box: "box",
  piece: "piece",
  slab: "slab",
  set: "set",
};

export function formatUnit(unit: string): string {
  return unitLabels[unit] ?? unit;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface PriceDisplay {
  /** Primary line, e.g. "₹68 / sq ft" or "From ₹92 / sq ft" or a guidance sentence. */
  primary: string;
  /** Secondary line, e.g. "₹1,224 / box". */
  secondary?: string;
  /** Structured offer info for JSON-LD; omit when price is not offer-worthy. */
  offer?: { low: number; high?: number; unit: string };
  /** True when the price is an enquiry type (no figure displayed). */
  isQuote: boolean;
}

/**
 * Renders the product price according to its `pricing.mode` (spec §11.1).
 * Deterministic and unit-tested. Never fabricates figures: any mode without
 * usable numbers falls back to the honest "ask for quote" line.
 */
export function getPriceDisplay(product: Product): PriceDisplay {
  const { pricing } = product;
  const unit = formatUnit(pricing.unit);

  switch (pricing.mode) {
    case "exact": {
      if (typeof pricing.amount === "number" && pricing.amount > 0) {
        const secondary =
          typeof pricing.boxAmount === "number" && pricing.boxAmount > 0
            ? `${formatINR(pricing.boxAmount)} / box`
            : undefined;
        return {
          primary: `${formatINR(pricing.amount)} / ${unit}`,
          secondary,
          offer: { low: pricing.amount, unit },
          isQuote: false,
        };
      }
      break;
    }
    case "from": {
      if (typeof pricing.amount === "number" && pricing.amount > 0) {
        return {
          primary: `From ${formatINR(pricing.amount)} / ${unit}`,
          offer: { low: pricing.amount, unit },
          isQuote: false,
        };
      }
      break;
    }
    case "range": {
      if (
        typeof pricing.min === "number" &&
        typeof pricing.max === "number" &&
        pricing.min > 0 &&
        pricing.max >= pricing.min
      ) {
        return {
          primary:
            pricing.min === pricing.max
              ? `${formatINR(pricing.min)} / ${unit}`
              : `${formatINR(pricing.min)}–${formatINR(pricing.max)} / ${unit}`,
          offer: { low: pricing.min, high: pricing.max, unit },
          isQuote: false,
        };
      }
      break;
    }
    case "quote":
      break;
  }

  return {
    primary: "Price varies by lot — ask for current quote.",
    isQuote: true,
  };
}

export function taxSuffix(product: Product, settings: SiteSettings): string | null {
  const label = product.pricing.taxLabel ?? settings.priceTaxLabel ?? "hidden";
  switch (label) {
    case "inclusive":
      return "Taxes included";
    case "exclusive":
      return "Taxes extra";
    case "varies":
      return "Taxes as applicable";
    default:
      return null;
  }
}

const availabilityLabels: Record<Availability["status"], string> = {
  ready_stock: "Ready stock",
  limited: "Limited stock",
  order_basis: "Order basis",
  unavailable: "Temporarily unavailable",
};

export function availabilityLabel(a: Availability): string {
  return availabilityLabels[a.status];
}

export function priceUpdatedAt(product: Product): string | null {
  if (!product.pricing.updatedAt) return null;
  try {
    return formatDate(product.pricing.updatedAt);
  } catch {
    return null;
  }
}
