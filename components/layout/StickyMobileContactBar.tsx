"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackCallClick, trackWhatsAppClick } from "@/lib/analytics/track";

/**
 * Sticky mobile conversion bar (spec §7): Call | WhatsApp | Quote on
 * catalogue/product pages. 44px+ targets, safe-area aware, never covers
 * content (the route layout reserves bottom padding).
 */
export function StickyMobileContactBar({
  phone,
  whatsappHref,
  quoteHref,
  show = true,
}: {
  phone: string;
  whatsappHref: string;
  quoteHref: string;
  show?: boolean;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (show) {
      document.documentElement.style.setProperty("--sticky-bar-height", "60px");
      return () => document.documentElement.style.setProperty("--sticky-bar-height", "0px");
    }
  }, [show]);

  if (!show) return null;
  // The visualizer is a full-height editor with its own bottom controls.
  if (pathname?.startsWith("/visualizer")) return null;
  const onProduct = pathname?.startsWith("/product/");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-safe-bar backdrop-blur-sm md:hidden">
      <div className="grid grid-cols-3 gap-1 px-2 pt-1.5">
        <a
          href={`tel:${phone}`}
          onClick={() => trackCallClick("sticky-bar")}
          className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-md text-sm font-medium text-text hover:bg-surface-muted"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick("sticky-bar")}
          className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-md bg-[#1fa855] text-sm font-medium text-white hover:bg-[#178a45]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.14-1.35A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.05.8.82-2.97-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.67.31 2.81 2.81 0 0 0-.88 2.09 4.87 4.87 0 0 0 1.02 2.58 11.15 11.15 0 0 0 4.27 3.78c1.6.62 2.22.67 3.02.56.48-.07 1.46-.6 1.66-1.18s.21-1.07.14-1.18-.21-.17-.47-.29Z" />
          </svg>
          WhatsApp
        </a>
        <a
          href={onProduct ? `/contact?ref=${encodeURIComponent(pathname ?? "")}` : quoteHref}
          className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border border-border text-sm font-medium text-text hover:bg-surface-muted"
        >
          Quote
        </a>
      </div>
    </div>
  );
}
