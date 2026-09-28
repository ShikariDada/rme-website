/**
 * Analytics event tracking (spec §18).
 *
 * GA4 via gtag.js. Events carry only the permitted non-PII parameters listed
 * in docs/ANALYTICS_EVENTS.md. Never send: name, phone, email, free text,
 * address, room image URLs or WhatsApp message bodies.
 */

import { siteUrl } from "@/lib/utils";

export const ANALYTICS_EVENTS = [
  "view_product",
  "search_submit",
  "search_zero_results",
  "filter_apply",
  "calculator_start",
  "calculator_complete",
  "whatsapp_click",
  "call_click",
  "quote_form_start",
  "quote_form_submit",
  "quote_form_error",
  "directions_click",
  "visualizer_open",
  "visualizer_product_selected",
  "visualizer_export",
  "visualizer_quote_click",
  "guide_to_product_click",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsParams {
  page_type?: string;
  product_sku?: string;
  brand_slug?: string;
  material_type?: string;
  source_surface?: string;
  filter_name?: string;
  filter_value?: string;
  [key: string]: string | number | boolean | undefined;
}

const FORBIDDEN_KEYS = new Set([
  "name",
  "phone",
  "email",
  "message",
  "address",
  "room_image",
  "image_url",
  "wa_text",
]);

type Tracker = (event: AnalyticsEvent, params: AnalyticsParams) => void;

let tracker: Tracker | null = null;

/** Used by the GA4 provider to install the real tracker; tests can stub it. */
export function setTracker(t: Tracker | null): void {
  tracker = t;
}

/** Fire an analytics event. Safe no-op when gtag is absent (blocked/SSR). */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  const clean: AnalyticsParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    if (FORBIDDEN_KEYS.has(k.toLowerCase())) continue;
    clean[k] = v;
  }
  if (tracker) {
    tracker(event, clean);
    return;
  }
  const g = (window as unknown as { gtag?: Tracker }).gtag;
  if (g) g(event, clean);
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export function gaScriptSrc(): string {
  return `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
}

/** Convenience wrappers shared by client components. */

export function trackWhatsAppClick(sourceSurface: string, extra: AnalyticsParams = {}): void {
  track("whatsapp_click", { source_surface: sourceSurface, ...extra });
}

export function trackCallClick(sourceSurface: string): void {
  track("call_click", { source_surface: sourceSurface });
}

export function trackDirectionsClick(sourceSurface: string): void {
  track("directions_click", { source_surface: sourceSurface });
}

export const gaEnabled = Boolean(GA_ID) && siteUrl().startsWith("http");
