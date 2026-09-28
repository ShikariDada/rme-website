import type { Product, SiteSettings } from "@/lib/types";
import { getPriceDisplay } from "@/lib/pricing/format";
import { absoluteUrl } from "@/lib/utils";

/**
 * JSON-LD builders (spec §22.2).
 * - LocalBusiness on home/showroom — truthful data only.
 * - Product + Offer/AggregateOffer on PDPs — only when price data is real.
 * - BreadcrumbList on deep pages.
 * - Article for guides.
 * - NO FAQPage markup (Google's 2023 policy change; spec forbids it).
 */

type JsonLdObject = Record<string, unknown>;

const availabilitySchema: Record<string, string> = {
  ready_stock: "https://schema.org/InStock",
  limited: "https://schema.org/LimitedAvailability",
  order_basis: "https://schema.org/PreOrder",
  unavailable: "https://schema.org/OutOfStock",
};

export function localBusinessJsonLd(settings: SiteSettings): JsonLdObject {
  const addr = settings.address;
  const openingHours = settings.hours
    .filter((h) => !h.closed && h.opens && h.closes)
    .map((h) => `${dayName(h.day)} ${h.opens}-${h.closes}`);
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Store"],
    name: settings.businessName,
    url: absoluteUrl("/"),
    telephone: settings.phone,
    email: settings.quoteEmail,
    image: settings.logo ? absoluteUrl(settings.logo.url) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: [addr.line1, addr.line2].filter(Boolean).join(", "),
      addressLocality: addr.locality,
      addressRegion: addr.state,
      postalCode: addr.postalCode,
      addressCountry: "IN",
    },
    ...(settings.gstin ? { taxID: settings.gstin } : {}),
    ...(openingHours.length > 0
      ? { openingHoursSpecification: parseOpeningHours(settings.hours) }
      : {}),
    ...(settings.businessProfileUrl
      ? { hasMap: settings.googleMapsUrl, sameAs: [settings.businessProfileUrl, ...settings.socialLinks?.map((s) => s.url) ?? []] }
      : { hasMap: settings.googleMapsUrl }),
    priceRange: "₹₹",
  };
}

function dayName(day: string): string {
  const names: Record<string, string> = {
    monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
    thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  };
  return names[day.toLowerCase()] ?? day;
}

function parseOpeningHours(hours: SiteSettings["hours"]): JsonLdObject[] {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  return hours
    .filter((h) => !h.closed && h.opens && h.closes)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${days.find((d) => d.toLowerCase() === h.day.toLowerCase()) ?? h.day}`,
      opens: h.opens,
      closes: h.closes,
    }));
}

export function productJsonLd(product: Product, settings: SiteSettings): JsonLdObject {
  const price = getPriceDisplay(product);
  const data: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: product.images.map((i) => absoluteUrl(i.url)),
    description: product.seo?.description ?? `${product.name} — available at ${settings.businessName}, ${settings.address.city}.`,
    brand: product.brandName
      ? { "@type": "Brand", name: product.brandName }
      : undefined,
    category: product.materialType,
  };
  if (!price.isQuote && price.offer) {
    const availability =
      availabilitySchema[product.availability.status] ?? "https://schema.org/InStock";
    if (price.offer.high !== undefined && price.offer.high > price.offer.low) {
      data.offers = {
        "@type": "AggregateOffer",
        priceCurrency: "INR",
        lowPrice: price.offer.low,
        highPrice: price.offer.high,
        availability,
      };
    } else {
      data.offers = {
        "@type": "Offer",
        priceCurrency: "INR",
        price: price.offer.low,
        availability,
        itemCondition: "https://schema.org/NewCondition",
      };
    }
  }
  // No aggregateRating: never fabricate reviews.
  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  updatedAt: string;
  authorLabel?: string;
  image?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt,
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    author: {
      "@type": "Organization",
      name: input.authorLabel ?? "Editorial team",
    },
  };
}
