import { CategoryPage, categoryMetadata } from "../category/CategoryPage";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const c = await contentSource.getCategoryBySlug("granite");
  return categoryMetadata(
    c?.name ?? "Granite",
    "granite",
    c?.summary ?? "Hard-wearing granite for kitchens, stairs and facades."
  );
}

export default function GraniteRoute() {
  return <CategoryPage slug="granite" path="/granite" />;
}
