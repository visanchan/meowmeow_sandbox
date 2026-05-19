# Vision — Meowmeow & MochiPOS

Two projects, one bet: build the POS that **booth sellers and pet retailers** actually need, starting from a real event-tested prototype, then productizing it for the rest of the market.

---

## 1. Executive summary

MochiPOS should not be built as a generic POS from day one. The strongest path is to build from a proven field-tested use case — **event booth sellers**, starting with **pet expo and cat-product businesses**.

Two layers:

- **Project 1 — Meowmeow Event POS** — internal, production-tested at theMeowseum's real Pet Expo booth. Survived a live 4-day event and generated practical lessons about booth stock, Send Later orders, sample stock, gifts, voids, and event-end reconciliation.
- **Project 2 — MochiPOS** — the SaaS productized version. Inherits the field-tested workflow, adds proper architecture: multi-tenant accounts, database, onboarding, approval flow, vertical modules.

The strategic insight that shaped the architecture:

> **MochiPOS makes the cashier flow faster, not heavier.**

Customer and pet profiles **must not block checkout**. At a busy event, forcing staff to register every customer before completing a sale creates opportunity cost, longer queues, and lower adoption. Instead the system has two connected layers:

1. **Fast POS Layer** — for cashier and booth staff during the event. Optimised for speed, low typing, mistake-resistance.
2. **Customer Portal Layer** — for customers to register themselves later via QR / link / Line. Captures pet info, builds the relationship engine, feeds repeat-customer recognition at the next event.

This lets the seller sell quickly during peak traffic while still building customer and pet data after the transaction.

---

## 2. The gap

Most small booth sellers at expos still use pen and paper, Excel, phone notes, bank transfer screenshots, or generic POS apps (Square, Toast, Loyverse, Shopify). Those tools work for normal retail, restaurants, or online shops — but they aren't designed around the messy reality of multi-day event booths.

Event booths have specific problems:

- Stock moves very fast.
- Staff are under pressure.
- Many customers arrive at the same time.
- Physical samples are displayed and sometimes sold.
- Some products are paid for now but shipped later.
- Free gifts and stickers need to be deducted from stock without polluting paid sales.
- Stock count drifts across event days.
- Sellers need post-event reconciliation.
- Customer relationship happens *after* the event, not always during checkout.

> **MochiPOS is a friendly event-first POS for booth sellers who need fast checkout, accurate event stock, Send Later orders, and post-event customer relationship tools.**

First wedge: pet expo sellers. Long-term: general booth, pop-up, and small retail.

---

## 3. Project 1 — Meowmeow Event POS *(production, internal)*

A single-file browser POS built for the Meowseum cat-merch booth. Vanilla HTML/CSS/JS, no backend, no build step. Runs offline on iPad in Edge. localStorage only; CSV export is the backup path.

### What it solves that generic POS doesn't

- **Multi-day inventory** with carry-forward, per-day dashboards, 4-day pace timeline, period-over-period compare.
- **Send Later orders** — paid at booth, shipped from warehouse stock after the event. Separate reservation queue, separate stock pool, separate fulfillment tracking.
- **Sample stock bucket** (Batch DD) — physical samples on booth display tracked as a real, persistent stock state across the whole event. One-click "make sample" / "return to event stock" conversions with movement audit trail.
- **Free gift / sticker promos** — automatic threshold-based gifts that deduct booth stock without polluting paid sales totals or top-sellers analytics.
- **Bill correction + void audit** — controlled exception flow, gated by passcode, full audit history. Carry-forward realigns across all later event days when an earlier bill is corrected. Send Later queue rebuild + warehouse-aware allowance check (Batch EE).
- **Inventory drift reconciler** — append-only movement journal, reconciler view, dashboard drift banner, end-of-event Reconcile CSV.
- **Bilingual EN/TH** for the customer-facing pages.

Every refactor traces back to a real Pet Expo field finding, not a theoretical bug. The fix-feedback loop runs in hours, not weeks. That is the right of way Project 2 inherits.

---

## 4. Project 2 — MochiPOS *(SaaS, in active build)*

Located in `pos-for-sell/`. Stack: Next.js 15 + TypeScript + Tailwind v4 + Supabase + Resend + Vercel + npm. 100-batch build plan in `pos-for-sell/docs/BATCH_PLAN.md`.

