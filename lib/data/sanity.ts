import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { ContentImage } from "@/lib/types";

/**
 * Sanity wiring. The site falls back to local seed data until these env vars
 * are provided, so nothing here runs at build time unless configured.
 */

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-01-01",
};

export const isSanityConfigured = Boolean(sanityConfig.projectId);

let client: SanityClient | null = null;

export function getSanityClient(): SanityClient {
  if (!isSanityConfigured) {
    throw new Error(
      "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID (and optionally SANITY_API_READ_TOKEN)."
    );
  }
  client ??= createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.dataset,
    apiVersion: sanityConfig.apiVersion,
    useCdn: true,
    token: process.env.SANITY_API_READ_TOKEN || undefined,
    perspective: "published",
  });
  return client;
}

const builder = isSanityConfigured
  ? imageUrlBuilder({
      projectId: sanityConfig.projectId,
      dataset: sanityConfig.dataset,
    })
  : null;

export function urlForImage(
  source: Parameters<NonNullable<typeof builder>["image"]>[0]
): ReturnType<NonNullable<typeof builder>["image"]> | null {
  if (!builder) return null;
  return builder.image(source);
}

/** GROQ projections shared by future Sanity-backed data source. */
export const GROQ = {
  product: /* groq */ `{
    _id, name, "slug": slug.current, sku, familyKey,
    "brandId": brand->_id, "brandName": brand->name,
    materialType, "categorySlugs": categories[]->slug.current,
    "applicationSlugs": applications[]->slug.current,
    status, featured, newArrival, pricing, availability,
    images[]{ asset->{"url": url, "width": metadata.dimensions.width, "height": metadata.dimensions.height}, alt, kind, source, rightsStatus },
    colorFamily, look, finish, tile, stone, description, care, installationNotes,
    "relatedProductSlugs": relatedProducts[]->slug.current,
    manufacturerProductUrl, sourceLastCheckedAt, seo, "visualizerMaterialId": visualizerMaterialId
  }`,
};
