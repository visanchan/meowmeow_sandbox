# Supabase pre-flight — setup / wiring readiness QA

**Purpose:** credential-free correctness review of the Supabase SQL + wiring points, so the deliberate provisioning + wiring session goes smoothly. **No provisioning, no keys, no runtime changes** — review + findings only.

**Method:** static read of each file against the schema and the hard rules in `CLAUDE.md` (every business table has `workspace_id`; RLS on; service-role server-only; money as satang integers; orders written through one transactional RPC; audit row on every mutating action).

**Severity legend:** 🔴 blocking (would error or corrupt data) · 🟡 contract/validation gap (correct only if the client behaves) · 🔵 note / edge case.

## Verdict
_In progress (pre-flight loop). Updated as each queue item is reviewed._

Queue: 8 RPCs → `rls-policies.sql` → 2 migrations → wiring points (`apply/actions.ts`, admin pages).

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

_(next: `rls-policies.sql`)_
