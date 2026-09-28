import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Accordion built on native <details>/<summary>: keyboard accessible and
 * screen-reader friendly with zero JS.
 */
export function Accordion({
  items,
  className,
}: {
  items: { id: string; question: string; answer: string }[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn("divide-y divide-border rounded-lg border border-border bg-surface", className)}>
      {items.map((item) => (
        <details key={item.id} className="group px-4 md:px-5 py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-[15px] font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            {item.question}
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              aria-hidden="true"
              className="shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-180"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <p className="pb-4 pr-8 text-[15px] text-text-muted whitespace-pre-line">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function Breadcrumb({
  items,
  className,
}: {
  items: { name: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className="text-border">
                /
              </span>
            )}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-text hover:underline underline-offset-2">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-text">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
