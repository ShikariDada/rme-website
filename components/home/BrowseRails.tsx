import Image from "next/image";
import Link from "next/link";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { contentSource } from "@/lib/data";

/**
 * Browse rails (design §5.2): material chips, a horizontal room rail of
 * rounded 4:5 plates with counts, and a look chip row. All counts come from
 * the live catalogue; a zero count hides the entry. No fake numbers.
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

  const lookLabels: Record<string, string> = {
    marble: "Marble look",
    wood: "Wood look",
    concrete: "Concrete look",
    stone: "Stone look",
    solid: "Plain surface",
  };
  const lookCards = Object.entries(lookLabels)
    .map(([slug, name]) => ({
      slug,
      name,
      count: active.filter((p) => p.look.includes(slug)).length,
    }))
    .filter((l) => l.count > 0);

  const chip =
    "inline-flex h-10 items-center rounded-pill border border-border bg-surface px-4 text-13 font-medium text-text-muted transition-all duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-text/30 hover:text-text hover:shadow-card";

  return (
    <Container className="py-16 md:py-28">
      <SectionHeader
        kicker="Collections"
        title="Start with the material"
        description="Every listing shows the current price state and stock, verified, with dates."
      />

      <div data-reveal="" className="flex flex-wrap gap-2">
        {materialCards.map((c) => (
          <Link key={c.slug} href={`/${c.slug}`} className={chip}>
            {c.name}
            {c.count > 0 && <span className="tnum ml-1.5 text-text-muted/70">({c.count})</span>}
          </Link>
        ))}
      </div>

      <h3 className="kicker mt-12 flex items-center gap-2.5">
        <span aria-hidden="true" className="h-px w-6 bg-accent" />
        By room
      </h3>
      <div
        data-reveal-grid=""
        className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:px-0"
      >
        {roomCards.map((room) => (
          <Link
            key={room.slug}
            href={`/room/${room.slug}`}
            className="group w-44 shrink-0 snap-start md:w-56"
          >
            <div className="relative aspect-45 overflow-hidden rounded-md bg-surface-muted shadow-card transition-shadow duration-500 ease-out-expo group-hover:shadow-raise">
              <Image
                src={room.image!.url}
                alt={room.image!.alt}
                fill
                sizes="224px"
                className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/70 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3.5">
                <p className="text-sm font-semibold text-white">{room.name}</p>
                <p className="tnum rounded-pill bg-white/15 px-2 py-0.5 text-11 font-medium text-white backdrop-blur-sm">
                  {room.count}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h3 className="kicker mt-12 flex items-center gap-2.5">
        <span aria-hidden="true" className="h-px w-6 bg-accent" />
        By look
      </h3>
      <div data-reveal="" className="mt-5 flex flex-wrap gap-2">
        {lookCards.map((look) => (
          <Link key={look.slug} href={`/products?look=${look.slug}`} className={chip}>
            {look.name}
            <span className="tnum ml-1.5 text-text-muted/70">({look.count})</span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
