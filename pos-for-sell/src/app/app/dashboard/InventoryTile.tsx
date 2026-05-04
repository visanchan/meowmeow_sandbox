import { Pill } from "@/components/ui/Pill";

export function InventoryTile({
  rows,
}: {
  rows: Array<{ sku: string; name: string; current: number; starting: number }>;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-panel-strong px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Inventory remaining
      </p>
      <ul className="mt-3 grid gap-2">
        {rows.map((r) => {
          const pct =
            r.starting > 0 ? Math.round((r.current / r.starting) * 100) : 0;
          const tone =
            r.current === 0 ? "danger" : r.current <= 5 ? "warn" : "ok";
          return (
            <li
              key={r.sku}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-extrabold text-text">{r.name}</p>
                <p className="text-[11px] text-muted">{r.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="num text-sm font-extrabold text-accent-strong">
                  {r.current} / {r.starting}
                </span>
                <Pill tone={tone}>
                  {r.current === 0 ? "sold out" : `${pct}%`}
                </Pill>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
