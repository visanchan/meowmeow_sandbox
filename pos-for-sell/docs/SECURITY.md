# Security

## Threat model

The app is a multi-tenant SaaS where each tenant's data is potentially valuable to its competitors. Primary risks:

1. **Cross-tenant leak** — workspace A reads workspace B's data.
2. **Privilege escalation** — a workspace cashier elevates to platform admin.
3. **Service-role exposure** — the all-powerful Supabase key reaches the browser.
4. **Spam / abuse** — `/apply` form gets bot-spammed.
5. **Email impersonation** — invite emails are spoofed.
6. **Data destruction** — accidental or malicious DELETEs.

## Controls

### Cross-tenant leak

- **Row Level Security** is enabled on every business table.
- Helper functions `is_workspace_member(uuid, text[])` and `is_admin()` are `security invoker` (run with caller's permissions).
- Every SELECT/INSERT/UPDATE/DELETE policy filters by `workspace_id`.
- Server actions use the **user's session**, not the service role, for tenant data.

### Privilege escalation

- `admin_users` table is the allowlist; only existing admins can insert.
- Workspace roles (`owner`, `manager`, `cashier`, `stock_staff`, `viewer`) are checked inside RPC functions and policies via `is_workspace_member(ws, array[...])`.
- Sales-creating routes (`create_order`) require role in `(owner, manager, cashier)`.
- Voids require `(owner, manager)`.

### Service-role exposure

- `src/lib/supabase/admin.ts` imports `"server-only"` so the bundler errors if a client component tries to import it.
- Service role key (`SUPABASE_SERVICE_ROLE_KEY`) is never `NEXT_PUBLIC_*`.
- Public-facing pages use the anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) only.

### Spam / abuse

- `/apply` has a hidden honeypot field (`website`); non-empty silently succeeds without inserting.
- DD-16 will add per-IP rate limiting (Upstash Redis or similar).
- Application emails are unique-per-email; duplicates return a friendly error.

### Email impersonation

- Resend domain verification (configured by user during DD-12 setup).
- Subjects + bodies plainly identify the sender ("Cat Booth POS").
- Invite emails contain the code only — no clickable login link, so a phished applicant cannot be redirected.

### Data destruction

- `products` deletion is **soft** via `is_active = false` — never hard-delete; preserves order_items history.
- `void_order` is reason-required and writes both old + new values to `audit_logs`.
- `correct_order` writes old + new to `audit_logs`.
- All admin actions (approve, reject, issue, cancel invite) write to `audit_logs`.

## Secrets management

| Var | Where | Surface |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | env | Browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | env | Browser + server |
| `SUPABASE_SERVICE_ROLE_KEY` | env | Server only |
| `RESEND_API_KEY` | env | Server only |
| `EMAIL_FROM` | env | Server only |
| `ADMIN_EMAIL` | env | Server only |

`.env.local` is git-ignored. Vercel env vars are scoped per-environment.

## What we don't do (yet)

- 2FA for admins (manual, low pilot risk).
- WAF / bot filtering at the edge (DD-16).
- CSP headers (TODO).
- Rate-limited login (Supabase has built-in lockout).

## Reporting a vulnerability

Email security@example.com (placeholder; user-configured at deploy).
