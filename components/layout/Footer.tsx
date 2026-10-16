import Link from "next/link";
import { Container } from "@/components/ui/Primitives";
import { contentSource } from "@/lib/data";

export async function Footer() {
  const settings = await contentSource.getSettings();
  const categories = await contentSource.getCategories();
  const address = settings.address;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-4 rounded-t-lg bg-ink text-white">
      <Container className="grid gap-12 px-6 py-16 md:grid-cols-4 md:py-20 lg:px-10">
        <div>
          <p className="text-2xl font-bold leading-tight tracking-display md:text-3xl">{settings.businessName}</p>
          <address className="mt-4 text-sm not-italic leading-relaxed text-white/60">
            {[address.line1, address.line2, address.locality, `${address.city}, ${address.state} ${address.postalCode}`]
              .filter(Boolean)
              .map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
          </address>
          <p className="mt-4 text-sm">
            <a href={`tel:${settings.phone}`} className="rounded-pill bg-white/10 px-4 py-2 font-medium transition-colors hover:bg-white/20">
              {settings.phoneDisplay ?? settings.phone}
            </a>
          </p>
          {settings.gstin && (
            <p className="mt-3 text-xs text-white/50">GSTIN: {settings.gstin}</p>
          )}
        </div>

        <nav aria-label="Shop">
          <p className="kicker mb-4 text-accent">Shop</p>
          <ul className="space-y-2.5 text-sm text-white/65">
            <li><Link href="/products" className="transition-colors hover:text-white">All products</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="transition-colors hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link href="/brand/varmora" className="transition-colors hover:text-white">Varmora</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help">
          <p className="kicker mb-4 text-accent">Help</p>
          <ul className="space-y-2.5 text-sm text-white/65">
            <li><Link href="/tile-calculator" className="transition-colors hover:text-white">Tile calculator</Link></li>
            <li><Link href="/visualizer" className="transition-colors hover:text-white">See in your room</Link></li>
            <li><Link href="/guides" className="transition-colors hover:text-white">Buying guides</Link></li>
            <li><Link href="/contact" className="transition-colors hover:text-white">Get a quote</Link></li>
            <li><Link href="/showroom" className="transition-colors hover:text-white">Visit showroom</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="kicker mb-4 text-accent">Company</p>
          <ul className="space-y-2.5 text-sm text-white/65">
            <li><Link href="/about" className="transition-colors hover:text-white">About</Link></li>
            <li><Link href="/projects" className="transition-colors hover:text-white">Projects</Link></li>
            <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link></li>
            <li><Link href="/terms" className="transition-colors hover:text-white">Terms</Link></li>
          </ul>
          {settings.socialLinks && settings.socialLinks.length > 0 && (
            <ul className="mt-4 space-y-2.5 text-sm text-white/65">
              {settings.socialLinks.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="py-5 text-xs text-white/45">
          © {year} {settings.businessName}. All rights reserved. Prices and stock are indicative
          until confirmed by the showroom.
        </Container>
      </div>
    </footer>
  );
}
