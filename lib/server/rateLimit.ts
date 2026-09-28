/**
 * Best-effort in-memory sliding-window rate limiter (spec §27).
 * Per-instance only — sufficient to blunt bursts on a single-region Vercel
 * deployment; Turnstile remains the primary bot defence.
 */

interface Window {
  timestamps: number[];
}

const buckets = new Map<string, Window>();
let lastSweep = 0;

function sweep(now: number, windowMs: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now, windowMs);
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfterSec: 0 };
}

/** Test hook. */
export function resetRateLimiter(): void {
  buckets.clear();
  lastSweep = 0;
}
