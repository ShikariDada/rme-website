import { describe, expect, it, beforeEach, vi } from "vitest";
import { quoteFormSchema } from "@/lib/validation/quote";
import { rateLimit, resetRateLimiter } from "@/lib/server/rateLimit";

describe("quoteFormSchema", () => {
  const valid = {
    name: "Test Person",
    phone: "9876543210",
    city: "Mathura",
    products: "",
    message: "",
    consent: true,
    websiteUrl: "",
    turnstileToken: "",
    sourceSurface: "test",
  };

  it("accepts a valid payload and canonicalizes phone to E.164", () => {
    const r = quoteFormSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("+919876543210");
  });

  it("accepts +91 formatted phone", () => {
    const r = quoteFormSchema.safeParse({ ...valid, phone: "+91 98765 43210" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("+919876543210");
  });

  it("rejects short names and bad phones", () => {
    expect(quoteFormSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
    expect(quoteFormSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("requires consent", () => {
    const r = quoteFormSchema.safeParse({ ...valid, consent: false });
    expect(r.success).toBe(false);
  });

  it("honeypot field must be empty when present", () => {
    const r = quoteFormSchema.safeParse({ ...valid, websiteUrl: "http://spam.example" });
    expect(r.success).toBe(false);
  });

  it("area must be positive when provided", () => {
    expect(quoteFormSchema.safeParse({ ...valid, areaSqFt: -10 }).success).toBe(false);
    expect(quoteFormSchema.safeParse({ ...valid, areaSqFt: 250 }).success).toBe(true);
  });
});

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimiter();
  });
  vi.useRealTimers();

  it("allows N requests then blocks, recovers after window", () => {
    vi.useFakeTimers();
    const start = Date.now();
    vi.setSystemTime(start);
    for (let i = 0; i < 5; i++) {
      expect(rateLimit("ip-1", 5, 60_000).ok).toBe(true);
    }
    const blocked = rateLimit("ip-1", 5, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    // Other keys unaffected.
    expect(rateLimit("ip-2", 5, 60_000).ok).toBe(true);
    // After the window passes, allowed again.
    vi.setSystemTime(start + 61_000);
    expect(rateLimit("ip-1", 5, 60_000).ok).toBe(true);
    vi.useRealTimers();
  });
});
