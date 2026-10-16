#!/usr/bin/env node
/** Diagnose: which Tailwind utilities used in source are missing from the export CSS. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const srcFiles = [];
function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) {
      if (!/node_modules|\.next|out|\.git/.test(p)) walk(p);
    } else if (/\.(tsx|ts)$/.test(f.name)) srcFiles.push(p);
  }
}
walk("app");
walk("components");
walk("src");
let all = "";
for (const f of srcFiles) all += readFileSync(f, "utf8");

let css = "";
const cssDir = "out/_next/static/chunks";
for (const f of readdirSync(cssDir)) if (f.endsWith(".css")) css += readFileSync(join(cssDir, f), "utf8");

const checks = [
  "min-h-[88vh]",
  "max-w-[560px]",
  "clamp(2.25rem",
  "tracking-[0.12em]",
  "grid-cols-[1fr_auto_auto]",
  "h-[calc(100dvh-4rem)]",
  "text-[13px]",
  "min-h-[560px]",
  "shadow-[0_2px_8px",
  "aspect-[4/5]",
  "leading-[1.15]",
  "w-[211px]",
  "max-w-[40ch]",
  "text-[clamp(2.25rem,4.5vw,3.5rem)]",
];
let missing = 0;
for (const c of checks) {
  const ok = css.includes(c);
  if (!ok) missing++;
  console.log((ok ? "OK   " : "MISS ") + c);
}
console.log(missing === 0 ? "\nAll critical utilities present." : `\n${missing} missing — Tailwind content detection is dropping classes in export builds.`);
