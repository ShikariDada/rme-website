# Analytics events (website spec §18)

GA4 via `NEXT_PUBLIC_GA_ID`. Implementation: `lib/analytics/track.ts` (SSR-safe,
strips forbidden keys). Do not send PII, ever.

## Measurement truth

`whatsapp_click` records that the user **clicked toward WhatsApp**. It does
NOT prove a message was sent. Message-level attribution comes later via the
`PDP-XXXXXX` source codes customers paste into their first message, or a
future WhatsApp Business Platform integration.

## Events

| Event | Permitted params | Fires when |
|---|---|---|
| view_product | product_sku, brand_slug, material_type, page_type | product page viewed (client effect) |
| search_submit | source_surface | catalogue search submitted |
| search_zero_results | source_surface | /products?q= returned zero items |
| filter_apply | filter_name, filter_value, source_surface | any filter chip/sheet/sort change |
| calculator_start | source_surface, page_type | first calculator input |
| calculator_complete | source_surface, page_type | calculator produced a result |
| whatsapp_click | source_surface, product_sku? | any WhatsApp CTA (hero, sticky bar, product-primary, visualizer…) |
| call_click | source_surface | tel: link activated |
| quote_form_start | source_surface | first quote-form field edited |
| quote_form_submit | source_surface | successful POST /api/quote |
| quote_form_error | source_surface, reason | validation/server/network failure (reason only — never field values) |
| directions_click | source_surface | Google Maps directions link |
| visualizer_open | source_surface, product_sku? | visualizer entered |
| visualizer_product_selected | product_sku | material applied to a surface |
| visualizer_export | source_surface | preview exported/shared |
| visualizer_quote_click | product_sku? | WhatsApp quote from visualizer |
| guide_to_product_click | product_sku, source_surface | product link inside a guide body |

`source_surface` values: `header`, `hero`, `sticky-bar`, `product-primary`,
`search-dialog`, `filter-sheet`, `calculator`, `contact-page`, `visualizer`,
`showroom`, `brand-*`.

## Forbidden in ALL event payloads

`name`, `phone`, `email`, `message` (free text), `address`, `room_image`,
`image_url`, `wa_text`, and any user-typed input. The track() helper strips
known-bad keys, but the rule is: **catalogue taxonomy and page context only**.

## Setup

1. Create a GA4 property; copy the Measurement ID.
2. `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` in `.env` — the loader only activates when set.
3. Verify in GA4 DebugView; check `anonymize_ip` is applied.
4. Zero-result queries also matter operationally: review them monthly to fix
   catalogue naming (they appear as `search_zero_results`).
