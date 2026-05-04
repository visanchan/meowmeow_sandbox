import { describe, it, expect } from "vitest";
import { normalizePhoneTH, isValidPhoneTH } from "@/lib/phone";

describe("phone/normalizePhoneTH", () => {
  it("normalizes a leading-0 local number", () => {
    expect(normalizePhoneTH("0812345678", "local")).toBe("0812345678");
    expect(normalizePhoneTH("0812345678", "intl")).toBe("+66812345678");
    expect(normalizePhoneTH("0812345678", "promptpay-13")).toBe("0066812345678");
  });

  it("normalizes +66 input", () => {
    expect(normalizePhoneTH("+66812345678", "local")).toBe("0812345678");
  });

  it("normalizes 66-prefixed without +", () => {
    expect(normalizePhoneTH("66812345678", "local")).toBe("0812345678");
  });

  it("strips dashes/spaces", () => {
    expect(normalizePhoneTH("081-234 5678", "intl")).toBe("+66812345678");
  });

  it("rejects too short / too long", () => {
    expect(() => normalizePhoneTH("123", "local")).toThrow();
    expect(() => normalizePhoneTH("12345678901234", "local")).toThrow();
  });

  it("isValidPhoneTH boolean shorthand", () => {
    expect(isValidPhoneTH("081-234-5678")).toBe(true);
    expect(isValidPhoneTH("nope")).toBe(false);
  });
});
