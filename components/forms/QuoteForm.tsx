"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, FieldError, FieldLabel, Input, Select, Textarea } from "@/components/ui/Input";
import { Turnstile } from "@/components/forms/Turnstile";
import { quoteFormSchema, type QuoteFormData } from "@/lib/validation/quote";
import { buildQuoteReferenceMessage, buildWhatsAppUrl, buildGeneralEnquiryMessage } from "@/lib/whatsapp";
import { track } from "@/lib/analytics/track";
import { isStaticExport } from "@/lib/static";
import type { SiteSettings } from "@/lib/types";

interface FieldErrors {
  name?: string;
  phone?: string;
  city?: string;
  areaSqFt?: string;
  consent?: string;
  form?: string;
}

// DOM order for moving keyboard focus to the first invalid field on failed validation.
const FIELD_ID_BY_KEY: Record<Exclude<keyof FieldErrors, "form">, string> = {
  name: "q-name",
  phone: "q-phone",
  city: "q-city",
  areaSqFt: "q-area",
  consent: "q-consent",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  home: "My home",
  shop: "Shop",
  office: "Office",
  other: "Other",
};

function buildGeneralEnquiry(): string {
  return buildGeneralEnquiryMessage("quote-form");
}

/** Same payload the server receives, composed as a WhatsApp-friendly message. */
function buildQuoteEnquiryMessage(data: QuoteFormData): string {
  const lines = [
    buildGeneralEnquiry(),
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `City: ${data.city}`,
  ];
  if (data.products) lines.push(`Products: ${data.products}`);
  if (data.areaSqFt !== undefined) lines.push(`Area: ${data.areaSqFt} sq ft`);
  if (data.projectType) {
    lines.push(`Project type: ${PROJECT_TYPE_LABELS[data.projectType] ?? data.projectType}`);
  }
  if (data.message) {
    lines.push("", data.message);
  }
  return lines.join("\n");
}

/**
 * Quote form (spec §17.4). Collects the minimum needed to respond: no email,
 * no address, no room images (spec §26 data minimisation).
 *
 * Two submit paths:
 * - Server build: POSTs to /api/quote (unchanged).
 * - Static export: no route handlers exist, so the same validated payload is
 *   handed over via WhatsApp (with a clipboard fallback), no fetch.
 */
