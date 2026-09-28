import { Container } from "@/components/ui/Primitives";
import { TileCalculator } from "@/components/calculator/TileCalculator";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Tile calculator — how many boxes do I need?",
  description:
    "Estimate tile boxes, tiles and coverage for your room — by total area or room dimensions, with an editable wastage allowance. Planning tool from our Mathura showroom.",
  path: "/tile-calculator",
});

export default function TileCalculatorPage() {
  return (
    <Container className="py-8 md:py-12">
      <h1 className="text-3xl leading-tight md:text-4xl">Tile quantity calculator</h1>
      <p className="mt-3 max-w-2xl text-text-muted">
        Measure each floor or wall as length × width, add a wastage allowance,
        and round up to whole boxes. The box coverage figure is printed on
        every product page.
      </p>
      <div className="mt-8">
        <TileCalculator />
      </div>
    </Container>
  );
}
