"use client";

import { useEffect } from "react";

/**
 * Site-wide motion runtime.
 * - reveals [data-reveal] / [data-reveal-grid] once: IntersectionObserver plus
 *   a cheap viewport sweep as a safety net, so content is never left hidden
 *   (restored scroll positions, instant jumps, back/forward cache).
 * - marks a `data-in` attribute (not a class) so React hydration never sees
 *   mutated props.
 * - toggles html[data-scrolled] past 12px for the floating nav.
 * Renders nothing.
 */
export function SiteMotion() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.documentElement.dataset.js = "1";

    const sel = "[data-reveal]:not([data-in]), [data-reveal-grid]:not([data-in])";
    const markVisible = () => {
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh + 320 && r.bottom > -320) {
          el.setAttribute("data-in", "1");
        }
      });
    };

    let io: IntersectionObserver | undefined;
    const observe = () => {
      const targets = document.querySelectorAll<HTMLElement>(sel);
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
        { rootMargin: "0px 0px -4% 0px", threshold: 0 }
      );
      targets.forEach((el) => io?.observe(el));
    };

    const onScroll = () => {
      document.documentElement.dataset.scrolled =
        (window.scrollY || document.documentElement.scrollTop) > 12 ? "true" : "false";
    };

    // Start after hydration settles; sweep again shortly after for restored scroll.
    const startTimer = window.setTimeout(() => {
      observe();
      markVisible();
    }, 140);
    const sweep = window.setInterval(markVisible, 900);
    const stopSweep = window.setTimeout(() => window.clearInterval(sweep), 12000);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        document
          .querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-grid]")
          .forEach((el) => el.setAttribute("data-in", "1"));
      } else {
        io?.disconnect();
        observe();
        markVisible();
      }
      onScroll();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(stopSweep);
      window.clearInterval(sweep);
      io?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
