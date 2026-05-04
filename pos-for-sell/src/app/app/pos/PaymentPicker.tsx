"use client";

import type { PaymentMethod } from "@/lib/pos/types";

const LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  promptpay: "PromptPay",
  transfer: "Transfer",
  card: "Card",
  other: "Other",
};

export function PaymentPicker({
  methods,
  selected,
  onSelect,
}: {
  methods: PaymentMethod[];
  selected: PaymentMethod | null;
  onSelect: (m: PaymentMethod) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {methods.map((m) => {
        const active = selected === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(m)}
            className={
              active
                ? "btn-accent rounded-xl px-2 py-2.5 text-sm font-extrabold"
                : "rounded-xl border border-line bg-panel px-2 py-2.5 text-sm font-extrabold text-accent-strong hover:bg-soft"
            }
          >
            {LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}
