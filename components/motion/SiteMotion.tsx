"use client";

import { useEffect } from "react";

/**
 * Site-wide motion runtime:
 * - reveals [data-reveal] / [data-reveal-grid] once, on intersection
 *   (marks elements with a `data-in` attribute, not a class, so React
 *   hydration never sees mutated props)
 * - toggles html[data-scrolled] past 12px so the floating nav can settle
 * - bfcache restores reveal everything instantly instead of replaying
 * Renders nothing.
 */
export function SiteMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.documentElement.dataset.js = "1";

    const mark = (root: ParentNode) => {
      root
        .querySelectorAll<HTMLElement>("[data-reveal]:not([data-in]), [data-reveal-grid]:not([data-in])")
        .forEach((el) => el.setAttribute("data-in", "1"));
    };
    const revealAll = () => mark(document);

    let io: IntersectionObserver | undefined;
    const observe = () => {
      const targets = document.querySelectorAll<HTMLElement>(
        "[data-reveal]:not([data-in]), [data-reveal-grid]:not([data-in])"
      );
      if (reduced.matches || !("IntersectionObserver" in window)) {
        targets.forEach((el) => el.setAttribute("data-in", "1"));
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-in", "1");
              io?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
      );
      targets.forEach((el) => io?.observe(el));
    };

    const onScroll = () => {
      document.documentElement.dataset.scrolled =
        (window.scrollY || document.documentElement.scrollTop) > 12 ? "true" : "false";
    };

    // Wait for hydration to settle (streamed Suspense boundaries included)
    // before touching any SSR-rendered DOM.
    const startTimer = window.setTimeout(observe, 220);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        revealAll();
      } else {
        io?.disconnect();
        observe();
      }
      onScroll();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(startTimer);
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
