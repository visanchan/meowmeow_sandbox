// Thai phone number normalizer.
// Accepts inputs like "0812345678", "081-234-5678", "+66812345678", "66812345678".
// Outputs:
//   - "local"        → "0812345678"  (10 digits, leading 0)
//   - "intl"         → "+66812345678"
//   - "promptpay-13" → "0000066812345678" padded to 13 chars
//
// Throws if it can't extract 8–10 core digits.

export type PhoneFormat = "local" | "intl" | "promptpay-13";

export function normalizePhoneTH(
  input: string,
  format: PhoneFormat = "local",
): string {
  const digits = input.replace(/\D/g, "");
  let core = digits;
  if (core.startsWith("66")) core = core.slice(2);
  else if (core.startsWith("0")) core = core.slice(1);
  if (core.length < 8 || core.length > 10) {
    throw new Error(`Invalid TH phone (${core.length} core digits): "${input}"`);
  }
  switch (format) {
    case "local":
      return "0" + core;
    case "intl":
      return "+66" + core;
    case "promptpay-13":
      return ("0000000000000" + ("66" + core)).slice(-13);
  }
}

export function isValidPhoneTH(input: string): boolean {
  try {
    normalizePhoneTH(input);
    return true;
  } catch {
    return false;
  }
}
