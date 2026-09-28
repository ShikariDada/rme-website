import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyMobileContactBar } from "@/components/layout/StickyMobileContactBar";
import { contentSource } from "@/lib/data";
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from "@/lib/whatsapp";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await contentSource.getSettings();
  const whatsappHref = buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildGeneralEnquiryMessage("site"),
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main-content" className="sr-only-focusable absolute left-2 top-2 z-50 rounded-md bg-accent px-4 py-2 text-white">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <StickyMobileContactBar
        phone={settings.phone}
        whatsappHref={whatsappHref}
        quoteHref="/contact"
      />
    </div>
  );
}
