import { describe, it, expect } from "vitest";
import { mergeDemoSettings, DEFAULT_DEMO_SETTINGS } from "@/lib/demo/settings";

describe("demo/settings/mergeDemoSettings", () => {
  it("returns defaults for null", () => {
    expect(mergeDemoSettings(null)).toEqual(DEFAULT_DEMO_SETTINGS);
  });

  it("returns defaults for undefined", () => {
    expect(mergeDemoSettings(undefined)).toEqual(DEFAULT_DEMO_SETTINGS);
  });

  it("returns defaults for non-object input", () => {
    expect(mergeDemoSettings("oops")).toEqual(DEFAULT_DEMO_SETTINGS);
    expect(mergeDemoSettings(42)).toEqual(DEFAULT_DEMO_SETTINGS);
  });

  it("merges partial input with defaults", () => {
    expect(mergeDemoSettings({ promptpayPhone: "0911111111" })).toEqual({
      ...DEFAULT_DEMO_SETTINGS,
      promptpayPhone: "0911111111",
    });
  });

  it("respects all provided fields and defaults the rest", () => {
    expect(
      mergeDemoSettings({
        brandDisplayName: "Cat Tokyo",
        promptpayPhone: "0922222222",
      }),
    ).toEqual({
      ...DEFAULT_DEMO_SETTINGS,
      brandDisplayName: "Cat Tokyo",
      promptpayPhone: "0922222222",
    });
  });

  it("ignores unknown keys (they pass through but typed as DemoSettings)", () => {
    const result = mergeDemoSettings({
      brandDisplayName: "Brand",
      mystery: 123,
    });
    expect(result.brandDisplayName).toBe("Brand");
  });
});
