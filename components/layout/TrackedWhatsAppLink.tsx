"use client";

import type { ReactNode } from "react";
import { trackWhatsAppClick } from "@/lib/analytics/track";

/** Client wrapper so server layouts can render tracked WhatsApp CTAs. */
export function TrackedWhatsAppLink({
  href,
  sourceSurface,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  sourceSurface: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick(sourceSurface)}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
