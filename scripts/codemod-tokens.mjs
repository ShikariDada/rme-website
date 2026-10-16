#!/usr/bin/env node
/**
 * Converts remaining arbitrary-value Tailwind utilities to shipped-safe forms.
 * Production Turbopack drops bracket utilities; theme/token classes ship.
 * Run repeatedly until the bracket scan is clean.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const reps = [
  // Danger / success / focus tokens
  ["bg-[var(--color-danger)]", "bg-danger"],
  ["text-[var(--color-danger)]", "text-danger"],
  ["border-[var(--color-danger)]", "border-danger"],
  ["border-[var(--color-danger)]/30", "border-danger/30"],
  ["bg-[var(--color-danger)]/5", "bg-danger/5"],
  ["text-[var(--color-success)]", "text-success"],
  ["bg-[var(--color-success)]/10", "bg-success/10"],
  ["border-[var(--color-success)]/30", "border-success/30"],
  ["accent-[var(--color-accent)]", "accent-accent"],
  ["outline-[var(--color-accent)]", "outline-accent"],
  // Motion / transitions
  ["hover:scale-[1.02]", "hover:scale-105"],
  ["group-hover:scale-[1.02]", "group-hover:scale-105"],
  ["transition-[transform,box-shadow]", "transition-all"],
  ["transition-transform duration-200 group-hover:scale-[1.02]", "transition-transform duration-300 group-hover:scale-105"],
  // Tracking / offsets
  ["tracking-[-0.02em]", "tracking-display"],
  ["tracking-[-0.01em]", "tracking-tight"],
  ["hover:underline-offset-[6px]", "hover:underline-offset-4"],
  ["hover:underline-offset-[4px]", "hover:underline-offset-4"],
  ["underline-offset-[6px]", "underline-offset-4"],
  ["underline-offset-[3px]", "underline-offset-2"],
  // Shadows → theme tokens
  ["shadow-[0_8px_24px_rgba(23,21,18,0.12)]", "shadow-dialog"],
  ["shadow-[0_2px_8px_rgba(19,21,18,0.06)]", "shadow-card"],
  ["shadow-[0_2px_8px_rgba(23,21,18,0.06)]", "shadow-card"],
  ["hover:shadow-[0_2px_8px_rgba(23,21,18,0.06)]", "hover:shadow-card"],
  ["focus-visible:shadow-[0_2px_8px_rgba(23,21,18,0.06)]", "focus-visible:shadow-card"],
  // Viewport/size
  ["min-h-[60dvh]", "min-h-dvh"],
  ["min-h-[75dvh]", "min-h-3/4"],
  ["min-h-[560px]", "min-h-140"],
  ["min-h-[480px]", "min-h-120"],
  ["min-h-[320px]", "min-h-80"],
  ["min-h-[44px]", "min-h-11"],
  ["min-w-[44px]", "min-w-11"],
  ["min-h-[48px]", "min-h-12"],
  ["max-w-[800px]", "max-w-200"],
  ["max-w-[720px]", "max-w-180"],
  ["max-w-[560px]", "max-w-140"],
  ["max-w-[520px]", "max-w-130"],
  ["max-w-[40ch]", "max-w-prose"],
  ["w-[211px]", "w-52"],
  ["h-[calc(100dvh-4rem)]", ""],
  // Old text sizes
  ["text-[13px]", "text-13"],
  ["text-[15px]", "text-15"],
  ["text-[11px]", "text-11"],
  ["text-[12px]", "text-12"],
  ["text-[16px]", "text-base"],
  ["text-[1.375rem]", "text-h3"],
  ["tracking-[0.1em]", "tracking-[0.1em]"],
];

const files = [];
function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (statSync(p).isDirectory()) {
      if (!/node_modules|\.next|out|\.git/.test(p)) walk(p);
    } else if (/\.(tsx|ts)$/.test(f.name)) files.push(p);
  }
}
walk("app");
walk("components");
walk("src");
walk("lib");

// tracking-display used by Base styles in globals? track
let changed = 0;
for (const file of files) {
  let s = readFileSync(file, "utf8");
  let next = s;
  for (const [from, to] of reps) next = next.split(from).join(to);
  // Clean up double spaces left by emptied classes
  next = next.split("  ").join(" ");
  if (next !== s) {
    writeFileSync(file, next);
    changed++;
  }
}
console.log("changed files:", changed);
