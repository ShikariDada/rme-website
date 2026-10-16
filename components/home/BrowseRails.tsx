import Image from "next/image";
import Link from "next/link";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { contentSource } from "@/lib/data";

/**
 * Material rail (design §5.2): horizontal strip of 4:5 texture crops framed by
 * hairlines, name + real catalogue count. No fake counts — zero hides the count.
 */
export async function BrowseRails() {
  const [applications, categories, products] = await Promise.all([
    contentSource.getApplications(),
    contentSource.getCategories(),
    contentSource.getProducts(),
  ]);
  const active = products.filter((p) => p.status === "active");

  const roomCards = applications
    .map((a) => ({
      ...a,
      count: active.filter((p) => p.applicationSlugs.includes(a.slug)).length,
    }))
    .filter((a) => a.image && a.count > 0);

  const materialCards = categories.map((c) => ({
    ...c,
    count: active.filter((p) => p.materialType === c.materialType).length,
  }));

  return (
    <Container className="py-14 md:py-24">
      <SectionHeader
        kicker="Collections"
        title="Start with the material"
        description="Every listing shows the current price state and stock — verified, with dates."
      />

      <div className="flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4">
        {materialCards.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="text-[13px] font-medium uppercase tracking-[0.1em] text-text-muted transition-colors hover:text-text hover:underline hover:decoration-accent hover:underline-offset-[6px]"
          >
            {c.name}
            {c.count > 0 && <span className="ml-1.5 text-text-muted/70">({c.count})</span>}
          </Link>
        ))}
      </div>

      <h3 className="kicker mt-10">By room</h3>
      <div className="-mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {roomCards.map((room) => (
          <Link
            key={room.slug}
            href={`/room/${room.slug}`}
            className="group w-44 shrink-0 snap-start md:w-52"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-muted">
              <Image
                src={room.image!.url}
                alt={room.image!.alt}
                fill
                sizes="208px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="pt-3">
              <p className="text-[15px] font-medium group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4">
                {room.name}
              </p>
              <p className="tnum mt-0.5 text-[13px] text-text-muted">
                {room.count} {room.count === 1 ? "surface" : "surfaces"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
