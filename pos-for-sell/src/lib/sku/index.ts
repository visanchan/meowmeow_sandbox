// SKU validator + normalizer.
// Allowed: A-Z, 0-9, dash. Length 2..32. Must start AND end with letter or digit.
// Normalization: trim, uppercase, collapse repeated dashes.

const SKU_RE = /^[A-Z0-9](?:[A-Z0-9-]{0,30}[A-Z0-9])?$/;

export type SkuValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

export function validateSku(input: string): SkuValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: "Empty SKU" };

  const upper = trimmed.toUpperCase().replace(/-+/g, "-");
  if (upper.length < 2) return { ok: false, reason: "SKU is too short (min 2)" };
  if (upper.length > 32) return { ok: false, reason: "SKU is too long (max 32)" };
  if (!SKU_RE.test(upper)) {
    return {
      ok: false,
      reason:
        "Allowed: letters, digits, dashes. Must start and end with a letter or digit.",
    };
  }
  return { ok: true, normalized: upper };
}

export function isValidSku(s: string): boolean {
  return validateSku(s).ok;
}
