# Architecture

## Stack

- **Next.js 16 (App Router, src/)** — server-first React. Public pages prerender; auth-gated layouts force-dynamic.
- **React 19** + **TypeScript 5** + **Tailwind CSS 4** (`@theme inline` tokens carrying meowmeow palette).
- **Supabase** — Postgres + Auth + Storage + Row Level Security. Service role key is server-only.
- **Resend** — transactional email. Wrapper at `src/lib/email/resend.ts`.
- **Vercel** — hosting. Root directory: `pos-for-sell/`.
- **npm**.
- **Vitest** for unit tests on pure-logic libs.

## Data flow

```
public visitor               admin                pilot client
       |                       |                        |
       v                       v                        v
   /apply form         /admin/applications        /register (invite-code)
       |                  approve / reject              |
       |                       |                        v
       v                       v                  /app/setup/products
  applications row     invite_codes row                 |
       |                       |                        v
       |               email via Resend             /app/pos
       |                       |                        |
       v                       |              create_order RPC (atomic)
   admin notif via Resend      v                        |
                          customer email          orders + order_items
                                                  + payment_records
                                                  + send_later_orders (if any)
                                                  + audit_logs
                                                  + event_inventory decrement
```

## Key boundaries

- **Server vs client**. Default is server components. `"use client"` only when interactivity needs it (forms, cart store, modal).
- **Mutations vs reads**. Server actions for app-internal mutations. Postgres `security definer` functions for atomic, multi-table writes (create_order, void_order, correct_order, redeem_invite_code). RLS allows direct INSERT/UPDATE for products/events/inventory by role; orders+order_items+payment_records have **no direct mutation policy** — they go through RPCs.
- **Admin vs tenant**. `/admin/*` requires a row in `admin_users` (checked in `src/lib/auth/admin-check.ts`). `/app/*` requires a row in `workspace_members` for the user's workspace. Public + auth pages have no gate.

## Tenancy

Every business table has `workspace_id`. RLS policies in `database/rls-policies.sql` enforce isolation: a workspace member sees only their workspace's rows. Server actions never use the service role for tenant data; they use the user's session. The service role is reserved for admin-side operations like creating invite codes.

## Money

All money is stored as `bigint` THB satang (1 THB = 100 satang). UI formats via `src/lib/money/format.ts`. Never use floats for money math.

## Inventory atomicity

`create_order` acquires `FOR UPDATE` on each `event_inventory` row before validating qty. Two cashiers cannot oversell the same SKU.

## Why a single Supabase project for all tenants

For the 5-brand pilot, one Postgres + RLS gives:

- Cheaper to operate (one DB, one Auth).
- Easier to audit (one schema, one set of policies).
- Multi-tenant separation provided by RLS policies + helper functions.
- Migration path to per-tenant DB is open (RLS makes that more annoying than helpful at this scale).

If/when the pilot graduates to a paid product, larger tenants can be migrated to dedicated projects.
