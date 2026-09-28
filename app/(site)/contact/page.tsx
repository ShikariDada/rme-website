import { Container } from "@/components/ui/Primitives";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { HoursTable } from "@/components/showroom/HoursTable";
import { WhatsAppIcon } from "@/components/layout/Header";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

interface Props {
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata() {
  const settings = await contentSource.getSettings();
  return pageMetadata({
    title: "Get a quote — tiles, marble & granite",
    description: `Request a quote from ${settings.businessName}. Share your list or rough area — we respond with current prices and stock.`,
    path: "/contact",
  });
}

export default async function ContactPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const settings = await contentSource.getSettings();

  // `ref` is a product path like /product/slug → resolve a friendly name.
  let prefill: string | undefined;
  if (ref?.startsWith("/product/")) {
    const product = await contentSource.getProductBySlug(ref.replace("/product/", ""));
    prefill = product ? `${product.name} (SKU ${product.sku})` : ref;
  } else if (ref) {
    prefill = ref;
  }

  return (
    <Container className="py-8 md:py-12">
      <div className="grid gap-10 md:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl leading-tight md:text-4xl">Get a quote</h1>
          <p className="mt-3 max-w-2xl text-text-muted">
            Send what you have — a material list, a rough area, or just the look
            you want. We reply with current prices and stock. WhatsApp is the
            fastest route; this form works too.
          </p>
          <div className="mt-8">
            <QuoteForm settings={settings} sourceSurface="contact-page" prefillProducts={prefill} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Showroom</h2>
            <p className="mt-2 text-sm leading-relaxed">
              {[settings.address.line1, settings.address.locality, `${settings.address.city}, ${settings.address.state}`]
                .filter(Boolean)
                .map((l, i) => (
                  <span key={i} className="block">{l}</span>
                ))}
            </p>
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#1fa855] px-4 text-sm font-medium text-white hover:bg-[#178a45]"
            >
              <WhatsAppIcon />
              WhatsApp us
            </a>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Hours</h2>
            <HoursTable hours={settings.hours} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
