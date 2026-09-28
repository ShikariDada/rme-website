import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-md border border-border bg-surface px-3 text-base text-text placeholder:text-text-muted/70 " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus)] " +
  "disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className, ...props }, ref) {
    return (
      <input ref={ref} className={cn(fieldBase, "h-11", className)} {...props} />
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldBase, "min-h-24 py-2", className)}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(fieldBase, "h-11 appearance-none bg-[right_0.75rem_center] pr-9", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c675f' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export const Checkbox = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-5 w-5 shrink-0 rounded-sm border-border accent-[var(--color-accent)]",
          className
        )}
        {...props}
      />
    );
  }
);

export function FieldLabel({
  htmlFor,
  children,
  hint,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5">
      {children}
      {required && (
        <span className="text-danger ml-0.5" aria-hidden="true">
          *
        </span>
      )}
      {hint && <span className="block text-xs font-normal text-text-muted">{hint}</span>}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}
