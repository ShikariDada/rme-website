# Sanity schema definitions

Plain-object Sanity schemas mirroring `lib/types.ts` (no `sanity` package
import required — Sanity schemas are plain objects). To enable the CMS:

1. `npm create sanity@latest` inside a `studio/` folder (or add the `sanity`
   dependency and run `npx sanity dev` with a config that registers these).
2. Register every schema below in the studio's `schemaTypes` array.
3. Set `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET`.
4. Validate rules here match `lib/types.ts` — the website depends on them.

The `product` schema carries the validation rules from website spec §12.5
(unique SKU/slug enforced via initial value + rule; positive amounts per
pricing mode; visualizer gating fields).
