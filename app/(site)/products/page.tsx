import { Suspense } from "react";
import type { Metadata } from "next";
import { Container, Skeleton } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";
import { materialDescription, materialLabel } from "@/lib/catalogue/facets";
import { ProductsClient } from "./products-client";

// Static canonical metadata for /products: the URL-driven index-policy
// variation is dropped (the client renders from search state, so the shared
// static shell must stay indexable).
export function generateMetadata(): Metadata {
  return pageMetadata({
    title: `${materialLabel()} — sizes, finishes & prices`,
    description: materialDescription(),
    path: "/products",
  });
}

export default async function ProductsPage() {
  const [products, applications, brands] = await Promise.all([
    contentSource.getProducts(),
    contentSource.getApplications(),
    contentSource.getBrands(),
  ]);

  return (
    <Suspense
      fallback={
        <Container className="pb-10 pt-6 md:pt-8">
          <Skeleton className="h-8 w-64" />
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[4/3]" />
            ))}
          </div>
        </Container>
      }
    >
      <ProductsClient
        allProducts={products}
        applications={applications}
        brands={brands}
      />
    </Suspense>
  );
}
