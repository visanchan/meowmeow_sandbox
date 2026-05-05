import { describe, it, expect } from "vitest";
import { computeExpectedCashFor } from "@/lib/demo/close-day";
import type { DemoOrder } from "@/lib/demo/sales";
import { isoDateInTZ } from "@/lib/date";

function order(p: Partial<DemoOrder> = {}): DemoOrder {
  return {
    id: p.id ?? "demo-1",
    orderNumber: p.orderNumber ?? "event_001",
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: p.paymentMethod ?? "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: p.totalSatang ?? 0,
    note: null,
    createdAt: p.createdAt ?? new Date().toISOString(),
    items: [],
    ...p,
  };
}

const today = isoDateInTZ(new Date());
const yesterday = (() => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 2); // safely "before today" in TH timezone
  return isoDateInTZ(d);
})();

describe("close-day/computeExpectedCashFor", () => {
  it("returns 0 for empty orders", () => {
    expect(computeExpectedCashFor([], today)).toBe(0);
  });

  it("sums cash-only orders for the given day", () => {
    expect(
      computeExpectedCashFor(
        [
          order({ paymentMethod: "cash", totalSatang: 50000 }),
          order({ paymentMethod: "cash", totalSatang: 30000 }),
        ],
        today,
      ),
    ).toBe(80000);
  });

  it("excludes orders from other days", () => {
    expect(
      computeExpectedCashFor(
        [
          order({ paymentMethod: "cash", totalSatang: 50000 }),
          order({
            paymentMethod: "cash",
            totalSatang: 99999,
            createdAt: new Date(yesterday + "T08:00:00Z").toISOString(),
          }),
        ],
        today,
      ),
    ).toBe(50000);
  });

  it("excludes voided orders", () => {
    expect(
      computeExpectedCashFor(
        [
          order({ paymentMethod: "cash", totalSatang: 50000 }),
          order({ paymentMethod: "cash", totalSatang: 30000, status: "voided" }),
        ],
        today,
      ),
    ).toBe(50000);
  });

  it("excludes non-cash methods", () => {
    expect(
      computeExpectedCashFor(
        [
          order({ paymentMethod: "cash", totalSatang: 50000 }),
          order({ paymentMethod: "promptpay", totalSatang: 100000 }),
          order({ paymentMethod: "transfer", totalSatang: 30000 }),
        ],
        today,
      ),
    ).toBe(50000);
  });

  it("for mixed orders, only counts cash splits", () => {
    expect(
      computeExpectedCashFor(
        [
          order({
            paymentMethod: "mixed",
            totalSatang: 100000,
            payments: [
              { method: "cash", amountSatang: 60000 },
              { method: "promptpay", amountSatang: 40000 },
            ],
          }),
        ],
        today,
      ),
    ).toBe(60000);
  });

  it("for mixed orders without payments array, contributes 0", () => {
    expect(
      computeExpectedCashFor(
        [order({ paymentMethod: "mixed", totalSatang: 100000 })],
        today,
      ),
    ).toBe(0);
  });
});
