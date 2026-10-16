import { Container, SectionHeader } from "@/components/ui/Primitives";
import { WhatsAppIcon } from "@/components/layout/Header";
import type { SiteSettings } from "@/lib/types";

/** Showroom block (design §5.7): hairline editorial panel, three columns, no card boxes. */
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
 <section data-reveal="" className="border-t border-border">
  <Container className="py-16 md:py-28">
  <SectionHeader
   kicker="Visit"
   title="See the material in person"
   description="Touch the finishes, compare side by side, and get a quote on the spot."
  />
  <div className="grid gap-10 border-t border-border pt-10 md:grid-cols-3 md:gap-12">
   <div>
   <h3 className="kicker">Address</h3>
   <address className="mt-3 not-italic leading-relaxed">
    {[addr.line1, addr.line2].filter(Boolean).map((l, i) => (
    <span key={i} className="block">{l}</span>
    ))}
    <span className="block">{addr.locality}</span>
    <span className="block">
    {addr.city}, {addr.state} {addr.postalCode}
    </span>
   </address>
   <a
    href={settings.googleMapsUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="link-arrow mt-4"
   >
    Get directions
    <span aria-hidden="true" className="arrow">→</span>
   </a>
   </div>
   <div>
   <h3 className="kicker">Hours</h3>
   {openSummary ? (
    <p className="tnum mt-3 leading-relaxed">{openSummary}</p>
   ) : (
    <p className="mt-3 text-text-muted">Call us for current hours.</p>
   )}
   {closed.length > 0 && (
    <p className="mt-2 text-sm text-text-muted">
    Closed: {closed.map((h) => daysShort[h.day.toLowerCase()] ?? h.day).join(", ")}
    </p>
   )}
   </div>
   <div>
   <h3 className="kicker">Talk to us</h3>
   <div className="mt-3 flex flex-col gap-3">
    <a
    href={`tel:${settings.phone}`}
    className="tnum inline-flex h-12 items-center justify-center rounded-pill border border-text/25 px-6 text-sm font-semibold text-text transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-text hover:bg-text hover:text-white"
    >
    Call {settings.phoneDisplay ?? settings.phone}
    </a>
    <a
    href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-wa px-6 text-sm font-semibold text-white transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-wa-dark hover:shadow-raise"
    >
    <WhatsAppIcon />
    WhatsApp us
    </a>
   </div>
   </div>
  </div>
  </Container>
 </section>
 );
}
