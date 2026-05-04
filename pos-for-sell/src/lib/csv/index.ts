// RFC 4180 CSV builder. Quotes cells that contain ", , or newlines; doubles internal quotes.

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build CSV from an array of objects. Headers are taken from the first row's keys
 * unless `headers` is supplied (which also enforces column order).
 */
export function toCsv(
  rows: Array<Record<string, unknown>>,
  headers?: string[],
): string {
  if (rows.length === 0 && !headers) return "";
  const cols = headers ?? Object.keys(rows[0] ?? {});
  const lines = [cols.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCsvCell(row[c])).join(","));
  }
  return lines.join("\r\n");
}

/** Build CSV from explicit headers + 2D rows. */
export function toCsvGrid(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const r of rows) {
    lines.push(r.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n");
}
