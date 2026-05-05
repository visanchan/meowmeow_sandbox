// Pure activity-feed derivation for the dashboard.
// Mixes: recent sales (most recent first), low-stock alerts, sold-out alerts.
// Time-sorted descending. Pure — no localStorage, no React.

import type { DemoOrder } from "./sales";
import { effectiveTotalSatang } from "./sales";
import type { Product } from "@/lib/pos/types";

export type ActivityKind = "sale" | "low_stock" | "sold_out" | "void" | "refund";

export type ActivityEntry = {
  kind: ActivityKind;
  /** ISO timestamp — used for sort. */
  at: string;
  /** Short headline. */
  title: string;
  /** Optional detail line (sku, qty, etc.). */
  body?: string;
  /** Money-relevant amount in satang, when applicable. */
  amountSatang?: number;
};

export const LOW_STOCK_THRESHOLD = 5;

export function deriveActivityFeed(
  orders: DemoOrder[],
  catalog: Product[],
  options: { saleLimit?: number; entryLimit?: number } = {},
): ActivityEntry[] {
  const { saleLimit = 8, entryLimit = 12 } = options;
  const entries: ActivityEntry[] = [];

  // 1. Recent non-voided sales — most recent first
  const sales = [...orders]
    .filter((o) => (o.status ?? "completed") !== "voided")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, saleLimit);
  for (const o of sales) {
    entries.push({
      kind: "sale",
      at: o.createdAt,
      title: `${o.orderNumber} · ${o.paymentMethod}`,
      body:
        o.items.length === 1
          ? `${o.items[0].sku} ×${o.items[0].qty}`
          : `${o.items.length} lines`,
      amountSatang: effectiveTotalSatang(o),
    });
  }

  // 2. Voided / refunded surface (most recent voids/refunds, capped)
  for (const o of orders) {
    if (o.voidedAt && o.status === "voided") {
      entries.push({
        kind: "void",
        at: o.voidedAt,
        title: `${o.orderNumber} voided`,
        body: o.voidReason ?? undefined,
        amountSatang: o.totalSatang,
      });
    }
    for (const r of o.refunds ?? []) {
      const item = o.items[r.lineIndex];
      entries.push({
        kind: "refund",
        at: r.refundedAt,
        title: `${o.orderNumber} refunded`,
        body: item ? `${item.sku} ×${r.qty}` : `${r.qty} units`,
        amountSatang: r.amountSatang,
      });
    }
  }

  // 3. Low-stock + sold-out alerts (snapshot, not historical)
  const nowIso = new Date().toISOString();
  for (const p of catalog) {
    if (!p.is_active) continue;
    if (p.current_qty === 0) {
      entries.push({
        kind: "sold_out",
        at: nowIso,
        title: `${p.sku} sold out`,
        body: p.name,
      });
    } else if (p.current_qty <= LOW_STOCK_THRESHOLD) {
      entries.push({
        kind: "low_stock",
        at: nowIso,
        title: `${p.sku} low stock`,
        body: `${p.name} · ${p.current_qty} left`,
      });
    }
  }

  // Sort all entries by `at` desc, cap.
  entries.sort((a, b) => b.at.localeCompare(a.at));
  return entries.slice(0, entryLimit);
}
