# Content guide

How content flows through the site, and the rules each field type must
follow. Read this together with `docs/OWNER_FACTS.md`.

## Where content lives

- **Local demo mode (default):** `content/seed/*.json` powers the whole site
  when `NEXT_PUBLIC_SANITY_PROJECT_ID` is unset. Regenerate programmatically
  with `npm run build:seed`. All values are demo placeholders.
- **Sanity mode:** set `NEXT_PUBLIC_SANITY_PROJECT_ID` (+ dataset). Schema
  definitions in `sanity/schemas/` mirror `lib/types.ts`. Bulk import via
  `npm run import:products` (CSV; see below). Publish → webhook to
  `/api/revalidate` revalidates tagged pages.

## Product fields that carry rules

### Pricing modes (`pricing.mode`) — website spec §11.1
| mode | renders | requires |
|---|---|---|
| `exact` | `₹68 / sq ft` (+ optional box price) | `amount > 0` |
| `from` | `From ₹92 / sq ft` | `amount > 0` |
| `range` | `₹120–₹155 / sq ft` | `min > 0`, `max ≥ min` |
| `quote` | "Price varies by lot — ask for current quote." | nothing |

Never fake a number. `updatedAt` on every price — `npm run audit:content`
warns after 30 days. The UI always shows the verification date.

### Availability (`availability.status`)
`ready_stock` (in the godown today) / `limited` (current batch nearly gone) /
`order_basis` (typically 10–12 days) / `unavailable`. Exact quantities are
never shown unless connected to a maintained inventory source. `verifiedAt`
should be refreshed with stock checks.

### Images
Every image needs: descriptive `alt`, `kind` (product/texture/closeup/installed),
`source`, and `rightsStatus` (`owned` / `manufacturer-approved` / `licensed` /
`unknown`). **Products may not publish with `rightsStatus: "unknown"` on
primary images.** Never: competitor watermarks, AI-generated "installed
scenes" presented as real projects, unlicensed manufacturer assets.

### Visualizer textures (products that appear in "See it in your room")
Straight-on capture, even lighting, one clean tile face per image, cropped to
the physical aspect ratio, real dimensions in mm, 4–12 faces for
marble/wood-look prints. Do not denoise/sharpen/AI-enhance a product texture
into something the customer can't buy. The site exposes a product to the
visualizer only when `visualizerMaterialId` maps to a known texture set AND
physical dimensions exist.

### Natural stone
Always fill `stone.variationNote`. Slabs are sold with lot variation explained;
photographs are representative, never a guarantee of delivered grain.

## The Varmora authorized-dealer claim
The homepage/brand-page claim is hard-gated on the brand record's
`isAuthorizedDealerClaimAllowed`. Enable it only with written confirmation,
and set `assetUsageApproved` for logo usage. Never hard-code manufacturer
statistics — they change; local stock truth is the trust signal.

## CSV import workflow
1. Copy `content/PRODUCT_TEMPLATE.csv`; keep the header row exactly.
2. Multiple values use `;` (applications, categories, colours, looks).
3. Blank price cells are safe: they fall back to `quote` mode — never ₹0.
4. `npm run import:products -- --dry-run file.csv` validates every row first.
5. Real import: `npm run import:products -- file.csv` (needs Sanity env vars
   + write token). Rows upsert by SKU; editorial fields only overwritten when
   their columns are present.
6. After import: upload/attach images in the Studio, set `rightsStatus`,
   write alt text, verify prices.

## Editorial voice
- Timestamps matter; ranges beat fake precision; explain what changes price.
- Guides: what decision does this help make? Comparison tables where useful;
  last-updated date; links to real products; no SEO filler.
- No doorway pages (city-farm spam), no invented reviews, no fake counts.
