/* Design canvas hosting Option 1 dashboard variants. */

/* -------- Mock data shaped like the real POS state -------- */
const TODAY_INDEX = 1; // Day 2 in progress
const EVENT_GOAL = 300000;

const DAYS = [
  { id: "day1", label: "Day 1", date: "Thu 14 Nov", revenue: 78420, receipts: 41, items: 96, cash: 22800, transfer: 49120, card: 6500, status: "closed" },
  { id: "day2", label: "Day 2", date: "Fri 15 Nov", revenue: 64980, receipts: 33, items: 71, cash: 19400, transfer: 38980, card: 6600, status: "live" },
  { id: "day3", label: "Day 3", date: "Sat 16 Nov", revenue: 0, receipts: 0, items: 0, cash: 0, transfer: 0, card: 0, status: "upcoming" },
  { id: "day4", label: "Day 4", date: "Sun 17 Nov", revenue: 0, receipts: 0, items: 0, cash: 0, transfer: 0, card: 0, status: "upcoming" },
];

const TOP_SELLERS = [
  { sku: "013", name: "Mona Lisa", qty: 12, revenue: 17880 },
  { sku: "005", name: "The Colosseum", qty: 6, revenue: 13140 },
  { sku: "015", name: "Starry Night", qty: 8, revenue: 11120 },
  { sku: "016", name: "Royal Haus of Meow", qty: 7, revenue: 10430 },
  { sku: "002A", name: "Cat the Curator 🔵", qty: 14, revenue: 9100 },
];

const HOURLY = [
  { h: "10", v: 4200 }, { h: "11", v: 8400 }, { h: "12", v: 11600 }, { h: "13", v: 9100 },
  { h: "14", v: 7700 }, { h: "15", v: 12300 }, { h: "16", v: 7400 }, { h: "17", v: 4280 }, { h: "18", v: 0 }
];

const LOW_STOCK = [
  { sku: "012", name: "Bowl Appetit", left: 1 },
  { sku: "010", name: "The Sphinx of Giza", left: 2 },
  { sku: "002A", name: "Cat the Curator 🔵", left: 2 },
];

/* -------- Palettes -------- */
const PALETTES = {
  cream: {
    name: "Cream & Brown (current)",
    bg: "#f6ecde",
    surface: "#fffdf8",
    surfaceAlt: "#fff7ea",
    line: "#e6d6bd",
    ink: "#2a1f15",
    inkSoft: "#6d5e4e",
    accent: "#8d6236",
    accentStrong: "#5f4220",
    accentTint: "#f0e2c9",
    good: "#3a8a4d",
    warn: "#c87a2a",
    bad: "#b24337",
    cash: "#3a8a4d",
    transfer: "#3066b3",
    card: "#8d6236",
  },
  espresso: {
    name: "Espresso (dark)",
    bg: "#1f1813",
    surface: "#2b2218",
    surfaceAlt: "#352a1e",
    line: "#4a3a28",
    ink: "#fbeed8",
    inkSoft: "#bda893",
    accent: "#e0a865",
    accentStrong: "#fbeed8",
    accentTint: "#3f3120",
    good: "#7bd193",
    warn: "#f2b25b",
    bad: "#e8836f",
    cash: "#7bd193",
    transfer: "#7eb1f0",
    card: "#e0a865",
  },
  ink: {
    name: "Editorial Ink",
    bg: "#efe9df",
    surface: "#ffffff",
    surfaceAlt: "#f5efe2",
    line: "#1c1714",
    ink: "#1c1714",
    inkSoft: "#5a5048",
    accent: "#1c1714",
    accentStrong: "#1c1714",
    accentTint: "#ead9b3",
    good: "#1c5e2c",
    warn: "#9e5b18",
    bad: "#8b2a1f",
    cash: "#1c5e2c",
    transfer: "#1f4a8a",
    card: "#1c1714",
  },
};

/* -------- Helpers -------- */
const fmtTHB = (n) => "THB " + Math.round(n).toLocaleString("en-US");
const fmtTHBshort = (n) => {
  if (n >= 1000) return "฿" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return "฿" + Math.round(n);
};
const sumDays = (days, key) => days.reduce((s, d) => s + (d[key] || 0), 0);

