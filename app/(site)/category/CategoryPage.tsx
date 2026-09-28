import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Accordion";
import { ButtonLink } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Primitives";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { GuideCard } from "@/components/content/Cards";
import { formatINR, formatUnit } from "@/lib/pricing/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

/**
 * Shared category landing page (spec §10.3): useful-first editorial layer,
 * price guidance, then products. Rendered by /tiles, /marble, /granite.
 */
export async function CategoryPage({ slug, path }: { slug: string; path: string }) {
  const category = await contentSource.getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, guides, faqs] = await Promise.all([
    contentSource.getProducts(),
    contentSource.getGuides(),
    contentSource.getFaqs(),
  ]);
  const catProducts = products.filter(
    (p) => p.status === "active" && p.materialType === category.materialType
  );
  const catGuides = guides.filter((g) => g.categorySlugs.includes(category.slug)).slice(0, 2);
  const catFaqs = faqs.filter(
    (f) => f.relatedCategorySlug === category.slug || f.scope === "site"
  ).slice(0, 5);

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb
        items={[
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: category.name },
        ]}
      />
      <div className="mt-4 grid items-start gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-3xl leading-tight md:text-4xl">{category.name}</h1>
          <p className="mt-3 max-w-2xl text-text-muted">{category.summary}</p>
        </div>
        {category.heroImage && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-muted md:w-64">
            <Image
              src={category.heroImage.url}
              alt={category.heroImage.alt}
              fill
              priority
              sizes="256px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {category.priceGuide && category.priceGuide.length > 0 && (
        <section className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-lg">Current price guidance</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {category.priceGuide.map((g) => (
              <li key={g.label} className="text-sm">
                <p>{g.label}</p>
                <p className="mt-0.5 font-medium">
                  {formatINR(g.min)}–{formatINR(g.max)} / {formatUnit(g.unit)}
                  <span className="ml-2 text-xs font-normal text-text-muted">
                    verified {new Date(g.lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl">{category.name} in stock</h2>
          <Link
            href={`/products?material=${category.materialType}`}
            className="text-accent underline underline-offset-2"
          >
            Filter the full range
          </Link>
        </div>
        {catProducts.length > 0 ? (
          <ProductGrid products={catProducts.slice(0, 24)} columns={4} />
        ) : (
          <p className="rounded-lg border border-border bg-surface p-8 text-center text-text-muted">
            New {category.name.toLowerCase()} stock arrives weekly — ask us for current arrivals.
          </p>
        )}
      </section>

      {catGuides.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="mb-4 text-xl">Before you buy</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {catGuides.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      )}

      {catFaqs.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="mb-4 text-xl">Questions about {category.name.toLowerCase()}</h2>
          <Accordion
            items={catFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
            className="max-w-3xl"
          />
        </section>
      )}

      <div className="mt-10">
        <ButtonLink href="/tile-calculator" variant="secondary">
          Estimate quantity for your room
        </ButtonLink>
      </div>
    </Container>
  );
}

export function categoryMetadata(name: string, slug: string, summary: string) {
  return pageMetadata({
    title: `${name} in Mathura — prices, sizes & stock`,
    description: summary,
    path: `/${slug}`,
  });
}
