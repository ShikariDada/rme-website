"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Map embed loaded strictly on interaction (spec §24: map loads on
 * interaction, reserved size before that to avoid CLS).
 */
export function MapEmbed({ query }: { query: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-border bg-surface-muted">
      {loaded ? (
        <iframe
          src={src}
          title={`Map — ${query}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button variant="secondary" onClick={() => setLoaded(true)}>
            Load map
          </Button>
        </div>
      )}
    </div>
  );
}
