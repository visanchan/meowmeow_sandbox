// Stock count / cycle count session.
//
// Pattern source: Cin7 Core Stocktake (locked count + variance commit),
// inFlow stock count, Sortly count-by-scan. Direct fix for the May 2026
// post-Pet-Expo finding: "warehouse inventory drift". The seller opens a
// count session, walks through the warehouse / unsold returns, types
// counted qty per SKU. On commit, system adjusts current_qty and writes
// per-line audit entries with a reason (shrinkage / sample / damaged).

import type { Product } from "@/lib/pos/types";

export const DEMO_STOCK_COUNT_KEY = "pos-for-sell:demo-stock-count:v1";

export type StockCountReason =
  | "shrinkage"
  | "sample"
  | "damaged"
  | "miscount"
  | "found"
  | "other";

export const STOCK_COUNT_REASONS: StockCountReason[] = [
  "miscount",
  "shrinkage",
  "sample",
  "damaged",
  "found",
  "other",
];

export type StockCountLine = {
  productId: string;
  sku: string;
  name: string;
  /** Expected qty snapshotted when the count session was opened. Frozen so
   *  late-arriving sales during the count don't move the goalpost. */
  expectedQty: number;
  /** Counted qty, or null if not yet entered. */
  countedQty: number | null;
  reason?: StockCountReason;
  reasonNote?: string;
};

export type StockCountSession = {
  id: string;
  status: "open" | "committed" | "cancelled";
  openedAt: string;
  closedAt?: string;
  notes?: string;
  lines: StockCountLine[];
};

export function readDemoStockCounts(): StockCountSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_STOCK_COUNT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StockCountSession[]) : [];
  } catch {
    return [];
  }
}

export function writeDemoStockCounts(sessions: StockCountSession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DEMO_STOCK_COUNT_KEY,
      JSON.stringify(sessions),
    );
  } catch {
    // quota — silent
  }
}

export function clearDemoStockCounts(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_STOCK_COUNT_KEY);
}

export function newStockCountId(): string {
  return `count-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Build a fresh session from the current catalog. Active products only —
 *  inactive items aren't being sold so counting them is busywork. */
export function buildSessionFromCatalog(
  catalog: Product[],
): StockCountSession {
  const lines: StockCountLine[] = catalog
    .filter((p) => p.is_active)
    .sort((a, b) => a.sku.localeCompare(b.sku))
    .map((p) => ({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      expectedQty: p.current_qty,
      countedQty: null,
    }));
  return {
    id: newStockCountId(),
    status: "open",
    openedAt: new Date().toISOString(),
    lines,
  };
}

/** Variance for one line. Positive = found (more on shelf than expected),
 *  negative = lost (fewer on shelf than expected). null when not counted. */
export function lineVariance(line: StockCountLine): number | null {
  if (line.countedQty === null) return null;
  return line.countedQty - line.expectedQty;
}

/** Aggregate variance for a session — only counts lines that have been
 *  entered. Useful for a "running drift" header during the count. */
export function sessionVarianceSummary(session: StockCountSession): {
  countedLines: number;
  totalLines: number;
  unitsLost: number;
  unitsFound: number;
  netUnits: number;
} {
  let countedLines = 0;
  let unitsLost = 0;
  let unitsFound = 0;
  for (const l of session.lines) {
    const v = lineVariance(l);
    if (v === null) continue;
    countedLines++;
    if (v > 0) unitsFound += v;
    else if (v < 0) unitsLost += -v;
  }
  return {
    countedLines,
    totalLines: session.lines.length,
    unitsLost,
    unitsFound,
    netUnits: unitsFound - unitsLost,
  };
}

/** A line is committable when it has been counted AND any non-zero
 *  variance has a reason picked. Zero variance is always committable. */
export function lineCommittable(line: StockCountLine): boolean {
  if (line.countedQty === null) return false;
  const v = (line.countedQty ?? 0) - line.expectedQty;
  if (v === 0) return true;
  return Boolean(line.reason);
}

/** True when every counted line is committable. We allow committing a
 *  partial count: any line with countedQty === null is just skipped. */
export function sessionCommittable(session: StockCountSession): {
  ok: boolean;
  reason?: string;
} {
  if (session.status !== "open") {
    return { ok: false, reason: "Session is not open" };
  }
  const counted = session.lines.filter((l) => l.countedQty !== null);
  if (counted.length === 0) {
    return { ok: false, reason: "No lines counted yet" };
  }
  const missingReason = counted.find(
    (l) =>
      (l.countedQty ?? 0) - l.expectedQty !== 0 && !l.reason,
  );
  if (missingReason) {
    return {
      ok: false,
      reason: `Pick a reason for ${missingReason.sku} (variance ${
        (missingReason.countedQty ?? 0) - missingReason.expectedQty
      })`,
    };
  }
  return { ok: true };
}
