"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * First screen (spec §29): use my photo, or try a curated sample room with
 * known geometry for the instant demo.
 */
export function RoomPicker({
  onUseOwnPhoto,
  onUsePreset,
}: {
  onUseOwnPhoto: (file: File) => void;
  onUsePreset: (presetId: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<{ id: string; name: string; image: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/rooms/preset-rooms.json");
        const data = (await res.json()) as { id: string; name: string; image: string }[];
        if (!cancelled) setPresets(data);
      } catch {
        // presets are optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setError("That file is not an image — try a JPG or PNG photo.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("That photo is very large — try one under 25 MB.");
      return;
    }
    setError(null);
    onUseOwnPhoto(file);
  }

  return (
    <div className="mx-auto max-w-md py-4">
      <h1 className="text-2xl leading-tight">See it in your room</h1>
      <p className="mt-2 text-sm text-text-muted">
        Your photo stays on this device — the preview runs entirely in your
        browser. Nothing is uploaded.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-surface p-4">
        <p className="font-medium">Use my photo</p>
        <p className="mt-1 text-sm text-text-muted">
          Take a straight-on photo of your floor or wall where the surface is
          clearly visible.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          aria-label="Choose a room photo"
        />
        <Button className="mt-3 w-full" onClick={() => fileRef.current?.click()}>
          Choose a photo
        </Button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 block text-sm font-medium">Or try a sample room</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onUsePreset(p.id)}
              className={cn(
                "overflow-hidden rounded-lg border border-border bg-surface text-left transition-colors hover:border-accent/60"
              )}
            >
              <span className="relative block aspect-[4/3] bg-surface-muted">
                <Image src={p.image} alt={`${p.name} sample room`} fill sizes="140px" className="object-cover" />
              </span>
              <span className="block p-2 text-xs font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
