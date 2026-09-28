import { Accordion } from "@/components/ui/Accordion";
import type { Faq } from "@/lib/types";

export function ProductFaq({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby="product-faq-heading">
      <h2 id="product-faq-heading" className="text-xl md:text-2xl">
        Common questions
      </h2>
      <Accordion
        className="mt-4"
        items={faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        }))}
      />
    </section>
  );
}
