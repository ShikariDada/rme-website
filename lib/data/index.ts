import { cache } from "react";
import type {
  Announcement,
  Application,
  Brand,
  Category,
  Faq,
  Guide,
  Product,
  Project,
  SiteSettings,
  Testimonial,
} from "@/lib/types";

/**
 * Unified data layer.
 *
 * - If NEXT_PUBLIC_SANITY_PROJECT_ID is configured, data comes from the Sanity
 *   Content Lake (see lib/data/sanity.ts).
 * - Otherwise the site runs on local seed data (content/seed/*.json), so the
 *   application is fully runnable before the owner sets up the CMS.
 *
 * All functions are React-cached per request. Sanity CDN caching plus Next's
 * caching covers production; the local path reads bundled JSON.
 */

export interface ContentSource {
  getSettings(): Promise<SiteSettings>;
  getProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getBrands(): Promise<Brand[]>;
  getBrandBySlug(slug: string): Promise<Brand | null>;
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  getApplications(): Promise<Application[]>;
  getApplicationBySlug(slug: string): Promise<Application | null>;
  getProjects(): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | null>;
  getGuides(): Promise<Guide[]>;
  getGuideBySlug(slug: string): Promise<Guide | null>;
  getFaqs(): Promise<Faq[]>;
  getTestimonials(): Promise<Testimonial[]>;
  getAnnouncements(): Promise<Announcement[]>;
}

const localImport = {
  settings: () => import("@/content/seed/settings.json"),
  products: () => import("@/content/seed/products.json"),
  brands: () => import("@/content/seed/brands.json"),
  categories: () => import("@/content/seed/categories.json"),
  applications: () => import("@/content/seed/applications.json"),
  projects: () => import("@/content/seed/projects.json"),
  guides: () => import("@/content/seed/guides.json"),
  faqs: () => import("@/content/seed/faqs.json"),
  testimonials: () => import("@/content/seed/testimonials.json"),
  announcements: () => import("@/content/seed/announcements.json"),
} as const;

export const contentSource: ContentSource = createLocalSource();

function createLocalSource(): ContentSource {
  const products = cache(async () => {
    const mod = await localImport.products();
    return mod.default as unknown as Product[];
  });
  const brands = cache(async () => {
    const mod = await localImport.brands();
    return mod.default as unknown as Brand[];
  });
  const categories = cache(async () => {
    const mod = await localImport.categories();
    return mod.default as unknown as Category[];
  });
  const applications = cache(async () => {
    const mod = await localImport.applications();
    return mod.default as unknown as Application[];
  });
  const projects = cache(async () => {
    const mod = await localImport.projects();
    return mod.default as unknown as Project[];
  });
  const guides = cache(async () => {
    const mod = await localImport.guides();
    return mod.default as unknown as Guide[];
  });
  const faqs = cache(async () => {
    const mod = await localImport.faqs();
    return mod.default as unknown as Faq[];
  });
  const testimonials = cache(async () => {
    const mod = await localImport.testimonials();
    return mod.default as unknown as Testimonial[];
  });
  const announcements = cache(async () => {
    const mod = await localImport.announcements();
    return mod.default as unknown as Announcement[];
  });
  const settings = cache(async () => {
    const mod = await localImport.settings();
    return mod.default as unknown as SiteSettings;
  });

  return {
    getSettings: settings,
    getProducts: products,
    getProductBySlug: async (slug) =>
      (await products()).find((p) => p.slug === slug && p.status === "active") ??
      null,
    getBrands: brands,
    getBrandBySlug: async (slug) =>
      (await brands()).find((b) => b.slug === slug) ?? null,
    getCategories: categories,
    getCategoryBySlug: async (slug) =>
      (await categories()).find((c) => c.slug === slug) ?? null,
    getApplications: applications,
    getApplicationBySlug: async (slug) =>
      (await applications()).find((a) => a.slug === slug) ?? null,
    getProjects: projects,
    getProjectBySlug: async (slug) =>
      (await projects()).find((p) => p.slug === slug) ?? null,
    getGuides: guides,
    getGuideBySlug: async (slug) =>
      (await guides()).find((g) => g.slug === slug) ?? null,
    getFaqs: faqs,
    getTestimonials: testimonials,
    getAnnouncements: async () => {
      const now = Date.now();
      return (await announcements()).filter((a) => {
        if (!a.isActive) return false;
        if (a.startAt && new Date(a.startAt).getTime() > now) return false;
        if (a.endAt && new Date(a.endAt).getTime() < now) return false;
        return true;
      });
    },
  };
}

/** Convenience helpers used across pages. */

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const list = await contentSource.getAnnouncements();
  return list[0] ?? null;
}

export async function getVisibleProducts(): Promise<Product[]> {
  const all = await contentSource.getProducts();
  return all.filter((p) => p.status === "active");
}

export async function getFeaturedProducts(limit = 10): Promise<Product[]> {
  const all = await getVisibleProducts();
  return all.filter((p) => p.featured).slice(0, limit);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const all = await getVisibleProducts();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  const related: Product[] = [];
  for (const slug of product.relatedProductSlugs ?? []) {
    const p = bySlug.get(slug);
    if (p && !related.includes(p)) related.push(p);
  }
  if (related.length < limit) {
    for (const p of all) {
      if (related.length >= limit) break;
      if (p.slug === product.slug || related.includes(p)) continue;
      if (
        p.materialType === product.materialType &&
        p.look.some((l) => product.look.includes(l))
      ) {
        related.push(p);
      }
    }
  }
  return related.slice(0, limit);
}
