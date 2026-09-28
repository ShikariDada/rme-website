"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";

export interface NavItem {
  name: string;
  href: string;
}

/**
 * Mobile navigation sheet (spec §7). Opens as a full-screen sheet with large
 * touch targets; keyboard accessible via the native dialog element.
 */
export function MobileNavButton({
  categories,
  brands,
  phone,
  whatsappHref,
}: {
  applications: NavItem[];
  brands: NavItem[];
  categories: NavItem[];
  phone: string;
  whatsappHref: string;
}) {
  const [open, setOpen] = useState(false);

  const sections: { title: string; links: NavItem[] }[] = [
    {
      title: "Shop",
      links: [
        { name: "All products", href: "/products" },
        ...categories,
      ],
    },
    {
      title: "Explore",
      links: [
        { name: "Varmora", href: "/brand/varmora" },
        ...brands.filter((b) => !b.href.endsWith("varmora")),
        { name: "Projects", href: "/projects" },
        { name: "Guides", href: "/guides" },
        { name: "Tile calculator", href: "/tile-calculator" },
        { name: "Visualizer", href: "/visualizer" },
      ],
    },
    {
      title: "Visit",
      links: [
        { name: "Showroom", href: "/showroom" },
        { name: "Contact", href: "/contact" },
        { name: "About", href: "/about" },
      ],
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md text-text hover:bg-surface-muted"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Menu" variant="sheet">
        <nav id="mobile-nav" aria-label="Mobile">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {section.title}
              </p>
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-[44px] items-center rounded-md px-2 text-base hover:bg-surface-muted"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border pt-4">
            <a href={`tel:${phone}`} className="flex h-11 flex-1 items-center justify-center rounded-md border border-border font-medium">
              Call {phone}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-[#1fa855] font-medium text-white"
            >
              WhatsApp
            </a>
          </div>
        </nav>
      </Dialog>
    </>
  );
}
