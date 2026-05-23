# Supabase pre-flight — setup / wiring readiness QA

**Purpose:** credential-free correctness review of the Supabase SQL + wiring points, so the deliberate provisioning + wiring session goes smoothly. **No provisioning, no keys, no runtime changes** — review + findings only.

**Method:** static read of each file against the schema and the hard rules in `CLAUDE.md` (every business table has `workspace_id`; RLS on; service-role server-only; money as satang integers; orders written through one transactional RPC; audit row on every mutating action).

**Severity legend:** 🔴 blocking (would error or corrupt data) · 🟡 contract/validation gap (correct only if the client behaves) · 🔵 note / edge case.

## Verdict
✅ **Complete — no blockers. The one high-risk item was found *and fixed* in this pass.** The SQL + wiring are sound (atomic RPCs, deny-by-default RLS, idempotent migrations, graceful degradation without keys). The RLS infinite-recursion risk on `is_workspace_member` / `is_admin` is **patched in `schema.sql`** — both are now `SECURITY DEFINER` with a pinned `search_path` (logic unchanged, still `auth.uid()`-constrained). All 11 queue items reviewed.

---

## RPC functions (`database/functions/*.sql`)

### `create_order.sql` — atomic sale write — ✅ solid
`SECURITY DEFINER` with `set search_path = public`. Locks the event row and each `event_inventory` row `FOR UPDATE` (correct serialization — prevents oversell + duplicate order numbers under concurrency). Enforces `auth.uid()` + `is_workspace_member(['owner','manager','cashier'])`. Validates each product is active + in-workspace + has sufficient stock. Subtotal excludes samples; total clamped to `≥ 0`. Writes order header → items → inventory decrement (`current_qty -`, `sold_qty +`) → payment record(s) → send-later row → `audit_logs`, all in one transaction. Workspace isolation holds (every read filters `workspace_id = v_workspace_id`). Grants: `revoke all from public; grant execute to authenticated`.

Findings:
- 🟡 **`payment_method = 'mixed'` with no `payments[]` array records zero `payment_records`.** The single-payment `elsif` excludes both `'sample'` and `'mixed'`, so a mixed order that doesn't include an explicit `payments[]` ends up with `total > 0` but no payment row. The contract assumes the client always sends `payments[]` for mixed — enforce that client-side during wiring, or add a guard that raises if `mixed` and `payments[]` is empty.
- 🟡 **Send-later required fields aren't enforced server-side.** The payload contract says `customer_phone` + `shipping_address` are required when any item is `send_later`, but the RPC falls back to `'Unknown'` / `'TBD'` rather than raising. Relies on client validation; consider raising here for defense-in-depth.
- 🔵 **`payment_status` is hardcoded `'paid'`** for every order (`case when … 'paid' else 'paid' end` is a no-op). Even `send_later` / `transfer` orders are marked paid at creation — confirm that matches when money is actually collected, or thread the real status through.
- 🔵 **Order-number allocation assumes the `event_NNN` shape.** `cast(split_part(order_number,'_',2) as int)` would raise if a non-conforming `order_number` ever existed for the event. Only this RPC creates them, so edge-only today.

