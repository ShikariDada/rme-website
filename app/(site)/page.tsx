import Image from "next/image";
import Link from "next/link";
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

  {/* Editorial split — rooms (design §5.3) */}
  <EditorialSplit
  image="/textures/marble-emperador-face-2.png"
  imageAlt="Large-format warm brown marble porcelain surface, close-up crop"
  kicker="By space"
  title={
   <>
   Rooms that hold up to how you{" "}
   <span className="text-accent-2">actually live</span>
   </>
  }
  copy="Bathrooms need grip underfoot; kitchens need stain resistance; living rooms carry the look. We stock each surface for the room it will serve, not one range sold for everything."
  href="/room"
  linkLabel="Browse by room"
  />

  {/* Featured collection grid (design §5.4) */}
  <Container className="py-14 md:py-24">
  <SectionHeader
   kicker="Ready stock"
   title="On the floor today"
   description="Exact prices and stock states on every card, verified, with the date."
   action={
   <Link href="/products" className="text-13 font-medium uppercase tracking-wide2 text-accent hover:underline hover:underline-offset-4">
    View all products →
   </Link>
   }
  />
  <ReadyStockGrid />
  </Container>

  {/* Visualizer promo — second editorial split */}
  <SeeInYourRoom settings={settings} />

  <FeaturedBrandBlock />

  {/* Craft / service band (design §5.5) */}
  <ServiceBand />

  <PriceGuideTeaser />

  {featuredProjects.length > 0 && (
  <Container className="py-14 md:py-24">
   <SectionHeader
   kicker="Displays"
   title="What you can walk on"
   action={
    <Link href="/projects" className="text-13 font-medium uppercase tracking-wide2 text-accent hover:underline hover:underline-offset-4">
    All displays →
    </Link>
   }
   />
   <div className="grid gap-6 md:grid-cols-3">
   {featuredProjects.map((p, i) => (
    <ProjectCard key={p.slug} project={p} priority={i === 0} />
   ))}
   </div>
  </Container>
  )}

  <section className="border-y border-border bg-surface-muted">
  <Container className="py-14 md:py-24">
   <SectionHeader
   kicker="Buying help"
   title="The answers our counter gives daily"
   action={
    <Link href="/guides" className="text-13 font-medium uppercase tracking-wide2 text-accent hover:underline hover:underline-offset-4">
    All guides →
    </Link>
   }
   />
   <div className="grid gap-6 md:grid-cols-3">
   {featuredGuides.map((g, i) => (
    <GuideCard key={g.slug} guide={g} priority={i === 0} />
   ))}
   </div>
  </Container>
  </section>

  <ShowroomBlock settings={settings} />

  <Container className="py-14 md:py-24">
  <SectionHeader
   kicker="Common questions"
   title="Pricing, stock, samples, delivery"
   description="The short version, with longer answers in the guides."
  />
  <Accordion
   items={siteFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
   className="max-w-3xl"
  />
  </Container>
 </>
 );
}

/** 50/50 editorial split (design §5.3): full-bleed image + muted panel. */
function EditorialSplit({
 image,
 imageAlt,
 kicker,
 title,
 copy,
 href,
 linkLabel,
 flip = false,
}: {
 image: string;
 imageAlt: string;
 kicker: string;
 title: React.ReactNode;
 copy: string;
 href: string;
 linkLabel: string;
 flip?: boolean;
}) {
 return (
 <section className={`grid md:grid-cols-2 ${flip ? "" : ""}`}>
  <div className={`relative min-h-80 md:min-h-120 ${flip ? "md:order-2" : ""}`}>
  <Image src={image} alt={imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
  </div>
  <div className="flex items-center bg-surface-muted">
  <div className="max-w-130 px-6 py-14 md:px-16 md:py-20">
   <p className="kicker">{kicker}</p>
   <h2 className="mt-4 font-display text-h2 leading-h2">{title}</h2>
   <p className="mt-5 text-base leading-relaxed text-text-muted">{copy}</p>
   <Link
   href={href}
   className="group mt-7 inline-flex items-center gap-2 text-13 font-medium uppercase tracking-wide2 text-accent"
   >
   {linkLabel}
   <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
   </Link>
  </div>
  </div>
 </section>
 );
}

/** Service band (design §5.5): three columns, no icons in circles, no counters. */
function ServiceBand() {
 const services = [
 {
  title: "Showroom visits",
  copy: "Walk the floors and compare full-scale displays under real light. No appointment needed during opening hours.",
  href: "/showroom",
  label: "Plan a visit",
 },
 {
  title: "Sample service",
  copy: "Take standard tile samples home to judge them in your own light. Premium slabs reserved against a refundable deposit.",
  href: "/contact",
  label: "Ask about samples",
 },
 {
  title: "Laying guidance",
  copy: "Bring your measurements or a room photo. We'll advise on layout, grout and the quantity your installer should plan for.",
  href: "/tile-calculator",
  label: "Estimate quantity",
 },
 ];
 return (
 <section className="border-y border-border bg-surface-muted">
  <Container className="grid gap-10 py-14 md:grid-cols-3 md:gap-12 md:py-24">
  {services.map((s) => (
   <div key={s.title}>
   <h3 className="font-display text-h3 leading-snug">{s.title}</h3>
   <p className="mt-3 text-15 leading-relaxed text-text-muted">{s.copy}</p>
   <Link
    href={s.href}
    className="group mt-5 inline-flex items-center gap-2 text-13 font-medium uppercase tracking-wide2 text-accent"
   >
    {s.label}
    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
   </Link>
   </div>
  ))}
  </Container>
 </section>
 );
}

async function ReadyStockGrid() {
 const featured = await getFeaturedProducts(8);
 return <ProductGrid products={featured} />;
}
