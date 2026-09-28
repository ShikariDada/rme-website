import { Container } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const settings = await contentSource.getSettings();
  return pageMetadata({
    title: `Terms — ${settings.businessName}`,
    description: "Pricing, stock, samples, delivery and website-use terms in plain language.",
    path: "/terms",
  });
}

export default async function TermsPage() {
  const settings = await contentSource.getSettings();

  return (
    <Container className="py-10 md:py-14 max-w-[800px]">
      <h1 className="text-3xl leading-tight md:text-4xl">Terms of use &amp; sale basics</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: September 2026.</p>

      <div className="mt-8 space-y-8 text-[16px] leading-relaxed">
        <section>
          <h2 className="font-display text-xl">Prices and stock</h2>
          <p className="mt-2 text-text-muted">
            Website prices and stock states are indicative until confirmed by
            the showroom at the time of order. Prices carry their
            last-verified date; tile prices marked as inclusive include GST,
            others may not — each listing states which. Natural materials are
            priced per lot and thickness.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Natural material variation</h2>
          <p className="mt-2 text-text-muted">
            Natural marble and granite vary in shade, veining and pattern
            between lots. Photographed items are representative. For natural
            stone we ask you to select (or approve) the actual slab before
            cutting; that selection is the basis of sale.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Quotes</h2>
          <p className="mt-2 text-text-muted">
            Written quotes are valid for the period stated on them (typically
            7 days for tiles, 3 days for natural stone lots). Quantities are
            planned estimates — the final order is confirmed with your
            installer or with us before dispatch.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Samples</h2>
          <p className="mt-2 text-text-muted">
            Standard tile samples are free to take from the showroom. For
            premium slabs we may ask for a refundable deposit against return
            of the sample piece.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Delivery</h2>
          <p className="mt-2 text-text-muted">
            Delivery around {settings.address.city} and nearby towns is
            arranged case by case — cost depends on distance, quantity and
            access. Site unloading is the customer&apos;s responsibility unless
            agreed otherwise in writing.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Website content</h2>
          <p className="mt-2 text-text-muted">
            Product photography, guides and imagery on this site belong to the
            business or their stated owners and may not be republished without
            permission. The room visualizer is a preview tool; its output is
            approximate and not a measurement or specification.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl">Governing law</h2>
          <p className="mt-2 text-text-muted">
            Transactions are governed by the laws of India, with disputes
            handled in the courts of {settings.address.city}, {settings.address.state}.
          </p>
        </section>
      </div>
    </Container>
  );
}
