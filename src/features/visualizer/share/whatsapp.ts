import { buildVisualizerShareMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * WhatsApp fallback (visualizer spec §33.2): the customer has saved the
 * preview and must attach it inside WhatsApp themselves — we say so plainly.
 */
export function whatsappShareHref(
  items: { productNames: string[]; skus: string[] },
  phoneE164: string
): string {
  return buildWhatsAppUrl({
    phoneE164,
    message: buildVisualizerShareMessage(items),
  });
}

export const SHARE_INSTRUCTION =
  "Attach the saved preview image inside WhatsApp — a chat link cannot attach it automatically.";
