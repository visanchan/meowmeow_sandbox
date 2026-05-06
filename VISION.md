# Vision — Meowmeow & MochiPOS

Two projects, one bet: build the POS that **booth sellers and pet retailers** actually need, starting from a real event-tested prototype, then productizing it for the rest of the market.

## The gap

Most cat-merch booth sellers at expos use either pen-and-paper or generic POS apps (Square, Toast, Loyverse) that aren't built for:

- **Multi-day pop-up events** (4-day expos with carry-forward inventory)
- **Physical samples on display** (units that exist but aren't sellable)
- **Post-event shipping** (paid at booth, ships later from warehouse stock)
- **Pet-customer relationships** (the pet, not the buyer, is the unit of memory)

Coffee-shop and restaurant POS models don't fit. Generic retail POS treats every transaction as anonymous. Booth sellers — especially in the pet space — have completely different operational and customer-relationship needs.

## Project 1 — Meowmeow Event POS *(production, internal use)*

A single-file browser POS built specifically for the **Meowseum cat-merch booth** at Pet Expo Thailand. Already used live at a real 4-day event, refined under fire.

**Stack**: vanilla HTML/CSS/JS, no backend, no build step. Runs offline on an iPad in Edge. localStorage only; CSV export is the backup path.

**What it solves that generic POS doesn't:**

- **Multi-day inventory** with carry-forward, per-day dashboards, 4-day pace timeline, period-over-period compare.
- **Send Later orders** — paid at booth, shipped from warehouse stock after the event. Separate reservation queue, separate stock pool, separate fulfillment tracking.
- **Sample stock bucket** — physical samples on booth display tracked as a real, persistent stock state across the whole event. One-click "make sample" / "return to event stock" conversions with movement audit trail.
- **Free gift / sticker promos** — automatic threshold-based gifts that deduct booth stock without polluting paid sales totals or top-sellers analytics.
- **Bill correction + void audit** — controlled exception flow, gated by passcode, with full audit history. Carry-forward realigns across all later event days when an earlier bill is corrected.
- **Inventory drift reconciler** — append-only movement journal, reconciler view, dashboard drift banner, end-of-event Reconcile CSV.
- **Bilingual EN/TH** for the customer-facing pages.

**Why it matters**: every refactor is driven by **field findings**, not theoretical bugs. Real warehouse drift, real sample visibility, real bill-correction edge cases. The codebase is small, the bugs surface fast, and the fix-feedback loop runs in hours, not weeks.

## Project 2 — MochiPOS *(SaaS, in active build)*

The productized, multi-tenant version. Same booth-seller DNA; broader market. Located in `pos-for-sell/`.

**Stack**: Next.js 15 + TypeScript + Tailwind v4 + Supabase + Resend + Vercel + npm. 100-batch build plan in `pos-for-sell/docs/BATCH_PLAN.md`. As of 2026-05-06: 248 tests, 27 routes, 38 waves shipped.

**Where it inherits from Meowmeow**: the multi-day inventory model, Send Later flow, sample bucket, drift reconciler, EN/TH bilingual UI, and the entire learned set of "things real booths actually need."

**Where it goes further** (already shipped or in progress, "Waves" 32–38):

- **COGS / margin per product** — actual profit per SKU, not just revenue. Dashboards show contribution margin, not vanity numbers.
- **Stock count session** — physical recount workflow that closes warehouse drift before it spreads.
- **Multi-period dashboard** — period-over-period comparisons, day-over-day footers on KPI tiles.
- **Customer lifecycle + LTV view** — repeat-customer detection, average bills over time, cohort retention.
- **Order source / channel attribution** — which marketing channel drove which sales, by SKU.
- **Reorder points + demand forecasting** (Lightspeed-inspired).
- **QR self-order menu** — customer scans table tag, picks, cashier rings up.
- **Loyalty points** (Loyverse / Square pattern), **partial refunds with reason**, **cash reconciliation at close-of-day**.
- **Pet profiles** — the **competitive moat**. Customers' pets are first-class records: name, breed, allergies, size, past purchases, recommendations. No generic POS has this; it's the reason a cat-shop owner switches.

## Why this works

- **Project 1 earned the right to build Project 2.** Every Project 2 feature traces back to a Project 1 learning, a Pet Expo field finding, or a documented competitor pattern (Lightspeed, Toast, Shopify, Square). No speculative features.
- **Pet-customer relationships are the moat.** A coffee shop sells coffee; a booth seller's repeat customer remembers their cat's name. Generic POS treats every transaction as anonymous. MochiPOS treats the **pet** as the unit of memory.
- **Built bilingual from day one (EN/TH)** — the Thai pet booth market is the wedge; English is the export path.
- **Solo-founder leverage**. AI-assisted development with a two-agent protocol (Claude implements; Codex reviews) means a one-person team ships at SaaS-startup pace without a team. The methodology is recorded in [skill.md](skill.md) so future contributors can onboard cold.

## Status (2026-05-06)

- **Project 1**: Event-ready. Last 8 bugs across DD + EE are merged into `main`. Manager Action Dashboard V1 (Batch AA) drafted and queued for next iteration.
- **Project 2**: Wave 38 shipped. Wave 39 next — porting DD's sample bucket model and EE's Send Later correction fixes from Project 1 so the SaaS launches without those bugs.

## Files for orientation

- [readme.md](readme.md) — Project 1 product behavior + working rules.
- [TASKS.md](TASKS.md) — shared task board; live status per batch.
- [CLAUDE.md](CLAUDE.md) — Claude session protocol.
- [codex.md](codex.md) — Codex session protocol.
- [skill.md](skill.md) — recorded methodology for future agent sessions.
- [pos-for-sell/docs/PROJECT_VISION.md](pos-for-sell/docs/PROJECT_VISION.md) — Project 2's own product-vision doc (more product-detailed than this umbrella).
- [pos-for-sell/docs/BATCH_PLAN.md](pos-for-sell/docs/BATCH_PLAN.md) — Project 2's 100-batch build plan.
