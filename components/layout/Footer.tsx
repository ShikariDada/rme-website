import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { contentSource } from "@/lib/data";

export async function Footer() {
  const settings = await contentSource.getSettings();
  const categories = await contentSource.getCategories();
  const address = settings.address;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">{settings.businessName}</p>
          <address className="mt-3 text-sm not-italic leading-relaxed text-text-muted">
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
            <p className="mt-2 text-xs text-text-muted">GSTIN: {settings.gstin}</p>
          )}
        </div>

        <nav aria-label="Shop">
          <p className="mb-3 text-sm font-semibold">Shop</p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/products" className="hover:text-text hover:underline">All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="hover:text-text hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link href="/brand/varmora" className="hover:text-text hover:underline">Varmora</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help">
          <p className="mb-3 text-sm font-semibold">Help</p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/tile-calculator" className="hover:text-text hover:underline">Tile calculator</Link></li>
            <li><Link href="/visualizer" className="hover:text-text hover:underline">See in your room</Link></li>
            <li><Link href="/guides" className="hover:text-text hover:underline">Buying guides</Link></li>
            <li><Link href="/contact" className="hover:text-text hover:underline">Get a quote</Link></li>
            <li><Link href="/showroom" className="hover:text-text hover:underline">Visit showroom</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="mb-3 text-sm font-semibold">Company</p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li><Link href="/about" className="hover:text-text hover:underline">About</Link></li>
            <li><Link href="/projects" className="hover:text-text hover:underline">Projects</Link></li>
            <li><Link href="/privacy" className="hover:text-text hover:underline">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-text hover:underline">Terms</Link></li>
          </ul>
          {settings.socialLinks && settings.socialLinks.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              {settings.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-text hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="py-4 text-xs text-text-muted">
          © {year} {settings.businessName}. All rights reserved. Prices and stock are indicative
          until confirmed by the showroom.
        </Container>
      </div>
    </footer>
  );
}
