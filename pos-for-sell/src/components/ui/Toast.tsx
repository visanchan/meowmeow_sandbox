"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type ToastKind = "info" | "success" | "warn" | "error";
export type ToastInput = {
  kind?: ToastKind;
  title?: string;
  message: string;
  durationMs?: number;
};
type ToastEntry = ToastInput & { id: number };

type ToastContextValue = {
  push: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const KIND_CLS: Record<ToastKind, string> = {
  info: "bg-panel-strong text-text border-line",
  success:
    "bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)] border-[var(--color-ok-soft-fg)]/30",
  warn:
    "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn-soft-fg)] border-[var(--color-warn-soft-fg)]/30",
  error:
    "bg-[var(--color-danger-soft-bg)] text-[var(--color-danger-soft-fg)] border-[var(--color-danger-soft-fg)]/30",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastEntry[]>([]);
  const seqRef = useRef(0);

  const push = useCallback((toast: ToastInput) => {
    const id = ++seqRef.current;
    setItems((curr) => [...curr, { ...toast, id }]);
    const ms = toast.durationMs ?? 4000;
    setTimeout(() => {
      setItems((curr) => curr.filter((t) => t.id !== id));
    }, ms);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto min-w-[260px] max-w-sm rounded-2xl border px-4 py-3 shadow-[var(--shadow-card)]",
              KIND_CLS[t.kind ?? "info"],
            )}
            role="status"
          >
            {t.title && (
              <p className="text-sm font-extrabold">{t.title}</p>
            )}
            <p className="text-sm">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Mounts the provider and forwards the context. Useful for non-app routes. */
export function ToastDismissOnRouteChange() {
  // Placeholder: a more robust impl would listen to next/navigation router events
  // and clear stale toasts. Pilot-stage is fine without this.
  useEffect(() => {}, []);
  return null;
}
