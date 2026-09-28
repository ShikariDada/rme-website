import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Primitives";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const app = await contentSource.getApplicationBySlug(slug);
  if (!app) return pageMetadata({ title: "Room not found", description: "", path: `/room/${slug}`, noindex: true });
  return pageMetadata({
    title: `${app.name} — tiles & surfaces for every ${app.name.toLowerCase()}`,
    description: app.description,
    path: `/room/${app.slug}`,
  });
}

export default async function RoomPage({ params }: Props) {
  const { slug } = await params;
  const app = await contentSource.getApplicationBySlug(slug);
  if (!app) notFound();

  const products = (await contentSource.getProducts()).filter(
    (p) => p.status === "active" && p.applicationSlugs.includes(app.slug)
  );

  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb
        items={[
          { name: "Home", href: "/" },
          { name: "By Room", href: "/room" },
          { name: app.name },
        ]}
      />
      <h1 className="mt-4 text-3xl leading-tight md:text-4xl">{app.name}</h1>
      <p className="mt-3 max-w-3xl text-text-muted">{app.description}</p>

      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} columns={4} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-8 text-center">
            <p className="text-text-muted">
              We are photographing this range now — WhatsApp us and we will send
              current stock photos straight away.
            </p>
            <ButtonLink href="/contact" variant="secondary" className="mt-4">
              Ask about {app.name.toLowerCase()} options
            </ButtonLink>
          </div>
        )}
      </div>
    </Container>
  );
}
