import { describe, it, expect } from "vitest";
import {
  buildSessionFromCatalog,
  lineCommittable,
  lineVariance,
  sessionCommittable,
  sessionVarianceSummary,
  type StockCountLine,
  type StockCountSession,
} from "@/lib/demo/stock-count";
import type { Product } from "@/lib/pos/types";

function p(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    workspace_id: "demo",
    sku: "X1",
    name: "Test",
    category: "x",
    price_satang: 10000,
    shipping_fee_satang: 0,
    send_later_enabled: false,
    is_active: true,
    image_path: null,
    current_qty: 10,
    ...overrides,
  };
}

function line(overrides: Partial<StockCountLine> = {}): StockCountLine {
  return {
    productId: "p1",
    sku: "X1",
    name: "Test",
    expectedQty: 10,
    countedQty: null,
    ...overrides,
  };
}

function session(lines: StockCountLine[]): StockCountSession {
  return {
    id: "s1",
    status: "open",
    openedAt: new Date().toISOString(),
    lines,
  };
}

describe("buildSessionFromCatalog", () => {
  it("snapshots expected qty per active product, sorted by SKU", () => {
    const catalog = [
      p({ id: "a", sku: "B-1", current_qty: 5 }),
      p({ id: "b", sku: "A-1", current_qty: 7 }),
      p({ id: "c", sku: "C-1", current_qty: 3, is_active: false }),
    ];
    const s = buildSessionFromCatalog(catalog);
    expect(s.status).toBe("open");
    expect(s.lines.map((l) => l.sku)).toEqual(["A-1", "B-1"]); // C-1 inactive
    expect(s.lines[0].expectedQty).toBe(7);
    expect(s.lines[1].expectedQty).toBe(5);
    expect(s.lines.every((l) => l.countedQty === null)).toBe(true);
  });
});

describe("lineVariance", () => {
  it("returns null when not counted", () => {
    expect(lineVariance(line())).toBeNull();
  });

  it("positive when found extra", () => {
    expect(lineVariance(line({ expectedQty: 10, countedQty: 12 }))).toBe(2);
  });

  it("negative when missing", () => {
    expect(lineVariance(line({ expectedQty: 10, countedQty: 7 }))).toBe(-3);
  });

  it("zero when matching", () => {
    expect(lineVariance(line({ expectedQty: 10, countedQty: 10 }))).toBe(0);
  });
});

describe("sessionVarianceSummary", () => {
  it("aggregates only counted lines", () => {
    const s = session([
      line({ productId: "a", expectedQty: 10, countedQty: 8 }), // -2 lost
      line({ productId: "b", expectedQty: 5, countedQty: 6 }), //  +1 found
      line({ productId: "c", expectedQty: 3, countedQty: null }), // skip
    ]);
    const sum = sessionVarianceSummary(s);
    expect(sum.countedLines).toBe(2);
    expect(sum.totalLines).toBe(3);
    expect(sum.unitsLost).toBe(2);
    expect(sum.unitsFound).toBe(1);
    expect(sum.netUnits).toBe(-1);
  });
});

describe("lineCommittable", () => {
  it("uncounted line not committable", () => {
    expect(lineCommittable(line())).toBe(false);
  });

  it("zero variance always committable", () => {
    expect(
      lineCommittable(line({ expectedQty: 10, countedQty: 10 })),
    ).toBe(true);
  });

  it("non-zero variance needs a reason", () => {
    expect(
      lineCommittable(line({ expectedQty: 10, countedQty: 8 })),
    ).toBe(false);
    expect(
      lineCommittable(
        line({ expectedQty: 10, countedQty: 8, reason: "shrinkage" }),
      ),
    ).toBe(true);
  });
});

describe("sessionCommittable", () => {
  it("rejects sessions not in open status", () => {
    const s: StockCountSession = {
      id: "s",
      status: "committed",
      openedAt: new Date().toISOString(),
      lines: [line({ countedQty: 10 })],
    };
    expect(sessionCommittable(s).ok).toBe(false);
  });

  it("rejects sessions with no counts", () => {
    const s = session([line(), line()]);
    expect(sessionCommittable(s).ok).toBe(false);
  });

  it("rejects sessions where a variance has no reason", () => {
    const s = session([line({ expectedQty: 10, countedQty: 8 })]);
    const result = sessionCommittable(s);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("X1");
  });

  it("accepts sessions where every counted variance has a reason", () => {
    const s = session([
      line({ expectedQty: 10, countedQty: 8, reason: "shrinkage" }),
      line({
        productId: "p2",
        sku: "X2",
        expectedQty: 5,
        countedQty: 5,
      }),
      line({ productId: "p3", sku: "X3", countedQty: null }),
    ]);
    expect(sessionCommittable(s).ok).toBe(true);
  });
});
