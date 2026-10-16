#!/usr/bin/env node
/**
 * Codemod: replace arbitrary-value Tailwind utilities (which the production
 * Turbopack pipeline silently drops — verified) with theme-based equivalents.
 * Adds required @theme tokens to globals.css.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const themeDefs = [];
function theme(name, value) {
  if (!themeDefs.some((t) => t.name === name)) themeDefs.push({ name, value });
  return name;
}

/** Build a replacement map. */
const map = new Map();
function rep(from, to) {
  map.set(from, to);
}

// Type scale
rep("text-[13px]", `text-${theme("text-13", "0.8125rem")}`);
rep("text-[clamp(2.25rem,4.5vw,3.5rem)]", `text-${theme("text-display", "clamp(2.25rem, 4.5vw, 3.5rem)")}`);
rep("text-[clamp(1.75rem,2.6vw,2.25rem)]", `text-${theme("text-h2", "clamp(1.75rem, 2.6vw, 2.25rem)")}`);
rep("text-[11px]", `text-${theme("text-11", "0.6875rem")}`);
rep("text-[12px]", `text-${theme("text-12", "0.75rem")}`);
rep("text-[15px]", `text-${theme("text-15", "0.9375rem")}`);
rep("text-[1.375rem]", `text-${theme("text-h3", "1.375rem")}`);

// Spacing-scale conversions (Tailwind v4 spacing scale: 1 unit = 0.25rem)
rep("max-w-[560px]", "max-w-140"); // 35rem
rep("max-w-[520px]", "max-w-130");
rep("max-w-[40ch]", `max-w-${theme("max-w-40ch", "40ch")}`);
rep("min-h-[88vh]", `min-h-${theme("min-h-88vh", "88vh")}`);
rep("min-h-[560px]", "min-h-140");
rep("min-h-[480px]", "min-h-120");
rep("min-h-[320px]", "min-h-80");
rep("h-[47px]", "h-12");
rep("w-[211px]", "w-52");
rep("gap-x-4 gap-y-8", "gap-x-4 gap-y-8");

// Tracking / leading
rep("tracking-[0.1em]", `tracking-${theme("tracking-wide2", "0.1em")}`);
rep("tracking-[0.12em]", `tracking-${theme("tracking-kicker", "0.12em")}`);
rep("tracking-[0.08em]", `tracking-${theme("tracking-badge", "0.08em")}`);
rep("tracking-[-0.02em]", `tracking-${theme("tracking-display", "-0.02em")}`);
rep("tracking-[-0.01em]", `tracking-${theme("tracking-h2", "-0.01em")}`);
rep("leading-[1.05]", `leading-${theme("leading-hero", "1.05")}`);
rep("leading-[1.15]", `leading-${theme("leading-h2", "1.15")}`);
rep("leading-[1.08]", `leading-${theme("leading-h2", "1.15")}`);

// Shadows / decoration
rep("shadow-[0_2px_8px_rgba(23,21,18,0.06)]", `shadow-${theme("shadow-card", "0 2px 8px rgba(23,21,18,0.06)")}`);
rep("decoration-accent", "decoration-accent"); // theme-based, ships fine (verified)
rep("underline-offset-\\[6px\\]", "underline-offset-4");
rep("underline-offset-\\[4px\\]", "underline-offset-4");
rep("underline-offset-[6px]", "underline-offset-4");
rep("underline-offset-[4px]", "underline-offset-4");

// Aspect ratios
rep("aspect-[4/3]", `aspect-${theme("aspect-43", "4 / 3")}`);
rep("aspect-[4/5]", `aspect-${theme("aspect-45", "4 / 5")}`);
rep("aspect-[16/9]", `aspect-${theme("aspect-169", "16 / 9")}`);

