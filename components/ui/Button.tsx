import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "text" | "destructive" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
 "inline-flex items-center justify-center gap-2 font-medium uppercase tracking-wide2 rounded-sm transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
 primary:
 "bg-accent text-bg hover:bg-accent-hover active:bg-accent-hover",
 secondary:
 "bg-transparent text-text border border-text hover:bg-text hover:text-bg active:bg-text active:text-bg",
 text: "text-accent underline underline-offset-4 decoration-border hover:decoration-accent hover:text-accent-hover",
 destructive: "bg-danger text-bg hover:opacity-90",
 whatsapp: "bg-wa text-white hover:bg-wa-dark active:bg-wa-dark",
};

const sizes: Record<Size, string> = {
 sm: "text-xs h-10 px-4 min-w-9",
 md: "text-13 h-12 px-7 min-w-11",
 lg: "text-13 h-14 px-8",
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
  "text-accent underline underline-offset-4 decoration-border hover:decoration-accent transition-colors",
  className
  )}
  {...props}
 />
 );
}
