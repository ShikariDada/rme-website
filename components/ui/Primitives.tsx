import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warn" | "muted" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface text-text border-border",
  success: "bg-surface text-[var(--color-success)] border-border",
  warn: "bg-surface text-[var(--color-danger)] border-border",
  muted: "bg-surface text-text-muted border-border",
  accent: "bg-accent-soft text-accent border-border",
};

/** Restrained badge (spec §8.7 bans badge/chip proliferation). */
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
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em]",
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
    <Tag className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-6", className)}>
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
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** 1 = page-level heading (one visible h1), 2/3 = section headings. */
  level?: 1 | 2 | 3;
  /** Optional kicker rendered above the title. */
  kicker?: string;
  className?: string;
}) {
  const Heading = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="max-w-2xl">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <Heading className={level === 1 ? "text-3xl md:text-4xl leading-tight" : "text-2xl md:text-[1.75rem] leading-tight"}>{title}</Heading>
        {description && <p className="mt-2 text-text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-surface-muted", className)} />;
}
