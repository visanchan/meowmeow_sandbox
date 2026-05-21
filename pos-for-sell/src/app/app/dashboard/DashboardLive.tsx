"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemoSales } from "@/lib/demo/useDemoSales";
import { useDemoCatalog } from "@/lib/demo/useDemoCatalog";
import { computeMetricsFor } from "@/lib/demo/dashboardMetrics";
import { aggregateMargin } from "@/lib/demo/margin";
import {
  dailyRevenueSeries,
  daysInRange,
  deltaPct,
  ordersInRange,
  previousRange,
  rangePreset,
  type RangePresetId,
} from "@/lib/demo/dashboard-range";
import { formatTHB } from "@/lib/money/format";
import { mockToday } from "./mock";
import { PaymentSplitTile } from "./PaymentSplitTile";
import { TopSellersTile } from "./TopSellersTile";
import { InventoryTile } from "./InventoryTile";
import { HourBars } from "./HourBars";
import { DailyBars } from "./DailyBars";
import { ExportCsvButton } from "./ExportCsvButton";
import { ActivityFeedTile } from "./ActivityFeedTile";
import { ProfitTile } from "./ProfitTile";
import { ReorderTile } from "./ReorderTile";
import { DateRangePicker } from "./DateRangePicker";
import { SourceSplitTile } from "./SourceSplitTile";
import { splitBySource } from "@/lib/demo/source-split";

