import { CategoryPage, categoryMetadata } from "../category/CategoryPage";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const c = await contentSource.getCategoryBySlug("marble");
  return categoryMetadata(
    c?.name ?? "Marble",
    "marble",
    c?.summary ?? "Natural marble slabs with honest lot-variation guidance."
  );
}

export default function MarbleRoute() {
  return <CategoryPage slug="marble" path="/marble" />;
}
