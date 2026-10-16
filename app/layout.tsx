import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";
import "./globals.css";

/**
 * Self-hosted variable fonts (spec §8.1: fonts must ship with the build, not
 * create runtime Google Fonts requests — and no build-time font fetching,
 * which broke Vercel builds).
 */
const albert = localFont({
 src: "./fonts/AlbertSans-Var.woff2",
 variable: "--font-albert",
 display: "swap",
 weight: "100 900",
});

const bodoni = localFont({
 src: "./fonts/BodoniModa-Var.woff2",
 variable: "--font-bodoni",
 display: "swap",
 weight: "400 900",
});

export async function generateMetadata(): Promise<Metadata> {
 const settings = await contentSource.getSettings();
 return pageMetadata({
 title: settings.seoDefaultTitle,
 description: settings.seoDefaultDescription,
 path: "/",
 });
}

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 themeColor: "#f6f5f3",
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <html lang="en-IN" suppressHydrationWarning className={`${albert.variable} ${bodoni.variable}`}>
  <head>
  <script
  // eslint-disable-next-line react/no-danger
  dangerouslySetInnerHTML={{ __html: 'document.documentElement.dataset.js="1"' }}
  />
  </head>
  <body>
  <AnalyticsProvider>{children}</AnalyticsProvider>
  </body>
 </html>
 );
}
