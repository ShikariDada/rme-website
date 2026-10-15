import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

// Static-compatible: emit at build time in both server and export modes.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
