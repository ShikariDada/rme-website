import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { SiteSettings } from "@/lib/types";

/**
 * Hero (design §3): full-bleed material photograph with a bottom scrim,
 * bold grotesque headline over it (somanyceramics.com language), glass
 * category chips along the base (varmora.com language). Copy rises on load.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="relative min-h-hero w-full overflow-hidden bg-ink">
      <Image
        src="/textures/marble-emperador-face-1.webp"
        alt="Emperador marble surface with warm veining, photographed close"
        fill
        priority
        sizes="100vw"
        className="hero-media object-cover"
      />

      {/* Functional bottom scrim for legibility over photography. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-ink/15"
      />

      <div className="relative z-10 flex min-h-hero flex-col justify-end px-5 pb-10 pt-28 md:px-10 md:pb-14 lg:px-14">
        <div className="max-w-3xl">
          <p className="rise kicker text-white/80" style={{ "--rise-delay": "0ms" } as CSSProperties}>
            Porcelain · Stone · Terracotta
          </p>
          <h1 className="rise mt-4 text-hero text-balance text-white" style={{ "--rise-delay": "80ms" } as CSSProperties}>
            Marble, tiles &amp; granite, honest prices, real stock.
          </h1>
          <p
            className="rise mt-5 max-w-prose text-lg font-medium leading-snug text-white/85 md:text-xl"
            style={{ "--rise-delay": "180ms" } as CSSProperties}
          >
            Per-square-foot pricing you can check before you visit, and material you can walk
            on before you decide.
          </p>
          <div
            className="rise mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ "--rise-delay": "280ms" } as CSSProperties}
          >
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-pill bg-surface px-7 text-sm font-semibold text-text shadow-nav transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-raise"
            >
              Browse the collection
            </Link>
            <Link
              href="/showroom"
              className="glass-chip inline-flex h-12 items-center justify-center rounded-pill px-7 text-sm font-semibold"
            >
              Visit the showroom
            </Link>
          </div>
        </div>

        {/* Category chips along the base (varmora.com language). */}
        <div
          className="rise mt-10 hidden items-center gap-2 md:flex"
          style={{ "--rise-delay": "380ms" } as CSSProperties}
        >
          {[
            { label: "Tiles & Vitrified", href: "/tiles" },
            { label: "Marble", href: "/marble" },
            { label: "Granite", href: "/granite" },
          ].map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="glass-chip inline-flex h-10 items-center rounded-pill px-5 text-13 font-medium"
            >
              {chip.label}
            </Link>
          ))}
          <span className="ml-auto text-xs text-white/60">
            Emperador marble-look porcelain · photographed close
          </span>
        </div>

        {/* Mobile: quiet caption instead of chips. */}
        <p className="rise mt-6 text-xs text-white/60 md:hidden" style={{ "--rise-delay": "380ms" } as CSSProperties}>
          Emperador marble-look porcelain · photographed close
        </p>
      </div>

      <p className="sr-only">
        {`${settings.businessName} in ${settings.address.city}. Tap Browse the collection, or message us on WhatsApp for current stock.`}
      </p>
    </section>
  );
}
