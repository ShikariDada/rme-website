# Design Direction — Premium Tile Showroom Rebuild

Single source of truth for implementers. Research base: porcelanosa.com, tilebar.com, daltile.com, annsacks.kohler.com, cletile.com, fireclaytile.com, mytyles.com, orientbell.com (kajaria/somany/siteinspire/awwwards blocked or timed out).

Key patterns observed across the premium tier (Porcelanosa, Ann Sacks, Clé, Fireclay, TileBar): warm-neutral paper backgrounds, uppercase tracked kickers + sentence-case serif display, full-bleed material photography, hairline borders, square or near-square buttons, price-per-ft² on cards, no gradients anywhere, editorial storytelling bands between product grids. Mass-market Indian sites (MyTyles, Orientbell) are search-first and dense — we deliberately do NOT follow them; our reference set is the US/EU premium tier.

---

## 1. Palette

Sharpened warm-neutral system. Deeper ink, stone-toned muted surface, bronze accent + one supporting clay tone.

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#F4F0E8` | Page background. Slightly warmer/deeper than current `#F6F3ED` — reads as paper, not grey. |
| `surface` | `#FFFFFF` | Cards, raised panels. Kept pure white for contrast against bg. |
| `surface-muted` | `#E9E3D7` | Alternating section bands, footer. Stone-toned, less yellow than current. |
| `ink` | `#171512` | Primary text. Near-black warm charcoal — deeper than current `#1E1D1A`. |
| `ink-muted` | `#6B655C` | Secondary text, captions, meta. |
| `border` | `#D8D1C3` | Hairline borders only (1px). Never heavier. |
| `accent` (bronze) | `#7A5C36` | Primary CTA fill, active states, links on hover. Used sparingly, max one accent element per viewport. |
| `accent-2` (clay) | `#A4634A` | Supporting tone: italic emphasis words in display headlines, small badges, pull-quote marks. Never fills large areas. |
| `success` | `#4A6741` | In-stock badges only. |
| `danger` | `#9C3D2E` | Errors, low-stock. |

Accent discipline (learned from Porcelanosa/Ann Sacks): bronze appears on primary buttons, active nav underline, and price text on PDP. Clay appears only in italic headline words and tiny badges. Everything else is ink on paper.

## 2. Typography

Fraunces (display) + Inter (body/UI). Both variable.

- **Fraunces**: load variable font with `opsz` axis. Display sizes use `font-variation-settings: "opsz" 144; "SOFT" 0; "WONK" 0`. Tracking: `-0.02em` at display sizes, `-0.01em` at subheads. Never uppercase Fraunces — uppercase is reserved for Inter kickers.
- **Inter**: body `400`, UI labels `500`, kickers `500` uppercase with `letter-spacing: 0.12em`, size `11–12px`.
- **Scale** (rem, 1rem=16px): display `3.5rem/1.05` (hero), h1 `2.75rem/1.1`, h2 `2rem/1.15`, h3 `1.375rem/1.25`, body `1rem/1.6`, small `0.875rem/1.5`, kicker `0.75rem/1.4`.
- **Italics: BANNED** (user constraint, 2026-10). No italic emphasis anywhere. Non-italic Fraunces with a single clay () colored phrase carries the same emphasis.
- Numbers in stats/prices: Inter `500`, tabular figures (`font-feature-settings: "tnum"`).

## 3. Hero pattern

Direction chosen: **full-bleed material texture crop with left-aligned editorial block** (Porcelanosa/Ann Sacks model), NOT search-first (MyTyles) and NOT carousel (TileBar/Orientbell — carousels are the mass-market tell).

Layout:
- Full viewport width, `min-height: 88vh`. Background: one tight procedural texture crop (see §7), no overlay gradient — if text legibility needs it, a solid `bg` panel behind the text block instead.
- Text block: left-aligned, max-width `560px`, positioned lower-left with `padding: 96px 64px 64px`. Stack: kicker (Inter uppercase, e.g. "PORCELAIN · STONE · TERRACOTTA") → Fraunces display headline with one non-italic clay emphasis phrase → one sentence subline (Inter, ink-muted, max 40ch) → CTA row.
- CTAs: primary = solid bronze square button ("Browse the collection"); secondary = hairline-bordered square button ("Book a showroom visit"). 12px gap.
- Bottom-right corner: small caption line (Inter 12px, ink-muted) naming the texture shown, e.g. "Calacatta Viola — honed finish". This is the premium-material cue Clé uses.
- No stats in the hero. No badge pills. No animated anything.

