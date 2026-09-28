import { ProductGrid } from "@/components/catalogue/ProductCard";
import type { Product } from "@/lib/types";

export function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="related-products-heading">
      <h2 id="related-products-heading" className="text-xl md:text-2xl">
        You may also like
      </h2>
      <div className="mt-4">
        <ProductGrid products={products} columns={3} />
      </div>
    </section>
  );
}
