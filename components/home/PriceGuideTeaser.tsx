import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { formatINR, formatUnit } from "@/lib/pricing/format";
import { contentSource } from "@/lib/data";

/**
 * Price guidance (design §6): clean hairline-divided rows, tabular figures,
 * soft hover. No card boxes.
 */
export async function PriceGuideTeaser() {
  const categories = await contentSource.getCategories();
  const withGuide = categories.filter((c) => c.priceGuide && c.priceGuide.length > 0);

  return (
    <Container data-reveal="" className="py-16 md:py-28">
      <SectionHeader
        kicker="Price guidance"
        title="Current ranges, with dates"
        description="Exact product prices are on every listing. Natural stone varies by lot, thickness and finish. The exact figure is confirmed when you pick your slab."
        action={
          <ButtonLink href="/tile-calculator" variant="secondary">
            Estimate quantity
          </ButtonLink>
        }
      />
      <div className="divide-y divide-border border-y border-border">
        {withGuide.map((c) =>
          (c.priceGuide ?? []).map((g) => (
            <div
              key={`${c.slug}-${g.label}`}
              className="grid md:grid-cols-price items-baseline gap-x-6 gap-y-1 py-4 transition-colors hover:bg-surface md:px-2"
            >
              <p className="text-15">
                <Link
                  href={`/${c.slug}`}
                  className="font-medium transition-colors hover:text-accent-hover"
                >
                  {g.label}
                </Link>
              </p>
              <p className="tnum text-15 font-bold text-text md:text-right">
                {formatINR(g.min)}–{formatINR(g.max)}
                <span className="ml-1 text-xs font-normal text-text-muted">
                  / {formatUnit(g.unit)}
                </span>
              </p>
              <p className="col-span-2 text-xs text-text-muted md:col-span-1 md:min-w-27 md:text-right">
                verified {new Date(g.lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          ))
        )}
      </div>
    </Container>
  );
}
