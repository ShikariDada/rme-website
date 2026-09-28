import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const settings = await contentSource.getSettings();
  return pageMetadata({
    title: `About ${settings.businessName}`,
    description: `A local ${settings.address.city} showroom for tiles, marble and granite — how we work, and why our prices and stock states are shown honestly.`,
    path: "/about",
  });
}

export default async function AboutPage() {
  const settings = await contentSource.getSettings();

  return (
    <Container className="py-10 md:py-14 max-w-[800px]">
      <h1 className="text-3xl leading-tight md:text-4xl">
        A {settings.address.city} showroom, built around honest answers
      </h1>

      <div className="mt-6 space-y-5 text-[16px] leading-relaxed text-text-muted">
        <p>
          {settings.businessName} is a local showroom for tiles, marble and
          granite — plus the adhesives and consumables that go with them. We
          publish prices with the date they were last checked, label stock as
          it actually is, and would rather show you a real sample than a
          flattering render.
        </p>

        <h2 className="pt-2 font-display text-xl text-text">How buying works here</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Browse the catalogue here — filter by room, size, finish or budget.</li>
          <li>Shortlist two or three options; use the visualizer or WhatsApp us photos of your space.</li>
          <li>Visit the showroom to see full-scale displays and feel the finishes.</li>
          <li>Get a quote with exact current pricing, including what delivery costs.</li>
          <li>Confirm quantities with your installer, and we arrange the rest.</li>
        </ol>

        <h2 className="pt-2 font-display text-xl text-text">What we promise</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Prices carry verification dates — no stale figures quietly displayed for months.</li>
          <li>Stock states mean what they say: ready stock is in the godown today.</li>
          <li>Natural stone is sold with its variation explained, and you pick your actual slab.</li>
          <li>No invented reviews, no manufactured urgency, no fake countdown offers.</li>
        </ul>

        <h2 className="pt-2 font-display text-xl text-text">Who we serve</h2>
        <p>
          Homeowners building or renovating, contractors who need sizes and
          availability fast, and architects and designers who need reliable
          specifications and shareable product links. If you are in
          {" "}{settings.address.city} or nearby, the kettle is usually on.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/products">Browse the catalogue</ButtonLink>
        <ButtonLink href="/showroom" variant="secondary">
          Visit the showroom
        </ButtonLink>
      </div>
    </Container>
  );
}
