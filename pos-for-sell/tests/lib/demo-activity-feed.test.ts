import { describe, it, expect } from "vitest";
import {
  deriveActivityFeed,
  LOW_STOCK_THRESHOLD,
} from "@/lib/demo/activityFeed";
import type { DemoOrder } from "@/lib/demo/sales";
import type { Product } from "@/lib/pos/types";

function order(p: Partial<DemoOrder> = {}): DemoOrder {
  return {
    id: p.id ?? "demo-1",
    orderNumber: p.orderNumber ?? "event_001",
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: 0,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: p.totalSatang ?? 50000,
    note: null,
    createdAt: p.createdAt ?? new Date().toISOString(),
    items: p.items ?? [
      {
        productId: "p-1",
        sku: "SKU-1",
        productName: "Item",
        qty: 1,
        unitPriceSatang: 50000,
        lineTotalSatang: 50000,
        fulfillmentType: "take_now",
      },
    ],
    ...p,
  };
}

function product(p: Partial<Product> = {}): Product {
  return {
    id: p.id ?? "p-1",
    workspace_id: "ws",
    sku: p.sku ?? "SKU",
    name: p.name ?? "Thing",
    category: "x",
    price_satang: 10000,
    shipping_fee_satang: 0,
    send_later_enabled: false,
    is_active: p.is_active ?? true,
    image_path: null,
    current_qty: p.current_qty ?? 50,
    ...p,
  };
}

describe("activityFeed/deriveActivityFeed", () => {
  it("returns empty for no orders + no catalog", () => {
    expect(deriveActivityFeed([], [])).toEqual([]);
  });

  it("surfaces recent sales", () => {
    const out = deriveActivityFeed(
      [order({ id: "1", orderNumber: "event_001" })],
      [],
    );
    expect(out.find((e) => e.kind === "sale")?.title).toContain("event_001");
  });

  it("excludes voided sales from sale entries (but surfaces void event)", () => {
    const t = "2026-05-04T08:00:00Z";
    const out = deriveActivityFeed(
      [
        order({
          id: "1",
          orderNumber: "event_001",
          status: "voided",
          voidedAt: t,
          voidReason: "wrong",
        }),
      ],
      [],
    );
    expect(out.filter((e) => e.kind === "sale")).toHaveLength(0);
    expect(out.find((e) => e.kind === "void")?.body).toBe("wrong");
  });

  it("surfaces refund events from non-voided orders", () => {
    const t = "2026-05-04T08:00:00Z";
    const out = deriveActivityFeed(
      [
        order({
          id: "1",
          orderNumber: "event_001",
          refunds: [
            {
              id: "r-1",
              lineIndex: 0,
              qty: 1,
              amountSatang: 50000,
              reason: "return",
              refundedAt: t,
            },
          ],
        }),
      ],
      [],
    );
    expect(out.find((e) => e.kind === "refund")?.title).toContain("event_001");
  });

  it("flags sold-out + low-stock products from catalog", () => {
    const out = deriveActivityFeed(
      [],
      [
        product({ sku: "OUT", current_qty: 0 }),
        product({ sku: "LOW", current_qty: LOW_STOCK_THRESHOLD }),
        product({ sku: "OK", current_qty: LOW_STOCK_THRESHOLD + 1 }),
      ],
    );
    expect(out.filter((e) => e.kind === "sold_out").map((e) => e.title)).toEqual([
      "OUT sold out",
    ]);
    expect(out.filter((e) => e.kind === "low_stock").map((e) => e.title)).toEqual([
      "LOW low stock",
    ]);
  });

  it("ignores inactive products in stock alerts", () => {
    const out = deriveActivityFeed(
      [],
      [product({ sku: "OUT", current_qty: 0, is_active: false })],
    );
    expect(out).toEqual([]);
  });

  it("sorts entries by timestamp desc and caps at entryLimit", () => {
    const out = deriveActivityFeed(
      [
        order({ id: "1", orderNumber: "event_001", createdAt: "2026-05-04T08:00:00Z" }),
        order({ id: "2", orderNumber: "event_002", createdAt: "2026-05-04T09:00:00Z" }),
        order({ id: "3", orderNumber: "event_003", createdAt: "2026-05-04T10:00:00Z" }),
      ],
      [],
      { entryLimit: 2 },
    );
    expect(out).toHaveLength(2);
    expect(out[0].title).toContain("event_003");
    expect(out[1].title).toContain("event_002");
  });

  it("respects saleLimit independently of entryLimit", () => {
    const orders = Array.from({ length: 10 }, (_, i) =>
      order({
        id: `${i}`,
        orderNumber: `event_${String(i + 1).padStart(3, "0")}`,
        createdAt: `2026-05-04T${String(i).padStart(2, "0")}:00:00Z`,
      }),
    );
    const out = deriveActivityFeed(orders, [], { saleLimit: 3, entryLimit: 100 });
    expect(out.filter((e) => e.kind === "sale")).toHaveLength(3);
  });
});
