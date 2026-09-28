import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Accordion";
import { PortableText } from "@/components/content/PortableText";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { articleJsonLd } from "@/lib/seo/jsonld";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = await contentSource.getGuideBySlug(slug);
  if (!guide) return pageMetadata({ title: "Guide not found", description: "", path: `/guides/${slug}`, noindex: true });
  return pageMetadata({
    title: guide.seo?.title ?? guide.title,
    description: guide.excerpt,
    path: `/guides/${guide.slug}`,
    type: "article",
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
    images: guide.heroImage ? [{ url: guide.heroImage.url, alt: guide.heroImage.alt }] : undefined,
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await contentSource.getGuideBySlug(slug);
  if (!guide) notFound();

  const products = (await contentSource.getProducts()).filter(
    (p) => p.status === "active" && guide.productSlugs.includes(p.slug)
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: guide.title,
              description: guide.excerpt,
              path: `/guides/${guide.slug}`,
              publishedAt: guide.publishedAt,
              updatedAt: guide.updatedAt,
              authorLabel: guide.authorLabel,
              image: guide.heroImage?.url,
            })
          ),
        }}
      />
      <article className="mx-auto w-full max-w-[800px] px-4 py-8 md:px-6 md:py-12">
        <Breadcrumb
          items={[
            { name: "Home", href: "/" },
            { name: "Guides", href: "/guides" },
            { name: guide.title },
          ]}
        />
        <h1 className="mt-4 text-3xl leading-tight md:text-4xl">{guide.title}</h1>
        <p className="mt-3 text-lg text-text-muted">{guide.excerpt}</p>
        <p className="mt-2 text-sm text-text-muted">
          {guide.authorLabel ? `${guide.authorLabel} · ` : ""}Updated{" "}
          {new Date(guide.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {guide.heroImage && (
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg border border-border bg-surface-muted">
            <Image
              src={guide.heroImage.url}
              alt={guide.heroImage.alt}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 800px"
              className="object-cover"
            />
          </div>
        )}

        <div className="mt-8">
          <PortableText blocks={guide.body} />
        </div>

        {products.length > 0 && (
          <section className="mt-10 border-t border-border pt-8">
            <h2 className="mb-4 text-xl">Products mentioned in this guide</h2>
            <ProductGrid products={products} columns={3} />
          </section>
        )}
      </article>
    </>
  );
}
