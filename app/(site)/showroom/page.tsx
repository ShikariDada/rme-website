import { Badge, Container } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";
import { HoursTable } from "@/components/showroom/HoursTable";
import { MapEmbed } from "@/components/showroom/MapEmbed";
import { DirectionsCTA } from "@/components/showroom/DirectionsCTA";
import { WhatsAppIcon } from "@/components/layout/Header";
import { pageMetadata } from "@/lib/seo/metadata";
import { localBusinessJsonLd } from "@/lib/seo/jsonld";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const settings = await contentSource.getSettings();
  return pageMetadata({
    title: `Visit our showroom — ${settings.address.city}`,
    description: `Address, hours, directions and contact details for ${settings.businessName}. Walk-ins welcome.`,
    path: "/showroom",
  });
}

export default async function ShowroomPage() {
  const settings = await contentSource.getSettings();
  const addr = settings.address;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(settings)) }}
      />
      <Container className="py-8 md:py-12">
        <h1 className="text-3xl leading-tight md:text-4xl">Visit the showroom</h1>
        <p className="mt-3 max-w-2xl text-text-muted">
          Materials read differently in person — bring your room measurements
          (or a photo) and we will lay out real options at real prices.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Address</h2>
            <address className="mt-2 not-italic leading-relaxed">
              {[addr.line1, addr.line2, addr.locality].filter(Boolean).map((l, i) => (
                <span key={i} className="block">{l}</span>
              ))}
              <span className="block">{addr.city}, {addr.state} {addr.postalCode}</span>
            </address>
            <div className="mt-3">
              <DirectionsCTA mapsUrl={settings.googleMapsUrl} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Opening hours</h2>
            <HoursTable hours={settings.hours} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Contact</h2>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={`tel:${settings.phone}`}
                className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 font-medium hover:bg-surface-muted"
              >
                Call {settings.phoneDisplay ?? settings.phone}
              </a>
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#1fa855] px-4 font-medium text-white hover:bg-[#178a45]"
              >
                <WhatsAppIcon />
                WhatsApp us
              </a>
              <ButtonLink href="/contact" variant="secondary">
                Request a quote instead
              </ButtonLink>
            </div>
            {settings.businessProfileUrl && (
              <p className="mt-3 text-sm">
                <a href={settings.businessProfileUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                  See our Google Business Profile
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg">Find us on the map</h2>
              <p className="text-sm text-text-muted">The map loads only when you ask — saving your data.</p>
            </div>
            <Badge tone="muted">Loads on click</Badge>
          </div>
          <div className="mt-4">
            <MapEmbed query={`${addr.line1}, ${addr.locality}, ${addr.city}, ${addr.state} ${addr.postalCode}`} />
          </div>
        </div>
      </Container>
    </>
  );
}
