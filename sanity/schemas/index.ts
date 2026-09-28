/**
 * Sanity schema definitions (website spec §12) — plain objects, mirroring
 * lib/types.ts. Import into a Sanity Studio config's `schemaTypes` array.
 * Validation rules enforce the content rules from the spec (§12.5).
 */

export const siteSettings = {
  name: "siteSettings",
  type: "document",
  title: "Site settings",
  __experimental_actions: ["update", "publish"], // singleton: no create/delete
  fields: [
    { name: "businessName", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "shortName", type: "string" },
    { name: "logo", type: "image" },
    { name: "phone", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "phoneDisplay", type: "string" },
    { name: "whatsappNumber", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "quoteEmail", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    {
      name: "address",
      type: "object",
      fields: [
        { name: "line1", type: "string" },
        { name: "line2", type: "string" },
        { name: "locality", type: "string" },
        { name: "city", type: "string" },
        { name: "state", type: "string" },
        { name: "postalCode", type: "string" },
        { name: "country", type: "string", initialValue: "IN" },
      ],
    },
    { name: "googleMapsUrl", type: "url" },
    { name: "businessProfileUrl", type: "url" },
    {
      name: "hours",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "day", type: "string" },
            { name: "opens", type: "string" },
            { name: "closes", type: "string" },
            { name: "closed", type: "boolean" },
          ],
        },
      ],
    },
    { name: "gstin", type: "string" },
    {
      name: "priceTaxLabel",
      type: "string",
      options: { list: ["inclusive", "exclusive", "varies", "hidden"] },
    },
    { name: "defaultQuoteResponseCopy", type: "text" },
    {
      name: "socialLinks",
      type: "array",
      of: [{ type: "object", fields: [{ name: "label", type: "string" }, { name: "url", type: "url" }] }],
    },
    { name: "seoDefaultTitle", type: "string" },
    { name: "seoDefaultDescription", type: "text" },
  ],
};

export const brand = {
  name: "brand",
  type: "document",
  title: "Brand",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" }, validation: (r: { required: () => unknown }) => r.required() },
    { name: "logo", type: "image" },
    { name: "description", type: "text" },
    { name: "officialUrl", type: "url" },
    { name: "isFeatured", type: "boolean", initialValue: false },
    {
      name: "isAuthorizedDealerClaimAllowed",
      type: "boolean",
      initialValue: false,
      description:
        "Enable ONLY with written dealer confirmation. Gates the public 'Authorised dealer' claim.",
    },
    {
      name: "authorizationEvidenceNote",
      type: "text",
      description: "Studio-only editorial note. Never rendered publicly.",
    },
    { name: "assetUsageApproved", type: "boolean", initialValue: false },
    { name: "sortOrder", type: "number", initialValue: 100 },
  ],
};

export const category = {
  name: "category",
  type: "document",
  title: "Category",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" }, validation: (r: { required: () => unknown }) => r.required() },
    {
      name: "materialType",
      type: "string",
      options: { list: ["tile", "marble", "granite", "quartz", "sanitaryware", "adhesive", "other"] },
      validation: (r: { required: () => unknown }) => r.required(),
    },
    { name: "heroImage", type: "image", fields: [{ name: "alt", type: "string" }] },
    { name: "summary", type: "text", validation: (r: { required: () => unknown }) => r.required() },
    { name: "buyingGuideBody", type: "array", of: [{ type: "block" }] },
    {
      name: "priceGuide",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", type: "string" },
            { name: "min", type: "number" },
            { name: "max", type: "number" },
            { name: "unit", type: "string", options: { list: ["sq_ft", "box", "piece", "slab", "set"] } },
            { name: "lastUpdated", type: "datetime" },
          ],
        },
      ],
    },
  ],
};

export const application = {
  name: "application",
  type: "document",
  title: "Application / Room",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" }, validation: (r: { required: () => unknown }) => r.required() },
    { name: "kind", type: "string", options: { list: ["room", "surface", "use-case"] } },
    { name: "description", type: "text" },
    { name: "image", type: "image", fields: [{ name: "alt", type: "string" }] },
    {
      name: "recommendedProductTypes",
      type: "array",
      of: [{ type: "string" }],
    },
  ],
};

