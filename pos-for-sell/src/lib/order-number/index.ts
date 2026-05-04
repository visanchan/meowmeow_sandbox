// Order number generator. Per-event sequence rendered as `{event_code}_{NNN}`.
// The actual sequence allocation must happen inside a Postgres transaction
// (see database/functions/create_order.sql). This helper formats the rendered
// string and parses it back.

export function formatOrderNumber(
  eventCode: string,
  sequence: number,
  padTo: number = 3,
): string {
  if (sequence < 1) throw new Error("sequence must be >= 1");
  return `${eventCode}_${String(sequence).padStart(padTo, "0")}`;
}

export type ParsedOrderNumber = {
  eventCode: string;
  sequence: number;
};

export function parseOrderNumber(s: string): ParsedOrderNumber | null {
  const m = /^(.+)_(\d+)$/.exec(s);
  if (!m) return null;
  const seq = Number(m[2]);
  if (!Number.isInteger(seq)) return null;
  return { eventCode: m[1], sequence: seq };
}
