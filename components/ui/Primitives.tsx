import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warn" | "muted" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-text border-border",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
  warn: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30",
  muted: "bg-transparent text-text-muted border-border",
  accent: "bg-accent-soft text-accent border-accent/30",
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
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
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 2 | 3;
  className?: string;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="max-w-2xl">
        <Heading className="text-2xl md:text-[1.75rem] leading-tight">{title}</Heading>
        {description && <p className="mt-2 text-text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-muted", className)} />;
}
