import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=1 produces a fully static build for GitHub Pages hosting
 * (https://shikaridada.github.io/rme-website/). The default build stays a
 * standard server build for Vercel.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = isStaticExport ? "/rme-website" : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@visualizer/engine", "@visualizer/ai"],
  ...(isStaticExport
    ? {
        output: "export" as const,
        basePath,
        assetPrefix: basePath,
        images: {
          /* custom loader prefixes every next/image src with /rme-website */
          loader: "custom" as const,
          loaderFile: "./lib/image-loader.ts",
        },
        trailingSlash: true,
      }
    : {
        images: {
          remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
        },
      }),
  async headers() {
    if (isStaticExport) return [];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;

