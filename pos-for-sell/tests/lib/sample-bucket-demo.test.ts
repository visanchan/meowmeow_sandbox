import { describe, it, expect } from "vitest";
import {
  convertEventToSample,
  convertSampleToEvent,
  findRow,
  rowQty,
  type SampleBucketRow,
} from "@/lib/demo/sample-bucket";

const EVENT = "evt_1";
const SKU_A = "prod_a";
const SKU_B = "prod_b";

describe("Wave 39b — convertEventToSample", () => {
  it("creates a new row when none exists", () => {
    const result = convertEventToSample([], EVENT, SKU_A, 3, 10, "smoke");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(1);
    expect(result.row.qty).toBe(3);
    expect(result.row.movements).toHaveLength(1);
    expect(result.row.movements[0].delta).toBe(3);
  });

  it("increments qty + prepends movement when row exists", () => {
    const initial: SampleBucketRow[] = [
      {
        eventId: EVENT,
        productId: SKU_A,
        qty: 2,
        movements: [{ at: "2026-04-01T00:00:00Z", delta: 2, reason: "first" }],
      },
    ];
    const result = convertEventToSample(initial, EVENT, SKU_A, 5, 100, "second");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.qty).toBe(7);
    expect(result.row.movements).toHaveLength(2);
    expect(result.row.movements[0].delta).toBe(5);
    expect(result.row.movements[0].reason).toBe("second");
  });

  it("rejects non-positive qty", () => {
    expect(convertEventToSample([], EVENT, SKU_A, 0, 10).ok).toBe(false);
    expect(convertEventToSample([], EVENT, SKU_A, -1, 10).ok).toBe(false);
  });

  it("rejects when availableEventQty < requested", () => {
    const result = convertEventToSample([], EVENT, SKU_A, 5, 3);
    expect(result).toEqual({ ok: false, reason: "not-enough-event-stock" });
  });

  it("scopes by (eventId, productId) — different products are independent", () => {
    const r1 = convertEventToSample([], EVENT, SKU_A, 2, 10);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const r2 = convertEventToSample(r1.rows, EVENT, SKU_B, 1, 10);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.rows).toHaveLength(2);
    expect(rowQty(r2.rows, EVENT, SKU_A)).toBe(2);
    expect(rowQty(r2.rows, EVENT, SKU_B)).toBe(1);
  });
});

describe("Wave 39b — convertSampleToEvent", () => {
  it("decrements qty + prepends movement", () => {
    const initial: SampleBucketRow[] = [
      {
        eventId: EVENT,
        productId: SKU_A,
        qty: 5,
        movements: [{ at: "2026-04-01T00:00:00Z", delta: 5, reason: "x" }],
      },
    ];
    const result = convertSampleToEvent(initial, EVENT, SKU_A, 2, "sell-as-product");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.qty).toBe(3);
    expect(result.row.movements).toHaveLength(2);
    expect(result.row.movements[0].delta).toBe(-2);
    expect(result.row.movements[0].reason).toBe("sell-as-product");
  });

  it("rejects when sample qty is below requested", () => {
    expect(
      convertSampleToEvent(
        [{ eventId: EVENT, productId: SKU_A, qty: 1, movements: [] }],
        EVENT,
        SKU_A,
        2,
      ),
    ).toEqual({ ok: false, reason: "not-enough-sample" });
  });

  it("rejects when no row exists for that (eventId, productId)", () => {
    expect(convertSampleToEvent([], EVENT, SKU_A, 1)).toEqual({
      ok: false,
      reason: "not-enough-sample",
    });
  });

  it("rejects non-positive qty", () => {
    const initial: SampleBucketRow[] = [
      { eventId: EVENT, productId: SKU_A, qty: 5, movements: [] },
    ];
    expect(convertSampleToEvent(initial, EVENT, SKU_A, 0).ok).toBe(false);
    expect(convertSampleToEvent(initial, EVENT, SKU_A, -1).ok).toBe(false);
  });

  it("round-trips Make + Return cleanly (qty back to zero, two movements)", () => {
    const made = convertEventToSample([], EVENT, SKU_A, 3, 10);
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    const returned = convertSampleToEvent(made.rows, EVENT, SKU_A, 3);
    expect(returned.ok).toBe(true);
    if (!returned.ok) return;
    expect(returned.row.qty).toBe(0);
    expect(returned.row.movements).toHaveLength(2);
    expect(returned.row.movements[0].delta).toBe(-3);
    expect(returned.row.movements[1].delta).toBe(3);
  });
});

describe("Wave 39b — findRow / rowQty", () => {
  const rows: SampleBucketRow[] = [
    { eventId: EVENT, productId: SKU_A, qty: 4, movements: [] },
    { eventId: EVENT, productId: SKU_B, qty: 0, movements: [] },
  ];

  it("findRow matches on (eventId, productId)", () => {
    expect(findRow(rows, EVENT, SKU_A)?.qty).toBe(4);
    expect(findRow(rows, EVENT, SKU_B)?.qty).toBe(0);
    expect(findRow(rows, "wrong", SKU_A)).toBeNull();
  });

  it("rowQty returns 0 for missing rows", () => {
    expect(rowQty(rows, EVENT, "missing")).toBe(0);
    expect(rowQty(rows, "missing-event", SKU_A)).toBe(0);
  });
});
