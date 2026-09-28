import { z } from "zod";

/**
 * Quote form validation (spec §17.4). Shared by client pre-validation and the
 * server route handler. Data minimisation per spec §26: no room images, no
 * email, no address fields beyond city/locality.
 */

export const quoteFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()\-]/g, ""))
    .refine((v) => /^(\+91|91|0)?[6-9]\d{9}$/.test(v), {
      message: "Enter a valid 10-digit Indian mobile number",
    })
    .transform((v) => `+91${v.replace(/^\+?91/, "").replace(/^0/, "")}`),
  city: z.string().trim().min(2, "Please enter your city or locality").max(80),
  products: z.string().trim().max(500).optional().default(""),
  areaSqFt: z.coerce
    .number()
    .positive("Area must be positive")
    .max(1_000_000)
    .optional(),
  projectType: z
    .enum(["home", "shop", "office", "other", ""])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  message: z.string().trim().max(2000).optional().default(""),
  /** Consent to be contacted about this enquiry. */
  consent: z.literal(true, { message: "Please allow us to contact you about this enquiry" }),
  /** Honeypot — must be empty. Hidden from real users. */
  websiteUrl: z.string().max(0).optional().default(""),
  /** Turnstile token when enabled. */
  turnstileToken: z.string().optional().default(""),
  /** Context the form was opened from (for analytics, not storage). */
  sourceSurface: z.string().trim().max(40).optional().default("quote-form"),
});

export type QuoteFormInput = z.input<typeof quoteFormSchema>;
export type QuoteFormData = z.output<typeof quoteFormSchema>;
