import { describe, it, expect } from "vitest";
import {
  countByStatus,
  filterByStatus,
  type DemoPreOrder,
} from "@/lib/demo/pre-orders";

function p(status: DemoPreOrder["status"], id = "x"): DemoPreOrder {
  return {
    id,
    productId: "p-1",
    sku: "SKU",
    productName: "Item",
    qty: 1,
    customerName: "Aim",
    customerPhone: "0812345678",
    customerEmail: null,
    note: null,
    status,
    createdAt: "2026-05-04T08:00:00Z",
    updatedAt: "2026-05-04T08:00:00Z",
  };
}

describe("pre-orders/filterByStatus", () => {
  const all = [
    p("pending", "1"),
    p("pending", "2"),
    p("notified", "3"),
    p("fulfilled", "4"),
    p("cancelled", "5"),
  ];

  it("returns everything when filter = all", () => {
    expect(filterByStatus(all, "all")).toHaveLength(5);
  });

  it("filters to specific status", () => {
    expect(filterByStatus(all, "pending").map((x) => x.id)).toEqual(["1", "2"]);
    expect(filterByStatus(all, "notified").map((x) => x.id)).toEqual(["3"]);
    expect(filterByStatus(all, "fulfilled").map((x) => x.id)).toEqual(["4"]);
    expect(filterByStatus(all, "cancelled").map((x) => x.id)).toEqual(["5"]);
  });
});

describe("pre-orders/countByStatus", () => {
  it("zeroes for empty input", () => {
    expect(countByStatus([])).toEqual({
      all: 0,
      pending: 0,
      notified: 0,
      fulfilled: 0,
      cancelled: 0,
    });
  });

  it("counts each status correctly", () => {
    const out = countByStatus([
      p("pending", "1"),
      p("pending", "2"),
      p("notified", "3"),
      p("fulfilled", "4"),
      p("fulfilled", "5"),
      p("cancelled", "6"),
    ]);
    expect(out).toEqual({
      all: 6,
      pending: 2,
      notified: 1,
      fulfilled: 2,
      cancelled: 1,
    });
  });
});
