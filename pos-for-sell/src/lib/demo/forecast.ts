// Pure demand-forecasting helpers. Given a product id and a list of past
// orders, compute sales velocity over a lookback window and suggest a
// restock quantity for the next event.
//
// Intentionally simple: average daily velocity × planned event days, minus
// what's already on hand. Replaced by a richer per-event aggregation when
// real `events` table is wired (DD-90+).

import type { DemoOrder } from "./sales";
import { isoDateInTZ } from "@/lib/date";

export type VelocityWindow = {
  /** Distinct days where any non-voided sale happened. */
  activeDays: number;
  /** Total non-voided non-refunded units sold of this product in the window. */
  qtySold: number;
  /** qtySold / max(1, activeDays). */
  perActiveDay: number;
};

export type ForecastInput = {
  orders: DemoOrder[];
  productId: string;
  /** Calendar lookback (default 30 days). */
  lookbackDays?: number;
  /** Days of inventory cover the next event needs. Default 4 (typical Pet Expo). */
  nextEventDays?: number;
  /** Current stock on hand for this product. */
  currentQty?: number;
};

export type ForecastResult = {
  window: VelocityWindow;
  /** projected demand for the next event = perActiveDay × nextEventDays */
  projectedQty: number;
  /** suggested restock = max(0, projected - currentQty), rounded up */
  suggestRestockQty: number;
};

/**
 * Pure: aggregate sales for one product across a lookback window,
 * counting only effective (non-voided, non-refunded) units.
 */
export function computeVelocity(
  orders: DemoOrder[],
  productId: string,
  lookbackDays: number = 30,
): VelocityWindow {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  const sinceMs = since.getTime();

  const days = new Set<string>();
  let qtySold = 0;
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    const orderTime = Date.parse(o.createdAt);
    if (Number.isNaN(orderTime) || orderTime < sinceMs) continue;

    let lineSum = 0;
    o.items.forEach((it, idx) => {
      if (it.productId !== productId) return;
      const refunded = (o.refunds ?? [])
        .filter((r) => r.lineIndex === idx)
        .reduce((s, r) => s + r.qty, 0);
      lineSum += Math.max(0, it.qty - refunded);
    });
    if (lineSum > 0) {
      qtySold += lineSum;
      days.add(isoDateInTZ(o.createdAt));
    }
  }

  const activeDays = days.size;
  return {
    activeDays,
    qtySold,
    perActiveDay: activeDays > 0 ? qtySold / activeDays : 0,
  };
}

export function forecastProduct(input: ForecastInput): ForecastResult {
  const lookbackDays = input.lookbackDays ?? 30;
  const nextEventDays = input.nextEventDays ?? 4;
  const currentQty = input.currentQty ?? 0;

  const window = computeVelocity(input.orders, input.productId, lookbackDays);
  const projectedQty = Math.ceil(window.perActiveDay * nextEventDays);
  const suggestRestockQty = Math.max(0, projectedQty - currentQty);

  return { window, projectedQty, suggestRestockQty };
}
