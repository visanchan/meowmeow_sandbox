"use client";

import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { useT } from "@/lib/i18n/provider";
import { deriveActivityFeed } from "@/lib/demo/activityFeed";
import { formatTHB } from "@/lib/money/format";
import { formatDateTimeTH } from "@/lib/date";
import { Pill, type PillTone } from "@/components/ui/Pill";

const TONE: Record<string, PillTone> = {
  sale: "ok",
  void: "danger",
  refund: "warn",
  low_stock: "warn",
  sold_out: "danger",
};

export function ActivityFeedTile() {
  const { orders } = useDemoSales();
  const { items } = useDemoCatalog();
  const { t } = useT();

  const entries = deriveActivityFeed(orders, items, { entryLimit: 10 });

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          {t.pos.activityFeedHeader}
        </p>
        <span className="grid h-2 w-2 place-items-center rounded-full bg-[var(--color-ok-soft-fg)]/80">
          <span className="h-2 w-2 animate-ping rounded-full bg-[var(--color-ok-soft-fg)]/60" />
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No activity yet today. Make a sale at /app/pos.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {entries.map((e, i) => (
            <li
              key={i}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex flex-wrap items-baseline gap-2">
                <Pill tone={TONE[e.kind] ?? "neutral"}>{e.kind.replace("_", " ")}</Pill>
                <span className="font-extrabold text-text">{e.title}</span>
                {e.body && (
                  <span className="text-xs text-muted">{e.body}</span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                {e.amountSatang !== undefined && (
                  <span className="num text-sm font-extrabold text-accent-strong">
                    {formatTHB(e.amountSatang)}
                  </span>
                )}
                <span className="text-[11px] text-muted">
                  {formatDateTimeTH(e.at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
