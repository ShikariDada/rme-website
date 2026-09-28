import type { Metadata } from "next";
import { absoluteUrl, siteUrl } from "@/lib/utils";

interface PageMetaInput {
  title: string;
  description: string;
  path: string; // canonical path, e.g. /products
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Shared metadata factory (spec §15). Every indexable page must produce a
 * unique title, description and canonical URL.
 */
export function pageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path);
  const base = siteUrl();
  const images = (input.images ?? []).map((img) => ({
    url: img.url.startsWith("http") ? img.url : absoluteUrl(img.url),
    width: img.width ?? 1200,
    height: img.height ?? 630,
    alt: img.alt ?? input.title,
  }));
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: base.replace(/^https?:\/\//, ""),
      type: input.type ?? "website",
      ...(input.type === "article"
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      images: images.map((i) => i.url),
    },
  };
}

export const DEFAULT_OG_IMAGE = "/brand/og-default.png";
