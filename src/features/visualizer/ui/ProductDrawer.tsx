"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { VisualizerMaterial } from "@visualizer/engine";

/** Product drawer (spec §29): thumbnails, name, size, price, honest availability. */
export function ProductDrawer({
  materials,
  selectedId,
  onSelect,
}: {
  materials: VisualizerMaterial[];
  selectedId?: string;
  onSelect: (materialId: string) => void;
}) {
  if (materials.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No visualizer-ready products yet — textures are being captured. Try a
        sample room with the default material.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {materials.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            onClick={() => onSelect(m.id)}
            aria-pressed={selectedId === m.id}
            className={cn(
              "w-full overflow-hidden rounded-lg border text-left transition-colors",
              selectedId === m.id ? "border-accent ring-1 ring-accent" : "border-border hover:border-accent/50"
            )}
          >
            <span className="relative block aspect-[4/3] bg-surface-muted">
              <Image
                src={m.faces[0].previewUrl}
                alt={`${m.name} surface texture`}
                fill
                sizes="(max-width: 768px) 45vw, 220px"
                className="object-cover"
              />
            </span>
            <span className="block p-2.5">
              <span className="line-clamp-2 block text-sm font-medium leading-snug">{m.name}</span>
              <span className="mt-1 block text-xs text-text-muted">
                {m.widthMm}×{m.heightMm} mm · {m.finish}
              </span>
              {typeof m.pricePerSqFt === "number" && (
                <span className="mt-0.5 block text-xs font-medium">₹{m.pricePerSqFt}/sq ft</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function RailButtonFallback() {
  return <Button variant="text">—</Button>;
}
