import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Primitives";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PriceBlock } from "@/components/product/PriceBlock";
import { SpecGrid } from "@/components/product/SpecGrid";
import { QuantityCalculatorEmbed } from "@/components/product/QuantityCalculatorEmbed";
import { ProductContactCTAs } from "@/components/product/ProductContactCTAs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductFaq } from "@/components/product/ProductFaq";
import { AvailabilityBadge } from "@/components/catalogue/AvailabilityBadge";
import { PortableText } from "@/components/content/PortableText";
import { contentSource, getRelatedProducts } from "@/lib/data";
import { formatDate } from "@/lib/pricing/format";
import { buildProductWhatsAppUrl } from "@/lib/whatsapp";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await contentSource.getProductBySlug(slug);
  if (!product) return {};
  const firstImage = product.images[0];
  return pageMetadata({
    title: product.seo?.title ?? `${product.name} — price, stock & specs`,
    description:
      product.seo?.description ??
      `${product.name} — see current price, stock status and full specifications.`,
    path: `/product/${product.slug}`,
    images: firstImage
      ? [
          {
            url: firstImage.url,
            width: firstImage.width,
            height: firstImage.height,
            alt: firstImage.alt,
          },
        ]
      : undefined,
    noindex: product.seo?.noindex === true,
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await contentSource.getProductBySlug(slug);
  if (!product || product.status !== "active") notFound();

  const [settings, related, allFaqs, categories, applications] = await Promise.all([
    contentSource.getSettings(),
    getRelatedProducts(product, 4),
    contentSource.getFaqs(),
    contentSource.getCategories(),
    contentSource.getApplications(),
  ]);

  const category = categories.find((c) => product.categorySlugs.includes(c.slug));
  const roomNames = applications
    .filter((a) => product.applicationSlugs.includes(a.slug))
    .map((a) => a.name);
  const productFaqs = allFaqs.filter(
    (f) => f.scope === "product" && f.relatedProductSlug === product.slug
  );
  const whatsappHref = buildProductWhatsAppUrl(
    product,
    settings.whatsappNumber,
    absoluteUrl(`/product/${product.slug}`)
  );

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    ...(category ? [{ name: category.name, href: `/${category.slug}` }] : []),
    { name: product.name },
  ];

  return (
    <Container className="py-6 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, settings)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd(
              breadcrumbItems.map((item) => ({
                name: item.name,
                path: item.href ?? `/product/${product.slug}`,
              }))
            )
          ),
        }}
      />

      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl leading-tight md:text-3xl">{product.name}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {[product.brandName, product.sku, product.familyKey]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <PriceBlock product={product} settings={settings} />

          <div className="flex flex-col gap-1.5">
            <div>
              <AvailabilityBadge product={product} />
            </div>
            {product.availability.publicNote && (
              <p className="text-sm text-text-muted">
                {product.availability.publicNote}
              </p>
            )}
            {product.availability.verifiedAt && (
              <p className="text-xs text-text-muted">
                Stock verified {formatDate(product.availability.verifiedAt)}
              </p>
            )}
          </div>

          <ProductContactCTAs
            whatsappHref={whatsappHref}
            phone={settings.phone}
            visualizerMaterialId={product.visualizerMaterialId}
            productSku={product.sku}
          />
        </div>
      </div>

      <div className="mt-10 space-y-10 md:mt-14 md:space-y-12">
        <SpecGrid product={product} roomNames={roomNames} />

        <QuantityCalculatorEmbed
          coverageSqFtPerBox={product.tile?.coverageSqFtPerBox}
          tilesPerBox={product.tile?.tilesPerBox}
          materialType={product.materialType}
        />

        {product.description && product.description.length > 0 && (
          <section aria-labelledby="product-description-heading" className="max-w-3xl">
            <h2 id="product-description-heading" className="text-xl md:text-2xl">
              About this product
            </h2>
            <div className="mt-4">
              <PortableText blocks={product.description} />
            </div>
          </section>
        )}

        {product.care && product.care.length > 0 && (
          <section aria-labelledby="product-care-heading" className="max-w-3xl">
            <h2 id="product-care-heading" className="text-xl md:text-2xl">
              Care &amp; maintenance
            </h2>
            <div className="mt-4">
              <PortableText blocks={product.care} />
            </div>
          </section>
        )}

        {product.installationNotes && product.installationNotes.length > 0 && (
          <section aria-labelledby="product-installation-heading" className="max-w-3xl">
            <h2 id="product-installation-heading" className="text-xl md:text-2xl">
              Installation notes
            </h2>
            <div className="mt-4">
              <PortableText blocks={product.installationNotes} />
            </div>
          </section>
        )}

        {product.stone && (
          <aside className="max-w-3xl rounded-md border border-accent/30 bg-accent-soft/40 px-4 py-3 text-sm">
            Natural stone varies in shade, veining and pattern between lots — the
            photographed slab is representative, not identical to every delivered
            piece. Select your actual slab in the showroom.
          </aside>
        )}

        <RelatedProducts products={related} />

        <ProductFaq faqs={productFaqs} />
      </div>
    </Container>
  );
}
