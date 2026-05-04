import { describe, it, expect } from "vitest";
import { validateSku, isValidSku } from "@/lib/sku";

describe("sku/validateSku", () => {
  it("accepts alphanumerics", () => {
    expect(validateSku("ABC123")).toEqual({ ok: true, normalized: "ABC123" });
  });

  it("accepts hyphens in the middle", () => {
    expect(validateSku("DEMO-001")).toEqual({ ok: true, normalized: "DEMO-001" });
  });

  it("uppercases input", () => {
    expect(validateSku("demo-002")).toEqual({ ok: true, normalized: "DEMO-002" });
  });

  it("collapses repeated dashes", () => {
    expect(validateSku("DEMO---X")).toEqual({ ok: true, normalized: "DEMO-X" });
  });

  it("rejects empty", () => {
    expect(validateSku("").ok).toBe(false);
    expect(validateSku("   ").ok).toBe(false);
  });

  it("rejects too short", () => {
    expect(validateSku("a").ok).toBe(false);
  });

  it("rejects too long", () => {
    expect(validateSku("a".repeat(33)).ok).toBe(false);
  });

  it("rejects leading/trailing dash", () => {
    expect(validateSku("-DEMO").ok).toBe(false);
    expect(validateSku("DEMO-").ok).toBe(false);
  });

  it("rejects spaces and symbols", () => {
    expect(validateSku("DE MO").ok).toBe(false);
    expect(validateSku("DE_MO").ok).toBe(false);
    expect(validateSku("DE/MO").ok).toBe(false);
  });

  it("isValidSku is shorthand", () => {
    expect(isValidSku("ABC123")).toBe(true);
    expect(isValidSku("nope!")).toBe(false);
  });
});
