/**
 * Content types shared by the Sanity schema, the local seed data and every
 * page/component. The Sanity schemas in /sanity/schemas mirror these shapes.
 *
 * NOTE: these are the *site* content types. Visualizer-specific material types
 * live in packages/visualizer-engine/src/materials/materialModel.ts and are
 * projected from these products by lib/visualizer/materials.ts.
 */

export type MaterialType =
  | "tile"
  | "marble"
  | "granite"
  | "quartz"
  | "sanitaryware"
  | "adhesive"
  | "other";

export type PriceMode = "exact" | "from" | "range" | "quote";
export type PriceUnit = "sq_ft" | "box" | "piece" | "slab" | "set";
export type TaxLabel = "inclusive" | "exclusive" | "varies";

export type AvailabilityStatus =
  | "ready_stock"
  | "limited"
  | "order_basis"
  | "unavailable";

export interface Pricing {
  mode: PriceMode;
  currency: "INR";
  unit: PriceUnit;
  amount?: number;
  min?: number;
  max?: number;
  boxAmount?: number;
  taxLabel?: TaxLabel;
  updatedAt: string; // ISO datetime
}

export interface Availability {
  status: AvailabilityStatus;
  verifiedAt?: string;
  publicNote?: string;
}

export type ImageRightsStatus =
  | "owned"
  | "manufacturer-approved"
  | "licensed"
  | "unknown";

export type ImageKind =
  | "product"
  | "texture"
  | "closeup"
  | "installed"
  | "detail";

export interface ContentImage {
  url: string;
  alt: string;
  kind: ImageKind;
  width?: number;
  height?: number;
  source?: string;
  rightsStatus: ImageRightsStatus;
}

export interface TileSpecs {
  widthMm: number;
  heightMm: number;
  thicknessMm?: number;
  bodyType?: string;
  use: Array<"floor" | "wall">;
  tilesPerBox?: number;
  coverageSqFtPerBox?: number;
  faces?: number;
  slipRating?: string;
  waterAbsorption?: string;
}

export interface StoneSpecs {
  thicknessOptionsMm?: number[];
  slabSizeText?: string;
  origin?: string;
  variationNote?: string;
}

export interface SeoFields {
  title?: string;
  description?: string;
  noindex?: boolean;
}

export interface Reference {
  _type: string;
  _ref: string;
}

export interface Product {
  id: string; // Sanity _id / seed id (used as key + SKU fallback)
  name: string;
  slug: string;
  sku: string;
  familyKey?: string;
  brandId?: string;
  brandName?: string; // denormalized for display
  materialType: MaterialType;
  categorySlugs: string[];
  applicationSlugs: string[];

  status: "active" | "hidden" | "discontinued";
  featured: boolean;
  newArrival: boolean;

  pricing: Pricing;
  availability: Availability;
  images: ContentImage[];

  colorFamily: string[];
  look: string[];
  finish: string[];

  tile?: TileSpecs;
  stone?: StoneSpecs;

  description?: PortableTextBlock[];
  care?: PortableTextBlock[];
  installationNotes?: PortableTextBlock[];
  relatedProductSlugs?: string[];
  manufacturerProductUrl?: string;
  sourceLastCheckedAt?: string;
  seo?: SeoFields;

  /** Visualizer texture availability (set by content pipeline). */
  visualizerMaterialId?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: ContentImage;
  description?: string;
  officialUrl?: string;
  isFeatured: boolean;
  /** Owner must confirm before this claim is ever displayed. */
  isAuthorizedDealerClaimAllowed: boolean;
  authorizationEvidenceNote?: string; // internal only — never rendered
  assetUsageApproved: boolean;
  sortOrder: number;
}

export type MaterialCategoryType = Extract<MaterialType, string>;

export interface PriceGuideEntry {
  label: string;
  min: number;
  max: number;
  unit: PriceUnit;
  lastUpdated: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  materialType: MaterialType;
  heroImage?: ContentImage;
  summary: string;
  buyingGuideBody?: PortableTextBlock[];
  priceGuide?: PriceGuideEntry[];
  seo?: SeoFields;
}

export type ApplicationKind = "room" | "surface" | "use-case";

export interface Application {
  id: string;
  name: string;
  slug: string;
  kind: ApplicationKind;
  description: string;
  image?: ContentImage;
  recommendedMaterialTypes: MaterialType[];
}

export type ProjectType =
  | "residential"
  | "commercial"
  | "hospitality"
  | "other";

export interface Project {
  id: string;
  title: string;
  slug: string;
  projectType: ProjectType;
  locationLabel?: string;
  completionDate?: string;
  summary: string;
  images: ContentImage[];
  productSlugs: string[];
  clientPermissionConfirmed: boolean;
  featured: boolean;
  seo?: SeoFields;
}

export interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: PortableTextBlock[];
  heroImage?: ContentImage;
  categorySlugs: string[];
  productSlugs: string[];
  authorLabel?: string;
  publishedAt: string;
  updatedAt: string;
  seo?: SeoFields;
}

export interface Testimonial {
  id: string;
  quote: string;
  reviewerDisplayName: string;
  source: "direct" | "google" | "project";
  sourceUrl?: string;
  permissionConfirmed: boolean;
  publishedAt?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  scope: "site" | "product" | "category" | "showroom";
  relatedProductSlug?: string;
  relatedCategorySlug?: string;
  sortOrder: number;
}

export interface Announcement {
  id: string;
  text: string;
  href?: string;
  startAt?: string;
  endAt?: string;
  isActive: boolean;
}

export interface BusinessHours {
  day: string; // "monday" ... "sunday"
  opens?: string; // "10:00"
  closes?: string;
  closed: boolean;
}

export interface SiteSettings {
  businessName: string;
  shortName?: string;
  logo?: ContentImage;
  phone: string; // canonical E.164, e.g. +919876543210
  phoneDisplay?: string; // human format
  whatsappNumber: string; // canonical E.164
  quoteEmail: string;
  address: {
    line1: string;
    line2?: string;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
    country: "IN";
  };
  googleMapsUrl: string;
  businessProfileUrl?: string;
  hours: BusinessHours[];
  gstin?: string;
  priceTaxLabel?: "inclusive" | "exclusive" | "varies" | "hidden";
  defaultQuoteResponseCopy?: string;
  socialLinks?: { label: string; url: string }[];
  seoDefaultTitle: string;
  seoDefaultDescription: string;
}

/**
 * Minimal Portable Text subset — rendered by a controlled component
 * (components/content/PortableText.tsx). Never rendered as raw HTML.
 */
export type PortableTextBlock =
  | { _type: "block"; style: "normal" | "h2" | "h3" | "blockquote"; children: { text: string; marks?: string[] }[]; markDefs?: { _key: string; _type: "link"; href: string }[] }
  | { _type: "list"; items: PortableTextBlock[]; ordered?: boolean }
  | { _type: "table"; head: string[]; rows: string[][] }
  | { _type: "callout"; variant: "info" | "warn"; text: string };

/** Filter taxonomy option for the catalogue UI. */
export interface FilterOption {
  value: string;
  label: string;
  count: number;
}
