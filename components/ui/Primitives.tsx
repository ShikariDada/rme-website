import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warn" | "muted" | "accent";

const tones: Record<BadgeTone, string> = {
 neutral: "bg-surface text-text border-border",
 success: "bg-surface text-success border-border",
 warn: "bg-surface text-danger border-border",
 muted: "bg-surface text-text-muted border-border",
 accent: "bg-accent-soft text-accent-hover border-accent/25",
};

/** Restrained pill badge (spec §8.7 bans badge/chip proliferation). */
export function Badge({
 tone = "neutral",
 className,
 children,
}: {
 tone?: BadgeTone;
 className?: string;
 children: ReactNode;
}) {
 return (
 <span
  className={cn(
  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-11 font-semibold uppercase tracking-badge",
  tones[tone],
  className
  )}
 >
  {children}
 </span>
 );
}

export function Container({
 className,
 children,
 as: Tag = "div",
}: {
 className?: string;
 children: ReactNode;
 as?: "div" | "section" | "header" | "footer" | "nav" | "main";
}) {
 return (
 <Tag className={cn("mx-auto w-full max-w-screen px-4 md:px-6", className)}>
  {children}
 </Tag>
 );
}

export function SectionHeader({
 title,
 description,
 action,
 level = 2,
 kicker,
 className,
reveal = true,
}: {
 title: string;
 description?: string;
 action?: ReactNode;
 /** 1 = page-level heading (one visible h1), 2/3 = section headings. */
 level?: 1 | 2 | 3;
 /** Optional kicker rendered above the title. */
 kicker?: string;
 className?: string;
reveal?: boolean;
}) {
 const Heading = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
 return (
 <div
  {...(reveal ? { "data-reveal": "" } : {})}
  className={cn("mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10", className)}
 >
  <div className="max-w-2xl">
  {kicker && (
   <p className="kicker mb-3 flex items-center gap-2.5">
   <span aria-hidden="true" className="h-px w-6 bg-accent" />
   {kicker}
   </p>
  )}
  <Heading className={level === 1 ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}>{title}</Heading>
  {description && <p className="mt-3 text-text-muted">{description}</p>}
  </div>
  {action && <div className="shrink-0">{action}</div>}
 </div>
 );
}

export function Skeleton({ className }: { className?: string }) {
 return <div className={cn("animate-pulse rounded-md bg-surface-muted", className)} />;
}
