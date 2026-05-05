// Multi-period dashboard helpers. Pure logic so range math + period-over-
// period comparison can be unit-tested without React.
//
// Pattern source: Shopify time-range comparison ("vs previous period"),
// Power BI relative-date filters, Square advanced reporting. Direct fix
// for the May 2026 finding that the dashboard is current-day only.

import { TH_TZ, isoDateInTZ } from "@/lib/date";
import type { DemoOrder } from "./sales";

export type RangePresetId =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "this_month"
  | "custom";

export type DateRange = {
  /** Inclusive ISO date YYYY-MM-DD in TH tz. */
  startDate: string;
  /** Inclusive ISO date YYYY-MM-DD in TH tz. */
  endDate: string;
  preset: RangePresetId;
  label: string;
};

function shiftDays(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/** Number of days inclusive between two YYYY-MM-DD strings. */
export function daysInRange(range: DateRange): number {
  const a = Date.parse(`${range.startDate}T00:00:00Z`);
  const b = Date.parse(`${range.endDate}T00:00:00Z`);
  return Math.floor((b - a) / 86400000) + 1;
}

/** Build a preset range relative to "today in TH timezone". */
export function rangePreset(id: RangePresetId, now: Date = new Date()): DateRange {
  const today = isoDateInTZ(now);
  if (id === "today") {
    return { startDate: today, endDate: today, preset: "today", label: "Today" };
  }
  if (id === "yesterday") {
    const y = shiftDays(today, -1);
    return { startDate: y, endDate: y, preset: "yesterday", label: "Yesterday" };
  }
  if (id === "last7") {
    return {
      startDate: shiftDays(today, -6),
      endDate: today,
      preset: "last7",
      label: "Last 7 days",
    };
  }
  if (id === "last30") {
    return {
      startDate: shiftDays(today, -29),
      endDate: today,
      preset: "last30",
      label: "Last 30 days",
    };
  }
  if (id === "this_month") {
    // Use parts in TH tz for first-of-month
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TH_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value ?? "1970";
    const m = parts.find((p) => p.type === "month")?.value ?? "01";
    const start = `${y}-${m}-01`;
    return {
      startDate: start,
      endDate: today,
      preset: "this_month",
      label: "This month",
    };
  }
  // custom — caller must override
  return { startDate: today, endDate: today, preset: "custom", label: "Custom" };
}

/** The period-over-period comparison range: same length as `range`,
 *  ending the day before `range.startDate`. Pattern from Shopify and
 *  most BI tools. */
export function previousRange(range: DateRange): DateRange {
  const span = daysInRange(range);
  const prevEnd = shiftDays(range.startDate, -1);
  const prevStart = shiftDays(prevEnd, -(span - 1));
  return {
    startDate: prevStart,
    endDate: prevEnd,
    preset: "custom",
    label: `Previous ${span === 1 ? "day" : `${span} days`}`,
  };
}

/** Filter orders to only those that fall inside the range (inclusive). */
export function ordersInRange(
  orders: DemoOrder[],
  range: DateRange,
): DemoOrder[] {
  return orders.filter((o) => {
    const d = isoDateInTZ(o.createdAt);
    return d >= range.startDate && d <= range.endDate;
  });
}

/** Compute a delta with a percentage. Handles div-by-zero by returning a
 *  null pct (so the UI can render "—" instead of "Infinity%"). */
export function deltaPct(current: number, previous: number): {
  delta: number;
  pct: number | null;
} {
  const delta = current - previous;
  if (previous === 0) return { delta, pct: current === 0 ? 0 : null };
  return { delta, pct: Math.round((delta / previous) * 1000) / 10 };
}

/** Daily revenue breakdown for a multi-day range. Used to replace
 *  HourBars when a range > 1 day is selected. */
export function dailyRevenueSeries(
  orders: DemoOrder[],
  range: DateRange,
): Array<{ date: string; totalSatang: number; bills: number }> {
  // Build the day spine first so empty days show as zero (no gaps in chart).
  const out: Array<{ date: string; totalSatang: number; bills: number }> = [];
  let cur = range.startDate;
  while (cur <= range.endDate) {
    out.push({ date: cur, totalSatang: 0, bills: 0 });
    cur = shiftDays(cur, 1);
  }
  const byDate = new Map(out.map((r) => [r.date, r]));
  for (const o of orders) {
    if ((o.status ?? "completed") === "voided") continue;
    const d = isoDateInTZ(o.createdAt);
    const slot = byDate.get(d);
    if (!slot) continue;
    slot.totalSatang += o.totalSatang;
    slot.bills += 1;
  }
  return out;
}
