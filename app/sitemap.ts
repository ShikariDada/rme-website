import type { MetadataRoute } from "next";
import { contentSource } from "@/lib/data";
import { absoluteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, rooms, brands, projects, guides] = await Promise.all([
    contentSource.getProducts(),
    contentSource.getApplications(),
    contentSource.getBrands(),
    contentSource.getProjects(),
    contentSource.getGuides(),
  ]);

  const staticPaths = [
    "",
    "/products",
    "/tiles",
    "/marble",
    "/granite",
    "/room",
    "/projects",
    "/guides",
    "/tile-calculator",
    "/visualizer",
    "/showroom",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
  ];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: absoluteUrl(p),
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/products" ? 0.9 : 0.6,
  }));

  for (const p of products.filter((p) => p.status === "active")) {
    entries.push({
      url: absoluteUrl(`/product/${p.slug}`),
      lastModified: new Date(p.pricing.updatedAt || now),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  for (const r of rooms) {
    entries.push({ url: absoluteUrl(`/room/${r.slug}`), changeFrequency: "monthly", priority: 0.5 });
  }
  for (const b of brands) {
    entries.push({ url: absoluteUrl(`/brand/${b.slug}`), changeFrequency: "monthly", priority: 0.5 });
  }
  for (const p of projects) {
    entries.push({ url: absoluteUrl(`/projects/${p.slug}`), changeFrequency: "monthly", priority: 0.5 });
  }
  for (const g of guides) {
    entries.push({
      url: absoluteUrl(`/guides/${g.slug}`),
      lastModified: new Date(g.updatedAt),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
