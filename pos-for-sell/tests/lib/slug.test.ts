import { describe, it, expect } from "vitest";
import { generateSlug, generateSlugCandidates } from "@/lib/slug";

describe("slug/generateSlug", () => {
  it("lowercases and replaces spaces", () => {
    expect(generateSlug("Meow House")).toBe("meow-house");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(generateSlug("--Meow!! House  ")).toBe("meow-house");
  });

  it("strips diacritics", () => {
    expect(generateSlug("Café Niño")).toBe("cafe-nino");
  });

  it("clamps to maxLength", () => {
    expect(generateSlug("a".repeat(80), { maxLength: 10 })).toBe("a".repeat(10));
  });

  it("returns fallback when result would be empty", () => {
    expect(generateSlug("!!!", { fallback: "shop" })).toBe("shop");
  });
});

describe("slug/generateSlugCandidates", () => {
  it("returns base + numbered fallbacks", () => {
    expect(generateSlugCandidates("Meow House", 3)).toEqual([
      "meow-house",
      "meow-house-2",
      "meow-house-3",
    ]);
  });
});
