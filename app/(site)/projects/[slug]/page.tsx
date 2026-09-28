import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Accordion";
import { Badge, Container } from "@/components/ui/Primitives";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = await contentSource.getProjectBySlug(slug);
  if (!project) return pageMetadata({ title: "Project not found", description: "", path: `/projects/${slug}`, noindex: true });
  return pageMetadata({
    title: project.seo?.title ?? project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    images: project.images[0] ? [{ url: project.images[0].url, alt: project.images[0].alt }] : undefined,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await contentSource.getProjectBySlug(slug);
  if (!project) notFound();

  const products = (await contentSource.getProducts()).filter(
    (p) => p.status === "active" && project.productSlugs.includes(p.slug)
  );

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb
        items={[
          { name: "Home", href: "/" },
          { name: "Projects", href: "/projects" },
          { name: project.title },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge>{project.projectType}</Badge>
        {project.locationLabel && <Badge tone="muted">{project.locationLabel}</Badge>}
      </div>
      <h1 className="mt-3 text-3xl leading-tight md:text-4xl">{project.title}</h1>
      <p className="mt-3 max-w-3xl text-text-muted">{project.summary}</p>
      <p className="mt-2 text-sm text-text-muted">
        Imagery shows our showroom displays and sample installations — not private customer homes.
      </p>

      <div className="mt-6 space-y-4">
        {project.images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-surface-muted"
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {products.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="mb-4 text-xl">Materials in this display</h2>
          <ProductGrid products={products} columns={3} />
        </section>
      )}
    </Container>
  );
}
