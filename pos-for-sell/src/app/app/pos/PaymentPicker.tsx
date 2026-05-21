"use client";

import type { PaymentMethod } from "@/lib/pos/types";
import { useT } from "@/lib/i18n/provider";

export function PaymentPicker({
  methods,
  selected,
  onSelect,
}: {
  methods: PaymentMethod[];
  selected: PaymentMethod | null;
  onSelect: (m: PaymentMethod) => void;
}) {
  const { t } = useT();
  const labels: Record<PaymentMethod, string> = {
    cash: t.pos.methodCash,
    promptpay: t.pos.methodPromptPay,
    transfer: t.pos.methodTransfer,
    card: t.pos.methodCard,
    other: t.pos.methodOther,
  };

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
                ? "btn-accent min-h-[48px] rounded-xl px-2 py-3 text-sm font-extrabold"
                : "min-h-[48px] rounded-xl border border-line bg-panel px-2 py-3 text-sm font-extrabold text-accent-strong hover:bg-soft"
            }
          >
            {labels[m]}
          </button>
        );
      })}
    </div>
  );
}
