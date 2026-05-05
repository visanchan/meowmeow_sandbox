// Tiny chip showing period-over-period delta. Pattern from Shopify
// comparison reports / Power BI KPI cards.

export function DeltaChip({
  pct,
  label = "vs prev",
  invert = false,
}: {
  pct: number | null;
  label?: string;
  /** When invert is true, a negative delta is "good" (e.g. fewer voids,
   *  fewer refunds). Default false: positive = good (more revenue). */
  invert?: boolean;
}) {
  if (pct === null) {
    return (
      <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-bold text-muted">
        — {label}
      </span>
    );
  }
  const goodSide = invert ? pct < 0 : pct > 0;
  const isFlat = pct === 0;
  const tone = isFlat
    ? "bg-soft text-muted"
    : goodSide
      ? "bg-[var(--color-ok-soft-bg)] text-[var(--color-ok-soft-fg)]"
      : "bg-[var(--color-warn-soft-bg)] text-[var(--color-warn-soft-fg)]";
  const arrow = isFlat ? "·" : pct > 0 ? "▲" : "▼";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${tone}`}
    >
      <span>{arrow}</span>
      <span>{Math.abs(pct).toFixed(1)}%</span>
      <span className="font-bold opacity-70">{label}</span>
    </span>
  );
}
