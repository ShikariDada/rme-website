/**
 * Search normalization for Indian showroom terminology (spec §16).
 * Synonyms are query-side aliases only — they never turn a colloquial term
 * into a technical certification claim (e.g. "anti skid" finds products
 * tagged slip-resistant, it does not create a slip-rating).
 */

const SYNONYM_GROUPS: string[][] = [
  ["600x600", "600×600", "2x2", "2×2", "1x1", "1×1"],
  ["600x1200", "600×1200", "2x4", "2×4", "1x2", "1×2", "2x1", "2×1", "4x2", "4×2", "1200x600", "1200×600"],
  ["600x2400", "600×2400", "2x8", "2×8"],
  ["1200x2400", "1200×2400", "4x8", "4×8"],
  ["1200x1200", "1200×1200", "4x4", "4×4"],
  ["matt", "matte"],
  ["anti skid", "anti-skid", "antiskid", "slip resistant", "slip-resistant"],
  ["marble finish", "marble-look"],
  ["wood finish", "wood-look", "wooden"],
  ["cement look", "concrete look", "concrete-look", "cement-look"],
  ["vitrified", "porcelain"],
  ["digital", "printed"],
];

const DIMENSION_RE = /^(\d{1,4})\s*[x×]\s*(\d{1,4})$/;

/**
 * Canonicalize a user query:
 * - lowercase, collapse whitespace, strip dashes/diacritic multiplication signs
 * - map 2x4 → 600x1200 etc.
 * - map synonym groups to their first (canonical) member
 */
export function normalizeQuery(raw: string): string {
  let q = raw.toLowerCase().trim().replace(/\s+/g, " ");

  q = q.replace(DIMENSION_RE, (_m, a: string, b: string) => {
    const norm = (v: string) => {
      const n = parseInt(v, 10);
      // feet/inches shorthand like 2x4 → mm if plausible tile sizes
      if (n <= 40) return String(n * 300);
      return v;
    };
    const aN = norm(a);
    const bN = norm(b);
    return `${aN}x${bN}`;
  });

  for (const group of SYNONYM_GROUPS) {
    for (const member of group) {
      if (member === group[0]) continue;
      const escaped = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      q = q.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "g"), `$1${group[0]}`);
    }
  }
  return q.trim();
}

export interface SearchableProduct {
  name: string;
  sku: string;
  brandName?: string;
  materialType: string;
  sizeAliases: string[]; // e.g. ["600x1200", "2x4"]
  keywords: string[]; // finish/look/color terms
}

/** Score a normalized query against one product. Returns 0 for no match. */
export function scoreMatch(query: string, p: SearchableProduct): number {
  if (!query) return 0;
  const haystacks: string[] = [
    p.name.toLowerCase(),
    p.sku.toLowerCase(),
    (p.brandName ?? "").toLowerCase(),
    p.materialType.toLowerCase(),
    ...p.sizeAliases.map((s) => s.toLowerCase()),
    ...p.keywords.map((k) => k.toLowerCase()),
  ];
  const terms = query.split(" ").filter(Boolean);
  let score = 0;
  for (const term of terms) {
    let termHit = false;
    for (const hay of haystacks) {
      if (hay.includes(term)) {
        termHit = true;
        score += hay === term ? 3 : hay.startsWith(term) ? 2 : 1;
      }
    }
    if (!termHit) return 0; // every term must match somewhere
  }
  return score;
}

/** Build searchable text for a site product. */
export function sizeAliasesFor(widthMm?: number, heightMm?: number): string[] {
  if (!widthMm || !heightMm) return [];
  const mm = `${widthMm}x${heightMm}`;
  const aliases = new Set<string>([mm, `${heightMm}x${widthMm}`]);
  const feet = (v: number) => (v % 300 === 0 ? v / 300 : null);
  const fw = feet(widthMm);
  const fh = feet(heightMm);
  if (fw && fh) {
    aliases.add(`${fw}x${fh}`);
    aliases.add(`${fh}x${fw}`);
    aliases.add(`${fw}x${fh} feet`);
  }
  return [...aliases];
}