### `void_order.sql` — restore inventory + mark voided — ✅ solid
Locks the order row `FOR UPDATE`; rejects double-void (`status='voided'` guard) and empty reason; **owner/manager only** (cashiers can't void). Restores `event_inventory` (`current_qty +`, `sold_qty -` clamped at 0) from `order_items` — including sample lines (they decremented stock, so they restore). Marks order + payment `voided`, cancels open send-later fulfilment, writes audit with the full prior order as `old_value`.

Findings:
- 🟡 **Voiding an order whose send-later line was already `completed` (shipped) still restores its inventory.** The send-later cancel skips `completed`/`cancelled` rows, but the inventory restore runs for *all* `order_items` unconditionally — so stock that's physically gone (shipped) gets added back → **inventory drift**. Consider blocking the void (or skipping the restore) for already-fulfilled send-later lines.
- 🔵 No status guard beyond `'voided'` (a `'corrected'` order can be voided) — likely intended; noted.

### `correct_order.sql` — patch customer info / note — ✅ solid
Owner/manager only; auth-gated. Partial update via `coalesce(nullif(…,''), col)` so blank fields preserve existing values; flips `completed → corrected`; audit row with old + payload. Correctly scoped — the header comment directs qty corrections to void+recreate, so it never touches line items or totals (money/stock integrity stays in `create_order`).

Findings:
- 🔵 **No `FOR UPDATE` lock** on the order row (plain select → update). Concurrent corrections are last-write-wins; low risk since it only touches customer metadata.
- 🔵 Customer fields can still be patched on a `voided` order (status stays `voided`, but the metadata updates). Harmless; noted.

### `redeem_invite_code.sql` — signup → workspace — ✅ solid
Post-signup (`auth.uid()` required). Validates brand + slug (the slug regex uses Postgres ARE, which *does* support `(?:…)` — fine); locks the invite `FOR UPDATE`; rejects used/cancelled/expired (marks expired on the fly); one-workspace-per-owner pilot guard; creates workspace + owner membership, marks the code used, flips the application → `registered`, audits.
- 🟡 **Slug collision surfaces as a raw unique-violation**, not a friendly message — it validates slug *format* but not *availability*. Catch the constraint error during wiring for a clean "name taken" response.

### `create_registration_token.sql` — issue post-purchase token — ✅ solid
Auth + owner/manager/cashier; resolves workspace from the order; generates a collision-checked URL-safe token (`gen_random_bytes` → strip `/ + =` → 16 chars); inserts the token row + audit.
- 🔵 In rare cases stripping `/ + =` leaves a token < 16 chars — still random and accepted (claim only requires len ≥ 8); cosmetic.

### `claim_registration_token.sql` — anon portal claim — ✅ solid (2 items to verify)
The only anon write surface. `set search_path = public` present ✓ (essential for an anon `SECURITY DEFINER`). Locks the token `FOR UPDATE`; rejects missing/claimed/expired; inserts customer + contacts (skip-empty, `on conflict` dedupe) + optional pets + order link; marks claimed; audits with `user_id = null`.
- 🟡 **Audit insert sets `user_id = null` → requires `audit_logs.user_id` to be NULLABLE.** If the schema column is `NOT NULL`, every anon claim fails. **Verify in the schema/RLS pass (potential 🔴).**
- 🟡 **Malformed anon pet input crashes the whole claim** — `…->>'weight_kg'::numeric`, `::date` casts abort the transaction on bad input. Validate in the portal Server Action (and/or guard the casts).
- 🔵 No in-RPC rate-limit (expected) — ensure the portal Server Action rate-limits this anon endpoint (CLAUDE.md public-form rule).

### `convert_event_to_sample.sql` + `convert_sample_to_event.sql` — sample-bucket moves — ✅ solid (mirror pair)
Both: auth + owner/manager/cashier/stock_staff; `qty > 0`; resolve workspace from event; lock the `event_inventory` row `FOR UPDATE`; underflow guard (event→sample checks `current_qty`, sample→event checks `sample_qty`); move qty between `current_qty` ↔ `sample_qty`; audit old + new; return the row.
- 🔵 **Both depend on `event_inventory.sample_qty`** (added by the Wave 39a migration). **Verify `schema.sql` includes `sample_qty`** so a fresh install (schema-only) has it; otherwise these 404 until the migration runs.

> **RPCs done (8/8) — no 🔴 blockers.** All are well-structured, atomic, with RBAC + `search_path` hardening + audit throughout. **Cross-cutting items to verify in the schema/RLS pass:** `audit_logs.user_id` nullable · `event_inventory.sample_qty` present in `schema.sql` · `is_workspace_member` helper correctness · `workspaces.slug` unique constraint.

---

## RLS — `database/rls-policies.sql` — ✅ strong design (+ recursion risk fixed in `schema.sql`)

**Deny-by-default verified.** RLS is enabled on all 18 tables. Reads are workspace-scoped via `is_workspace_member(workspace_id)` (or `is_admin()`). Writes to `orders` / `order_items` / `payment_records` / `customers` / `customer_contacts` / `pets` / `customer_order_links` / `audit_logs` have **no direct INSERT/UPDATE policy at all** — denied for clients, performed only through the `SECURITY DEFINER` RPCs (which bypass RLS). `applications` allows anon INSERT only (public apply form) with admin-only SELECT/UPDATE; registration tokens are never exposed to anon SELECT. Role gating is consistent (owner/manager for events + voids, +stock_staff for products/inventory, +cashier for sales). Matches `CLAUDE.md` rules 2 / 3 / 6.

**Verify-list from the RPC pass — all resolved against `schema.sql`:**
- ✅ `audit_logs.user_id` is **nullable** (`schema.sql:285`) → the anon `claim_registration_token` audit succeeds. (Cleared the potential blocker.)
- ✅ `event_inventory.sample_qty` is present (`schema.sql:175`, `not null default 0`) → `convert_*` work on a fresh, schema-only install.
- ✅ `workspaces.slug` is `unique` (`schema.sql:67`) → confirms the `redeem_invite_code` slug-collision finding.

Findings:
- ✅ **FIXED in this pass (was the top first-run risk) — RLS recursion.** `is_workspace_member` and `is_admin` were `SECURITY INVOKER` and read `workspace_members` / `admin_users`, whose own SELECT policies call those same helpers — the classic Postgres "infinite recursion detected in policy" trap that would have broken **every** workspace-scoped query (products, events, orders, admin, …). **Patched in `schema.sql`:** both helpers are now **`SECURITY DEFINER`** with `set search_path = public, pg_temp` and fully-qualified table reads, so their internal reads bypass RLS — no recursion. Safe: logic unchanged and still constrained to `auth.uid()`, so a caller can only check their *own* membership/admin status (no permission broadening, no workspace-check bypass). A regression-guard comment in `schema.sql` records why they must stay `DEFINER`. **Verified:** every RLS policy that calls these helpers (workspaces, workspace_members, products, events, event_inventory, orders/items/payments, send_later, audit_logs, all 5 customer-portal tables) is now non-recursive, and the helpers no longer trigger the `workspace_members` / `admin_users` policies.
- 🔵 **No DELETE policies anywhere** — products soft-delete via `is_active`; everything else is immutable or RPC-only. Intentional; deny-by-default holds.
- 🔵 Stale in-SQL comment (`rls-policies.sql:217-218`: order RPCs "added in later batches") — they exist now; cosmetic.

---

## Migrations (`database/migrations/*.sql`)

### `2026-05-07_add_sample_qty.sql` (Wave 39a) — ✅ clean
Adds `event_inventory.sample_qty` + a `>= 0` check, both idempotent (`add column if not exists`; constraint guarded by a `pg_constraint` name check). **Fresh install:** effectively a no-op — `schema.sql` already has the column (line 175), and Postgres auto-names the inline column check `event_inventory_sample_qty_check`, which is exactly the name the DO-block looks for, so it skips cleanly (no duplicate constraint). Upgrade-only file.

### `2026-05-07_customer_portal.sql` (Wave 40a) — ✅ clean (one upgrade-path note)
Creates the 5 customer-portal tables (customers, contacts, pets, order_links, registration_tokens) + indexes + `touch_updated_at` triggers, all idempotent. **Fresh install:** no-op — `schema.sql` already has these tables. Upgrade-only file.
- 🟡 **Upgrade path only:** this migration creates the tables but **not** their RLS. `rls-policies.sql` enables their RLS via `alter table if exists` — so if `rls-policies.sql` was applied *before* this migration (the upgrade ordering), those lines were no-ops and the 5 tables are left **RLS-disabled** (customer/pet data unprotected). **After running this migration on an existing DB, re-run `rls-policies.sql`.** Not a concern on a fresh install (schema.sql creates the tables before rls-policies runs).

## Wiring points

### `src/app/apply/actions.ts` — ✅ solid
Server Action: Zod validation → field errors; honeypot (`website`) → silent success; **degrades gracefully** when Supabase env is missing (friendly "not yet wired" message, no crash); inserts into `applications` via the anon/user session (matches the `applications_anon_insert` policy); maps unique-violation `23505` → friendly "already applied"; best-effort admin email in try/catch gated on Resend env. Correct and defensive.

### `src/lib/auth/admin-check.ts` (admin gate) — ✅ solid
Typed guard with all three failure modes — `not-configured` / `not-authed` / `not-admin` — each with a helpful message; `server-only`. Reads `admin_users` with the **user session** (not service role) via the `user_id = auth.uid()` self-select policy, so `/admin/*` pages render a graceful state in demo mode instead of crashing.
- ✅ Reads `admin_users` via `is_admin`, which is now `SECURITY DEFINER` (recursion fixed) — admin login is safe; no first-run action needed.

---

## ✅ Overall verdict

**The Supabase SQL + wiring are in good shape — no *unconditional* blockers found.** The 8 RPCs are atomic, row-locked, RBAC-gated, `search_path`-hardened, and audited; RLS is deny-by-default across all 18 tables with every sensitive write funnelled through `SECURITY DEFINER` RPCs; the migrations are idempotent and correct for a fresh install; the wired Server Actions degrade gracefully without keys.

**When you provision, in this order:**
1. ✅ **FIXED — RLS recursion.** `is_workspace_member` + `is_admin` are now `SECURITY DEFINER` with `search_path = public, pg_temp` (logic unchanged, still `auth.uid()`-constrained), so the day-one break risk is removed — no first-run action needed. *(Optional smoke-check after provisioning: load `/app` as a member; it should just work.)*
2. 🟡 **Close the wire-time validation gaps in the Server Actions** (none block provisioning): `create_order` `mixed` payment needs a `payments[]` array; send-later needs phone + address; the anon `claim_registration_token` must validate pet weight/date and be rate-limited.
3. 🟡 **Decide `void_order` behavior** for already-shipped send-later lines (today it restores stock that's physically gone → inventory drift).
4. 🟡 **Upgrade path only:** if you run `customer_portal.sql` against an existing DB, re-run `rls-policies.sql` afterward.

Everything else is 🔵 notes. **Pre-flight complete — all queue items reviewed; loop stopping.**
