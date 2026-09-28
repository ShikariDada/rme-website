# Rajasthan Marble Enterprises (RME) — retail site + in-house visualizer

A marble/tile/stone retail website (showcase + WhatsApp/quote lead
generation) with a **custom in-house room visualizer**, built to the two
project specifications:

- `FINAL_Marble_Tile_Retail_Website_Build_Spec` — website (Next.js 16 App
  Router, TypeScript strict, Tailwind 4, Sanity-ready CMS, quote API,
  calculator, SEO/a11y/performance rules).
- `CUSTOM_IN_HOUSE_TILE_VISUALIZER_BUILD_SPEC` — visualizer (deterministic
  WebGL2/Three.js compositor, homography + patterns + grout + illumination,
  manual-first editing, optional self-hosted Smart Select).

> **Most seed data is DEMO content.** The business name, phone and address are owner-supplied; prices,
> stock states and the Varmora dealer claim are structural placeholders.
> Replace them before launch — see `docs/OWNER_FACTS.md`.

## Quick start

```bash
npm install
npm run generate:assets   # procedural demo textures + sample rooms (idempotent)
npm run build:seed        # regenerate demo seed JSON
npm run dev               # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

Quality gates:

```bash
npm run typecheck         # tsc --noEmit (strict)
npm test                  # vitest — homography, patterns, calibration, calculator,
                          # pricing, WhatsApp templates, filters, quote schema, state/history
npm run audit:content     # content QA (stale prices, rights, alts, duplicates)
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Home: hero, room/material rails, Varmora block (gated), ready stock, see-in-your-room, price guidance, projects, guides, showroom, FAQ |
| `/products` | URL-driven catalogue: search (Indian size synonyms), 9 filter facets, sort, pagination, canonical/noindex policy |
| `/product/[slug]` | PDP per spec §11 (gallery, price modes, availability, CTAs, specs, calculator embed, related, JSON-LD) |
| `/tiles` `/marble` `/granite` | Category pages with price guidance + editorial layer |
| `/room` + `/room/[slug]` | Browse by room/application |
| `/brand/[slug]` | Brand pages; Varmora claim gated on `isAuthorizedDealerClaimAllowed` |
| `/projects` `/guides` | Real-content pages with Article JSON-LD |
| `/tile-calculator` | Deterministic quantity calculator (area or multi-row dimensions, wastage) |
| `/visualizer` | The in-house editor (see below) |
| `/showroom` `/contact` `/about` `/privacy` `/terms` | Local/business/legal pages |
| `/api/quote` | Zod-validated, honeypot, rate-limited, Turnstile-optional, Resend email, reference codes |
| `/api/revalidate` | Secret-tagged content webhook |
| `/sitemap.xml` `/robots.txt` | Generated from live content |

## Visualizer (`/visualizer`)

- Upload your own photo (stays on-device; nothing uploaded) or pick a preset
  room with known geometry.
- Drag corner handles (or use numeric inputs) to mark floor/wall; the tile
  renders with correct aspect ratio, perspective, running-bond/diagonal
  layouts, grout in material space, multiple production faces, and the
  original room's illumination/shadows preserved.
- Erase the mask to keep furniture in front. Undo/redo with drag coalescing.
- Calibrate with a known length for true scale — otherwise the UI says
  **Approximate scale**.
- Export a high-res image or a design card; share via the OS share sheet or
  download + WhatsApp fallback (a `wa.me` link cannot attach files — the
  customer attaches the saved preview themselves).
- Smart Select (MobileSAM segmentation) is code-complete but hidden until
  weights are self-hosted (`scripts/ai/prepare-models.mjs`,
  `docs/MODEL_LICENSES.md`).

## Repository map

```
app/                    # App Router routes ((site) group + APIs)
components/             # ui primitives, layout, catalogue, product, forms, home…
lib/                    # types, data layer (Sanity-or-seed), pricing, whatsapp,
                        # calculator, filters, search, seo, validation, analytics
packages/visualizer-engine/   # Layer A + pure math (three.js, zero React)
packages/visualizer-ai/       # Layer C (onnxruntime-web, MobileSAM, worker)
src/features/visualizer/      # React editor: state, bridge, storage, share, ui
sanity/schemas/         # CMS schema definitions mirroring lib/types.ts
scripts/                # seed builder, asset generator, CSV importer, auditor
content/seed/           # DEMO dataset (replace per docs/OWNER_FACTS.md)
docs/                   # OWNER_FACTS, CONTENT_GUIDE, ANALYTICS_EVENTS,
                        # LAUNCH_CHECKLIST, VISUALIZER_INHOUSE_PLAN,
                        # MODEL_LICENSES, THIRD_PARTY_NOTICES, CONTRACTS
tests/unit/             # vitest suites
```

## Environment

Copy `.env.example` → `.env.local`. Everything runs without env vars (local
seed + no email/GA); set `NEXT_PUBLIC_SANITY_PROJECT_ID`, `RESEND_API_KEY`,
`NEXT_PUBLIC_GA_ID`, Turnstile keys etc. per `docs/LAUNCH_CHECKLIST.md`
when moving to production.
