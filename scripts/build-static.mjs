#!/usr/bin/env node
/**
 * Static export build (GitHub Pages).
 * Moves app/api temporarily out of the build because POST Route Handlers
 * cannot exist in `output: "export"`; the quote flow becomes WhatsApp-native
 * in static mode (components/forms/QuoteForm.tsx branches on
 * NEXT_PUBLIC_STATIC_EXPORT).
 *
 * Windows-safe: a running dev server can briefly lock the directory, so the
 * stash uses retries and falls back to moving individual route folders.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "app", "api");
const stashDir = join(root, ".api-static-stash");

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

if (!existsSync(apiDir)) {
  console.error("app/api not found");
  process.exit(1);
}

/** Stash the API dir out of the export build. Returns a restore function. */
function stashApi() {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      rmSync(stashDir, { recursive: true, force: true });
      renameSync(apiDir, stashDir);
      return () => {
        rmSync(apiDir, { recursive: true, force: true });
        renameSync(stashDir, apiDir);
      };
    } catch {
      sleep(500);
    }
  }
  // Fallback: move route folders individually into the stash.
  mkdirSync(stashDir, { recursive: true });
  for (const entry of readdirSync(apiDir)) {
    const from = join(apiDir, entry);
    const to = join(stashDir, entry);
    let moved = false;
    for (let attempt = 0; attempt < 8 && !moved; attempt++) {
      try {
        rmSync(to, { recursive: true, force: true });
        renameSync(from, to);
        moved = true;
      } catch {
        sleep(500);
      }
    }
    if (!moved) {
      console.error(`Could not stash app/api/${entry}. Close the dev server and retry.`);
      process.exit(1);
    }
  }
  return () => {
    for (const entry of readdirSync(stashDir)) {
      const from = join(stashDir, entry);
      const to = join(apiDir, entry);
      rmSync(to, { recursive: true, force: true });
      renameSync(from, to);
    }
    rmSync(stashDir, { recursive: true, force: true });
  };
}

const restore = stashApi();

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
  restore();
}

if (result.status !== 0) process.exit(result.status ?? 1);
console.log("\nStatic export ready in ./out");
