# Database Schema (overview)

Source of truth: `database/schema.sql`. RLS in `database/rls-policies.sql`. Seed data in `database/seed.sql`.

## Tables

### Tenant + identity

1. **applications** — public form submissions (pre-auth). No workspace_id.
2. **invite_codes** — one-shot signup tokens linked to an approved application.
3. **workspaces** — one per pilot client. The tenancy boundary.
4. **workspace_members** — link `auth.users.id` ↔ `workspaces.id` with a role.
5. **admin_users** — explicit allowlist of platform admins (separate from workspace owners).

### Catalog

6. **products** — product cards. Belongs to a workspace. Image stored in Supabase Storage; row holds `image_path`.
7. **categories** — optional. Workspace-scoped. Initially we may inline category as a string column on products.

### Selling

8. **events** — one booth/fair. Workspace-scoped. Has start_date, end_date, status.
9. **event_inventory** — per-product stock at an event. Has starting_qty, current_qty, reserved_qty (for send-later), sold_qty, adjusted_qty.
10. **orders** — sale header. Has total, payment_method, payment_status, customer info, order_type (take_now / send_later / mixed).
11. **order_items** — one row per SKU sold. Has fulfillment_type per line.
12. **payment_records** — payment events for an order (multiple payments allowed, e.g. partial cash + transfer).
13. **send_later_orders** — fulfillment data when one or more items are send_later.

### Trust + audit

14. **audit_logs** — append-only. Action + table + before/after JSON snapshots.

## Money

All money columns are `bigint` representing **THB satang** (1 THB = 100 satang). UI formats to "1,234.50 THB".

## Identifiers

- All primary keys are `uuid` defaulting to `gen_random_uuid()`.
- `workspaces.slug` is a human-readable URL slug, unique.
- `orders.order_number` is a human-readable per-event sequence (event_001, event_002, ...).
- `invite_codes.code` is `CATBOOTH-XXXX-YYYY` where X/Y are ambiguity-safe base32.

## RLS strategy

- **Public tables (`applications`)**: anyone can insert; only admins can select/update.
- **Auth-required, workspace-scoped (`products`, `events`, `event_inventory`, `orders`, `order_items`, `payment_records`, `send_later_orders`, `audit_logs`)**: row visible only to members of the workspace via `workspace_members`. Insert/update allowed if user has the appropriate role within the workspace.
- **Identity tables (`workspaces`, `workspace_members`)**: a member can read their own workspace and its members. Insert is via server action with admin/owner check. Update is owner-only.
- **Admin tables (`invite_codes`, `admin_users`)**: only platform admins can read/write.

## Postgres functions (server-side, security definer)

- `create_order(payload jsonb) returns uuid` — atomic sale write. Acquires `FOR UPDATE` on each `event_inventory` row, validates qty, decrements, inserts orders+items+payments+audit, returns order_id. Caller must be a workspace member with role in (owner, manager, cashier).
- `void_order(order_id uuid, reason text) returns void` — inverse. Restores event_inventory, sets order.status = voided, writes audit row. Owner/manager only.
- `correct_order(order_id uuid, payload jsonb) returns void` — edit existing order; recomputes inventory delta vs original; writes audit.
- `redeem_invite_code(code text, password text, brand_name text) returns uuid` — code validation + signup + workspace creation, in one transaction. Returns workspace_id.

## Roles

| Role | Can do |
|---|---|
| `owner` | All workspace operations including delete |
| `manager` | All except delete workspace, can invite staff |
| `cashier` | Sell, view today's sales |
| `stock_staff` | Adjust stock, no sales |
| `viewer` | Read-only dashboard |

Pilot starts with only `owner` (one user per workspace). Other roles are reserved for post-pilot.

## Storage buckets

- `product-images` — public-read, write-restricted to workspace members. Path: `{workspace_id}/{product_id}/{filename}.webp`.
- `payment-slips` — private, signed URLs. Path: `{workspace_id}/{order_id}/{filename}.jpg`. (For transfer slip uploads.)
