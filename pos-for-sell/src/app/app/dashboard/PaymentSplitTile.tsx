import { formatTHB } from "@/lib/money/format";

type Split = {
  cash: number;
  promptpay: number;
  transfer: number;
  card: number;
  other: number;
};

const LABELS: Record<keyof Split, string> = {
  cash: "Cash",
  promptpay: "PromptPay",
  transfer: "Transfer",
  card: "Card",
  other: "Other",
};

const ORDER: Array<keyof Split> = ["cash", "promptpay", "transfer", "card", "other"];

export function PaymentSplitTile({ split }: { split: Split }) {
  const total = ORDER.reduce((s, k) => s + split[k], 0);
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Payment split
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        {ORDER.map((k) => {
          const v = split[k];
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <div key={k} className="rounded-xl border border-line bg-panel px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                {LABELS[k]}
              </p>
              <p className="num mt-1 text-base font-black text-accent-strong">
                {formatTHB(v)}
              </p>
              <p className="num text-[11px] text-muted">{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
