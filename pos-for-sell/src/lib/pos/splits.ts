// Pure split-payment helpers. Used by the cart store and the SplitPaymentBlock UI.
// One source of truth for the validation rules so they can be unit-tested
// independent of React state.

import type { PaymentMethod } from "./types";

/** A single line in a multi-payment split. Method + amount in satang. */
export type PaymentSplit = {
  method: PaymentMethod;
  amountSatang: number;
};

export function splitsTotal(splits: PaymentSplit[]): number {
  return splits.reduce((s, p) => s + Math.max(0, p.amountSatang), 0);
}

export function splitsRemaining(
  splits: PaymentSplit[],
  totalSatang: number,
): number {
  return totalSatang - splitsTotal(splits);
}

export type SplitsValidation =
  | { ok: true }
  | { ok: false; reason: "empty" | "short" | "over"; offBy: number };

/**
 * Validates a splits array against a target total.
 * - empty: no splits at all
 * - short: sum < total (customer hasn't paid enough)
 * - over: sum > total (would owe change — but split flow doesn't model change;
 *   user should put excess into a single line and use cash-tender pad instead)
 */
export function validateSplits(
  splits: PaymentSplit[],
  totalSatang: number,
): SplitsValidation {
  if (splits.length === 0) return { ok: false, reason: "empty", offBy: totalSatang };
  const sum = splitsTotal(splits);
  if (sum < totalSatang) return { ok: false, reason: "short", offBy: totalSatang - sum };
  if (sum > totalSatang) return { ok: false, reason: "over", offBy: sum - totalSatang };
  return { ok: true };
}
