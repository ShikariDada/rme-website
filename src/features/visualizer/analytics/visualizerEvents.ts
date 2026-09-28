import { track } from "@/lib/analytics/track";

/** Visualizer funnel events (spec §35.5) — no room imagery, ever. */
export function visualizerOpen(source: string): void {
  track("visualizer_open", { source_surface: source });
}

export function visualizerProductSelected(sku: string): void {
  track("visualizer_product_selected", { product_sku: sku });
}

export function visualizerExport(): void {
  track("visualizer_export", { source_surface: "visualizer" });
}

export function visualizerQuoteClick(sku?: string): void {
  track("visualizer_quote_click", { source_surface: "visualizer", ...(sku ? { product_sku: sku } : {}) });
}

export function visualizerSurfaceCompleted(): void {
  track("filter_apply", { source_surface: "visualizer-surface", filter_name: "surface_done", filter_value: "true" });
}