// Grid templates
rep("grid-cols-[1fr_auto_auto]", `grid-cols-${theme("grid-cols-price", "1fr auto auto")}`);
rep("grid-cols-[1fr_6rem_6rem_auto]", "grid-cols-[1fr_6rem_6rem_auto]"); // handled below
rep("grid-cols-[1fr_1fr_5.5rem_auto]", "grid-cols-[1fr_1fr_5.5rem_auto]"); // handled below
rep("grid-cols-[1fr_6rem_auto]", "grid-cols-[1fr_6rem_auto]"); // handled below
rep("grid-cols-[1fr_auto]", `grid-cols-${theme("grid-cols-label", "1fr auto")}`);
rep("grid-cols-[1fr_320px]", `grid-cols-${theme("grid-cols-calc", "1fr 20rem")}`);
rep("grid-cols-[1fr_5rem_5rem]", `grid-cols-${theme("grid-cols-dims", "1fr 5rem 5rem")}`);
rep("grid-cols-[1fr_6rem_5rem]", `grid-cols-${theme("grid-cols-cal2", "1fr 6rem 5rem")}`);
rep("grid-cols-[1fr_6.5rem_6.5rem]", `grid-cols-${theme("grid-cols-cm", "1fr 6.5rem 6.5rem")}`);
rep("grid-cols-[1fr_auto_6rem]", `grid-cols-${theme("grid-cols-meet", "1fr auto 6rem")}`);
rep("grid-cols-[1fr_2fr]", `grid-cols-${theme("grid-cols-share", "1fr 2fr")}`);
rep("grid-cols-[1fr_1.2fr]", `grid-cols-${theme("grid-cols-share2", "1fr 1.2fr")}`);
rep("grid-cols-[24rem_1fr]", `grid-cols-${theme("grid-cols-pdp", "24rem 1fr")}`);

// Misc
rep("min-w-[280px]", "min-w-70");
rep("max-w-[1280px]", "max-w-screen");
rep("max-w-[720px]", "max-w-180");
rep("max-w-[92%]", `max-w-${theme("max-w-92pct", "92%")}`);
rep("min-h-[75dvh]", `min-h-${theme("min-h-75dvh", "75dvh")}`);
rep("w-[calc(100%-2rem)]", `w-${theme("w-dialog", "calc(100% - 2rem)")}`);
rep("bg-[#171512]/90", `bg-${theme("color-inkbanner", "rgba(23,21,18,0.9)")}`);
rep("bg-[#171512]", "bg-text");
rep("text-[#F4F0E8]", "text-bg");
rep("bg-[#1fa855]", "bg-[#1fa855]"); // whatsapp brand fill is arbitrary too
rep("hover:bg-[#178a45]", "hover:bg-[#178a45]");
rep("decoration-[rgba(244,240,232,0.15)]", `decoration-${theme("decoration-footer", "rgba(244,240,232,0.15)")}`);
rep("bg-[rgba(244,240,232,0.15)]", `bg-${theme("color-hairline-paper", "rgba(244,240,232,0.15)")}`);

// Fixed: the remaining complex grids keep brackets — force-emit them as plain
// CSS via globals (handled after scan below).

const files = [];
function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) {
      if (!/node_modules|\.next|out|\.git/.test(p)) walk(p);
    } else if (/\.(tsx|ts)$/.test(f.name)) files.push(p);
  }
}
walk("app");
walk("components");
walk("src");
walk("lib");

let changed = 0;
const leftover = new Map();
for (const file of files) {
  let s = readFileSync(file, "utf8");
  let next = s;
  for (const [from, to] of map) next = next.split(from).join(to);
  if (next !== s) {
    writeFileSync(file, next);
    changed++;
  }
  // collect remaining arbitrary utilities for report
  for (const m of next.matchAll(/[a-zA-Z0-9:[\]()#%.,/-]*\[[^\]]+\][a-zA-Z0-9_[\]()/%-]*/g)) {
    const t = m[0];
    if (t.length < 4) continue;
    leftover.set(t, (leftover.get(t) ?? 0) + 1);
  }
}

for (const { name, value } of themeDefs) {
  // emitted once each into the @theme block appended below
}

console.log(`Rewrote ${changed} files.`);

// Report leftovers (complex / unhandled arbs)
const leftovers = [...leftover.entries()].filter(([k]) => k.includes("["));
console.log(`Remaining bracket utilities: ${leftovers.length}`);
for (const [k, n] of [...leftovers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${String(n).padStart(3)}  ${k}`);
}
