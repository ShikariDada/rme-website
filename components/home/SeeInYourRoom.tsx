import Image from "next/image";
import Link from "next/link";
import { Container, SectionHeader } from "@/components/ui/Primitives";
import { buildRoomPhotoMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { absoluteUrl } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";

/**
 * Visualizer promo (design §5.6): editorial split — copy left, room scene
 * right. Steps as numbered editorial rows, not cards. Honest preview language.
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
  title: "Pick a surface",
  body: "Open any tile, marble or granite, or start in the visualizer and choose there.",
 },
 {
  title: "Show us your room",
  body: "Upload a photo in the visualizer and mark the floor or wall. Your photo stays on your device.",
 },
 {
  title: "Preview, then confirm",
  body: "See the exact SKU in place. Final look and quantity are confirmed with real samples in the showroom.",
 },
 ];

 return (
 <section className="grid md:grid-cols-2">
  <div className="flex items-center bg-surface-muted md:order-1">
  <div className="max-w-130 px-6 py-14 md:px-16 md:py-20">
   <p className="kicker">See it in your room</p>
   <h2 className="mt-4 font-display text-h2 leading-h2">
   Preview the material{" "}
   <span className="text-accent-2">before</span> you commit
   </h2>
   <ol className="mt-7 space-y-6">
   {steps.map((s, i) => (
    <li key={s.title} className="flex gap-5">
    <span className="tnum shrink-0 font-display text-15 text-accent" aria-hidden="true">
     {String(i + 1).padStart(2, "0")}
    </span>
    <div>
     <p className="text-15 font-medium">{s.title}</p>
     <p className="mt-1 text-15 leading-relaxed text-text-muted">{s.body}</p>
    </div>
    </li>
   ))}
   </ol>
   <div className="mt-8 flex flex-col gap-3 sm:flex-row">
   <Link
    href="/visualizer"
    className="inline-flex h-12 items-center justify-center rounded-sm bg-accent px-7 text-13 font-medium uppercase tracking-wide2 text-bg transition-colors duration-200 hover:bg-accent-hover"
   >
    Try the room visualizer
   </Link>
   <a
    href={photoHref}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex h-12 items-center justify-center rounded-sm border border-text px-7 text-13 font-medium uppercase tracking-wide2 text-text transition-colors duration-200 hover:bg-text hover:text-bg"
   >
    Send a photo on WhatsApp
   </a>
   </div>
   <p className="mt-4 text-xs text-text-muted">
   Previews are approximate and generated from actual product imagery, not a
   substitute for seeing the material in person.
   </p>
  </div>
  </div>
  <div className="relative min-h-80 md:min-h-140 md:order-2">
  <Image
   src="/textures/marble-bianco-face-2.png"
   alt="Bathroom preview generated with the room visualizer: wall and floor tile combination"
   fill
   sizes="(max-width: 768px) 100vw, 50vw"
   className="object-cover"
  />
  </div>
 </section>
 );
}
