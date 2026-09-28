import { quoteFormSchema } from "@/lib/validation/quote";
import { rateLimit } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Generate a non-sensitive reference like Q-26A7F3 (spec §17.4). */
function generateReference(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `Q-${out}`;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? "unknown";
}

interface TurnstileResult {
  success: boolean;
  "error-codes"?: string[];
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip (honeypot + rate limit still active)
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as TurnstileResult;
    return data.success === true;
  } catch {
    // Fail closed on verification infrastructure errors.
    return false;
  }
}

export async function POST(request: Request) {
  // Body size guard (spec §27: max request body size).
  const raw = await request.text();
  if (raw.length > 10_000) {
    return Response.json({ ok: false, error: "Request too large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field. Return a plausible success without
  // processing or sending anything.
  const honeypot = (payload as { websiteUrl?: string } | null)?.websiteUrl;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return Response.json({ ok: true, reference: "Q-000000" });
  }

  const ip = clientIp(request);
  const limited = rateLimit(`quote:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Too many requests — please call or WhatsApp us instead." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const parsed = quoteFormSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return Response.json(
      { ok: false, error: "Please check the highlighted fields", fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const humanVerified = await verifyTurnstile(data.turnstileToken, ip);
  if (!humanVerified) {
    return Response.json(
      { ok: false, error: "Verification failed — please try again." },
      { status: 403 }
    );
  }

  const reference = generateReference();

  // Transactional email (spec §17.4). Never log the form body — outcome only.
  let warning: string | undefined;
  if (process.env.RESEND_API_KEY && process.env.QUOTE_EMAIL_TO) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const lines = [
        `Reference: ${reference}`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        `City: ${data.city}`,
        `Products: ${data.products || "(not specified)"}`,
        `Approx. area: ${data.areaSqFt ? `${data.areaSqFt} sq ft` : "(not specified)"}`,
        `Project type: ${data.projectType ?? "(not specified)"}`,
        `Message: ${data.message || "(none)"}`,
        `Source surface: ${data.sourceSurface}`,
        `Received: ${new Date().toISOString()}`,
      ];
      const from = process.env.RESEND_FROM ?? "Website <onboarding@resend.dev>";
      const result = await resend.emails.send({
        from,
        to: process.env.QUOTE_EMAIL_TO,
        subject: `Quote ${reference} — ${data.city}`,
        text: lines.join("\n"),
      });
      if (result.error) {
        console.error("resend-rejected", reference);
        warning = "email-failed";
      }
    } catch {
      console.error("resend-failed", reference);
      warning = "email-failed";
    }
  } else {
    // Dev/demo mode: no transport configured. Log the outcome, not the payload.
    console.log("quote-accepted", reference, "(no email transport configured)");
  }

  return Response.json({ ok: true, reference, ...(warning ? { warning } : {}) });
}
