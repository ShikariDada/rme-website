import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "text" | "destructive" | "whatsapp";
type Size = "sm" | "md" | "lg";

const base =
 "inline-flex items-center justify-center gap-2 font-semibold rounded-pill transition-all duration-300 ease-out-expo disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
 primary:
 "bg-ink text-white hover:bg-ink-soft hover:-translate-y-0.5 hover:shadow-raise active:translate-y-0",
 secondary:
 "bg-transparent text-text border border-text/25 hover:border-text hover:bg-text hover:text-white",
 text: "text-accent underline underline-offset-4 decoration-border hover:decoration-accent hover:text-accent-hover",
 destructive: "bg-danger text-white hover:opacity-90",
 whatsapp: "bg-wa text-white hover:bg-wa-dark hover:-translate-y-0.5 hover:shadow-raise",
};

const sizes: Record<Size, string> = {
 sm: "text-13 h-10 px-5 min-w-9",
 md: "text-sm h-12 px-6 min-w-11",
 lg: "text-sm h-14 px-8",
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
