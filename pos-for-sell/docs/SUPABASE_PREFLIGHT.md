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

_(next: `void_order`, `correct_order`, then the remaining 5 RPCs)_
