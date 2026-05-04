export function formatTHB(satang: number): string {
  const baht = satang / 100;
  const isInt = baht % 1 === 0;
  return baht.toLocaleString("en-US", {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function formatTHBWithUnit(satang: number): string {
  return `${formatTHB(satang)} THB`;
}

export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}
