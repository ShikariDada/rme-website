# OWNER FACTS — TO BE SUPPLIED BY THE OWNER

> **This file is the gate between demo and production.** Every value in
> `content/seed/` is a DEMO PLACEHOLDER (business name, address, phone,
> prices, stock, hours, the Varmora dealer claim). Nothing may be treated as
> real until it is replaced with owner-supplied facts, either by editing the
> seed data or by configuring Sanity and publishing real content.
>
> The website code never invents facts at runtime — it only renders what is
> in the CMS/seed. Copy this list into your onboarding notes and tick items
> off before launch.

## Business identity

- [x] Official business display name: **Rajasthan Marble Enterprises** (owner-supplied)
- [ ] Logo files — ideally SVG + high-resolution PNG (drop into `public/brand/`, reference in site settings)
- [ ] Favicon / app icon (demo ships a neutral monogram at `app/icon.svg`)
- [ ] GSTIN (only if you want it public)
- [x] Short name for the header: **RME** (owner-supplied)

## Contact & location

- [x] Showroom phone number: **+91 92197 33022** (owner-supplied)
- [ ] WhatsApp Business number — currently set to the same +91 92197 33022; **confirm WhatsApp is active on this number**
- [x] Showroom address: **Goverhan Chauraha, Mathura, 281001** (owner-supplied)
- [ ] Google Maps link for directions buttons
- [ ] Google Business Profile URL + owner access (local SEO — see LAUNCH_CHECKLIST)
- [ ] Opening days and hours (demo hours are placeholders)
- [ ] Primary contact email receiving website quote notifications (Resend target)

## Commercial policy (each one drives visible UI)

- [ ] Whether prices include or exclude GST (`priceTaxLabel`: inclusive | exclusive | varies)
- [ ] Price policy per class: fixed / negotiable / indicative / batch-dependent
- [ ] Quote response commitment — **do not publish "2 hours" unless operations can consistently meet it** (demo text: "within one business day during showroom hours")
- [ ] Delivery geography and rough policy
- [ ] Whether measurement/site visit is offered, free or paid, and where
- [ ] Whether installation/fixing is offered directly, referred, or not offered
- [ ] Returns / replacement / damage policy
- [ ] Sample policy: free / paid / refundable deposit / showroom-only / none

## Brand authorisation

- [ ] Written confirmation that you may publicly describe the business as an
      **authorised Varmora dealer** — the homepage/brand-page claim is gated on
      `isAuthorizedDealerClaimAllowed` in the brand record. Do not enable it
      without confirmation.
- [ ] Approved Varmora logo / co-branding assets or written permission
      (`assetUsageApproved`). Current Varmora statistics change frequently —
      do not hard-code manufacturer stat walls; if you want stats, store them
      in the CMS with source URL + verified date.

## Catalogue data quality (target: 30–60 curated products, not 300 dirty ones)

For every product:
- [ ] Current price state (exact / from / range / quote) + date verified
- [ ] Stock state (ready stock / limited / order basis) + date verified
- [ ] Dimensions, thickness, finish, body type, tiles per box, box coverage
- [ ] Rooms/applications
- [ ] At least one excellent straight-on image, source + rights recorded, descriptive alt text
- [ ] Visualizer textures (if the product should appear in the in-room preview tool):
      straight-on capture, even lighting, one clean tile face per image,
      cropped to the physical aspect ratio, real dimensions in mm,
      4–12 faces for marble/wood-look prints

## Content approvals

- [ ] Real project photography (only with client permission; no street addresses)
- [ ] Testimonials (only real, with permission; the demo ships zero)
- [ ] Announcement bar messages (only real current offers — inactive by default)

## Where to put the answers

- Local-demo route: edit `content/seed/*.json` (see docs/CONTENT_GUIDE.md), run `npm run build:seed` if regenerating, or edit the JSONs directly.
- CMS route: configure Sanity (`.env` → `NEXT_PUBLIC_SANITY_PROJECT_ID`), import via `npm run import:products`, manage in Sanity Studio.
