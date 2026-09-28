import { Container, SectionHeader } from "@/components/ui/Primitives";
import { GuideCard } from "@/components/content/Cards";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

export const metadata = pageMetadata({
  title: "Buying guides — tiles, marble & granite explained",
  description:
    "Practical guides from our Mathura showroom: tile sizes for Indian rooms, vitrified vs ceramic vs natural stone, and how to estimate quantity and wastage.",
  path: "/guides",
});

export default async function GuidesPage() {
  const guides = await contentSource.getGuides();
  return (
    <Container className="py-10 md:py-14">
      <SectionHeader
        title="Buying guides"
        description="The answers our counter staff give every day — written down properly."
      />
      {guides.length === 0 ? (
        <p className="text-text-muted">Guides are on the way — ask us anything in the showroom meanwhile.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {guides.map((g, i) => (
            <GuideCard key={g.slug} guide={g} priority={i < 3} />
          ))}
        </div>
      )}
    </Container>
  );
}