export function QuoteForm({
  settings,
  sourceSurface,
  prefillProducts,
}: {
  settings: SiteSettings;
  sourceSurface: string;
  prefillProducts?: string;
}) {
  // `?ref=` prefill (product path) is resolved client-side so both build modes
  // work without server searchParams; an explicit prefillProducts prop wins.
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") ?? "";
  const refPrefill = useMemo(() => {
    if (!refParam) return "";
    // searchParams are already decoded; a guarded decode is defensive for
    // double-encoded links and never crashes on malformed input.
    try {
      return decodeURIComponent(refParam) || refParam;
    } catch {
      return refParam;
    }
  }, [refParam]);

  const startedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({
    name: "",
    phone: "",
    city: "",
    products: prefillProducts ?? refPrefill,
    areaSqFt: "",
    projectType: "",
    message: "",
    consent: false,
    websiteUrl: "", // honeypot — humans never fill this
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; warning?: string } | null>(null);
  const [prepared, setPrepared] = useState<{ message: string; whatsappHref: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const set = useCallback(
    (field: keyof typeof values, value: string | boolean) => {
      setValues((v) => ({ ...v, [field]: value }));
      if (!startedRef.current) {
        startedRef.current = true;
        track("quote_form_start", { source_surface: sourceSurface });
      }
    },
    [sourceSurface]
  );

  const onTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const whatsappHref = useMemo(() => buildWhatsAppUrl({
    phoneE164: settings.whatsappNumber,
    message: buildGeneralEnquiry(),
  }), [settings.whatsappNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = quoteFormSchema.safeParse({
      ...values,
      areaSqFt: values.areaSqFt === "" ? undefined : Number(values.areaSqFt),
      turnstileToken,
      sourceSurface,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form") as keyof FieldErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      // Move keyboard focus to the first invalid field so screen-reader and
      // keyboard users land right on what needs fixing.
      const firstErrorField = (
        ["name", "phone", "city", "areaSqFt", "consent"] as const
      ).find((key) => Boolean(fieldErrors[key]));
      if (firstErrorField) {
        const el = document.getElementById(FIELD_ID_BY_KEY[firstErrorField]);
        requestAnimationFrame(() => el?.focus());
      }
      track("quote_form_error", { source_surface: sourceSurface, reason: "validation" });
      return;
    }

    // Static export: no /api/quote route handler exists — prepare the enquiry
    // for WhatsApp instead of fetching.
    if (isStaticExport) {
      const message = buildQuoteEnquiryMessage(parsed.data);
      setPrepared({
        message,
        whatsappHref: buildWhatsAppUrl({ phoneE164: settings.whatsappNumber, message }),
      });
      track("quote_form_submit", { source_surface: sourceSurface });
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as {
        ok: boolean;
        reference?: string;
        warning?: string;
        error?: string;
      };
      if (!res.ok || !body.ok || !body.reference) {
        setErrors({ form: body.error ?? "Something went wrong — please call or WhatsApp us instead." });
        track("quote_form_error", { source_surface: sourceSurface, reason: "server" });
        return;
      }
      setSuccess({ reference: body.reference, warning: body.warning });
      track("quote_form_submit", { source_surface: sourceSurface });
    } catch {
      setErrors({ form: "Network problem — please try again, or WhatsApp us." });
      track("quote_form_error", { source_surface: sourceSurface, reason: "network" });
    } finally {
      setPending(false);
    }
  }

  async function copyDetails() {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (prepared) {
    return (
      <div className="rounded-sm border border-border bg-surface p-6" role="status">
        <h2 className="font-display text-xl">Enquiry prepared</h2>
        <p className="mt-2 text-text-muted">
          Nothing was sent yet — hand it over with one tap. WhatsApp is the
          fastest route; calling {settings.phoneDisplay ?? settings.phone} works too.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <ButtonLink variant="whatsapp" href={prepared.whatsappHref} external>
            Send enquiry on WhatsApp
          </ButtonLink>
          <Button variant="secondary" onClick={copyDetails}>
            {copied ? "Copied!" : "Copy details"}
          </Button>
          <ButtonLink variant="secondary" href={`tel:${settings.phone}`}>
            Call {settings.phoneDisplay ?? settings.phone}
          </ButtonLink>
        </div>
        {settings.defaultQuoteResponseCopy && (
          <p className="mt-4 text-sm text-text-muted">{settings.defaultQuoteResponseCopy}</p>
        )}
      </div>
    );
  }

  if (success) {
    const summary = `Quote request: ${values.products || "general enquiry"}, ${values.city}`;
    const continueHref = buildWhatsAppUrl({
      phoneE164: settings.whatsappNumber,
      message: buildQuoteReferenceMessage({ reference: success.reference, summary }),
    });
    return (
      <div className="rounded-sm border border-border bg-surface p-6" role="status">
        <h2 className="font-display text-xl">Request received</h2>
        <p className="mt-2 text-text-muted">
          Keep this reference for the showroom:
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-wide">{success.reference}</p>
        {success.warning === "email-failed" && (
          <p className="mt-3 rounded-sm border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2 text-sm text-[var(--color-danger)]">
            The email notification could not be sent — please continue on WhatsApp so we definitely see your request.
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <ButtonLink variant="whatsapp" href={continueHref} external>
            Continue on WhatsApp
          </ButtonLink>
          <ButtonLink variant="secondary" href={`tel:${settings.phone}`}>
            Call {settings.phoneDisplay ?? settings.phone}
          </ButtonLink>
        </div>
        {settings.defaultQuoteResponseCopy && (
          <p className="mt-4 text-sm text-text-muted">{settings.defaultQuoteResponseCopy}</p>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      {errors.form && (
        <p role="alert" className="rounded-sm border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 px-3 py-2 text-sm text-[var(--color-danger)]">
          {errors.form}
        </p>
      )}

      <div>
        <FieldLabel htmlFor="q-name" required>Name</FieldLabel>
        <Input
          id="q-name" name="name" autoComplete="name" required
          value={values.name} onChange={(e) => set("name", e.target.value)}
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "q-name-error" : undefined}
        />
        <FieldError id="q-name-error" message={errors.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="q-phone" required>Phone (WhatsApp preferred)</FieldLabel>
          <Input
            id="q-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required
            placeholder="98765 43210"
            value={values.phone} onChange={(e) => set("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "q-phone-error" : undefined}
          />
          <FieldError id="q-phone-error" message={errors.phone} />
        </div>
        <div>
          <FieldLabel htmlFor="q-city" required>City / locality</FieldLabel>
          <Input
            id="q-city" name="city" autoComplete="address-level2" required
            value={values.city} onChange={(e) => set("city", e.target.value)}
            aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "q-city-error" : undefined}
          />
          <FieldError id="q-city-error" message={errors.city} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="q-products" hint="Product names, sizes, or SKUs — whatever you have">What are you looking for?</FieldLabel>
        <Textarea
          id="q-products" name="products" rows={3}
          defaultValue={values.products}
          onChange={(e) => set("products", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="q-area" hint="Approximate — helps us estimate quantity">Area (sq ft)</FieldLabel>
          <Input
            id="q-area" name="areaSqFt" type="number" inputMode="decimal" min="1" step="any"
            value={values.areaSqFt} onChange={(e) => set("areaSqFt", e.target.value)}
            aria-invalid={Boolean(errors.areaSqFt)} aria-describedby={errors.areaSqFt ? "q-area-error" : undefined}
          />
          <FieldError id="q-area-error" message={errors.areaSqFt} />
        </div>
        <div>
          <FieldLabel htmlFor="q-type">Project type</FieldLabel>
          <Select id="q-type" name="projectType" value={values.projectType} onChange={(e) => set("projectType", e.target.value)}>
            <option value="">Select…</option>
            <option value="home">My home</option>
            <option value="shop">Shop</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="q-message">Anything else?</FieldLabel>
        <Textarea
          id="q-message" name="message" rows={3}
          value={values.message} onChange={(e) => set("message", e.target.value)}
        />
      </div>

      {/* Honeypot: hidden from users and assistive tech; bots fill it. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="q-websiteUrl">Website</label>
        <input
          id="q-websiteUrl" name="websiteUrl" tabIndex={-1} autoComplete="off"
          value={values.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)}
        />
      </div>

      <Turnstile onToken={onTurnstileToken} />

      <div className="flex items-start gap-3">
        <Checkbox
          id="q-consent" name="consent" checked={values.consent}
          onChange={(e) => set("consent", e.target.checked)}
          aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "q-consent-error" : undefined}
        />
        <label htmlFor="q-consent" className="text-sm text-text-muted">
          You can contact me by phone or WhatsApp about this enquiry.
        </label>
      </div>
      <FieldError id="q-consent-error" message={errors.consent} />

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending
          ? "Sending…"
          : isStaticExport
            ? "Send enquiry on WhatsApp"
            : "Request a quote"}
      </Button>
      <p className="text-xs text-text-muted">
        Prefer chatting? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">Message us on WhatsApp</a> — usually the fastest route.
      </p>
    </form>
  );
}