export function DashboardLive() {
  const { orders, ready: salesReady } = useDemoSales();
  const { items: catalog, ready: catalogReady } = useDemoCatalog();
  const [rangeId, setRangeId] = useState<RangePresetId>("today");

  const range = useMemo(() => rangePreset(rangeId), [rangeId]);
  const prev = useMemo(() => previousRange(range), [range]);
  const isMultiDay = daysInRange(range) > 1;

  const ordersHere = useMemo(
    () => (salesReady ? ordersInRange(orders, range) : []),
    [orders, range, salesReady],
  );
  const ordersPrev = useMemo(
    () => (salesReady ? ordersInRange(orders, prev) : []),
    [orders, prev, salesReady],
  );

  const hasLiveData = salesReady && ordersHere.length > 0;
  const live = hasLiveData ? computeMetricsFor(ordersHere) : null;
  const prevMetrics =
    ordersPrev.length > 0 ? computeMetricsFor(ordersPrev) : null;
  const margin = hasLiveData ? aggregateMargin(ordersHere) : null;
  const sourceRows = hasLiveData ? splitBySource(ordersHere) : [];

  const inventoryRows =
    catalogReady && catalog.length > 0
      ? catalog.map((p) => ({
          sku: p.sku,
          name: p.name,
          current: p.current_qty,
          starting: Math.max(p.current_qty, p.current_qty),
        }))
      : mockToday.inventoryRemaining;

  const totals = live ?? {
    totalSatang: mockToday.totalSatang,
    bills: mockToday.bills,
    avgBillSatang: mockToday.avgBillSatang,
    paymentSplit: mockToday.paymentSplit,
    topSellers: mockToday.topSellers.map((s) => ({
      productId: s.sku,
      sku: s.sku,
      name: s.name,
      qty: s.qty,
      revenueSatang: s.revenueSatang,
    })),
    hourly: mockToday.hourly.map((h) => ({ hour: h.hour, today: h.today })),
  };

  const hourly =
    rangeId === "today" && live
      ? live.hourly.map((h) => ({
          hour: h.hour,
          today: h.today,
          prev: mockToday.hourly.find((m) => m.hour === h.hour)?.prev ?? 0,
        }))
      : mockToday.hourly;

  const daily =
    isMultiDay && hasLiveData ? dailyRevenueSeries(orders, range) : null;

  const goal = mockToday.goal;
  const dRev = deltaPct(live?.totalSatang ?? 0, prevMetrics?.totalSatang ?? 0);
  const compareLabel = `vs prev ${daysInRange(range) === 1 ? "day" : `${daysInRange(range)}d`}`;
  const revDelta = !hasLiveData
    ? "illustrative"
    : dRev.pct === null
      ? "first period — no comparison"
      : `${dRev.pct >= 0 ? "▲" : "▼"} ${Math.abs(dRev.pct)}% ${compareLabel}`;

  return (
    <main className="mx-auto max-w-[1320px] px-6 py-8 pb-14 sm:px-10">
      {/* Hero — mockup screens/dashboard.html */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--lavender-700)]">
            Mochi POS · {hasLiveData ? "live demo" : "illustrative"}
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-black tracking-tight text-text">
            Today&apos;s takings
          </h1>
          <p className="mt-1 text-sm text-muted">
            {range.label}
            {hasLiveData && (
              <>
                {" · "}
                <strong className="font-bold text-text">
                  {ordersHere.length}
                </strong>{" "}
                orders · vs {ordersPrev.length} prev-period
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={rangeId} onChange={setRangeId} />
          <ExportCsvButton />
        </div>
      </div>

      {!hasLiveData && (
        <p className="mb-4 text-sm text-muted">
          No sales in this range — record one at{" "}
          <Link href="/app/pos" className="font-bold text-accent">
            /app/pos
          </Link>{" "}
          to see live numbers. Figures below are illustrative.
        </p>
      )}

      {/* KPI strip — feature card (revenue) + 3 metric cards */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          className="rounded-[20px] p-[22px] text-white shadow-[var(--shadow-card)]"
          style={{ background: "var(--grad-primary)" }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/75">
            {rangeId === "today" ? "Today's revenue" : "Revenue"}
          </div>
          <div className="num mt-1.5 text-[36px] font-black leading-none tracking-[-0.025em]">
            ฿{formatTHB(totals.totalSatang)}
          </div>
          <div className="mt-2 text-xs font-bold text-white/80">
            {revDelta}
            {goal.targetSatang > 0 &&
              ` · target ฿${formatTHB(goal.targetSatang)}`}
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-[var(--shadow-card)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            Orders
          </div>
          <div className="num mt-1.5 text-[36px] font-black leading-none tracking-[-0.025em] text-text">
            {totals.bills}
          </div>
          <div className="mt-2 text-xs text-muted">
            Avg ฿{formatTHB(totals.avgBillSatang)} per order
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-[var(--shadow-card)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            Gross margin
          </div>
          <div
            className="num mt-1.5 text-[36px] font-black leading-none tracking-[-0.025em]"
            style={{ color: "var(--color-ok-soft-fg)" }}
          >
            {margin && margin.marginPct !== null
              ? `${Math.round(margin.marginPct)}%`
              : "—"}
          </div>
          <div className="mt-2 text-xs text-muted">
            {margin && margin.marginPct !== null
              ? `After COGS · ฿${formatTHB(margin.profitSatang)} profit`
              : "Add product cost to see margin"}
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-panel p-[22px] shadow-[var(--shadow-card)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted">
            Avg bill
          </div>
          <div className="num mt-1.5 text-[36px] font-black leading-none tracking-[-0.025em] text-text">
            ฿{formatTHB(totals.avgBillSatang)}
          </div>
          <div className="mt-2 text-xs text-muted">
            {totals.bills} order{totals.bills === 1 ? "" : "s"} in range
          </div>
        </div>
      </section>

      {/* Existing tiles — restructured into the mockup's left-card / right-rail
          (lavender hour-chart + top products, Send-Later + low-stock) in a
          follow-up commit on this PR. */}
      <div className="grid gap-4">
        <PaymentSplitTile split={totals.paymentSplit} />

        {margin && (
          <ProfitTile
            revenueSatang={margin.revenueSatang}
            cogsSatang={margin.cogsSatang}
            profitSatang={margin.profitSatang}
            marginPct={margin.marginPct}
            ordersWithCost={margin.ordersWithCost}
            totalOrders={ordersHere.length}
          />
        )}

        {sourceRows.length > 1 && (
          <SourceSplitTile
            rows={sourceRows}
            totalSatang={live?.totalSatang ?? 0}
          />
        )}

        {catalogReady && catalog.length > 0 && (
          <ReorderTile catalog={catalog} />
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <TopSellersTile
            sellers={totals.topSellers.map((s) => ({
              sku: s.sku,
              name: s.name,
              qty: s.qty,
              revenueSatang: s.revenueSatang,
            }))}
          />
          <InventoryTile rows={inventoryRows} />
        </div>

        <ActivityFeedTile />

        {isMultiDay && daily ? (
          <DailyBars series={daily} />
        ) : (
          <HourBars hourly={hourly} />
        )}
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
