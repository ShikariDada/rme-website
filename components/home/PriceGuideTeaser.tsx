import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { formatINR, formatUnit } from "@/lib/pricing/format";
import { contentSource } from "@/lib/data";

/** Price guidance + calculator teaser, combined (spec §9.8). */
export async function PriceGuideTeaser() {
  const categories = await contentSource.getCategories();
  const withGuide = categories.filter((c) => c.priceGuide && c.priceGuide.length > 0);

  return (
    <section className="border-y border-border bg-surface">
      <Container className="py-10 md:py-14">
        <SectionHeader
          title="Honest price guidance"
          description="Current ranges by category, with the date each was last verified. Exact product prices are on every listing."
          action={
            <ButtonLink href="/tile-calculator" variant="secondary">
              Estimate boxes for your room
            </ButtonLink>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {withGuide.map((c) => (
            <div key={c.slug} className="rounded-lg border border-border p-5">
              <h3 className="font-medium">
                <Link href={`/${c.slug}`} className="hover:underline underline-offset-2">
                  {c.name}
                </Link>
              </h3>
              <ul className="mt-3 space-y-3">
                {c.priceGuide?.map((g) => (
                  <li key={g.label} className="text-sm">
                    <p>{g.label}</p>
                    <p className="mt-0.5 font-medium">
                      {formatINR(g.min)}–{formatINR(g.max)} / {formatUnit(g.unit)}
                    </p>
                    <p className="text-xs text-text-muted">
                      Verified {new Date(g.lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-text-muted">
          Natural stone varies by lot, thickness and finish — the exact figure is confirmed
          when you pick your slab. Tile prices shown per square foot include GST where noted.
        </p>
      </Container>
    </section>
  );
}
