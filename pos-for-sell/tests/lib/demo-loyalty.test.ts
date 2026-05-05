import { describe, it, expect } from "vitest";
import {
  pointsForSale,
  pointsToSatang,
  maxRedeemablePoints,
} from "@/lib/demo/loyalty";

describe("loyalty/pointsForSale", () => {
  it("returns 0 for zero or negative totals", () => {
    expect(pointsForSale(0)).toBe(0);
    expect(pointsForSale(-1000)).toBe(0);
  });

  it("default rate: 1 point per 100 THB spent", () => {
    expect(pointsForSale(10000)).toBe(1); // 100 THB
    expect(pointsForSale(50000)).toBe(5); // 500 THB
    expect(pointsForSale(100000)).toBe(10); // 1,000 THB
  });

  it("floors partial points", () => {
    // 150 THB = 15,000 satang → 1.5 points → 1
    expect(pointsForSale(15000)).toBe(1);
    // 199 THB = 19,900 satang → 1.99 points → 1
    expect(pointsForSale(19900)).toBe(1);
    // 99 THB = 9,900 satang → 0.99 points → 0
    expect(pointsForSale(9900)).toBe(0);
  });

  it("respects custom rate", () => {
    // 2 points per 100 THB
    expect(pointsForSale(50000, 2)).toBe(10);
    // 0.5 points per 100 THB
    expect(pointsForSale(100000, 0.5)).toBe(5);
  });

  it("returns 0 for zero rate", () => {
    expect(pointsForSale(50000, 0)).toBe(0);
  });
});

describe("loyalty/pointsToSatang", () => {
  it("default rate: 1 point = 1 THB = 100 satang", () => {
    expect(pointsToSatang(0)).toBe(0);
    expect(pointsToSatang(1)).toBe(100);
    expect(pointsToSatang(50)).toBe(5000);
    expect(pointsToSatang(100)).toBe(10000);
  });

  it("respects custom rate", () => {
    expect(pointsToSatang(10, 5)).toBe(5000); // 5 THB per point
  });

  it("returns 0 for non-positive inputs", () => {
    expect(pointsToSatang(-5)).toBe(0);
    expect(pointsToSatang(10, 0)).toBe(0);
  });
});

describe("loyalty/maxRedeemablePoints", () => {
  it("returns 0 when nothing available", () => {
    expect(maxRedeemablePoints(0, 50000)).toBe(0);
  });

  it("returns 0 when target is 0", () => {
    expect(maxRedeemablePoints(50, 0)).toBe(0);
  });

  it("caps at available points", () => {
    // 50 points available, 5,000 THB target → could redeem 5000 if available
    expect(maxRedeemablePoints(50, 500000)).toBe(50);
  });

  it("caps at total cost (do not over-redeem)", () => {
    // 100 points but only 30 THB total → max 30 points (1 THB = 1 point)
    expect(maxRedeemablePoints(100, 3000)).toBe(30);
  });

  it("respects custom redemption rate", () => {
    // 1 point = 5 THB; total 30 THB → 6 points max
    expect(maxRedeemablePoints(100, 3000, 5)).toBe(6);
  });
});
