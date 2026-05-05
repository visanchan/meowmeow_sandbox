// Close-of-day cash reconciliation: compute what cash *should* be in the
// drawer based on today's non-voided cash sales, then let the operator enter
// what they actually counted and record the discrepancy.
//
// Persisted as an array of close records, one per day. A new record per
// close-of-day; re-closing the same day appends a new record (the latest is
// the one that "counts" but we keep the history for audit).

import type { DemoOrder } from "./sales";
import { isoDateInTZ } from "@/lib/date";

export const DEMO_CLOSE_DAY_KEY = "pos-for-sell:demo-close-day:v1";

export type DemoCloseDayRecord = {
  id: string;
  /** ISO date (YYYY-MM-DD) in TH timezone for the day being closed. */
  isoDate: string;
  /** Sum of cash collected during the day according to the system. */
  expectedSatang: number;
  /** What the operator actually counted in the drawer. */
  countedSatang: number;
  /** counted − expected (positive = surplus, negative = short). */
  discrepancySatang: number;
  /** Operator's note when discrepancy ≠ 0 (or any time, optional). */
  reason: string;
  /** ISO timestamp of the close action. */
  closedAt: string;
};

/**
 * Pure: compute expected cash for a given ISO date.
 * - cash-only orders contribute their full totalSatang
 * - mixed (split) orders contribute the sum of their cash-method splits
 * - voided orders are excluded
 */
export function computeExpectedCashFor(
  orders: DemoOrder[],
  isoDate: string,
): number {
  let cash = 0;
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    if (isoDateInTZ(o.createdAt) !== isoDate) continue;

    if (o.paymentMethod === "cash") {
      cash += o.totalSatang;
      continue;
    }
    if (o.paymentMethod === "mixed" && o.payments) {
      for (const p of o.payments) {
        if (p.method === "cash") cash += p.amountSatang;
      }
    }
  }
  return cash;
}

export function readDemoCloseDay(): DemoCloseDayRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_CLOSE_DAY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoCloseDayRecord[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoCloseDay(records: DemoCloseDayRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_CLOSE_DAY_KEY, JSON.stringify(records));
  } catch {
    // quota — silently drop
  }
}

export function clearDemoCloseDay(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_CLOSE_DAY_KEY);
}

export function appendCloseDay(record: DemoCloseDayRecord): void {
  const all = readDemoCloseDay();
  writeDemoCloseDay([record, ...all].slice(0, 90)); // keep at most 90 days
}

export function newCloseDayId(): string {
  return `close-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}