/* -------- Sub-components -------- */

function StatusPill({ pal, percent }) {
  let mood = { emoji: "🙂", text: "Sales are warming up", tone: pal.warn };
  if (percent >= 100) mood = { emoji: "🎉", text: "Goal smashed", tone: pal.good };
  else if (percent >= 60) mood = { emoji: "🚀", text: "On track", tone: pal.good };
  else if (percent >= 30) mood = { emoji: "💪", text: "Building momentum", tone: pal.warn };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "10px 16px", borderRadius: 999,
      background: pal.surface, border: `1.5px solid ${pal.line}`,
      fontWeight: 800, fontSize: 15, color: pal.ink,
      boxShadow: `0 1px 0 ${pal.line}`,
    }}>
      <span style={{ fontSize: 20 }}>{mood.emoji}</span>
      <span>{mood.text}</span>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: mood.tone }} />
    </div>
  );
}

function GoalBar({ pal, current, goal }) {
  const pct = Math.min(100, (current / goal) * 100);
  const milestones = [25, 50, 75, 100];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 18, flexWrap: "nowrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: pal.inkSoft, letterSpacing: ".08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Event total · vs goal</div>
          <div className="num" style={{ fontSize: 56, fontWeight: 900, color: pal.accentStrong, lineHeight: 1, letterSpacing: "-.03em", marginTop: 8, whiteSpace: "nowrap" }}>
            {fmtTHB(current)}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="num" style={{ fontSize: 44, fontWeight: 900, color: pal.accent, lineHeight: 1, whiteSpace: "nowrap" }}>{pct.toFixed(0)}%</div>
          <div className="num" style={{ fontSize: 13, color: pal.inkSoft, marginTop: 6, whiteSpace: "nowrap" }}>of {fmtTHB(goal)}</div>
        </div>
      </div>
      <div style={{ position: "relative", height: 18, borderRadius: 999, background: pal.accentTint, border: `1.5px solid ${pal.line}`, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, width: pct + "%",
          background: `linear-gradient(90deg, ${pal.accent}, ${pal.accentStrong})`,
          transition: "width .4s ease",
        }} />
        {milestones.map(m => (
          <div key={m} style={{
            position: "absolute", left: m + "%", top: -4, bottom: -4,
            width: 1.5, background: pal.surface, opacity: m === 100 ? 0 : .85,
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: pal.inkSoft, fontWeight: 600 }}>
        <span>0</span><span>25%</span><span>50%</span><span>75%</span><span>{fmtTHB(goal)}</span>
      </div>
    </div>
  );
}

function PaymentSplit({ pal, cash, transfer, card }) {
  const total = cash + transfer + card || 1;
  const segs = [
    { label: "Cash", value: cash, color: pal.cash, emoji: "💵" },
    { label: "Transfer", value: transfer, color: pal.transfer, emoji: "📲" },
    { label: "Card", value: card, color: pal.card, emoji: "💳" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: pal.ink, letterSpacing: ".04em", textTransform: "uppercase" }}>Payment split · today</div>
        <div style={{ fontSize: 12, color: pal.inkSoft, fontWeight: 600 }}>Cash count must match booth float</div>
      </div>
      <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", border: `1.5px solid ${pal.line}` }}>
        {segs.map(s => (
          <div key={s.label} title={s.label} style={{ width: (s.value / total) * 100 + "%", background: s.color }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
        {segs.map(s => (
          <div key={s.label} style={{
            padding: "12px 14px", borderRadius: 14,
            background: pal.surface, border: `1.5px solid ${pal.line}`,
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: pal.inkSoft, textTransform: "uppercase", letterSpacing: ".06em" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} />
              {s.label}
              {s.label === "Cash" && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, padding: "3px 7px", borderRadius: 999,
                  background: s.color, color: "#fff", letterSpacing: ".08em",
                }}>COUNT</span>
              )}
            </div>
            <div className="num" style={{ fontSize: 24, fontWeight: 900, color: pal.ink, marginTop: 6, lineHeight: 1 }}>
              {fmtTHB(s.value)}
            </div>
            <div style={{ fontSize: 12, color: pal.inkSoft, marginTop: 4 }}>
              {((s.value / total) * 100).toFixed(0)}% of today
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ pal, label, value, sub, emoji, tone }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 16,
      background: pal.surface, border: `1.5px solid ${pal.line}`,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      minHeight: 96,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: pal.inkSoft, textTransform: "uppercase", letterSpacing: ".06em" }}>
        <span>{emoji}</span>{label}
      </div>
      <div>
        <div className="num" style={{ fontSize: 26, fontWeight: 900, color: pal.ink, lineHeight: 1, letterSpacing: "-.01em" }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: tone || pal.inkSoft, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
      </div>
    </div>
  );
}

function DayTimeline({ pal, days, todayIdx }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: pal.ink, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>4-Day Pace</div>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
        <div style={{ position: "absolute", left: "12.5%", right: "12.5%", top: 22, height: 2, background: pal.line }} />
        <div style={{
          position: "absolute", left: "12.5%", top: 22, height: 2,
          width: `calc(${(todayIdx / 3) * 75}% )`, background: pal.accent,
        }} />
        {days.map((d, i) => {
          const done = i < todayIdx;
          const live = i === todayIdx;
          return (
            <div key={d.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
              <div style={{
                width: 46, height: 46, borderRadius: 99,
                background: done ? pal.accent : live ? pal.surface : pal.surfaceAlt,
                border: `2.5px solid ${done || live ? pal.accent : pal.line}`,
                color: done ? pal.surface : live ? pal.accent : pal.inkSoft,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 16, position: "relative", zIndex: 1,
                boxShadow: live ? `0 0 0 4px ${pal.accentTint}` : "none",
              }}>
                {done ? "✓" : i + 1}
                {live && <div style={{ position: "absolute", inset: -6, borderRadius: 99, border: `2px solid ${pal.accent}`, opacity: .35, animation: "pulse 2s infinite" }} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: pal.ink, whiteSpace: "nowrap", marginTop: 4 }}>{d.label}</div>
              <div style={{ fontSize: 11, color: pal.inkSoft, whiteSpace: "nowrap" }}>{d.date}</div>
              <div className="num" style={{ fontSize: 15, fontWeight: 900, color: done || live ? pal.accentStrong : pal.inkSoft, marginTop: 4, whiteSpace: "nowrap" }}>
                {d.revenue ? fmtTHBshort(d.revenue) : "—"}
              </div>
              <div style={{ fontSize: 10, color: pal.inkSoft, fontWeight: 600, whiteSpace: "nowrap" }}>
                {d.receipts ? `${d.receipts} bills · ${d.items} items` : "upcoming"}
              </div>
              {live && <div style={{
                position: "absolute", top: -8, right: 6,
                fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
                background: pal.good, color: "#fff", letterSpacing: ".08em",
              }}>LIVE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HourlySpark({ pal, data }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: pal.ink, letterSpacing: ".04em", textTransform: "uppercase" }}>Today by Hour</div>
        <div className="num" style={{ fontSize: 12, color: pal.inkSoft }}>peak {fmtTHBshort(max)} @ 15:00</div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90, padding: "0 2px" }}>
        {data.map((d, i) => {
          const isPeak = d.v === max;
          const isCurrent = i === 7;
          return (
            <div key={d.h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div className="num" style={{ fontSize: 9, color: pal.inkSoft, fontWeight: 700, opacity: d.v ? 1 : 0 }}>
                {fmtTHBshort(d.v)}
              </div>
              <div style={{
                width: "100%", height: ((d.v / max) * 70) + "px",
                minHeight: d.v ? 3 : 0,
                background: isPeak ? pal.accent : isCurrent ? pal.accent : pal.accentTint,
                border: `1.5px solid ${isPeak || isCurrent ? pal.accent : pal.line}`,
                borderRadius: 4,
                opacity: d.v ? 1 : .35,
              }} />
              <div style={{ fontSize: 10, color: isCurrent ? pal.accent : pal.inkSoft, fontWeight: isCurrent ? 800 : 600 }}>{d.h}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopSellers({ pal, items }) {
  const max = Math.max(...items.map(i => i.revenue), 1);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, color: pal.ink, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>Top Sellers · event</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it, i) => (
          <div key={it.sku} style={{ display: "grid", gridTemplateColumns: "20px 1fr 80px", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: pal.inkSoft, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pal.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                <div className="num" style={{ fontSize: 11, color: pal.inkSoft, fontWeight: 700 }}>×{it.qty}</div>
              </div>
              <div style={{ height: 6, background: pal.accentTint, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: (it.revenue / max) * 100 + "%", height: "100%", background: pal.accent, borderRadius: 99 }} />
              </div>
            </div>
            <div className="num" style={{ fontSize: 13, fontWeight: 800, color: pal.accentStrong, textAlign: "right" }}>{fmtTHBshort(it.revenue)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LowStockList({ pal, items }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: pal.ink, letterSpacing: ".04em", textTransform: "uppercase" }}>Low stock alerts</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: pal.bad, padding: "2px 8px", borderRadius: 999, background: `${pal.bad}1a` }}>
          {items.length} ITEMS
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map(it => (
          <div key={it.sku} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", borderRadius: 10,
            background: pal.surfaceAlt, border: `1px solid ${pal.line}`,
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: pal.ink }}>{it.name}</div>
              <div className="mono" style={{ fontSize: 10, color: pal.inkSoft }}>{it.sku}</div>
            </div>
            <div className="num" style={{ fontSize: 18, fontWeight: 900, color: it.left <= 1 ? pal.bad : pal.warn }}>
              {it.left} <span style={{ fontSize: 10, fontWeight: 700, color: pal.inkSoft }}>left</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- The whole dashboard -------- */

function Dashboard({ palette }) {
  const pal = palette;
  const today = DAYS[TODAY_INDEX];
  const totalRevenue = sumDays(DAYS, "revenue");
  const totalReceipts = sumDays(DAYS, "receipts");
  const totalItems = sumDays(DAYS, "items");
  const avgBill = totalReceipts ? totalRevenue / totalReceipts : 0;
  const itemsPerBill = totalReceipts ? totalItems / totalReceipts : 0;
  const pct = (totalRevenue / EVENT_GOAL) * 100;
  const remaining = Math.max(0, EVENT_GOAL - totalRevenue);
  const daysLeft = DAYS.filter(d => d.status === "upcoming").length + (today.status === "live" ? 1 : 0);
  const dailyNeeded = daysLeft ? remaining / daysLeft : 0;
  const yest = DAYS[TODAY_INDEX - 1];
  const todayDelta = yest ? ((today.revenue - yest.revenue) / yest.revenue) * 100 : 0;

  return (
    <div style={{
      width: 1200, padding: 28,
      background: pal.bg, color: pal.ink,
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      borderRadius: 28,
    }}>
      {/* Top header strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: pal.accent, color: pal.surface,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900,
          }}>🐱</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: pal.inkSoft, letterSpacing: ".12em", textTransform: "uppercase" }}>Meowseum · Pet Expo</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: pal.ink, marginTop: 2 }}>Internal Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusPill pal={pal} percent={pct} />
          <div style={{
            padding: "10px 14px", borderRadius: 12,
            background: pal.surface, border: `1.5px solid ${pal.line}`,
            fontSize: 12, color: pal.inkSoft, fontWeight: 700,
          }}>
            <span style={{ color: pal.ink }}>Day 2 · 17:14</span> · refreshed 4s ago
          </div>
          <button style={{
            padding: "10px 16px", borderRadius: 12, border: "none",
            background: pal.ink, color: pal.surface, fontWeight: 800, fontSize: 13, cursor: "pointer",
          }}>Close ✕</button>
        </div>
      </div>

      {/* Hero row: Goal bar + Day timeline */}
      <div style={{
        background: pal.surface, border: `1.5px solid ${pal.line}`,
        borderRadius: 24, padding: 28, marginBottom: 16,
        boxShadow: `0 1px 0 ${pal.line}`,
      }}>
        <GoalBar pal={pal} current={totalRevenue} goal={EVENT_GOAL} />
        <div style={{
          marginTop: 14, padding: "12px 16px", borderRadius: 12,
          background: pal.surfaceAlt, border: `1px dashed ${pal.line}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 13, color: pal.inkSoft,
        }}>
          <span>To hit goal: <strong style={{ color: pal.ink }} className="num">{fmtTHB(remaining)}</strong> across <strong style={{ color: pal.ink }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong></span>
          <span>Pace needed: <strong className="num" style={{ color: pal.accentStrong }}>{fmtTHB(dailyNeeded)}/day</strong></span>
        </div>
      </div>

      {/* Day timeline */}
      <div style={{
        background: pal.surface, border: `1.5px solid ${pal.line}`,
        borderRadius: 20, padding: 24, marginBottom: 16,
      }}>
        <DayTimeline pal={pal} days={DAYS} todayIdx={TODAY_INDEX} />
      </div>

      {/* Today block: stat tiles + payment split + hourly */}
      <div style={{
        background: pal.surface, border: `1.5px solid ${pal.line}`,
        borderRadius: 20, padding: 24, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: pal.inkSoft, letterSpacing: ".1em", textTransform: "uppercase" }}>{today.label} · {today.date}</div>
            <div className="num" style={{ fontSize: 36, fontWeight: 900, color: pal.accentStrong, lineHeight: 1, marginTop: 4 }}>{fmtTHB(today.revenue)}</div>
          </div>
          <div style={{
            padding: "6px 12px", borderRadius: 999,
            background: todayDelta >= 0 ? `${pal.good}1f` : `${pal.bad}1f`,
            color: todayDelta >= 0 ? pal.good : pal.bad,
            fontSize: 13, fontWeight: 800,
          }}>
            {todayDelta >= 0 ? "▲" : "▼"} {Math.abs(todayDelta).toFixed(0)}% vs Day 1
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <StatTile pal={pal} emoji="🧾" label="Receipts" value={today.receipts} sub={`${totalReceipts} total event`} />
          <StatTile pal={pal} emoji="📦" label="Items sold" value={today.items} sub={`${totalItems} total event`} />
          <StatTile pal={pal} emoji="💳" label="Avg bill" value={fmtTHBshort(today.revenue / today.receipts)} sub={`${itemsPerBill.toFixed(1)} items/bill`} />
          <StatTile pal={pal} emoji="📈" label="Peak hour" value="15:00" sub={fmtTHBshort(12300) + " in 1 hour"} tone={pal.good} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <PaymentSplit pal={pal} cash={today.cash} transfer={today.transfer} card={today.card} />
          <HourlySpark pal={pal} data={HOURLY} />
        </div>
      </div>

      {/* Bottom row: top sellers + low stock */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16 }}>
        <div style={{
          background: pal.surface, border: `1.5px solid ${pal.line}`,
          borderRadius: 20, padding: 24,
        }}>
          <TopSellers pal={pal} items={TOP_SELLERS} />
        </div>
        <div style={{
          background: pal.surface, border: `1.5px solid ${pal.line}`,
          borderRadius: 20, padding: 24,
        }}>
          <LowStockList pal={pal} items={LOW_STOCK} />
        </div>
      </div>
    </div>
  );
}

/* -------- Board -------- */

function DashboardBoard() {
  return (
    <DesignCanvas title="Dashboard Redesign · Option 1 (Booth Display)" subtitle="Tablet 1200px · Meowseum Pet Expo" background="#1c1714">
      <DCSection id="cream" title="A. Cream & Brown — current palette" subtitle="Keeps Meowseum warm DNA. Cleaner hierarchy, big goal bar, payment split, day timeline.">
        <DCArtboard id="cream-1" label="Cream / Brown — full dashboard" width={1256} height={1320}>
          <Dashboard palette={PALETTES.cream} />
        </DCArtboard>
      </DCSection>

      <DCSection id="espresso" title="B. Espresso — dark variant" subtitle="Same layout, dark surfaces. Better for late-evening booth glance + projector display.">
        <DCArtboard id="espresso-1" label="Espresso / Dark" width={1256} height={1320}>
          <Dashboard palette={PALETTES.espresso} />
        </DCArtboard>
      </DCSection>

      <DCSection id="ink" title="C. Editorial Ink — high-contrast" subtitle="Sharper, newspaper-feel. Hard black ink on cream, warm accents only on data. For end-of-day review.">
        <DCArtboard id="ink-1" label="Editorial Ink" width={1256} height={1320}>
          <Dashboard palette={PALETTES.ink} />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

window.DashboardBoard = DashboardBoard;