export const product = {
  name: "product",
  type: "document",
  title: "Product",
  fields: [
    { name: "name", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "name" }, validation: (r: { required: () => unknown }) => r.required() },
    {
      name: "sku",
      type: "string",
      validation: (r: { required: () => { unique: () => unknown } }) => r.required().unique(),
    },
    { name: "familyKey", type: "string" },
    { name: "brand", type: "reference", to: [{ type: "brand" }] },
    {
      name: "materialType",
      type: "string",
      options: { list: ["tile", "marble", "granite", "quartz", "sanitaryware", "adhesive", "other"] },
      validation: (r: { required: () => unknown }) => r.required(),
    },
    { name: "categories", type: "array", of: [{ type: "reference", to: [{ type: "category" }] }] },
    { name: "applications", type: "array", of: [{ type: "reference", to: [{ type: "application" }] }] },
    {
      name: "status",
      type: "string",
      options: { list: ["active", "hidden", "discontinued"] },
      initialValue: "active",
    },
    { name: "featured", type: "boolean", initialValue: false },
    { name: "newArrival", type: "boolean", initialValue: false },
    {
      name: "pricing",
      type: "object",
      fields: [
        {
          name: "mode",
          type: "string",
          options: { list: ["exact", "from", "range", "quote"] },
          validation: (r: { required: () => unknown }) => r.required(),
        },
        { name: "currency", type: "string", initialValue: "INR", readOnly: true },
        {
          name: "unit",
          type: "string",
          options: { list: ["sq_ft", "box", "piece", "slab", "set"] },
          validation: (r: { required: () => unknown }) => r.required(),
        },
        { name: "amount", type: "number" },
        { name: "min", type: "number" },
        { name: "max", type: "number" },
        { name: "boxAmount", type: "number" },
        { name: "taxLabel", type: "string", options: { list: ["inclusive", "exclusive", "varies"] } },
        { name: "updatedAt", type: "datetime" },
      ],
      validation: (r: {
        custom: (fn: (v: unknown) => string | true) => unknown;
      }) =>
        r.custom((v) => {
          const p = (v ?? {}) as { mode?: string; amount?: number; min?: number; max?: number };
          const amt = typeof p.amount === "number" ? p.amount : 0;
          const min = typeof p.min === "number" ? p.min : 0;
          const max = typeof p.max === "number" ? p.max : 0;
          if (p.mode === "exact" && !(amt > 0)) return "exact mode requires amount > 0";
          if (p.mode === "from" && !(amt > 0)) return "from mode requires amount > 0";
          if (p.mode === "range" && (!(min > 0) || !(max >= min)))
            return "range mode requires min > 0 and max ≥ min";
          return true;
        }),
    },
    {
      name: "availability",
      type: "object",
      fields: [
        {
          name: "status",
          type: "string",
          options: { list: ["ready_stock", "limited", "order_basis", "unavailable"] },
        },
        { name: "verifiedAt", type: "datetime" },
        { name: "publicNote", type: "string" },
      ],
    },
    {
      name: "images",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "asset", type: "image" },
            {
              name: "alt",
              type: "string",
              description: "Mandatory for public images",
              validation: (r: { required: () => unknown }) => r.required(),
            },
            { name: "kind", type: "string", options: { list: ["product", "texture", "closeup", "installed", "detail"] } },
            { name: "source", type: "string" },
            {
              name: "rightsStatus",
              type: "string",
              options: { list: ["owned", "manufacturer-approved", "licensed", "unknown"] },
            },
          ],
          preview: { select: { title: "alt", subtitle: "rightsStatus" } },
        },
      ],
    },
    { name: "colorFamily", type: "array", of: [{ type: "string" }], options: { layout: "tags" } },
    { name: "look", type: "array", of: [{ type: "string" }], options: { layout: "tags" } },
    { name: "finish", type: "array", of: [{ type: "string" }], options: { layout: "tags" } },
    {
      name: "tile",
      type: "object",
      fields: [
        { name: "widthMm", type: "number" },
        { name: "heightMm", type: "number" },
        { name: "thicknessMm", type: "number" },
        { name: "bodyType", type: "string" },
        { name: "use", type: "array", of: [{ type: "string", options: { list: ["floor", "wall"] } }] },
        { name: "tilesPerBox", type: "number" },
        { name: "coverageSqFtPerBox", type: "number" },
        { name: "faces", type: "number" },
        { name: "slipRating", type: "string", description: "Only if manufacturer-documented" },
        { name: "waterAbsorption", type: "string", description: "Only if manufacturer-documented" },
      ],
    },
    {
      name: "stone",
      type: "object",
      fields: [
        { name: "thicknessOptionsMm", type: "array", of: [{ type: "number" }] },
        { name: "slabSizeText", type: "string" },
        { name: "origin", type: "string", description: "Only if verified" },
        { name: "variationNote", type: "text" },
      ],
    },
    { name: "description", type: "array", of: [{ type: "block" }] },
    { name: "care", type: "array", of: [{ type: "block" }] },
    { name: "installationNotes", type: "array", of: [{ type: "block" }] },
    { name: "relatedProducts", type: "array", of: [{ type: "reference", to: [{ type: "product" }] }] },
    { name: "manufacturerProductUrl", type: "url" },
    { name: "sourceLastCheckedAt", type: "datetime" },
    { name: "visualizerMaterialId", type: "string", description: "Links to the visualizer texture set" },
  ],
};

