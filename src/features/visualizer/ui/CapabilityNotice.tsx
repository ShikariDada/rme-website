"use client";

import { ButtonLink } from "@/components/ui/Button";

/** WebGL2 unavailable (spec §23 Tier 0 guard) — honest fallback, not a crash. */
export function CapabilityNotice({
  message,
  whatsappNumber,
}: {
  message: string;
  whatsappNumber: string;
}) {
  const waHref = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi, I'd like help visualising a tile in my room."
  )}`;
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl">Preview not available on this browser</h1>
      <p className="mt-3 text-text-muted">{message}</p>
      <p className="mt-2 text-sm text-text-muted">
        You can still send us a photo of your room on WhatsApp and our team
        will show you the material applied.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ButtonLink href={waHref} variant="whatsapp" external>
          Send a room photo on WhatsApp
        </ButtonLink>
        <ButtonLink href="/products" variant="secondary">
          Browse products instead
        </ButtonLink>
      </div>
    </div>
  );
}
