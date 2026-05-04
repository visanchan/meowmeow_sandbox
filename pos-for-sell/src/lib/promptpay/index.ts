// EMVCo-compliant PromptPay QR payload generator (Thai PromptPay).
// Produces the full payload string; pair with any QR rendering library to
// produce an actual QR image.
//
// Reference: Bank of Thailand "Standard for QR Code for Payment" (EMVCo
// Merchant-Presented Mode QR Code Specification v1.0).

export type PromptPayProxy =
  | { kind: "phone"; value: string } // 10-digit local TH phone (or +66/66 prefixed)
  | { kind: "citizen-id"; value: string } // 13-digit national ID
  | { kind: "ewallet"; value: string }; // 15-char e-wallet ID

export type GenerateOpts = {
  proxy: PromptPayProxy;
  /** Amount in satang. Omit for a static (no-amount) QR. */
  amountSatang?: number;
};

const APP_ID_PROMPTPAY = "A000000677010111";

export function generatePromptPayPayload(opts: GenerateOpts): string {
  const isDynamic =
    opts.amountSatang !== undefined && opts.amountSatang > 0;

  const merchantInfo: string[] = [tlv("00", APP_ID_PROMPTPAY)];
  switch (opts.proxy.kind) {
    case "phone":
      merchantInfo.push(tlv("01", normalizePhoneForPromptPay(opts.proxy.value)));
      break;
    case "citizen-id": {
      const digits = opts.proxy.value.replace(/\D/g, "");
      if (digits.length !== 13) {
        throw new Error("citizen-id must be 13 digits");
      }
      merchantInfo.push(tlv("02", digits));
      break;
    }
    case "ewallet": {
      const v = opts.proxy.value.padStart(15, "0");
      if (v.length !== 15) throw new Error("ewallet must be 15 chars");
      merchantInfo.push(tlv("03", v));
      break;
    }
  }

  const fields: string[] = [
    tlv("00", "01"), // Payload Format Indicator
    tlv("01", isDynamic ? "12" : "11"), // Point of Initiation Method
    tlv("29", merchantInfo.join("")), // Merchant Account Information
    tlv("53", "764"), // Transaction Currency: 764 = THB
  ];
  if (isDynamic) {
    const baht = (opts.amountSatang! / 100).toFixed(2);
    fields.push(tlv("54", baht));
  }
  fields.push(tlv("58", "TH")); // Country Code

  // CRC is computed over everything including "6304" (the CRC field's ID+LEN).
  const withoutCrc = fields.join("") + "6304";
  const crc = crc16(withoutCrc);
  return withoutCrc + crc;
}

function tlv(id: string, value: string): string {
  if (id.length !== 2) throw new Error("TLV id must be 2 chars");
  if (value.length > 99) throw new Error("TLV value too long for 2-digit length");
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** Normalize a Thai phone number to the 13-char PromptPay format ("0000{country+number}"). */
export function normalizePhoneForPromptPay(input: string): string {
  const digits = input.replace(/\D/g, "");
  let core = digits;
  if (core.startsWith("66")) core = core.slice(2);
  else if (core.startsWith("0")) core = core.slice(1);
  if (core.length < 8 || core.length > 10) {
    throw new Error(`PromptPay phone proxy: unexpected length (${core.length}) for "${input}"`);
  }
  return ("0000000000000" + ("66" + core)).slice(-13);
}

/** CRC16-CCITT (FALSE) — polynomial 0x1021, initial 0xFFFF, no reflection. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
