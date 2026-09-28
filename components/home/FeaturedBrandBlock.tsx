import Link from "next/link";
import { Badge } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";
import { ProductGrid } from "@/components/catalogue/ProductCard";
import { contentSource } from "@/lib/data";

/**
 * Varmora / featured-brand trust block (spec §9.5). The authorised-dealer
 * claim renders ONLY when the brand record allows it (owner confirmation
 * gate). No manufacturer stat walls.
 */
export async function FeaturedBrandBlock() {
  const brand = await contentSource.getBrandBySlug("varmora");
  if (!brand) return null;

  const products = (await contentSource.getProducts()).filter(
    (p) => p.status === "active" && p.brandName === brand.name
  );
  const featured = products.filter((p) => p.featured || p.newArrival).slice(0, 3);
  const shown = (featured.length > 0 ? featured : products.slice(0, 3));

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl">{brand.name}</h2>
              {brand.isAuthorizedDealerClaimAllowed && (
                <Badge tone="success">Authorised dealer</Badge>
              )}
            </div>
            {brand.description && (
              <p className="mt-2 max-w-2xl text-text-muted">{brand.description}</p>
            )}
          </div>
          <ButtonLink href={`/brand/${brand.slug}`} variant="secondary">
            View {brand.name} range
          </ButtonLink>
        </div>
        {shown.length > 0 ? (
          <ProductGrid products={shown} />
        ) : (
          <p className="text-sm text-text-muted">
            {brand.name} ranges arrive in the showroom regularly —{" "}
            <Link href="/contact" className="text-accent underline underline-offset-2">
              ask us what is currently in stock
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
