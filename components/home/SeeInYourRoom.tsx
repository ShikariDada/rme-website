import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { buildRoomPhotoMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { absoluteUrl } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

/**
 * "See it in your room" (spec §9.7): the visualizer is the primary path, the
 * manual WhatsApp room-photo service is the human fallback. Honest preview
 * language throughout.
 */
export function SeeInYourRoom({ settings }: { settings: SiteSettings }) {
  const photoHref = buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildRoomPhotoMessage(
      "a product from your catalogue",
      absoluteUrl("/products")
    ),
  });

  const steps = [
    {
      title: "Pick a product",
      body: "Open any tile, marble or granite page — or start from the visualizer and choose there.",
    },
    {
      title: "Show us the surface",
      body: "Upload a room photo in the visualizer and mark the floor or wall, or send the photo to us on WhatsApp.",
    },
    {
      title: "Preview, then confirm",
      body: "Get a realistic preview with the exact SKU. Final look and quantity are confirmed with real samples in the showroom.",
    },
  ];

  return (
    <Container className="py-10 md:py-14">
      <SectionHeader
        title="See it in your room"
        description="Wondering how a tile actually looks at home? Preview it against your own photo before you shortlist."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-lg border border-border bg-surface p-5">
            <p className="font-display text-lg text-accent">{i + 1}</p>
            <h3 className="mt-1 font-medium">{s.title}</h3>
            <p className="mt-1 text-sm text-text-muted">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/visualizer" size="lg">
          Open the visualizer
        </ButtonLink>
        <ButtonLink href={photoHref} variant="secondary" size="lg" external>
          Send a room photo on WhatsApp
        </ButtonLink>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        Previews are approximate and generated from the actual product imagery — they are
        not a substitute for seeing the material in person.
      </p>
    </Container>
  );
}
