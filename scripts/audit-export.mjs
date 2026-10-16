import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) files.push(p);
  }
}
walk("out");

let hits = 0;
let italics = 0;
const classRe = /\b(min-|max-|h-|w-|text-|bg-|border-|tracking-|shadow-|aspect-|grid-cols-|leading-|p-|m-|gap-|rounded-)[a-z-]*-\[[^\]]+\]/g;
for (const f of files) {
  const html = readFileSync(f, "utf8");
  const m = html.match(classRe);
  const it = html.match(/<i>|<em|display-italic/g);
  if (m) {
    hits++;
    if (hits < 7) console.log(f.split("out").join(""), "=>", [...new Set(m)].slice(0, 6));
  }
  if (it) italics++;
}
console.log("bracket-class pages:", hits, "| italic-tag pages:", italics, "| total pages:", files.length);
