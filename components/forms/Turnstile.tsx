"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget (spec §27). Renders only when the site key is
 * configured; the form must work without it (token simply absent).
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    function tryRender() {
      if (cancelled) return;
      const w = window as unknown as {
        turnstile?: {
          render: (el: HTMLElement, opts: Record<string, unknown>) => string;
          remove: (id: string) => void;
        };
      };
      if (!w.turnstile || !containerRef.current) {
        window.setTimeout(tryRender, 200);
        return;
      }
      if (widgetIdRef.current !== null) return;
      widgetIdRef.current = w.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        theme: "light",
      });
      setReady(true);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = tryRender;
      document.head.appendChild(s);
    } else {
      tryRender();
    }

    return () => {
      cancelled = true;
      const w = window as unknown as {
        turnstile?: { remove: (id: string) => void };
      };
      if (widgetIdRef.current && w.turnstile) {
        w.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return (
    <div>
      <div ref={containerRef} />
      {!ready && <p className="text-xs text-text-muted">Loading verification…</p>}
    </div>
  );
}
