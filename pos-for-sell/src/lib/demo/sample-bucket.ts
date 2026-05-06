// Wave 39b — Sample bucket demo store.
//
// Ports the meowmeow Batch DD field-tested model into MochiPOS demo mode.
// Each (event_id, product_id) pair holds an event-long sample count: units
// physically on display at the booth that reduce sellable booth stock but
// never return to warehouse on their own.
//
// In real Supabase mode (Wave 40a + production wiring), this swaps to the
// `event_inventory.sample_qty` column + `convert_event_to_sample` /
// `convert_sample_to_event` RPCs without UI changes.

export const DEMO_SAMPLE_BUCKET_KEY = "pos-for-sell:demo-sample-bucket:v1";

export type SampleMovement = {
  /** ISO timestamp. */
  at: string;
  /** Positive when moving from event stock into sample (display).
   *  Negative when returning from sample back to event stock (sellable). */
  delta: number;
  reason: string;
};

export type SampleBucketRow = {
  /** Concrete event id; pos-for-sell scopes inventory per event. */
  eventId: string;
  productId: string;
  qty: number;
  /** Append-only history of conversions; newest first. */
  movements: SampleMovement[];
};

export function readSampleBuckets(): SampleBucketRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DEMO_SAMPLE_BUCKET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SampleBucketRow[]) : [];
  } catch {
    return [];
  }
}

export function writeSampleBuckets(rows: SampleBucketRow[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_SAMPLE_BUCKET_KEY, JSON.stringify(rows));
  } catch {
    // quota — silent
  }
}

export function clearSampleBuckets(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_SAMPLE_BUCKET_KEY);
}

export function findRow(
  rows: SampleBucketRow[],
  eventId: string,
  productId: string,
): SampleBucketRow | null {
  return (
    rows.find((r) => r.eventId === eventId && r.productId === productId) ?? null
  );
}

export function rowQty(
  rows: SampleBucketRow[],
  eventId: string,
  productId: string,
): number {
  return findRow(rows, eventId, productId)?.qty ?? 0;
}

export type ConvertResult =
  | { ok: true; rows: SampleBucketRow[]; row: SampleBucketRow }
  | { ok: false; reason: "not-enough-event-stock" | "not-enough-sample" | "qty-must-be-positive" };

/**
 * Move N units from current event stock into the sample bucket.
 *
 * The caller is responsible for separately decrementing the event's
 * sellable stock (or for using a transactional RPC in production). This
 * function only manages the bucket count + movement journal.
 *
 * `availableEventQty` is what's currently sellable on the booth — passed
 * in by the UI which knows the event_inventory.current_qty value. We
 * refuse to over-allocate.
 */
export function convertEventToSample(
  rows: SampleBucketRow[],
  eventId: string,
  productId: string,
  qty: number,
  availableEventQty: number,
  reason = "Moved from event stock to sample",
  now = new Date(),
): ConvertResult {
  if (qty <= 0) return { ok: false, reason: "qty-must-be-positive" };
  if (availableEventQty < qty) return { ok: false, reason: "not-enough-event-stock" };
  const existing = findRow(rows, eventId, productId);
  const movement: SampleMovement = {
    at: now.toISOString(),
    delta: qty,
    reason,
  };
  if (existing) {
    const next: SampleBucketRow = {
      ...existing,
      qty: existing.qty + qty,
      movements: [movement, ...existing.movements],
    };
    return {
      ok: true,
      rows: rows.map((r) => (r === existing ? next : r)),
      row: next,
    };
  }
  const next: SampleBucketRow = {
    eventId,
    productId,
    qty,
    movements: [movement],
  };
  return { ok: true, rows: [...rows, next], row: next };
}

/** Move N units from the sample bucket back to event sellable stock. */
export function convertSampleToEvent(
  rows: SampleBucketRow[],
  eventId: string,
  productId: string,
  qty: number,
  reason = "Returned from sample to event stock",
  now = new Date(),
): ConvertResult {
  if (qty <= 0) return { ok: false, reason: "qty-must-be-positive" };
  const existing = findRow(rows, eventId, productId);
  const current = existing?.qty ?? 0;
  if (current < qty) return { ok: false, reason: "not-enough-sample" };
  const movement: SampleMovement = {
    at: now.toISOString(),
    delta: -qty,
    reason,
  };
  const next: SampleBucketRow = {
    eventId,
    productId,
    qty: current - qty,
    movements: [movement, ...(existing?.movements ?? [])],
  };
  return {
    ok: true,
    rows: rows.map((r) =>
      r.eventId === eventId && r.productId === productId ? next : r,
    ),
    row: next,
  };
}
