# Launch checklist

Working through this list takes the site from demo to production. Nothing on
it is optional.

## 1. Business facts (gate — blocks everything else)

- [ ] Every item in `docs/OWNER_FACTS.md` answered and recorded
      (seed data edited or Sanity configured)
- [ ] Demo placeholders gone: business name, address, phone, hours, email
- [ ] Price policy + tax treatment confirmed (`priceTaxLabel`)
- [ ] Quote response commitment published only if operations can meet it

## 2. Catalogue

- [ ] 30–60 curated products with: verified price state, stock state,
      dimensions, finish, applications, one excellent image each
- [ ] `npm run audit:content` exits clean (no errors; warnings triaged)
- [ ] Every image: alt text + rightsStatus resolved
- [ ] Visualizer textures captured for the launch subset (straight-on,
      aspect-cropped, 4+ faces for marble-looks)

## 3. Brand authorisation

- [ ] Varmora dealer status confirmed in writing → then set
      `isAuthorizedDealerClaimAllowed`
- [ ] Approved logo/assets received → `assetUsageApproved`
- [ ] Ask Varmora to add the showroom to their "Where to buy" locator

## 4. Infrastructure

- [ ] `NEXT_PUBLIC_SITE_URL` set to the production domain
- [ ] Hosting: Vercel Pro (or validated Cloudflare alternative) — Hobby is
      not licensed for commercial use
- [ ] Sanity: project created, dataset private plan considered, read token if
      needed; Studio access for the owner
- [ ] Resend: API key, verified sending domain, `QUOTE_EMAIL_TO` = the
      showroom inbox; end-to-end quote test email received
- [ ] Turnstile keys set (`TURNSTILE_SECRET_KEY` +
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) — enable before public launch
- [ ] `NEXT_PUBLIC_GA_ID` set; DebugView confirms events, no PII
- [ ] `SANITY_REVALIDATE_SECRET` set + publish webhook configured to
      `/api/revalidate` (header: `x-revalidate-secret`)

## 5. SEO & compliance

- [ ] Google Business Profile: claimed, categories, hours, photos, website link
- [ ] Search Console verified; sitemap submitted; robots OK
- [ ] Canonical host + HTTPS forced; check noindex on filtered/search URLs
- [ ] Product JSON-LD valid (Rich Results test) — only truthful Offers
- [ ] Privacy page reviewed (processors list matches reality)
- [ ] DPDP posture: data minimisation confirmed (no PII in analytics/logs)

## 6. Quality gates

- [ ] `npm test` green; `npm run build` green
- [ ] Lighthouse mobile on production build: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms
      (75th-percentile field targets once traffic exists)
- [ ] Real Android pass: catalogue, PDP, calculator, quote form, visualizer
      (upload → corners → material → grout → export → share)
- [ ] iOS Safari pass: visualizer + Web Share sheet with file
- [ ] Quote form: honeypot silent, rate limit behaves, success panel shows
      reference and WhatsApp continuation
- [ ] All WhatsApp CTAs open the right prefilled chat to the real number

## 7. Operational rhythm (after launch)

- [ ] Weekly: price/stock verification on rotating subsets (audit warns at 30 days)
- [ ] Weekly: dependency review (`npm audit` + patch releases)
- [ ] Monthly: zero-result search review; Search Console coverage
- [ ] Monthly: GB Profile photos/posts; respond to reviews
- [ ] Quarterly: visualizer texture quality pass; refresh price guidance
