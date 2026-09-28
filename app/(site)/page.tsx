import { Container, SectionHeader } from "@/components/ui/Primitives";
import { Accordion } from "@/components/ui/Accordion";
import { Hero } from "@/components/home/Hero";
import { BrowseRails } from "@/components/home/BrowseRails";
import { FeaturedBrandBlock } from "@/components/home/FeaturedBrandBlock";
import { SeeInYourRoom } from "@/components/home/SeeInYourRoom";
import { PriceGuideTeaser } from "@/components/home/PriceGuideTeaser";
import { ShowroomBlock } from "@/components/home/ShowroomBlock";
import { GuideCard, ProjectCard } from "@/components/content/Cards";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { pageMetadata } from "@/lib/seo/metadata";
import { localBusinessJsonLd } from "@/lib/seo/jsonld";
import { contentSource, getFeaturedProducts } from "@/lib/data";

export async function generateMetadata() {
  const settings = await contentSource.getSettings();
  return pageMetadata({
    title: settings.seoDefaultTitle,
    description: settings.seoDefaultDescription,
    path: "/",
  });
}

export default async function HomePage() {
  const [settings, projects, guides, faqs] = await Promise.all([
    contentSource.getSettings(),
    contentSource.getProjects(),
    contentSource.getGuides(),
    contentSource.getFaqs(),
  ]);
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);
  const featuredGuides = guides.slice(0, 3);
  const siteFaqs = faqs
    .filter((f) => f.scope === "site")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(settings)) }}
      />
      <Hero settings={settings} />
      <BrowseRails />
      <FeaturedBrandBlock />

      <Container className="py-10 md:py-14">
        <SectionHeader
          title="Ready stock, honestly labelled"
          description="Current picks from the floor. Exact prices and stock states on every card."
          action={
            <a href="/products" className="text-accent underline underline-offset-2">
              View all products
            </a>
          }
        />
        <ReadyStockGrid />
      </Container>

      <SeeInYourRoom settings={settings} />
      <PriceGuideTeaser />

      {featuredProjects.length > 0 && (
        <Container className="py-10 md:py-14">
          <SectionHeader
            title="What you can see on our floor"
            description="Displays you can walk on in the showroom."
            action={
              <a href="/projects" className="text-accent underline underline-offset-2">
                All displays
              </a>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {featuredProjects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} priority={i === 0} />
            ))}
          </div>
        </Container>
      )}

      <section className="border-y border-border bg-surface">
        <Container className="py-10 md:py-14">
          <SectionHeader
            title="Buying help that actually helps"
            description="No filler — the answers our counter staff give every day."
            action={
              <a href="/guides" className="text-accent underline underline-offset-2">
                All guides
              </a>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {featuredGuides.map((g, i) => (
              <GuideCard key={g.slug} guide={g} priority={i === 0} />
            ))}
          </div>
        </Container>
      </section>

      <ShowroomBlock settings={settings} />

      <Container className="py-10 md:py-14">
        <SectionHeader
          title="Common questions"
          description="Pricing, stock, samples and delivery — the short version."
        />
        <Accordion
          items={siteFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
          className="max-w-3xl"
        />
      </Container>
    </>
  );
}

async function ReadyStockGrid() {
  const featured = await getFeaturedProducts(8);
  return <ProductGrid products={featured} />;
}
