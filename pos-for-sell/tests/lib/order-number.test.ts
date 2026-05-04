import { describe, it, expect } from "vitest";
import { formatOrderNumber, parseOrderNumber } from "@/lib/order-number";

describe("order-number/formatOrderNumber", () => {
  it("zero-pads to 3 digits by default", () => {
    expect(formatOrderNumber("event", 1)).toBe("event_001");
    expect(formatOrderNumber("event", 42)).toBe("event_042");
    expect(formatOrderNumber("event", 999)).toBe("event_999");
  });

  it("does not truncate when sequence exceeds pad width", () => {
    expect(formatOrderNumber("event", 1000)).toBe("event_1000");
  });

  it("respects custom pad width", () => {
    expect(formatOrderNumber("e", 1, 5)).toBe("e_00001");
  });

  it("rejects sequence < 1", () => {
    expect(() => formatOrderNumber("e", 0)).toThrow();
    expect(() => formatOrderNumber("e", -3)).toThrow();
  });
});

describe("order-number/parseOrderNumber", () => {
  it("round-trips", () => {
    const formatted = formatOrderNumber("event", 42);
    expect(parseOrderNumber(formatted)).toEqual({ eventCode: "event", sequence: 42 });
  });

  it("handles event codes with underscores", () => {
    expect(parseOrderNumber("pet_expo_2026_007")).toEqual({
      eventCode: "pet_expo_2026",
      sequence: 7,
    });
  });

  it("returns null for malformed input", () => {
    expect(parseOrderNumber("event")).toBeNull();
    expect(parseOrderNumber("event_xyz")).toBeNull();
  });
});
