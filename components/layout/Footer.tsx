import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { contentSource } from "@/lib/data";

export async function Footer() {
  const settings = await contentSource.getSettings();
  const categories = await contentSource.getCategories();
  const address = settings.address;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-[#171512] text-[#F4F0E8]">
      <Container className="grid gap-12 py-16 md:grid-cols-4 md:py-20">
        <div>
          <p className="font-display text-xl tracking-[-0.01em]">{settings.businessName}</p>
          <address className="mt-3 text-sm not-italic leading-relaxed text-[#F4F0E8]/60">
            {[address.line1, address.line2, address.locality, `${address.city}, ${address.state} ${address.postalCode}`]
              .filter(Boolean)
              .map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
          </address>
          <p className="mt-3 text-sm">
            <a href={`tel:${settings.phone}`} className="hover:underline">
              {settings.phoneDisplay ?? settings.phone}
            </a>
          </p>
          {settings.gstin && (
            <p className="mt-2 text-xs text-[#F4F0E8]/60">GSTIN: {settings.gstin}</p>
          )}
        </div>

        <nav aria-label="Shop">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[#F4F0E8]/60">Shop</p>
          <ul className="space-y-2 text-sm text-[#F4F0E8]/60">
            <li><Link href="/products" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link href="/brand/varmora" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Varmora</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[#F4F0E8]/60">Help</p>
          <ul className="space-y-2 text-sm text-[#F4F0E8]/60">
            <li><Link href="/tile-calculator" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Tile calculator</Link></li>
            <li><Link href="/visualizer" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">See in your room</Link></li>
            <li><Link href="/guides" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Buying guides</Link></li>
            <li><Link href="/contact" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Get a quote</Link></li>
            <li><Link href="/showroom" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Visit showroom</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[#F4F0E8]/60">Company</p>
          <ul className="space-y-2 text-sm text-[#F4F0E8]/60">
            <li><Link href="/about" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">About</Link></li>
            <li><Link href="/projects" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Projects</Link></li>
            <li><Link href="/privacy" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">Terms</Link></li>
          </ul>
          {settings.socialLinks && settings.socialLinks.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-[#F4F0E8]/60">
              {settings.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#F4F0E8] hover:underline hover:decoration-[#7A5C36]">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </Container>
      <div className="border-t border-[rgba(244,240,232,0.15)]">
        <Container className="py-5 text-xs text-[#F4F0E8]/50">
          © {year} {settings.businessName}. All rights reserved. Prices and stock are indicative
          until confirmed by the showroom.
        </Container>
      </div>
    </footer>
  );
}