### Architecture: two connected layers

**A. POS App (seller-facing)** — used by cashier and staff during the event. Purpose: fast checkout, stock deduction, payment recording, Send Later marking, receipt/order creation, optional quick customer tag (phone or nickname). This flow must be extremely fast.

**B. Customer Portal (customer-facing)** — used by customers after purchase, accessed via QR on receipt or link by Line/SMS. Purpose: register customer profile, add pet information, connect order history, join loyalty program, receive shipping update, future promotions. Built mobile-first, bilingual EN/TH.

### Inheritance from Meowmeow

- Multi-day event inventory + carry-forward.
- Send Later order flow + warehouse pool.
- Sample stock bucket with explicit make/return actions.
- Daily dashboard + multi-period compare + 4-day pace timeline.
- Event archive (CSV bundle).
- Stock reconciliation (drift journal + reconciler view).
- EN/TH bilingual UI.
- Practical booth-selling logic.

### What MochiPOS adds beyond Meowmeow

- Multi-tenant Supabase backend with RLS-enforced workspace isolation.
- Approval-based onboarding (apply → admin reviews → invite code).
- Customer portal layer (the architectural separation that doesn't exist in Meowmeow).
- COGS / margin per product — actual profit per SKU, not just revenue.
- Customer lifecycle + LTV cohort view.
- Order source / channel attribution.
- Reorder points + demand forecasting (Lightspeed-inspired).
- QR self-order menu.
- Loyalty points (Loyverse / Square pattern), partial refunds with reason, cash reconciliation at close-of-day.
- Pet profiles as a **post-purchase** relationship engine — the booth-seller competitive moat.

---

## 5. Key strategic correction — checkout first, profile later

This is the most important architectural decision.

The original idea was to add customer and pet profile **into** the cashier flow. In real event conditions this is dangerous:

- Many customers arrive at the same time during peak hours.
- Staff must handle queues quickly.
- Customers may not want to give information immediately.
- Some customers only buy small items and don't return.
- Typing customer details is slow under pressure; mistakes happen.
- Staff may skip the feature completely under load.
- Net result: checkout flow becomes heavier; sales capacity drops.

If the seller loses 30–60 seconds per order, a 100-customer peak hour costs 75 staff-minutes. That's too expensive.

**Rule: checkout first, profile later.** MochiPOS never forces customer registration before a sale.

### Why pet profiles still matter (the moat)

Pet sellers have a unique relationship with customers. Customers don't just buy "a product" — they buy for their cat, dog, pet's personality, allergies, size, breed, age, behaviour, preferences. That makes customer memory genuinely valuable:

- "Milo likes cardboard scratchers."
- "Luna has food allergy — avoid X."
- "This customer bought the dinosaur scratcher last event."
- "Recommend the refill toy / replacement product next time."

Generic POS doesn't store this naturally. Pet profile is a real differentiator — but the **timing matters**.

> Bad timing: ask for full pet profile before checkout.
> Good timing: complete sale first, then invite the customer to register their pet later.

---

## 6. Recommended user flow

### Event checkout flow (cashier)

1. Cashier opens POS.
2. Customer selects products.
3. Cashier adds to cart.
4. Cashier chooses payment method.
5. Cashier picks fulfillment: take now / Send Later.
6. Cashier completes checkout.
7. System creates receipt / order with a QR for customer registration.
8. Customer may scan now or later. Cashier doesn't wait.

### Customer registration flow (customer-side, post-purchase)

1. Customer scans QR on receipt.
2. Mobile-friendly registration page opens.
3. Customer enters phone, email or Line.
4. Customer confirms order link.
5. Customer optionally adds pet profile (name, type, breed, birthday, allergies, preferences).
6. Consent for marketing / future updates.
7. Seller can see the registered customer + pet profile in the dashboard.

### Repeat customer flow (next event)

1. Customer gives phone number or scans loyalty QR at the booth.
2. Cashier looks up customer in one tap.
3. POS shows: customer name, pet name, past purchases, notes / allergies.
4. Cashier recommends better-fit products.
5. The moat compounds with each event.

### Optional cashier quick-options (no required fields)

- **Skip customer** — anonymous walk-in.
- **Add phone only** — fastest path to link future activity.
- **Existing customer lookup** — if returning.
- **Send registration link** — after the sale, fire SMS/Line to the customer.

---

## 7. Data architecture

### Core POS tables (every business)

| Table | Purpose |
|---|---|
| workspaces, workspace_members, applications, invite_codes | Tenancy + onboarding |
| products | Product master |
| events | Expo / event records |
| event_inventory | Stock allocated to event (incl. sample bucket from Wave 39a) |
| orders, order_items | Sales |
| payment_records | Payment events per order |
| send_later_orders | Fulfillment queue |
| audit_logs | Append-only audit trail |

### Customer relationship tables (separate from POS flow)

| Table | Purpose |
|---|---|
| customers | Customer profile |
| customer_contacts | Phone, email, Line |
| customer_order_links | Link customers to past orders |
| customer_registration_tokens | One-shot tokens for QR/link claim |
| loyalty_accounts | Points and rewards (post-pilot) |
| customer_tags | Segments and labels |
| customer_notes | Seller notes |

### Pet vertical module (optional per workspace)

| Table | Purpose |
|---|---|
| pets | Pet profiles |
| pet_preferences | Favorite products, diet, toy type |
| pet_allergies | Allergy info |
| pet_life_events | Birthday, adoption day |
| pet_recommendations | Future recommendation logic |

The architecture: **general POS core + optional vertical modules**. Pet sellers enable the pet module; general retail hides it.

---

## 8. Updated positioning

> **MochiPOS keeps checkout fast during the event, then helps sellers build customer and pet relationships after the sale.**

Generic POS is **transaction-first**. MochiPOS is **event-first and relationship-ready**.

Short product messages:

- **General**: MochiPOS helps booth sellers sell fast at events, manage stock accurately, and build customer relationships after the sale.
- **Pet vertical**: MochiPOS is built for pet booth sellers who want fast checkout, clear stock, Send Later orders, and pet-customer memory without slowing down the cashier.
- **Founder story**: MochiPOS started from a real Pet Expo booth POS used by theMeowseum. Every feature comes from real event problems, not assumptions.

---

## 9. MVP scope

The MVP must prove two things:

1. Can MochiPOS run a real event smoothly?
2. Can MochiPOS collect customer/pet data **after** purchase without slowing down sales?

### Must-have

**Seller-side POS**: login, business account, product setup, image upload, cost + price, event setup + stock allocation, checkout, payment method, Send Later, sample stock, daily dashboard, CSV export, order history.

**Customer registration system**: unique QR/link per receipt, mobile-friendly registration page, customer profile form, pet profile form, order linking via token, bilingual EN/TH, consent, seller-side customer dashboard.

**Admin control**: customer approval flow, registration code, tenant management, pilot list, basic usage monitoring.

### Defer (not yet)

Advanced AI recommendations, complex loyalty engine, multi-branch system, full accounting integration, full CRM automation, marketing automation, advanced forecasting, full tax system, complicated staff permission matrix.

---

## 10. Roadmap

| Wave | Goal | Build |
|---|---|---|
| **Wave 1 — SaaS Foundation** | Make MochiPOS usable by selected sellers. | Landing page, request access form, admin approval, registration code, login, tenant account, product setup + image upload, basic POS, sales history. |
| **Wave 2 — Event Workflow** | Make MochiPOS event-first. | Event creation, multi-day event stock, warehouse stock, Send Later orders, sample stock, free gift deduction, daily dashboard, stock movement journal, CSV export. |
| **Wave 3 — Customer Registration Portal** | Capture customer + pet data without slowing checkout. | Receipt QR, registration link, mobile customer profile page, pet profile page, order linking, consent capture, seller customer dashboard. |
| **Wave 4 — Repeat Customer Memory** | Make customer data useful at the next event. | Phone lookup, repeat customer badge, pet profile preview, purchase history, notes + tags, product preference fields, Line-ready export. |
| **Wave 5 — Business Intelligence** | Help sellers manage profit + stock. | COGS, gross margin, sales by product, sales by event, low-stock alert, slow-moving stock, reorder point, basic demand forecast. |
| **Wave 6 — General Business Expansion** | Move beyond pet sellers. | Vertical modules, optional pet module, general retail customer profile, pop-up seller mode, beauty / handmade modes, loyalty points, QR self-order menu. |

Current progress (2026-05-07): Waves 32–38 shipped in pos-for-sell, plus Wave 39a (sample bucket data layer), Wave 39b (sample bucket UI in demo), Wave 40a (Customer Portal data layer + RLS + RPCs), Wave 40b (portal UI in demo), and Wave 40c (cashier returning-customer lookup) all merged. **Wave 40d** — real Supabase wiring for the Customer Portal (Server Actions calling `create_registration_token` / `claim_registration_token`) — is pending and blocks on Supabase project provisioning. The wave numbering is post-100-batch organic — see git log or `pos-for-sell/docs/STATUS.md` for the full history.

---

## 11. Pilot plan

### Target

Start with **5 selected pet businesses** from Pet Expo Thailand. Best pilot customers sell at events regularly, have 10–100 SKUs, take cash + PromptPay/transfer + card, sometimes need Send Later, care about branding + customer relationships, are willing to give weekly feedback.

Politely defer for the pilot: restaurants and food vendors, multi-branch retailers, brands with thousands of SKUs, customers requiring official Thai e-tax invoicing on day one, customers needing barcode/printer integrations on day one.

### Objective

> Can MochiPOS help a real pet booth seller run **one event** better than their current method?

### Success metrics

| Area | Metric |
|---|---|
| Setup | Seller can upload products and prepare event stock |
| Checkout | Staff can complete sales quickly (target: under 30 sec for take-now) |
| Stock | Stock mismatch reduced vs. previous-event spreadsheet |
| Send Later | Fulfillment queue is clearer; zero lost reservations |
| Customer profile | Customers register after purchase (target: ≥30% scan rate) |
| Pet profile | Some customers add pet details (target: ≥50% of registrants) |
| Seller satisfaction | Seller wants to use again |
| Willingness to pay | Seller accepts paid plan after pilot |

---

## 12. Pricing intent

### Pilot phase

Free for one event in exchange for feedback + anonymised case study + usage data sharing.

### Early paid plans (post-pilot)

| Plan | Price | Suitable for |
|---|---:|---|
| Starter Event | 490–990 THB / event | Small booth |
| Pro Event | 1,500–2,500 THB / event | Medium booth |
| Frequent Seller | 990–1,990 THB / month | Sellers joining events often |

Event-based pricing fits the behaviour of expo sellers (they think in event cycles). Monthly SaaS comes later once usage becomes regular.

---

## 13. Why this works

- **Project 1 earned the right to build Project 2.** Every Project 2 feature traces to a Project 1 learning, a Pet Expo field finding, or a documented competitor pattern (Lightspeed, Toast, Shopify, Square). No speculative features.
- **Pet-customer relationships are the moat — but only when implemented post-purchase.** Generic POS is anonymous-transaction-first. MochiPOS is event-first, then relationship-ready, with the timing right.
- **Built bilingual from day one (EN/TH).** Thai pet booth market is the wedge; English is the export path.
- **Solo-founder leverage.** AI-assisted development with a two-agent protocol (Claude implements; Codex reviews). Methodology in [skill.md](skill.md).

---

## 14. Files for orientation

- [readme.md](readme.md) — Project 1 product behavior + working rules.
- [TASKS.md](TASKS.md) — Project 1 shared task board.
- [CLAUDE.md](CLAUDE.md) — Claude session protocol (Project 1).
- [codex.md](codex.md) — Codex session protocol (Project 1).
- [skill.md](skill.md) — recorded methodology for future agent sessions.
- [pos-for-sell/CLAUDE.md](pos-for-sell/CLAUDE.md) — Project 2 protocol; overrides root CLAUDE.md inside pos-for-sell.
- [pos-for-sell/TASKS.md](pos-for-sell/TASKS.md) — Project 2 task board.
- [pos-for-sell/docs/PROJECT_VISION.md](pos-for-sell/docs/PROJECT_VISION.md) — Project 2 product-vision (more product-detailed than this umbrella).
- [pos-for-sell/docs/BATCH_PLAN.md](pos-for-sell/docs/BATCH_PLAN.md) — Project 2's 100-batch build plan.
