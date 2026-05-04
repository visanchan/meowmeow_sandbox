import { describe, it, expect } from "vitest";
import {
  TH_TZ,
  formatDateTH,
  formatDateTimeTH,
  isoDateInTZ,
  eventDayIndex,
} from "@/lib/date";

describe("date/TH_TZ", () => {
  it("is Asia/Bangkok", () => {
    expect(TH_TZ).toBe("Asia/Bangkok");
  });
});

describe("date/isoDateInTZ", () => {
  it("returns YYYY-MM-DD in TH timezone", () => {
    // 2026-05-04T15:30:00Z → 2026-05-04 22:30 in Bangkok → 2026-05-04
    expect(isoDateInTZ("2026-05-04T15:30:00Z")).toBe("2026-05-04");
    // Cross midnight: 2026-05-04T17:30:00Z → 2026-05-05 00:30 in Bangkok → 2026-05-05
    expect(isoDateInTZ("2026-05-04T17:30:00Z")).toBe("2026-05-05");
  });
});

describe("date/eventDayIndex", () => {
  it("day 1 == event start", () => {
    expect(eventDayIndex("2026-05-04T00:00:00Z", "2026-05-04T08:00:00Z")).toBe(1);
  });

  it("subsequent days increment", () => {
    expect(eventDayIndex("2026-05-04T00:00:00Z", "2026-05-05T08:00:00Z")).toBe(2);
    expect(eventDayIndex("2026-05-04T00:00:00Z", "2026-05-07T08:00:00Z")).toBe(4);
  });

  it("returns null for sales before event start", () => {
    expect(eventDayIndex("2026-05-04T00:00:00Z", "2026-05-03T08:00:00Z")).toBeNull();
  });
});

describe("date/formatDateTH", () => {
  it("renders something for a date", () => {
    expect(formatDateTH("2026-05-04T08:00:00Z")).toMatch(/2026/);
  });
});

describe("date/formatDateTimeTH", () => {
  it("renders date + time", () => {
    const out = formatDateTimeTH("2026-05-04T08:00:00Z");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/[0-9]{1,2}:[0-9]{2}/);
  });
});
