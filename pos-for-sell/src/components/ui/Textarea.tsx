"use client";

import { forwardRef, type TextareaHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

const baseInput =
  "w-full min-h-[100px] rounded-[var(--radius-md)] border bg-panel px-3 py-2.5 text-base text-text shadow-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/25";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id: providedId, className, ...rest }, ref) {
    const autoId = useId();
    const id = providedId ?? autoId;
    return (
      <label htmlFor={id} className="block">
        {label && (
          <span className="mb-1.5 block text-sm font-bold text-accent-strong">
            {label}
          </span>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${id}-msg` : undefined}
          className={cn(
            baseInput,
            error
              ? "border-[var(--color-danger-soft-fg)] focus:border-[var(--color-danger-soft-fg)]"
              : "border-line focus:border-accent",
            className,
          )}
          {...rest}
        />
        {(hint || error) && (
          <span
            id={`${id}-msg`}
            className={cn(
              "mt-1 block text-xs",
              error ? "text-[var(--color-danger-soft-fg)]" : "text-muted",
            )}
          >
            {error || hint}
          </span>
        )}
      </label>
    );
  },
);
