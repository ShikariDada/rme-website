import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Accordion";
import { Badge, Container } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/layout/Header";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from "@/lib/whatsapp";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const brand = await contentSource.getBrandBySlug(slug);
  if (!brand) return pageMetadata({ title: "Brand not found", description: "", path: `/brand/${slug}`, noindex: true });
  return pageMetadata({
    title: `${brand.name} tiles & ranges in our showroom`,
    description: brand.description ?? `Browse ${brand.name} products stocked in our showroom with current prices and stock states.`,
    path: `/brand/${brand.slug}`,
  });
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = await contentSource.getBrandBySlug(slug);
  if (!brand) notFound();

  const settings = await contentSource.getSettings();
  const products = (await contentSource.getProducts()).filter(
    (p) => p.status === "active" && p.brandName === brand.name
  );
  const whatsappHref = buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildGeneralEnquiryMessage(`brand-${brand.slug}`),
  });

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb
        items={[
          { name: "Home", href: "/" },
          { name: "Brands" },
          { name: brand.name },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl leading-tight md:text-4xl">{brand.name}</h1>
        {brand.isAuthorizedDealerClaimAllowed && (
          <Badge tone="success">Authorised dealer</Badge>
        )}
      </div>
      {brand.description && <p className="mt-3 max-w-3xl text-text-muted">{brand.description}</p>}
      {brand.isAuthorizedDealerClaimAllowed && (
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          Our showroom stocks and displays {brand.name} ranges sourced through the
          authorised channel. Manufacturer figures and marketing change often —
          what we publish is what is actually on our floor.
        </p>
      )}
      {brand.officialUrl && (
        <p className="mt-2 text-sm">
          <a href={brand.officialUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
            Official {brand.name} website
          </a>
        </p>
      )}

      <div className="mt-4">
        <ButtonLink href={whatsappHref} variant="whatsapp" external>
          <WhatsAppIcon />
          Check current stock on WhatsApp
        </ButtonLink>
      </div>

      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <p className="rounded-lg border border-border bg-surface p-8 text-center text-text-muted">
            {brand.name} ranges rotate through the showroom — ask us what is currently available.
          </p>
        )}
      </div>
    </Container>
  );
}
