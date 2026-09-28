"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dialog + Sheet built on the native <dialog> element, which provides focus
 * trapping, Escape handling and inert background content out of the box.
 * Sheet = bottom sheet on mobile, centered dialog on desktop.
 */

export function Dialog({
  open,
  onClose,
  title,
  children,
  variant = "dialog",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "dialog" | "sheet";
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
    previouslyFocused.current?.focus?.();
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      handleClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [handleClose]);

  // Scroll lock while open (native dialog doesn't lock page scroll).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isSheet = variant === "sheet";

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClick={(e) => {
        // Close when clicking the backdrop (dialog padding area).
        if (e.target === ref.current) handleClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg bg-surface text-text backdrop:bg-black/40",
        "border border-border rounded-lg shadow-lg p-0 open:animate-none",
        isSheet &&
          "md:m-auto max-md:m-0 max-md:mt-auto max-md:max-w-none max-md:w-full max-md:rounded-b-none max-md:rounded-t-lg",
        className
      )}
    >
      <div className={cn("flex items-center justify-between gap-4 px-5 pt-4", isSheet && "pb-1")}>
        <h2 id="dialog-title" className="text-lg font-display">
          {title}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div
        className={cn(
          "px-5 py-4",
          isSheet && "max-md:max-h-[75dvh] max-md:overflow-y-auto pb-safe-bar"
        )}
      >
        {children}
      </div>
    </dialog>
  );
}
