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
const fraunces = localFont({
  src: "./fonts/Fraunces-Variable.ttf",
  variable: "--font-fraunces",
  display: "swap",
  weight: "100 900",
});

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
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
  themeColor: "#F6F3ED",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
