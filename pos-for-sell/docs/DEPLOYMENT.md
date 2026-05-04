# Deployment (Vercel)

## One-time setup

1. **Push the repo to GitHub** if not already there.
2. https://vercel.com → New Project → Import the repo.
3. **Root Directory**: `pos-for-sell` (this is critical — Vercel will run `npm install` and `npm run build` inside this folder).
4. **Framework Preset**: Next.js (auto-detected).
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `.next` (default).
7. **Install Command**: `npm install` (default).
8. **Environment Variables**: copy from `pos-for-sell/.env.local` (see `docs/ENV_VARS.md`).
9. **Deploy**.

## After first deploy

- The first deployment will fail without the Supabase env vars; that's expected. Add them and redeploy.
- `/admin/*` will gate on `admin_users`. Manually insert a row in Supabase SQL editor:
  ```sql
  insert into public.admin_users (user_id) values ('<your-auth-uid>');
  ```
- Apply database migrations: run `database/schema.sql`, then `database/rls-policies.sql`, then optionally `database/seed.sql` and the `database/functions/*.sql` (after the schema is up).

## Environments

| Env | Trigger | Use |
|---|---|---|
| Production | merge to `main` | live booth |
| Preview | every PR | review per change |
| Development | `npm run dev` | local |

Set per-environment env vars in Vercel — production should point at the production Supabase project, preview at a staging project (or share production read-only).

## Domains

- Production gets `<project>.vercel.app` automatically.
- Custom domain (e.g. `catbooth.app`) can be added in Vercel Project Settings → Domains.
- Configure DNS at the registrar per Vercel's instructions.
- TLS is automatic.

## Rollbacks

Vercel keeps every deployment. From the dashboard, click any past deploy → Promote → Promote to Production. Rollback takes seconds and is non-destructive.

## Database migrations

Schema changes ship as new SQL files under `database/`. Apply them in order in the Supabase SQL editor. There is no `migrate` CLI in this repo yet; for the pilot, manual application is fine. Track applied migrations in a hand-curated list in `docs/DEPLOYMENT.md` (this file) once we hit migration #2.

| # | Date | File | Notes |
|---|---|---|---|
| 1 | unapplied | `schema.sql` | Initial 13 tables + helpers |
| 2 | unapplied | `rls-policies.sql` | RLS policies + helpers |
| 3 | unapplied | `seed.sql` | Demo data (dev only; do NOT run in prod) |
| 4 | unapplied | `functions/create_order.sql` | atomic sale RPC |
| 5 | unapplied | `functions/void_order.sql` | inventory restore |
| 6 | unapplied | `functions/correct_order.sql` | customer-info patch |
| 7 | unapplied | `functions/redeem_invite_code.sql` | workspace creation |

## Build sizes

`npm run build` outputs route-level bundle sizes. Watch for any single page > 200kB First Load JS — investigate before merging.

## Dev → preview → prod promotion

Pilot-stage flow:

1. Create branch `pos/DD-XXX-...` off `main`.
2. Open PR → Vercel auto-builds a preview URL.
3. User reviews preview → merge.
4. Production deploy fires automatically.
5. If bad, click Promote on the previous deploy.
