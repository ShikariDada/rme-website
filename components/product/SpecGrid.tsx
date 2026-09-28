import { Fragment } from "react";
import type { Product } from "@/lib/types";

interface SpecRow {
  label: string;
  value?: string;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function useLabel(use: Array<"floor" | "wall">): string {
  const hasFloor = use.includes("floor");
  const hasWall = use.includes("wall");
  if (hasFloor && hasWall) return "Floor & wall";
  if (hasFloor) return "Floor";
  if (hasWall) return "Wall";
  return "";
}

function tileRows(product: Product, roomNames: string[]): SpecRow[] {
  const tile = product.tile;
  if (!tile) return [];
  return [
    {
      label: "Size",
      value: `${tile.widthMm}×${tile.heightMm} mm`,
    },
    {
      label: "Thickness",
      value: tile.thicknessMm !== undefined ? `${tile.thicknessMm} mm` : undefined,
    },
    {
      label: product.finish.length > 1 ? "Finishes" : "Finish",
      value: product.finish.map(titleCase).join(", ") || undefined,
    },
    { label: "Body / type", value: tile.bodyType },
    { label: "Use", value: useLabel(tile.use) || undefined },
    { label: "Rooms", value: roomNames.length > 0 ? roomNames.join(", ") : undefined },
    {
      label: "Tiles per box",
      value: tile.tilesPerBox !== undefined ? String(tile.tilesPerBox) : undefined,
    },
    {
      label: "Box coverage",
      value:
        tile.coverageSqFtPerBox !== undefined
          ? `${tile.coverageSqFtPerBox} sq ft`
          : undefined,
    },
    { label: "Faces", value: tile.faces !== undefined ? String(tile.faces) : undefined },
  ];
}

function stoneRows(product: Product): SpecRow[] {
  const stone = product.stone;
  if (!stone) return [];
  return [
    { label: "Material", value: titleCase(product.materialType) },
    { label: "Origin", value: stone.origin },
    {
      label: product.finish.length > 1 ? "Finishes" : "Finish",
      value: product.finish.map(titleCase).join(", ") || undefined,
    },
    {
      label: "Thickness options",
      value:
        stone.thicknessOptionsMm && stone.thicknessOptionsMm.length > 0
          ? `${stone.thicknessOptionsMm.join(" / ")} mm`
          : undefined,
    },
    { label: "Slab sizes", value: stone.slabSizeText },
    { label: "Variation", value: stone.variationNote },
  ];
}

export function SpecGrid({
  product,
  roomNames = [],
}: {
  product: Product;
  roomNames?: string[];
}) {
  const rows = (product.tile ? tileRows(product, roomNames) : stoneRows(product)).filter(
    (row): row is SpecRow & { value: string } => Boolean(row.value)
  );
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="spec-grid-heading">
      <h2 id="spec-grid-heading" className="text-xl md:text-2xl">
        Specifications
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-text-muted">{row.label}</dt>
            <dd className="min-w-0 break-words">{row.value}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
