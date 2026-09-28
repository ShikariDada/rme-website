import { Container } from "@/components/ui/Primitives";
import { pageMetadata } from "@/lib/seo/metadata";
import { contentSource } from "@/lib/data";

export async function generateMetadata() {
  const settings = await contentSource.getSettings();
  return pageMetadata({
    title: `Privacy — ${settings.businessName}`,
    description: "What we collect, what we never collect, and how your room photos stay on your device.",
    path: "/privacy",
  });
}

export default async function PrivacyPage() {
  const settings = await contentSource.getSettings();

  return (
    <Container className="py-10 md:py-14 max-w-[800px]">
      <h1 className="text-3xl leading-tight md:text-4xl">Privacy, in plain language</h1>
      <p className="mt-2 text-sm text-text-muted">
        Last updated: September 2026. This is a practical summary, not legal
        advice. Questions? {settings.quoteEmail} or {settings.phoneDisplay ?? settings.phone}.
      </p>

      <div className="mt-8 space-y-8 text-[16px] leading-relaxed">
        <section>
          <h2 className="font-display text-xl">What we collect, and why</h2>
          <p className="mt-2 text-text-muted">
            The quote form asks for your name, phone number, city/locality and
            the details of your enquiry. We use exactly this to respond to you,
            by phone or WhatsApp. We do not ask for your email on the form, we
            do not store room images on our servers, and we do not add you to
            marketing lists. Consent to be contacted is an explicit checkbox —
            untick it and the form cannot be sent.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">WhatsApp</h2>
          <p className="mt-2 text-text-muted">
            Most conversations happen on WhatsApp. Those messages, and any room
            photos you attach there, live in WhatsApp&apos;s own system under
            their terms — not in our website database. Delete a conversation
            there and it is gone from the thread.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">The room visualizer</h2>
          <p className="mt-2 text-text-muted">
            The &quot;see it in your room&quot; tool processes your photo
            locally in your browser. Your photo is not uploaded to us. Saved
            visualizer projects stay in your own browser storage until you
            delete them; clearing your browser data also clears them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Analytics</h2>
          <p className="mt-2 text-text-muted">
            We use Google Analytics 4 to understand which pages help people
            (for example, which products get viewed before a quote request).
            Names, phone numbers, message text and image URLs are never sent to
            analytics. IP addresses are anonymized.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl">Where data lives</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-text-muted">
            <li>Quote requests: sent as email to the showroom inbox; kept only as long as useful to serve you, deleted on request.</li>
            <li>Hosting: Vercel (or our chosen host) serving this website.</li>
            <li>Email delivery: Resend (transactional email processor).</li>
            <li>Analytics: Google Analytics 4.</li>
            <li>Maps: Google Maps embed, loaded only when you click.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">Your choices</h2>
          <p className="mt-2 text-text-muted">
            Ask us what we hold about your enquiry, or ask us to delete the
            correspondence: {settings.quoteEmail}. We will do it promptly —
            there is no account system to untangle.
          </p>
        </section>
      </div>
    </Container>
  );
}
