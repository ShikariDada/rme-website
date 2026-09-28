"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/track";

/**
 * Catalogue search dialog (spec §16). Submits to the URL-driven /products
 * page so results are server-rendered and shareable.
 */
export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    track("search_submit", { source_surface: "search-dialog" });
    setOpen(false);
    router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products"
        className="flex h-11 w-11 items-center justify-center rounded-md text-text hover:bg-surface-muted"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Search catalogue">
        <form onSubmit={submit} role="search">
          <Input
            autoFocus
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “600x1200”, “marble”, or a SKU…"
            aria-label="Search products"
          />
          <p className="mt-2 text-sm text-text-muted">
            Common sizes work too: 2x2, 2x4, 4x8.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Search</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
