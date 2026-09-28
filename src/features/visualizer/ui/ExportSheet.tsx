"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import { SHARE_INSTRUCTION } from "../share/whatsapp";

/** Export/share sheet (spec §32–33): image, design card, WhatsApp fallback. */
export function ExportSheet({
  onShare,
  onSaveImage,
  onSaveCard,
  onQuote,
  hasMaterial,
}: {
  onShare: () => void;
  onSaveImage: () => void;
  onSaveCard: () => void;
  onQuote: () => void;
  hasMaterial: boolean;
}) {
  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" onClick={onShare} disabled={!hasMaterial}>
        Share preview…
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onSaveImage} disabled={!hasMaterial}>
          Save image
        </Button>
        <Button variant="secondary" onClick={onSaveCard} disabled={!hasMaterial}>
          Save design card
        </Button>
      </div>
      <Button variant="whatsapp" size="lg" className="w-full" onClick={onQuote} disabled={!hasMaterial}>
        Get quote on WhatsApp
      </Button>
      <p className="text-xs text-text-muted">
        If sharing is not available on your device, the preview is saved to
        your downloads first. {SHARE_INSTRUCTION}
      </p>
      <p className="text-xs text-text-muted">
        Previews are approximate unless you set a real scale — final decisions
        with real samples in the showroom.
      </p>
    </div>
  );
}

export function ShareFallbackLink({ href }: { href: string }) {
  return (
    <ButtonLink href={href} variant="whatsapp" external className="w-full">
      Open WhatsApp for quote
    </ButtonLink>
  );
}
