// Pure loyalty-points logic. Demo defaults to "1 point per 100 THB spent;
// 1 point = 1 THB discount on redemption" — matches Loyverse / Square typical
// starter program. Rates are overrideable via demo settings (see settings.ts).

export const DEFAULT_POINTS_PER_100_BAHT = 1;
export const DEFAULT_BAHT_PER_POINT = 1;

/**
 * Points earned from a single sale.
 * Floors the result so partial points don't accumulate.
 */
export function pointsForSale(
  totalSatang: number,
  pointsPer100Baht: number = DEFAULT_POINTS_PER_100_BAHT,
): number {
  if (totalSatang <= 0 || pointsPer100Baht <= 0) return 0;
  // 1 point per 100 baht = pointsPer100Baht / 10000 satang.
  return Math.floor((totalSatang * pointsPer100Baht) / 10000);
}

/**
 * Convert points to a satang discount value at the redemption rate.
 */
export function pointsToSatang(
  points: number,
  bahtPerPoint: number = DEFAULT_BAHT_PER_POINT,
): number {
  if (points <= 0 || bahtPerPoint <= 0) return 0;
  return Math.max(0, Math.floor(points * bahtPerPoint * 100));
}

/**
 * Highest whole points the customer can spend without exceeding `targetSatang`.
 */
export function maxRedeemablePoints(
  available: number,
  targetSatang: number,
  bahtPerPoint: number = DEFAULT_BAHT_PER_POINT,
): number {
  if (available <= 0 || targetSatang <= 0 || bahtPerPoint <= 0) return 0;
  const cappedByTotal = Math.floor(targetSatang / (bahtPerPoint * 100));
  return Math.min(available, cappedByTotal);
}
