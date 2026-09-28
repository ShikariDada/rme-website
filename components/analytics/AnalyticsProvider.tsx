"use client";

import Script from "next/script";

/**
 * GA4 loader (spec §18, §26): loads only when NEXT_PUBLIC_GA_ID is set.
 * No PII is ever sent — lib/analytics/track.ts strips forbidden keys and
 * forwards events to window.gtag, which this script initializes.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return <>{children}</>;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
      {children}
    </>
  );
}
