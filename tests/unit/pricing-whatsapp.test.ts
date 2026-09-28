import { describe, expect, it } from "vitest";
import { getPriceDisplay } from "@/lib/pricing/format";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { normalizeIndianPhone, shortCode } from "@/lib/utils";
import type { Product } from "@/lib/types";

function productWith(partial: Partial<Product>): Product {
  return {
    id: "p1",
    name: "Test Tile",
    slug: "test-tile",
    sku: "TT-001",
    materialType: "tile",
    categorySlugs: ["tiles"],
    applicationSlugs: [],
    status: "active",
    featured: false,
    newArrival: false,
    pricing: { mode: "quote", currency: "INR", unit: "sq_ft", updatedAt: "2026-09-01" },
    availability: { status: "ready_stock" },
    images: [],
    colorFamily: [],
    look: [],
    finish: [],
    ...partial,
  } as Product;
}

describe("price display modes (spec §11.1)", () => {
  it("exact shows ₹/unit and optional box", () => {
    const p = productWith({ pricing: { mode: "exact", currency: "INR", unit: "sq_ft", amount: 68, boxAmount: 1054, updatedAt: "" } });
    const d = getPriceDisplay(p);
    expect(d.primary).toBe("₹68 / sq ft");
    expect(d.secondary).toBe("₹1,054 / box");
    expect(d.offer).toEqual({ low: 68, unit: "sq ft" });
    expect(d.isQuote).toBe(false);
  });

  it("from mode prefixes From", () => {
    const d = getPriceDisplay(productWith({ pricing: { mode: "from", currency: "INR", unit: "sq_ft", amount: 92, updatedAt: "" } }));
    expect(d.primary).toBe("From ₹92 / sq ft");
  });

  it("range mode uses en-dash and AggregateOffer data", () => {
    const d = getPriceDisplay(productWith({ pricing: { mode: "range", currency: "INR", unit: "sq_ft", min: 120, max: 155, updatedAt: "" } }));
    expect(d.primary).toBe("₹120–₹155 / sq ft");
    expect(d.offer).toEqual({ low: 120, high: 155, unit: "sq ft" });
  });

  it("quote mode never fabricates a number", () => {
    const d = getPriceDisplay(productWith({ pricing: { mode: "quote", currency: "INR", unit: "sq_ft", updatedAt: "" } }));
    expect(d.isQuote).toBe(true);
    expect(d.offer).toBeUndefined();
  });

  it("exact without amount falls back to quote honestly", () => {
    const d = getPriceDisplay(productWith({ pricing: { mode: "exact", currency: "INR", unit: "sq_ft", amount: 0, updatedAt: "" } }));
    expect(d.isQuote).toBe(true);
  });

  it("never shows ₹0 from blank data", () => {
    const d = getPriceDisplay(productWith({ pricing: { mode: "exact", currency: "INR", unit: "box", updatedAt: "" } }));
    expect(d.primary).not.toContain("₹0");
  });
});

describe("whatsapp url + messages (spec §17)", () => {
  it("encodes the message and uses digits-only phone", () => {
    const url = buildWhatsAppUrl({ phoneE164: "+91 98765 43210", message: "Hi\nStock?" });
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=Hi%0AStock%3F$/);
  });

  it("product message contains SKU, size, page and source code — no PII", () => {
    const p = productWith({
      name: "Bianco Tile",
      sku: "VMT-BCG-6012",
      slug: "bianco-tile",
      tile: { widthMm: 600, heightMm: 1200, use: ["floor"] },
      finish: ["gloss"],
    });
    const msg = buildProductMessage({ product: p, canonicalUrl: "https://example.com/product/bianco-tile" });
    expect(msg).toContain("SKU: VMT-BCG-6012");
    expect(msg).toContain("Size: 600×1200 mm");
    expect(msg).toContain("Page: https://example.com/product/bianco-tile");
    expect(msg).toMatch(/Source: PDP-[A-Z2-9]{6}/);
  });
});

describe("phone normalization", () => {
  it("normalizes Indian formats to E.164", () => {
    expect(normalizeIndianPhone("98765 43210")).toBe("+919876543210");
    expect(normalizeIndianPhone("+91-9876543210")).toBe("+919876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("+919876543210");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("1234567890")).toBeNull(); // doesn't start with 6-9
  });
});

describe("shortCode", () => {
  it("is deterministic and collision-resistant enough", () => {
    expect(shortCode("bianco-carrara-gloss-600x1200")).toBe(shortCode("bianco-carrara-gloss-600x1200"));
    const codes = new Set(Array.from({ length: 200 }, (_, i) => shortCode(`slug-${i}`)));
    expect(codes.size).toBeGreaterThan(180);
  });
});
