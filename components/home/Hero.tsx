import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";
import { WhatsAppIcon } from "@/components/layout/Header";
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from "@/lib/whatsapp";
import type { SiteSettings } from "@/lib/types";

/**
 * Hero (spec §9.3): one honest positioning line, one helpful subline, real
 * material imagery — no gradient overlays, no generic "premium living" copy.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  const whatsappHref = buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildGeneralEnquiryMessage("hero"),
  });

  return (
    <section className="border-b border-border bg-surface">
      <Container className="grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
        <div>
          <h1 className="text-3xl leading-[1.08] md:text-[clamp(2.125rem,4.5vw,3.5rem)]">
            Marble, tiles &amp; granite —
            <br />
            <span className="text-text-muted">see real prices before you visit.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-text-muted md:text-lg">
            A local showroom in {settings.address.city} with honest per-square-foot
            pricing, live stock states, and tools to help you decide — not a
            catalogue that hides the answer.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/products" size="lg">
              Browse products
            </ButtonLink>
            <ButtonLink href={whatsappHref} variant="whatsapp" size="lg" external>
              <WhatsAppIcon />
              WhatsApp us
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            Prefer to see materials in person?{" "}
            <a href="/showroom" className="text-accent underline underline-offset-2">
              Visit the showroom
            </a>{" "}
            — directions inside.
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-muted">
          <Image
            src="/textures/marble-bianco-face-1.png"
            alt="Polished white marble-look tile surface with soft grey veining"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
