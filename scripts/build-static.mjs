#!/usr/bin/env node
/**
 * Static export build (GitHub Pages).
 * Moves app/api temporarily out of the build because POST Route Handlers
 * cannot exist in `output: "export"`; the quote flow becomes WhatsApp-native
 * in static mode (components/forms/QuoteForm.tsx branches on
 * NEXT_PUBLIC_STATIC_EXPORT).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "app", "api");
const stashDir = join(root, ".api-static-stash");

if (!existsSync(apiDir)) {
  console.error("app/api not found");
  process.exit(1);
}
renameSync(apiDir, stashDir);

let result;
try {
  result = spawnSync("npx", ["next", "build", "--turbopack"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      STATIC_EXPORT: "1",
      NEXT_PUBLIC_STATIC_EXPORT: "1",
      /* real public URL so canonical/og/sitemap URLs are correct in static pages */
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://zerothlayer.com",
    },
  });
} finally {
  if (existsSync(stashDir)) {
    rmSync(apiDir, { recursive: true, force: true });
    renameSync(stashDir, apiDir);
  }
}

if (result.status !== 0) process.exit(result.status ?? 1);
console.log("\nStatic export ready in ./out");
