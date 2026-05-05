import { describe, it, expect } from "vitest";
import {
  dailyRevenueSeries,
  daysInRange,
  deltaPct,
  ordersInRange,
  previousRange,
  rangePreset,
} from "@/lib/demo/dashboard-range";
import type { DemoOrder } from "@/lib/demo/sales";

const FIXED = new Date("2026-05-04T05:00:00Z"); // 2026-05-04 12:00 BKK

function order(date: string, total: number, status: "completed" | "voided" = "completed"): DemoOrder {
  return {
    id: `o-${date}-${total}`,
    orderNumber: `e_${total}`,
    customerName: null,
    customerPhone: null,
    customerEmail: null,
    orderType: "take_now",
    paymentMethod: "cash",
    subtotalSatang: total,
    discountSatang: 0,
    shippingFeeSatang: 0,
    totalSatang: total,
    note: null,
    createdAt: `${date}T05:00:00Z`,
    items: [],
    status,
  };
}

describe("rangePreset", () => {
  it("today is one-day inclusive", () => {
    const r = rangePreset("today", FIXED);
    expect(r.startDate).toBe("2026-05-04");
    expect(r.endDate).toBe("2026-05-04");
    expect(daysInRange(r)).toBe(1);
  });

  it("last7 covers 7 days ending today", () => {
    const r = rangePreset("last7", FIXED);
    expect(r.startDate).toBe("2026-04-28");
    expect(r.endDate).toBe("2026-05-04");
    expect(daysInRange(r)).toBe(7);
  });

  it("last30 covers 30 days", () => {
    const r = rangePreset("last30", FIXED);
    expect(daysInRange(r)).toBe(30);
  });

  it("this_month starts on the 1st", () => {
    const r = rangePreset("this_month", FIXED);
    expect(r.startDate).toBe("2026-05-01");
    expect(r.endDate).toBe("2026-05-04");
  });
});

describe("previousRange", () => {
  it("previous of last7 ends day before, same span", () => {
    const r = rangePreset("last7", FIXED);
    const p = previousRange(r);
    expect(p.endDate).toBe("2026-04-27");
    expect(p.startDate).toBe("2026-04-21");
    expect(daysInRange(p)).toBe(7);
  });

  it("previous of today is yesterday", () => {
    const r = rangePreset("today", FIXED);
    const p = previousRange(r);
    expect(p.startDate).toBe("2026-05-03");
    expect(p.endDate).toBe("2026-05-03");
  });
});

describe("ordersInRange", () => {
  it("inclusive on both ends", () => {
    const orders = [
      order("2026-05-01", 100),
      order("2026-05-02", 200),
      order("2026-05-03", 300),
      order("2026-05-04", 400),
    ];
    const range = {
      startDate: "2026-05-02",
      endDate: "2026-05-03",
      preset: "custom" as const,
      label: "x",
    };
    expect(ordersInRange(orders, range)).toHaveLength(2);
  });
});

describe("deltaPct", () => {
  it("computes delta + pct", () => {
    expect(deltaPct(150, 100)).toEqual({ delta: 50, pct: 50 });
    expect(deltaPct(80, 100)).toEqual({ delta: -20, pct: -20 });
  });

  it("returns null pct when previous is 0 and current is non-zero", () => {
    expect(deltaPct(100, 0).pct).toBeNull();
  });

  it("returns 0 pct when both are zero", () => {
    expect(deltaPct(0, 0)).toEqual({ delta: 0, pct: 0 });
  });
});

describe("dailyRevenueSeries", () => {
  it("fills empty days with zero", () => {
    const orders = [
      order("2026-05-01", 1000),
      order("2026-05-03", 3000),
    ];
    const range = {
      startDate: "2026-05-01",
      endDate: "2026-05-03",
      preset: "custom" as const,
      label: "x",
    };
    const series = dailyRevenueSeries(orders, range);
    expect(series).toHaveLength(3);
    expect(series[0].totalSatang).toBe(1000);
    expect(series[1].totalSatang).toBe(0);
    expect(series[2].totalSatang).toBe(3000);
  });

  it("ignores voided orders", () => {
    const orders = [
      order("2026-05-01", 1000),
      order("2026-05-01", 5000, "voided"),
    ];
    const range = {
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      preset: "custom" as const,
      label: "x",
    };
    const series = dailyRevenueSeries(orders, range);
    expect(series[0].totalSatang).toBe(1000);
    expect(series[0].bills).toBe(1);
  });
});
