// Thailand timezone date helpers.

export const TH_TZ = "Asia/Bangkok";

export function formatDateTH(
  d: Date | string | number,
  locale: "th-TH" | "en-US" = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TH_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(toDate(d));
}

export function formatDateTimeTH(
  d: Date | string | number,
  locale: "th-TH" | "en-US" = "en-US",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: TH_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(d));
}

export function isoDateInTZ(d: Date | string | number, tz: string = TH_TZ): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(toDate(d));
}

/**
 * Index of an event day, where day 1 == event start. Days are computed in TH timezone.
 * Returns null if `sale` precedes `eventStart`.
 */
export function eventDayIndex(
  eventStart: Date | string,
  sale: Date | string,
): number | null {
  const startDay = isoDateInTZ(eventStart);
  const saleDay = isoDateInTZ(sale);
  const diffMs = Date.parse(saleDay) - Date.parse(startDay);
  if (diffMs < 0) return null;
  return Math.floor(diffMs / 86400000) + 1;
}

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d);
}
