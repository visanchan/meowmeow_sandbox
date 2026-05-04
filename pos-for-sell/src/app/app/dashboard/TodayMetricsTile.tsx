import { formatTHB } from "@/lib/money/format";

export function TodayMetricsTile({
  totalSatang,
  bills,
  avgBillSatang,
}: {
  totalSatang: number;
  bills: number;
  avgBillSatang: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Tile label="Total today" value={`${formatTHB(totalSatang)} THB`} />
      <Tile label="Bills" value={String(bills)} />
      <Tile label="Avg bill" value={`${formatTHB(avgBillSatang)} THB`} />
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="num mt-1 text-3xl font-black text-accent-strong">{value}</p>
    </div>
  );
}
