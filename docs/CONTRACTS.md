# IMPLEMENTATION CONTRACTS — READ FIRST (agents)

Project: marble/tile retail website (Next.js 16.3.5 + React 19 + TS strict + Tailwind 4.3) with an in-house WebGL visualizer. Root: `D:\Projects\Tile_Visualizer`.

This file is the integration contract between all agents. **Do not modify files outside your assigned list. Do not run `npm install`. Do not run `next build`. You may run `npx vitest run <your-test-file>` and `npx tsc --noEmit` to check your own work.**

## 0. Global conventions

- **TypeScript strict.** No `any`. No non-null `!` unless obviously safe. Import shared types from `@/lib/types`, engine types from `@visualizer/engine` (workspace package, TS source, works via transpilePackages).
- **Path alias** `@/*` maps to repo root (`@/lib/...`, `@/components/...`).
- **Styling:** Tailwind 4 utility classes only, using the semantic tokens registered in `app/globals.css`: colors `bg`, `surface`, `surface-muted`, `text`, `text-muted`, `border`, `accent`, `accent-hover`, `accent-soft`, `danger`, `success`, `focus`; fonts `font-display` (Fraunces) / `font-body` (Inter); radii `rounded-sm|md|lg`. NEVER raw hex (except the WhatsApp green `#1fa855` used in CTAs). Radius: restrained (`rounded-md` default, `rounded-lg` cards/sheets).
- **No design-slop** (spec §8.7): no gradients-as-decoration, no glassmorphism, no bento grids, no emoji icons, no animated counters, no gradient text. Material imagery carries the design.
- **A11y (WCAG 2.2 AA):** semantic landmarks, one `h1` per page, labelled controls (`htmlFor`), errors tied to fields with `role="alert"`, visible focus (`:focus-visible` styled globally), 44px touch targets for primary controls, `aria-current` on breadcrumbs, alt text mandatory, empty alt for decorative.
- **Mobile-first.** Every page must be checked at 360–400px width mentally: stacks, full-width CTAs, sticky bottom bars do not cover content (`main` has `pb-16 md:pb-0` already).
- **Server components by default.** `"use client"` only for interaction: filters UI, dialogs, gallery, calculator, forms, analytics hooks.
- **Analytics:** import `{ track }` from `@/lib/analytics/track`. Events + params per `docs/ANALYTICS_EVENTS.md` table below. Never send PII.
- **Links:** internal via `next/link`; external `target="_blank" rel="noopener noreferrer"`. WhatsApp links are external.
- **Comments:** only for non-obvious constraints. No AI-narration comments.
- **Next.js 16:** `params`/`searchParams` in pages are **Promises — await them**. `generateMetadata` same. Route handlers: `export async function POST(request: Request)`.

## 1. Existing foundation (already written — import, don't rewrite)

### Data layer
- `lib/types.ts` — all content types (Product, Brand, Category, Application, Project, Guide, Faq, SiteSettings, ContentImage, Pricing, PortableTextBlock…).
- `lib/data` — `contentSource.getSettings/getProducts/getProductBySlug/getBrands/getBrandBySlug/getCategories/getCategoryBySlug/getApplications/getApplicationBySlug/getProjects/getProjectBySlug/getGuides/getGuideBySlug/getFaqs/getTestimonials/getAnnouncements`; helpers `getVisibleProducts`, `getFeaturedProducts(limit)`, `getRelatedProducts(product, limit)`, `getActiveAnnouncement()`.
- `contentSource` currently serves local seed data (`content/seed/*.json`, 25 products).

### Logic libs (all unit-tested)
- `lib/pricing/format` — `formatINR`, `formatUnit`, `formatDate`, `getPriceDisplay(product) → {primary, secondary?, offer?, isQuote}`, `taxSuffix(product, settings)`, `availabilityLabel(a)`, `priceUpdatedAt(product)`.
- `lib/whatsapp` — `buildWhatsAppUrl({phoneE164, message})`, `buildProductWhatsAppUrl(product, phoneE164, canonicalUrl)`, `buildRoomPhotoMessage(name, url)`, `buildMaterialListMessage()`, `buildGeneralEnquiryMessage(source)`, `buildVisualizerShareMessage({productNames, skus})`, `buildQuoteReferenceMessage({reference, summary})`.
- `lib/calculator/quantity` — `calculateTileQuantity({areaSqFt?|rows?, wastagePercent, coverageSqFtPerBox?, tilesPerBox?}) → {netAreaSqFt, requiredAreaSqFt, boxes?, coveragePurchasedSqFt?, tiles?}`, `calculateStoneQuantity`, `rowAreaSqFt`, `toFeet`, `CalculatorInputError`, `formatSqFt`. Throws `CalculatorInputError` on bad input. LengthUnit: ft|in|m|cm.
- `lib/catalogue/filters` — `parseFilters(sp)`, `filtersToSearchParams(state)`, `applyCatalogue(products, state) → {items, total, page, pageCount}`, `countActiveFilters`, `catalogueIndexPolicy`, `SORT_OPTIONS`, `PRICE_BANDS`, `PAGE_SIZE=12`, type `CatalogueFilterState`, `slugOf`.
- `lib/search/synonyms` — `normalizeQuery`, `scoreMatch`, `sizeAliasesFor`.
- `lib/seo/metadata` — `pageMetadata({title, description, path, images?, noindex?, type?, publishedTime?, modifiedTime?})`, `DEFAULT_OG_IMAGE`.
- `lib/seo/jsonld` — `localBusinessJsonLd(settings)`, `productJsonLd(product, settings)`, `breadcrumbJsonLd(items)`, `articleJsonLd({...})`.
- `lib/validation/quote` — zod `quoteFormSchema` (name, phone, city, products?, areaSqFt?, projectType?, message?, consent=true, websiteUrl honeypot, turnstileToken?, sourceSurface?), types `QuoteFormInput`/`QuoteFormData`.
- `lib/analytics/track` — `track(event, params)`, `ANALYTICS_EVENTS`, wrappers `trackWhatsAppClick/trackCallClick/trackDirectionsClick`.
- `lib/utils` — `cn`, `slugify`, `siteUrl`, `absoluteUrl`, `shortCode`, `clamp`, `isValidEmail`, `normalizeIndianPhone`.
- `lib/visualizer/materials` — `getVisualizerMaterials()`, `getVisualizerMaterial(idOrSlug)` → engine `VisualizerMaterial[]`.