## 4. Product card anatomy

Reference: Fireclay's bestseller grid + TileBar's collection cards, tightened.

- **Image**: 4:3 aspect ratio, `object-fit: cover`, corners `border-radius: 2px` (near-square — not fully sharp, not rounded; reads architectural). Full-bleed within card, no inner padding.
- **Body** (below image, 16px top gap, left-aligned):
  - Name: Inter 500, 15px, ink. Pattern: "[Name]" only — no size stuffed into title.
  - Meta line: Inter 400, 13px, ink-muted. "600×1200 · Polished porcelain".
  - Price: Inter 500, 15px, ink. Per-sqft format: "₹185/sq.ft" (Fireclay's per-ft² pattern, localized). If per-piece pricing exists, show it muted after: "· ₹740/pc".
- **Availability badge**: top-left of image, 8px offset. Solid `surface` background, 1px `border` hairline, 2px radius, Inter 500 11px uppercase, `letter-spacing: 0.08em`. "In stock" (success dot) / "Made to order" (ink) / "Low stock" (danger). One badge max. No pill shapes.
- **Hover**: image swaps to alternate crop/room scene (TileBar/Fireclay both do this) with 250ms crossfade; card lifts with `translateY(-2px)` and a single restrained shadow (see §6); name underlines in bronze. No zoom-scale on the image itself on cards (reserve zoom for PDP).
- Entire card is one link. No icon buttons on cards (no wishlist hearts on grid — mass-market tell).

## 5. Home section composition

Order (modeled on Ann Sacks / Fireclay, minus fake-stats risk):

1. Hero (§3)
2. **Material rail**: horizontal scroll strip of 6 material categories (Porcelain, Ceramic, Natural Stone, Terracotta, Mosaic, Outdoor). Each = 4:5 texture crop + name + count ("24 surfaces"). Hairline top/bottom borders frame the rail. Counts must come from real catalog data.
3. **Editorial split**: 50/50 — left full-bleed room scene, right `surface-muted` panel with kicker, Fraunces h2 (one italic word), 2-sentence copy, text link with arrow ("Explore bathroom surfaces →"). Alternate sides per section. (Porcelanosa's core rhythm.)
4. **Featured collection grid**: 8 product cards (§4), section header = kicker + h2 left, "View all →" right.
5. **Craft/service band**: `surface-muted` full-width band, 3 columns max — Showroom visits, Sample service, Design consultation. Each: Fraunces h3, 2 lines of copy, text link. NO icons in circles, NO stat counters. (Fireclay's services grid, de-iconed.)
6. **Second editorial split** (visualizer promo): copy left, visualizer screenshot/room scene right, CTA "Try the room visualizer".
7. **Footer**: `ink` background, `#F4F0E8` text. 4 columns: Visit (showroom address, hours, phone), Collections, Company, Support. Hairline `rgba(244,240,232,0.15)` dividers between columns. Bottom row: copyright + legal links. No social icon row above the fold of the footer; socials go small in the bottom row if at all.

Stat bands: only if numbers are real and verifiable (e.g., actual SKU count, years in business from OWNER_FACTS.md). Otherwise omit entirely.

## 6. Micro-detail kit

- **Borders**: 1px `#D8D1C3` hairlines everywhere. No 2px+ borders, no double borders.
- **Dividers**: full-width hairline between major sections; short 32px bronze rule (2px) above kickers in editorial panels only.
- **Spacing rhythm**: section padding `96px` desktop / `56px` mobile. Component internal padding `24–32px`. Grid gaps `24px` (cards), `64px` (editorial splits). Generous is the point — Porcelanosa/Ann Sacks win on whitespace.
- **Shadows**: one shadow only: `0 2px 8px rgba(23,21,18,0.06)` on card hover. Nothing else. No shadows at rest.
- **Buttons**: square (2px radius), padding `14px 28px`, Inter 500 13px uppercase, `letter-spacing: 0.1em`. Primary = bronze fill, paper text, hover darkens to `#6A4F2D`. Secondary = transparent, 1px ink border, hover fills ink. No pills.
- **Icons**: thin 1.5px stroke line icons (Lucide-style), ink color, 20px. Used only where functional (phone, pin, arrow). Never decorative icon rows.
- **Forms (quote/sample)**: labels Inter 500 12px uppercase above fields; inputs 48px tall, 1px `border`, 2px radius, `surface` bg, focus = 1px bronze border (no glow/ring). Submit = primary button full-width on mobile.
- **Price guide tables**: hairline row dividers only (no vertical rules, no zebra striping), tabular numbers right-aligned, header row = kicker style. Generous cell padding `16px 12px`.
- **Hover states**: links underline in bronze (1px, offset 3px); text links with arrows translate arrow 4px right. All transitions 200–250ms ease-out. No spring physics.

## 7. Imagery

- **Textures**: full-bleed tight crops, never floating swatches on white. Hero/category imagery at 16:9 or wider crops; material rail at 4:5; cards at 4:3. Consistent ratios per slot — mixed ratios in one grid is a mass-market tell.
- **Zoom-on-hover**: PDP gallery only (1.5×, follows cursor). Cards use image-swap instead (§4).
- **Procedural texture note**: our textures are procedurally generated, not photographed. To read premium they must: (a) render at ≥2048px on the long edge with visible surface variation (no flat tiling repeats — break repetition with large-scale tonal drift); (b) use realistic finish response — honed = matte, polished = subtle specular streak, never plastic gloss; (c) be cropped tight enough that grout lines/edges don't reveal tiling; (d) be graded warm to sit in the palette (slight lift toward `#F4F0E8` in highlights). If a texture reads as "CGI pattern" at hero size, crop tighter or use it only at card size. One perfect hero texture beats five mediocre ones.
- Room scenes (where used in editorial splits) should show the material in context with natural light and minimal staging — Clé/Fireclay standard.

## 8. Explicitly avoid (ship-blockers)

- Gradient backgrounds of any kind (including "subtle" warm washes and image-overlay gradients — use solid panels instead)
- Glassmorphism: frosted panels, backdrop-blur cards, translucent navs
- Glowing blobs, aurora backgrounds, floating orbs, ambient light effects
- Bento grids (mixed-size card mosaics)
- Generic copy: "Transform your space", "Elevate your home", "Discover endless possibilities", "Where design meets…" — write material-specific copy instead ("Porcelain that reads as quarried stone")
- Badge/pill proliferation: max one badge per card, no pill shapes anywhere
- Decorative icon rows with circles (the "4 value props with icons in circles" pattern)
- Animated counters / counting-up stats
- Hero carousels with auto-rotation
- Rounded-xl cards, pill buttons, soft pastel shadows
- Emoji in UI, star-rating widgets on the homepage
- Fake stats, fake review counts, fake "as seen on" logos — every number must trace to OWNER_FACTS.md or real catalog data


## 9. Ship rules learned on this build

- Production Turbopack DROPS every bracket arbitrary-value utility (text-[13px] etc.) even in static export; dev looks fine. All spacing/sizes/colors/shadows must be shipped as  tokens,  definitions, or standard utilities. No bracket classes anywhere.
- Header chrome is INK (#171512) with paper text and a bare Fraunces "RME" wordmark lockup with a tracked "Marble · Tiles · Granite" kicker (xl+ only). Brand green (#1FA855) is reserved for actual WhatsApp contact moments (sticky mobile bar, floating bubble, form rails); the header CTA is walnut bronze.
- Rendering QA: screenshot home, products, PDP, visualizer, contact at 1440x900 AND 390x844 before shipping.
- No em dashes in any user-visible copy (search  content/seed, app, components, src).
