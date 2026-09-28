"use client";

import { track, trackCallClick, trackWhatsAppClick } from "@/lib/analytics/track";
import { ButtonLink } from "@/components/ui/Button";

function WhatsAppGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.14-1.35A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.05.8.82-2.97-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.67.31 2.81 2.81 0 0 0-.88 2.09 4.87 4.87 0 0 0 1.02 2.58 11.15 11.15 0 0 0 4.27 3.78c1.6.62 2.22.67 3.02.56.48-.07 1.46-.6 1.66-1.18s.21-1.07.14-1.18-.21-.17-.47-.29Z" />
    </svg>
  );
}

export function ProductContactCTAs({
  whatsappHref,
  phone,
  visualizerMaterialId,
  productSku,
}: {
  whatsappHref: string;
  phone: string;
  visualizerMaterialId?: string;
  productSku: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ButtonLink
        href={whatsappHref}
        variant="whatsapp"
        size="lg"
        className="w-full"
        onClick={() =>
          trackWhatsAppClick("product-primary", { product_sku: productSku })
        }
      >
        <WhatsAppGlyph />
        Check stock &amp; price on WhatsApp
      </ButtonLink>

      {visualizerMaterialId && (
        <ButtonLink
          href={`/visualizer?material=${encodeURIComponent(visualizerMaterialId)}`}
          variant="secondary"
          className="w-full"
          onClick={() =>
            track("visualizer_open", {
              source_surface: "product-page",
              product_sku: productSku,
            })
          }
        >
          See this in your room
        </ButtonLink>
      )}

      <a
        href={`tel:${phone}`}
        onClick={() => trackCallClick("product-page")}
        className="mx-auto inline-flex min-h-[44px] items-center text-sm font-medium text-accent underline underline-offset-2 hover:decoration-accent"
      >
        Call showroom
      </a>
    </div>
  );
}
