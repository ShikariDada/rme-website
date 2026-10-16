import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { buildGeneralEnquiryMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Hero (design §3): full-bleed material texture crop, left-aligned editorial
 * block on a solid bg panel (no overlay gradient). One italic clay accent
 * word in the Fraunces headline. Caption bottom-right names the texture.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
 const whatsappHref = buildWhatsAppUrl({
 phoneE164: settings.whatsappNumber,
 message: buildGeneralEnquiryMessage("hero"),
 });

 return (
 <section className="relative min-h-hero w-full overflow-hidden border-b border-border">
  <Image
  src="/textures/marble-bianco-face-1.png"
  alt="Bianco Carrara, polished porcelain surface with soft grey veining"
  fill
  priority
  sizes="100vw"
  className="object-cover"
  />

  {/* Editorial block — solid bg panel, lower-left */}
  <div className="relative z-10 flex min-h-hero items-end">
  <div className="max-w-140 bg-bg px-6 pb-14 pt-14 md:ml-0 md:px-16 md:pb-16 md:pt-24">
   <p className="kicker">Porcelain · Stone · Terracotta</p>
   <h1 className="mt-5 font-display text-display leading-hero tracking-display">
   Marble, tiles &amp; granite,{" "}
   <span className="text-accent-2">honest prices</span>, real stock.
   </h1>
   <p className="mt-5 max-w-max-w-40ch text-base leading-relaxed text-text-muted">
   A local showroom with per-square-foot pricing you can check before
   you visit, and material you can walk on before you decide.
   </p>
   <p className="mt-4 text-sm text-text-muted">
   Or message us on{" "}
   <a
    href={whatsappHref}
    target="_blank"
    rel="noopener noreferrer"
    className="text-accent underline underline-offset-4 decoration-border hover:decoration-accent"
   >
    WhatsApp
   </a>{" "}
   for current stock.
   </p>
   <div className="mt-8 flex flex-col gap-3 sm:flex-row">
   <Link
    href="/products"
    className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-7 text-13 font-medium uppercase tracking-wide2 text-white transition-colors duration-200 hover:bg-accent-hover"
   >
    Browse the collection
   </Link>
   <Link
    href="/showroom"
    className="inline-flex h-12 items-center justify-center rounded-sm border border-text bg-transparent px-7 text-13 font-medium uppercase tracking-wide2 text-text transition-colors duration-200 hover:bg-text hover:text-bg"
   >
    Visit the showroom
   </Link>
   </div>
  </div>
  </div>

  {/* Texture caption — bottom-right */}
  <p className="pointer-events-none absolute bottom-4 right-4 z-10 text-xs text-text-muted md:bottom-6 md:right-6">
  Bianco Carrara, polished porcelain
  </p>
 </section>
 );
}
