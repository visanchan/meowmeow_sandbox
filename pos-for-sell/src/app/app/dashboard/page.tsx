import Link from "next/link";
import { mockToday } from "./mock";
import { PaceStrip } from "./PaceStrip";
import { TodayMetricsTile } from "./TodayMetricsTile";
import { PaymentSplitTile } from "./PaymentSplitTile";
import { TopSellersTile } from "./TopSellersTile";
import { InventoryTile } from "./InventoryTile";
import { HourBars } from "./HourBars";

export default function DashboardPage() {
  const m = mockToday;
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl text-accent-strong">Dashboard</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Demo · today
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        Wires to live data at DD-85..94. Numbers below are illustrative.
      </p>

      <div className="mt-6 grid gap-4">
        <PaceStrip
          achievedSatang={m.goal.achievedSatang}
          targetSatang={m.goal.targetSatang}
        />

        <TodayMetricsTile
          totalSatang={m.totalSatang}
          bills={m.bills}
          avgBillSatang={m.avgBillSatang}
        />

        <PaymentSplitTile split={m.paymentSplit} />

        <div className="grid gap-4 lg:grid-cols-2">
          <TopSellersTile sellers={m.topSellers} />
          <InventoryTile rows={m.inventoryRemaining} />
        </div>

        <HourBars hourly={m.hourly} />
      </div>

      <Link
        href="/app"
        className="mt-8 inline-block text-sm font-bold text-accent-strong"
      >
        ← App home
      </Link>
    </main>
  );
}
