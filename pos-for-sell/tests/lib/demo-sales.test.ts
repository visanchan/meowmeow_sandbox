import { describe, it, expect } from "vitest";
import { nextOrderNumberFrom } from "@/lib/demo/sales";
import type { DemoOrder } from "@/lib/demo/sales";

function order(orderNumber: string): DemoOrder {
  return {
    id: orderNumber,
    orderNumber,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: 0,
    note: null,
    createdAt: new Date().toISOString(),
    items: [],
  };
}

describe("demo/sales/nextOrderNumberFrom", () => {
  it("returns event_001 from an empty list", () => {
    expect(nextOrderNumberFrom([])).toBe("event_001");
  });

  it("increments the highest existing sequence", () => {
    const orders = [
      order("event_001"),
      order("event_002"),
      order("event_005"),
    ];
    expect(nextOrderNumberFrom(orders)).toBe("event_006");
  });

  it("ignores malformed order numbers", () => {
    const orders = [order("event_007"), order("not-a-number"), order("event_garbage")];
    expect(nextOrderNumberFrom(orders)).toBe("event_008");
  });

  it("zero-pads to 3 digits", () => {
    expect(nextOrderNumberFrom([order("event_009")])).toBe("event_010");
    expect(nextOrderNumberFrom([order("event_999")])).toBe("event_1000");
  });
});