export const project = {
  name: "project",
  type: "document",
  title: "Project",
  fields: [
    { name: "title", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "title" }, validation: (r: { required: () => unknown }) => r.required() },
    {
      name: "projectType",
      type: "string",
      options: { list: ["residential", "commercial", "hospitality", "other"] },
    },
    { name: "locationLabel", type: "string", description: "City/area granularity only — never street address" },
    { name: "completionDate", type: "date" },
    { name: "summary", type: "text" },
    { name: "images", type: "array", of: [{ type: "image", fields: [{ name: "alt", type: "string" }] }] },
    { name: "productsUsed", type: "array", of: [{ type: "reference", to: [{ type: "product" }] }] },
    {
      name: "clientPermissionConfirmed",
      type: "boolean",
      description: "Required true before publishing real client photography",
    },
    { name: "featured", type: "boolean", initialValue: false },
  ],
};

export const guide = {
  name: "guide",
  type: "document",
  title: "Guide",
  fields: [
    { name: "title", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "slug", type: "slug", options: { source: "title" }, validation: (r: { required: () => unknown }) => r.required() },
    { name: "excerpt", type: "text" },
    { name: "body", type: "array", of: [{ type: "block" }] },
    { name: "heroImage", type: "image", fields: [{ name: "alt", type: "string" }] },
    { name: "categoryRefs", type: "array", of: [{ type: "reference", to: [{ type: "category" }] }] },
    { name: "productRefs", type: "array", of: [{ type: "reference", to: [{ type: "product" }] }] },
    { name: "authorLabel", type: "string" },
    { name: "publishedAt", type: "datetime" },
    { name: "updatedAt", type: "datetime" },
  ],
};

export const testimonial = {
  name: "testimonial",
  type: "document",
  title: "Testimonial",
  fields: [
    { name: "quote", type: "text", validation: (r: { required: () => unknown }) => r.required() },
    { name: "reviewerDisplayName", type: "string" },
    { name: "source", type: "string", options: { list: ["direct", "google", "project"] } },
    { name: "sourceUrl", type: "url" },
    {
      name: "permissionConfirmed",
      type: "boolean",
      description: "Never publish a testimonial without it",
    },
    { name: "publishedAt", type: "datetime" },
  ],
};

export const faq = {
  name: "faq",
  type: "document",
  title: "FAQ",
  fields: [
    { name: "question", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "answer", type: "text", validation: (r: { required: () => unknown }) => r.required() },
    { name: "scope", type: "string", options: { list: ["site", "product", "category", "showroom"] } },
    { name: "relatedProduct", type: "reference", to: [{ type: "product" }] },
    { name: "relatedCategory", type: "reference", to: [{ type: "category" }] },
    { name: "sortOrder", type: "number", initialValue: 100 },
  ],
};

export const announcement = {
  name: "announcement",
  type: "document",
  title: "Announcement",
  fields: [
    { name: "text", type: "string", validation: (r: { required: () => unknown }) => r.required() },
    { name: "href", type: "string" },
    { name: "startAt", type: "datetime" },
    { name: "endAt", type: "datetime" },
    { name: "isActive", type: "boolean", initialValue: false },
  ],
};

export const schemaTypes = [
  siteSettings,
  brand,
  category,
  application,
  product,
  project,
  guide,
  testimonial,
  faq,
  announcement,
];
