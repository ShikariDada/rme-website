import Image from "next/image";
import Link from "next/link";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { contentSource } from "@/lib/data";

/** Browse-by-room + material rails (spec §9.4): compact, real counts only. */
export async function BrowseRails() {
  const [applications, categories, products] = await Promise.all([
    contentSource.getApplications(),
    contentSource.getCategories(),
    contentSource.getProducts(),
  ]);
  const active = products.filter((p) => p.status === "active");

  const roomCounts = applications.map((a) => ({
    ...a,
    count: active.filter((p) => p.applicationSlugs.includes(a.slug)).length,
  }));
  const materialCards = categories.map((c) => ({
    ...c,
    count: active.filter((p) => p.materialType === c.materialType).length,
  }));

  return (
    <Container className="py-10 md:py-14">
      <SectionHeader
        title="Start with your space"
        description="Browse by room, or by material — every listing shows the current price state and stock."
      />

      <h3 className="sr-only">By room</h3>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {roomCounts.map((room) => (
          <Link
            key={room.slug}
            href={`/room/${room.slug}`}
            className="group w-40 shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-surface md:w-48"
          >
            <div className="relative aspect-[4/3] bg-surface-muted">
              {room.image ? (
                <Image
                  src={room.image.url}
                  alt={room.image.alt}
                  fill
                  sizes="192px"
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
              ) : null}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium">{room.name}</p>
              {room.count > 0 && (
                <p className="text-xs text-text-muted">{room.count} products</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-text-muted">
        By material
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {materialCards.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm hover:border-accent/50"
          >
            {c.name}
            {c.count > 0 && <span className="text-xs text-text-muted">{c.count}</span>}
          </Link>
        ))}
      </div>
    </Container>
  );
}
