"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnBackdropClick?: boolean;
};

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeOnBackdropClick = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // simple focus trap inside the dialog
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    // body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // initial focus
    queueMicrotask(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-3 py-6"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn("panel relative w-full p-5", sizeClass[size])}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-soft px-3 py-1 text-sm font-extrabold text-muted hover:text-text"
        >
          ✕
        </button>
        {title && (
          <h2 className="font-display text-2xl text-accent-strong">{title}</h2>
        )}
        <div className={cn(title && "mt-4")}>{children}</div>
      </div>
    </div>
  );
}
