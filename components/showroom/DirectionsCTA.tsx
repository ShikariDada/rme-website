"use client";

import { trackDirectionsClick } from "@/lib/analytics/track";

export function DirectionsCTA({ mapsUrl }: { mapsUrl: string }) {
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackDirectionsClick("showroom")}
      className="inline-flex min-h-[44px] items-center text-accent underline underline-offset-2"
    >
      Get directions (Google Maps)
    </a>
  );
}
