import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { SearchButton } from "@/components/layout/SearchDialog";
import { contentSource } from "@/lib/data";
import { buildWhatsAppUrl, buildGeneralEnquiryMessage } from "@/lib/whatsapp";
import { TrackedWhatsAppLink } from "@/components/layout/TrackedWhatsAppLink";

const primaryNav = [
  { label: "Products", href: "/products" },
  { label: "By Room", href: "/room" },
  { label: "Projects", href: "/projects" },
  { label: "Guides", href: "/guides" },
  { label: "Calculator", href: "/tile-calculator" },
  { label: "Showroom", href: "/showroom" },
];

export async function Header() {
  const settings = await contentSource.getSettings();
  const categories = await contentSource.getCategories();
  const brands = await contentSource.getBrands();
  const whatsappHref = buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildGeneralEnquiryMessage("header"),
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-bg/85">
      <Container className="flex h-16 items-center gap-2 md:h-[68px]">
        {/* Mobile: menu button */}
        <div className="md:hidden">
          <MobileNavButton
            applications={[]}
            brands={brands.map((b) => ({ name: b.name, href: `/brand/${b.slug}` }))}
            categories={categories.map((c) => ({ name: c.name, href: `/${c.slug}` }))}
            phone={settings.phoneDisplay ?? settings.phone}
            whatsappHref={whatsappHref}
          />
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="mr-2 flex min-w-0 items-center gap-2 font-display text-lg font-semibold tracking-tight md:text-xl"
          aria-label={`${settings.businessName} — home`}
        >
          {settings.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo.url} alt="" className="h-8 w-auto" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent font-display text-base text-white">
              {settings.businessName.slice(0, 1)}
            </span>
          )}
          <span className="truncate">
            {settings.shortName ?? settings.businessName}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1 text-[15px]">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex h-10 items-center rounded-md px-3 text-text-muted hover:bg-surface-muted hover:text-text"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/brand/varmora"
                className="inline-flex h-10 items-center rounded-md px-3 text-text-muted hover:bg-surface-muted hover:text-text"
              >
                Varmora
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <SearchButton />
          <a
            href={`tel:${settings.phone}`}
            className="hidden h-11 items-center gap-2 rounded-md px-3 text-[15px] font-medium text-text hover:bg-surface-muted lg:inline-flex"
            aria-label="Call showroom"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="hidden xl:inline">{settings.phoneDisplay ?? settings.phone}</span>
          </a>
          <TrackedWhatsAppLink
            href={whatsappHref}
            sourceSurface="header"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1fa855] px-3 text-[15px] font-medium text-white hover:bg-[#178a45] max-md:w-10 max-md:justify-center max-md:px-0"
            ariaLabel="Chat on WhatsApp"
          >
            <WhatsAppIcon />
            <span className="hidden md:inline">WhatsApp</span>
          </TrackedWhatsAppLink>
        </div>
      </Container>
    </header>
  );
}

export function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.14-1.35A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.05.8.82-2.97-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.13c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12s-.64.8-.79.97c-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42s-.56-1.35-.77-1.85c-.2-.48-.41-.42-.56-.42h-.48a.92.92 0 0 0-.67.31 2.81 2.81 0 0 0-.88 2.09 4.87 4.87 0 0 0 1.02 2.58 11.15 11.15 0 0 0 4.27 3.78c1.6.62 2.22.67 3.02.56.48-.07 1.46-.6 1.66-1.18s.21-1.07.14-1.18-.21-.17-.47-.29Z" />
    </svg>
  );
}
