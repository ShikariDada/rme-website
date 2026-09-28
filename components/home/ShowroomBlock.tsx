import { Container, SectionHeader } from "@/components/ui/Primitives";
import { WhatsAppIcon } from "@/components/layout/Header";
import type { SiteSettings } from "@/lib/types";

/** Showroom block (spec §9.11): address, honest hours, call/WhatsApp/directions. */
export function ShowroomBlock({ settings }: { settings: SiteSettings }) {
  const addr = settings.address;
  const open = settings.hours.filter((h) => !h.closed);
  const closed = settings.hours.filter((h) => h.closed);
  const daysShort: Record<string, string> = {
    monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
    friday: "Fri", saturday: "Sat", sunday: "Sun",
  };
  const openSummary = open
    .map((h) => `${daysShort[h.day.toLowerCase()] ?? h.day} ${h.opens}–${h.closes}`)
    .join(" · ");

  return (
    <Container className="py-10 md:py-14">
      <SectionHeader
        title="Visit the showroom"
        description="Touch the materials, compare finishes side by side, and get a quote on the spot."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Address</h3>
          <address className="mt-2 not-italic leading-relaxed">
            {[addr.line1, addr.line2, addr.locality].filter(Boolean).map((l, i) => (
              <span key={i} className="block">{l}</span>
            ))}
            <span className="block">
              {addr.city}, {addr.state} {addr.postalCode}
            </span>
          </address>
          <a
            href={settings.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[44px] items-center text-accent underline underline-offset-2"
          >
            Get directions
          </a>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Hours</h3>
          {openSummary ? (
            <p className="mt-2 leading-relaxed">{openSummary}</p>
          ) : (
            <p className="mt-2 text-text-muted">Call us for current hours.</p>
          )}
          {closed.length > 0 && (
            <p className="mt-1 text-sm text-text-muted">
              Closed: {closed.map((h) => daysShort[h.day.toLowerCase()] ?? h.day).join(", ")}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Talk to us</h3>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex min-h-[44px] items-center rounded-md border border-border px-4 font-medium hover:bg-surface-muted"
            >
              Call {settings.phoneDisplay ?? settings.phone}
            </a>
            <a
              href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-[#1fa855] px-4 font-medium text-white hover:bg-[#178a45]"
            >
              <WhatsAppIcon />
              WhatsApp the showroom
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
