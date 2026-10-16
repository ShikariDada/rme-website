import { contentSource } from "@/lib/data";
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from "@/lib/whatsapp";
import { TrackedWhatsAppLink } from "@/components/layout/TrackedWhatsAppLink";

/**
 * Desktop WhatsApp bubble: the persistent chat entry Indian customers expect
 * on every page. Hidden on mobile, where the sticky contact bar covers it.
 */
export async function WhatsAppBubble() {
  const settings = await contentSource.getSettings();
  const href = buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildGeneralEnquiryMessage("bubble"),
  });
  return (
    <div className="viz-hide-on-app max-md:hidden">
      <TrackedWhatsAppLink
        href={href}
        sourceSurface="bubble"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-wa text-white shadow-dialog transition-colors hover:bg-wa-dark"
        ariaLabel="Chat with us on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.14-1.35A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.05.8.82-2.97-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.67.31 2.81 2.81 0 0 0-.88 2.09 4.87 4.87 0 0 0 1.02 2.58 11.15 11.15 0 0 0 4.27 3.78c1.6.62 2.22.67 3.02.56.48-.07 1.46-.6 1.66-1.18s.21-1.07.14-1.18-.21-.17-.47-.29Z" />
        </svg>
      </TrackedWhatsAppLink>
    </div>
  );
}
