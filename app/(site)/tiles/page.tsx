import { CategoryPage, categoryMetadata } from "../category/CategoryPage";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const c = await contentSource.getCategoryBySlug("tiles");
  return categoryMetadata(
    c?.name ?? "Tiles",
    "tiles",
    c?.summary ?? "Browse tiles with honest prices and stock states."
  );
}

export default function TilesRoute() {
  return <CategoryPage slug="tiles" path="/tiles" />;
}
