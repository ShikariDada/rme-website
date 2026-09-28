"use client";

import { useState } from "react";
import Image from "next/image";
import type { ContentImage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
}: {
  images: ContentImage[];
  name: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="aspect-[4/3] w-full rounded-lg border border-border bg-surface-muted md:aspect-square"
        aria-hidden="true"
      />
    );
  }

  const current = images[Math.min(index, images.length - 1)];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => (i - 1 + images.length) % images.length);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex((i) => (i + 1) % images.length);
    }
  }

  return (
    <div>
      <div
        role="group"
        aria-label={`${name} — image ${Math.min(index, images.length - 1) + 1} of ${images.length}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-muted md:aspect-square"
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority={index === 0}
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((img, i) => (
            <li key={`${img.url}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={i === index}
                aria-label={`View image ${i + 1}: ${img.alt}`}
                className={cn(
                  "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border",
                  i === index
                    ? "border-accent ring-1 ring-accent"
                    : "border-border hover:border-accent/50"
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
