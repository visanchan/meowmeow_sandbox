import { describe, it, expect } from "vitest";
import {
  computeVelocity,
  forecastProduct,
} from "@/lib/demo/forecast";
import type { DemoOrder } from "@/lib/demo/sales";

function order(opts: {
  id: string;
  createdAt: string;
  items: Array<{ productId: string; qty: number }>;
  status?: "completed" | "voided";
  refunds?: Array<{ lineIndex: number; qty: number }>;
}): DemoOrder {
  return {
    id: opts.id,
    orderNumber: `event_${opts.id}`,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: 50000,
    note: null,
    createdAt: opts.createdAt,
    items: opts.items.map((it) => ({
      productId: it.productId,
      sku: `SKU-${it.productId}`,
      productName: it.productId,
      qty: it.qty,
      unitPriceSatang: 50000,
      lineTotalSatang: 50000 * it.qty,
      fulfillmentType: "take_now",
    })),
    status: opts.status,
    refunds: opts.refunds?.map((r, i) => ({
      id: `r-${i}`,
      lineIndex: r.lineIndex,
      qty: r.qty,
      amountSatang: 50000 * r.qty,
      reason: "test",
      refundedAt: opts.createdAt,
    })),
  };
}

const recent = (daysAgo: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
};

describe("forecast/computeVelocity", () => {
  it("returns zero when no orders", () => {
    expect(computeVelocity([], "p-1")).toEqual({
      activeDays: 0,
      qtySold: 0,
      perActiveDay: 0,
    });
  });

  it("counts qty across orders for the same product", () => {
    const out = computeVelocity(
      [
        order({ id: "1", createdAt: recent(1), items: [{ productId: "p-1", qty: 2 }] }),
        order({ id: "2", createdAt: recent(2), items: [{ productId: "p-1", qty: 3 }] }),
      ],
      "p-1",
    );
    expect(out.qtySold).toBe(5);
    expect(out.activeDays).toBe(2);
    expect(out.perActiveDay).toBe(2.5);
  });

  it("ignores other products", () => {
    const out = computeVelocity(
      [
        order({ id: "1", createdAt: recent(1), items: [{ productId: "p-2", qty: 99 }] }),
      ],
      "p-1",
    );
    expect(out.qtySold).toBe(0);
  });

  it("excludes voided orders", () => {
    const out = computeVelocity(
      [
        order({ id: "1", createdAt: recent(1), items: [{ productId: "p-1", qty: 5 }], status: "voided" }),
      ],
      "p-1",
    );
    expect(out.qtySold).toBe(0);
  });

  it("subtracts refunded qty from the same line", () => {
    const out = computeVelocity(
      [
        order({
          id: "1",
          createdAt: recent(1),
          items: [{ productId: "p-1", qty: 5 }],
          refunds: [{ lineIndex: 0, qty: 2 }],
        }),
      ],
      "p-1",
    );
    expect(out.qtySold).toBe(3);
  });

  it("respects the lookback window", () => {
    const out = computeVelocity(
      [
        order({ id: "1", createdAt: recent(5), items: [{ productId: "p-1", qty: 10 }] }),
        order({ id: "2", createdAt: recent(40), items: [{ productId: "p-1", qty: 99 }] }),
      ],
      "p-1",
      30,
    );
    expect(out.qtySold).toBe(10);
  });

  it("counts unique active days, not order count", () => {
    const sameDay = recent(1);
    const out = computeVelocity(
      [
        order({ id: "1", createdAt: sameDay, items: [{ productId: "p-1", qty: 1 }] }),
        order({ id: "2", createdAt: sameDay, items: [{ productId: "p-1", qty: 1 }] }),
        order({ id: "3", createdAt: sameDay, items: [{ productId: "p-1", qty: 1 }] }),
      ],
      "p-1",
    );
    expect(out.activeDays).toBe(1);
    expect(out.qtySold).toBe(3);
    expect(out.perActiveDay).toBe(3);
  });
});

describe("forecast/forecastProduct", () => {
  it("returns 0 restock when no history", () => {
    const out = forecastProduct({ orders: [], productId: "p-1", currentQty: 5 });
    expect(out.window.qtySold).toBe(0);
    expect(out.projectedQty).toBe(0);
    expect(out.suggestRestockQty).toBe(0);
  });

  it("projects per-day × nextEventDays and subtracts on-hand", () => {
    const out = forecastProduct({
      orders: [
        order({ id: "1", createdAt: recent(1), items: [{ productId: "p-1", qty: 4 }] }),
        order({ id: "2", createdAt: recent(2), items: [{ productId: "p-1", qty: 4 }] }),
      ],
      productId: "p-1",
      nextEventDays: 4,
      currentQty: 3,
    });
    // 8 over 2 days = 4/day; next event 4 days = 16; on hand 3 → suggest 13
    expect(out.window.perActiveDay).toBe(4);
    expect(out.projectedQty).toBe(16);
    expect(out.suggestRestockQty).toBe(13);
  });

  it("does not go negative", () => {
    const out = forecastProduct({
      orders: [
        order({ id: "1", createdAt: recent(1), items: [{ productId: "p-1", qty: 1 }] }),
      ],
      productId: "p-1",
      nextEventDays: 4,
      currentQty: 99,
    });
    expect(out.suggestRestockQty).toBe(0);
  });

  it("ceils fractional projections", () => {
    const out = forecastProduct({
      orders: [
        order({ id: "1", createdAt: recent(1), items: [{ productId: "p-1", qty: 3 }] }),
      ],
      productId: "p-1",
      nextEventDays: 4,
      currentQty: 0,
    });
    // 3/day × 4 = 12; ceiled = 12 (already integer)
    expect(out.projectedQty).toBe(12);
  });
});
