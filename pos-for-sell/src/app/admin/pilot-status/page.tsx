import { Pill, type PillTone } from "@/components/ui/Pill";
import { formatDateTimeTH } from "@/lib/date";
import { formatTHB } from "@/lib/money/format";

type WorkspaceHealth = {
  brand: string;
  slug: string;
  setupComplete: boolean;
  lastSaleAt: string | null;
  lastSaleSatang: number;
  todayBills: number;
  lowStockCount: number;
  pendingSendLater: number;
};

const MOCK: WorkspaceHealth[] = [
  {
    brand: "Meow House",
    slug: "meow-house",
    setupComplete: true,
    lastSaleAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastSaleSatang: 89000,
    todayBills: 17,
    lowStockCount: 2,
    pendingSendLater: 3,
  },
  {
    brand: "Cat Tokyo",
    slug: "cat-tokyo",
    setupComplete: false,
    lastSaleAt: null,
    lastSaleSatang: 0,
    todayBills: 0,
    lowStockCount: 0,
    pendingSendLater: 0,
  },
];

function tone(h: WorkspaceHealth): PillTone {
  if (!h.setupComplete) return "warn";
  if (h.lastSaleAt && Date.now() - new Date(h.lastSaleAt).getTime() > 86400000)
    return "warn";
  return "ok";
}

export default function PilotStatusPage() {
  const rows = MOCK; // DD-100 will compute live.
  return (
    <div>
      <h1 className="font-display text-3xl text-accent-strong">Pilot status</h1>
      <p className="mt-1 text-sm text-muted">
        Per-workspace health overview. Demo data; live computation arrives at DD-100.
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {rows.map((h) => (
          <div
            key={h.slug}
            className="rounded-[var(--radius-lg)] border border-line bg-panel px-5 py-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="font-display text-lg text-accent-strong">
                  {h.brand}
                </p>
                <p className="text-xs text-muted">/{h.slug}</p>
              </div>
              <Pill tone={tone(h)}>
                {!h.setupComplete
                  ? "setup pending"
                  : h.lastSaleAt
                    ? "active"
                    : "no sales yet"}
              </Pill>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Stat label="Bills today" value={String(h.todayBills)} />
              <Stat
                label="Last sale"
                value={
                  h.lastSaleAt
                    ? `${formatTHB(h.lastSaleSatang)} · ${formatDateTimeTH(h.lastSaleAt)}`
                    : "—"
                }
              />
              <Stat label="Low stock SKUs" value={String(h.lowStockCount)} />
              <Stat label="Pending send-later" value={String(h.pendingSendLater)} />
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel-strong px-3 py-2">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="num mt-1 text-sm font-extrabold text-accent-strong">
        {value}
      </dd>
    </div>
  );
}