### UI components (already written)
- `components/ui/Button` — `Button`, `ButtonLink` (props: variant primary|secondary|text|destructive|whatsapp, size sm|md|lg), `TextLink`, `buttonClasses`.
- `components/ui/Input` — `Input`, `Textarea`, `Select`, `Checkbox`, `FieldLabel({htmlFor, hint, required})`, `FieldError({id, message})`.
- `components/ui/Primitives` — `Badge(tone)`, `Container`, `SectionHeader({title, description, action})`, `Skeleton`.
- `components/ui/Dialog` — `Dialog({open, onClose, title, children, variant: "dialog"|"sheet"})` — native dialog, Escape/backdrop close, focus managed.
- `components/ui/Accordion` — `Accordion({items:[{id,question,answer}]})`, `Breadcrumb({items:[{name, href?}]})`.
- `components/catalogue/ProductCard` — `ProductCard({product, priority?, className?})`, `ProductGrid({products, columns?})`, `EmptyResults({query?})`.
- `components/catalogue/AvailabilityBadge` — `AvailabilityBadge({product})`.
- `components/layout/*` — Header (desktop nav + mobile sheet + search), Footer, AnnouncementBar, StickyMobileContactBar (Call|WhatsApp|Quote on mobile; shows on ALL site pages; on product pages Quote links to `/contact?ref=<path>`).
- `app/layout.tsx` (fonts, GA provider), `app/(site)/layout.tsx` (skip link, announcement, header, footer, sticky bar, main#main-content). `app/globals.css` tokens.

### Visualizer engine (exists, tested)
`@visualizer/engine` exports: geometry (`solveHomography`, `homographyFromQuad`, `applyH`, `inverseH`, `validateQuad`, `polygonArea`, `pointInPolygon`, `scaleFromCalibrationLine`, `approximateScale`, `calibrationFromImagePoints`, `planeDistanceMm`, `CalibrationError`), patterns (`evaluatePattern`, `patternUniforms`, `isGrout`, `effectiveRotationDeg`, `V1_LAYOUTS`), materials (`VisualizerMaterial`, `isVisualizerReady`, `selectFace`, `hashCell`, `FINISH_PROFILES`, `siteFinishToFinishType`), masks (`createMask`, `rasterizePolygon`, `brushStamp`, `blurMask`, `thresholdMask`, `MaskBuffer`), lighting (`computeIlluminationMap`, `luminanceLinear`).
Project/scene types: `src/features/visualizer/state/types.ts` (`VisualizerProject`, `VisualizerSurface`, `createEmptySurface`, `newId`).
Bridge contract: `src/features/visualizer/bridge/rendererTypes.ts` (`SurfaceRenderState`, `EngineCapabilities`, `IVisualizerRenderer`, `IExportRenderer`, `ContextLossHandlers`).

## 2. Page spec quick reference

- **Home `/`**: announcement (auto), hero (positioning line, subline, CTAs "Browse products" + WhatsApp; NO gradient stock hero — use a texture image with honest framing), browse-by-room + material rails (real counts from data), Varmora block (only if `brand.isAuthorizedDealerClaimAllowed` — say "Authorised Varmora Dealer" + featured products + CTA), ready-stock grid (8 products), "See it in your room" section (CTA to /visualizer + manual WhatsApp room-photo service explanation), price guidance + calculator teaser (category priceGuide entries with lastUpdated), projects (3), guides (3), showroom block (address/hours/call/WhatsApp/directions), FAQ (site scope, Accordion) + JSON-LD LocalBusiness.
- **/products**: reads `searchParams` (await) → `parseFilters` → `applyCatalogue(contentSource.getProducts())`. Sticky search+filter bar under header; `FilterSheet` (client, bottom sheet via Dialog variant="sheet") with FilterGroups (brand, room, size, finish, look, colour, use, availability, priceBand); `ActiveFilterChips` (keyboard-removable links); `SortSelect`; grid via `ProductGrid`; `Pagination` (links preserving params); `EmptyResults` when 0; `search_zero_results` tracking; metadata: title/description vary by material facet; `catalogueIndexPolicy` decides robots noindex + canonical.
- **/product/[slug]**: order per spec §11: breadcrumbs, gallery (client, swipe/keyboard), brand+name h1, SKU/family, price block (getPriceDisplay + taxSuffix + priceUpdatedAt), availability + note, CTAs (WhatsApp check-stock primary, "See this in your room" → `/visualizer?material=<id>` when `product.visualizerMaterialId` maps, call secondary), key specs (SpecGrid — only populated fields), quantity calculator (client embed), description/care/installation (PortableText), related products, product-scope FAQs, JSON-LD Product+Offer+Breadcrumb. `generateMetadata` + `generateStaticParams`? (not required; dynamic fine). 404 via `notFound()`.
- **Calculator page** `/tile-calculator`: mode A area / mode B rows (add/remove), unit select ft|in|m|cm, wastage slider 0–20 default 10 labelled planning estimate, boxes/tiles/coverage result, disclaimer, link products, `calculator_start`/`calculator_complete` events.
- **Category routes** `/tiles`, `/marble`, `/granite`: editorial intro (2–4 sentences), price guide table (priceGuide + lastUpdated), product grid filtered by materialType, related guide links, FAQ. No doorway pages.
- **/room/[slug]**, **/brand/[slug]** (+ `/brand/varmora` gated claim), **/projects**, **/projects/[slug]**, **/guides**, **/guides/[slug]** (Article JSON-LD, `guide_to_product_click` on product links), **/showroom** (hours table, map iframe loads on interaction only, directions CTA `directions_click`, LocalBusiness JSON-LD), **/contact** (QuoteForm), **/about**, **/privacy** (DPDP-aware, processors list), **/terms**.
- **/sitemap.ts**: static routes + all products/rooms/brands/projects/guides/categories. **/robots.ts**: disallow `/api/`.

## 3. Analytics events (docs/ANALYTICS_EVENTS.md — agents: create per table)

| Event | Params | Fires when |
|---|---|---|
| view_product | product_sku, brand_slug, material_type, page_type | PDP render (client effect) |
| search_submit | source_surface | search dialog submit |
| search_zero_results | source_surface | results page with q and 0 results |
| filter_apply | filter_name, filter_value, source_surface | any filter chip/sort change |
| calculator_start / calculator_complete | source_surface, page_type | calculator first edit / successful result |
| whatsapp_click | source_surface, product_sku? | any WhatsApp CTA |
| call_click | source_surface | tel: CTA |
| quote_form_start / _submit / _error | source_surface | quote form lifecycle (error params: reason only) |
| directions_click | source_surface | maps directions |
| visualizer_open / _product_selected / _export / _quote_click | source_surface, product_sku? | visualizer funnel |
| guide_to_product_click | product_sku, source_surface | guide body product link |

## 4. Visualizer architecture (agents: ENG, VUI, AI)

- **VUI owns** `src/features/visualizer/**` (ui/, state/, bridge/rendererClient.ts, storage/, share/, analytics/visualizerEvents.ts) + `app/(site)/visualizer/page.tsx`.
- **ENG owns** `packages/visualizer-engine/src/renderer|shaders|materials/textureManager...` implementing `IVisualizerRenderer`/`IExportRenderer` per `rendererTypes.ts`. Three.js WebGL2 + custom ShaderMaterial. Deterministic. Fragment pipeline: roomUV → mask → H⁻¹ → plane mm → pattern cell/face/grout → atlas sample (textureGrad with analytic derivatives) → linear lighting × illumination → composite. Draw order: room background quad → surfaces sorted by z with alpha blending (mask feather from mask texture). Multiple surfaces supported. Context-loss handled, full disposal, mipmaps + anisotropy from capabilities.
- **AI owns** `packages/visualizer-ai/**` + `scripts/ai/prepare-models.mjs` + `public/visualizer-models/README.md`. MobileSAM two-session (encoder once/image, decoder per prompt) via onnxruntime-web 1.30 (`onnxruntime-web/webgpu` import; `ort.env.wasm.wasmPaths = "/visualizer-wasm/"`; EP `["webgpu"]` catch → `["wasm"]`; fetch model → ArrayBuffer; cache in OPFS/IndexedDB). Feature-flagged, lazy, worker-only, graceful unavailable fallback. 1024×1024 input, ImageNet mean/std.

Feature flags `src/features/visualizer/flags.ts` (VUI): `{ smartSelect: true, sam2Experiment: false, depthAssist: false, pbrMaps: false, herringbone: false, bookmatch: false, offlinePwa: false }`.

## 5. Demo-data honesty

All seed content is DEMO placeholder data (marked in file headers). Never render fake reviews, fake ratings, or fabricated stats. Empty testimonials render nothing. The announcement bar is inactive by default.
