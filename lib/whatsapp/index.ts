import type { Product } from "@/lib/types";
import { shortCode } from "@/lib/utils";

/**
 * WhatsApp Click to Chat helpers.
 *
 * IMPORTANT (spec §17.1): Click to Chat can prefill TEXT only. It cannot
 * pre-attach files or images. Every flow that needs an image (room photo,
 * visualizer export, material list) instructs the user to attach the file
 * inside WhatsApp manually.
 */

export interface WhatsAppTarget {
  phoneE164: string; // e.g. +919876543210
  message: string;
}

export function buildWhatsAppUrl({ phoneE164, message }: WhatsAppTarget): string {
  const digits = phoneE164.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export interface ProductMessageInput {
  product: Product;
  canonicalUrl: string;
}

/** Product message template — exactly per spec §17.1. */
export function buildProductMessage({
  product,
  canonicalUrl,
}: ProductMessageInput): string {
  const size = product.tile
    ? `${product.tile.widthMm}×${product.tile.heightMm} mm`
    : product.stone?.slabSizeText ?? "—";
  const finish = product.finish[0] ?? "—";
  return [
    "Hi, I'm interested in:",
    product.name,
    `SKU: ${product.sku}`,
    `Size: ${size}`,
    `Finish: ${finish}`,
    `Page: ${canonicalUrl}`,
    `Source: PDP-${shortCode(product.slug)}`,
    "",
    "Please confirm current stock and price.",
  ].join("\n");
}

export function buildProductWhatsAppUrl(
  product: Product,
  phoneE164: string,
  canonicalUrl: string
): string {
  return buildWhatsAppUrl({
    phoneE164,
    message: buildProductMessage({ product, canonicalUrl }),
  });
}

/** Room-photo assistance flow (spec §17.2): the user attaches the photo themselves. */
export function buildRoomPhotoMessage(
  productName: string,
  productUrl: string
): string {
  return [
    "Hi, I'd like to see how this could look in my room:",
    productName,
    `Page: ${productUrl}`,
    "",
    "I will attach one clear photo of my room/floor/wall here.",
  ].join("\n");
}

/** Material-list quote flow (spec §17.3). */
export function buildMaterialListMessage(): string {
  return [
    "Hi, I want a quote for a material list.",
    "I'll attach the list (photo/PDF) here.",
  ].join("\n");
}

export function buildGeneralEnquiryMessage(source: string): string {
  return `Hi, I have a question about your tiles/marble. (Source: ${source})`;
}

/**
 * Visualizer share fallback (spec §33.2): the customer has saved/exported a
 * preview image and must attach it in WhatsApp themselves.
 */
export function buildVisualizerShareMessage(items: {
  productNames: string[];
  skus: string[];
}): string {
  const lines = [
    "Hi, I have generated a room preview on your website and will attach it here.",
    "",
  ];
  if (items.productNames.length > 0) {
    lines.push(`Products: ${items.productNames.join(", ")}`);
    lines.push(`SKUs: ${items.skus.join(", ")}`);
  }
  return lines.join("\n");
}

/** Quote form continuation (spec §17.4 step 9). */
export function buildQuoteReferenceMessage(input: {
  reference: string;
  summary: string;
}): string {
  return [
    "Hi, I just submitted a quote request on your website.",
    `Reference: ${input.reference}`,
    "",
    input.summary,
  ].join("\n");
}
