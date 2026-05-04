import { describe, it, expect } from "vitest";
import {
  generatePromptPayPayload,
  normalizePhoneForPromptPay,
  crc16,
} from "@/lib/promptpay";

describe("promptpay/normalizePhoneForPromptPay", () => {
  it("normalizes a 10-digit local number with leading 0", () => {
    // 66 (country) + 9 digits after stripping leading 0 = 11 chars, padded to 13
    expect(normalizePhoneForPromptPay("0812345678")).toBe("0066812345678");
  });

  it("normalizes +66 international format", () => {
    expect(normalizePhoneForPromptPay("+66812345678")).toBe("0066812345678");
  });

  it("normalizes hyphen-separated", () => {
    expect(normalizePhoneForPromptPay("081-234-5678")).toBe("0066812345678");
  });

  it("rejects empty input", () => {
    expect(() => normalizePhoneForPromptPay("abc")).toThrow();
  });
});

describe("promptpay/crc16", () => {
  it("computes CCITT-FALSE checksum", () => {
    // Reference vector from EMVCo specification examples.
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("promptpay/generatePromptPayPayload", () => {
  it("produces a static-amount payload starting with 000201 0102 11", () => {
    const out = generatePromptPayPayload({
      proxy: { kind: "phone", value: "0812345678" },
    });
    expect(out.startsWith("000201")).toBe(true);
    expect(out.slice(6, 14)).toBe("01021129"); // 010211 (POI=11) then 29 (merchant info ID)
  });

  it("encodes the amount when amountSatang > 0", () => {
    const out = generatePromptPayPayload({
      proxy: { kind: "phone", value: "0812345678" },
      amountSatang: 12500, // 125.00 THB
    });
    // Amount field is "54" + length-of-value-as-2-digits + value: "5406125.00"
    expect(out).toContain("5406125.00");
    expect(out.slice(6, 12)).toBe("010212"); // POI = 12 (dynamic)
  });

  it("ends with 6304XXXX checksum", () => {
    const out = generatePromptPayPayload({
      proxy: { kind: "phone", value: "0812345678" },
      amountSatang: 5000,
    });
    expect(out.slice(-8, -4)).toBe("6304");
    const crc = out.slice(-4);
    const recomputed = crc16(out.slice(0, -4));
    expect(crc).toBe(recomputed);
  });

  it("rejects bad citizen-id length", () => {
    expect(() =>
      generatePromptPayPayload({ proxy: { kind: "citizen-id", value: "123" } }),
    ).toThrow();
  });
});
