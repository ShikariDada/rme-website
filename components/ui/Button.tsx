import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "text" | "destructive" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
  secondary:
    "bg-surface text-text border border-border hover:bg-surface-muted active:bg-surface-muted",
  text: "text-accent hover:bg-accent-soft active:bg-accent-soft",
  destructive: "bg-danger text-white hover:opacity-90",
  whatsapp: "bg-[#1fa855] text-white hover:bg-[#178a45] active:bg-[#178a45]",
};

const sizes: Record<Size, string> = {
  sm: "text-sm h-9 px-3 min-w-[36px]",
  md: "text-base h-11 px-4 min-w-[44px]",
  lg: "text-lg h-12 px-6",
};

export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string
): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  external?: boolean;
  children: ReactNode;
}

export function ButtonLink({
  variant,
  size,
  className,
  external,
  href,
  children,
  ...props
}: ButtonLinkProps) {
  if (external || String(href).startsWith("http")) {
    return (
      <a
        href={String(href)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses(variant, size, className)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

export function TextLink({ className, href, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(
        "text-accent underline underline-offset-2 decoration-border hover:decoration-accent transition-colors",
        className
      )}
      {...props}
    />
  );
}
