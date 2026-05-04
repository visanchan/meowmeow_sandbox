# Batch Plan — DD-01 through DD-100

100 implementation batches grouped into 8 phases. Each batch is small enough to land in one PR. **TASKS.md** tracks live claim/status; this file is the static plan.

Format per batch:

> `### DD-NN — <title>`
> - **Goal:** what user-visible or system-visible thing changes
> - **Touches:** key paths
> - **Acceptance:** the bar to call it done
> - **Blocker:** external dep that prevents starting (if any)
> - **Depends on:** prior batches that must be merged first

---

## Phase 0 — Foundation (DD-01 → DD-12)

### DD-01 — Repo + stack decision docs
- **Goal:** project vision, batch plan, design tokens, schema overview, pilot rules captured in `docs/`.
- **Touches:** `docs/PROJECT_VISION.md`, `docs/USER_FLOW.md`, `docs/PILOT_RULES.md`, `docs/DESIGN_TOKENS.md`, `docs/DATABASE_SCHEMA.md`, `docs/BATCH_PLAN.md`, `CLAUDE.md`, `TASKS.md`.
- **Acceptance:** docs exist, link to each other, Codex/Claude can pick up cold.

### DD-02 — Next.js scaffold
- **Goal:** empty Next.js 16 app builds clean.
- **Touches:** whole `pos-for-sell/` tree from `create-next-app`.
- **Acceptance:** `npm run dev` shows the default page; `npm run build` succeeds; `npm run lint` clean.

### DD-03 — Project conventions
- **Goal:** strict TS, prettier (or biome), path aliases, basic CI hint.
- **Touches:** `tsconfig.json`, `eslint.config.mjs`, `package.json` scripts, `.editorconfig`, `.prettierrc` (or biome).
- **Acceptance:** `tsc --noEmit` clean; lint clean; format-on-save documented in README.

### DD-04 — Theme tokens (cream/brown palette)
- **Goal:** meowmeow palette mapped into Tailwind v4 via `@theme inline` block in `globals.css`. Remove dark-mode default.
- **Touches:** `src/app/globals.css`, `src/app/layout.tsx`.
- **Acceptance:** `bg-bg`, `text-accent`, `border-line`, `font-display` etc. work in JSX. Default page uses cream background.

### DD-05 — Layout shell
- **Goal:** page chrome — top bar, container, light footer.
- **Touches:** `src/components/chrome/TopBar.tsx`, `src/components/chrome/Footer.tsx`, `src/app/layout.tsx`.
- **Acceptance:** every page inherits the shell; mobile stacks correctly.

### DD-06 — Database schema SQL
- **Goal:** `database/schema.sql` defines all 14 tables with FKs, defaults, check constraints, indexes.
- **Touches:** `database/schema.sql`.
- **Acceptance:** runs cleanly against an empty Supabase Postgres without errors.
- **Blocker:** for *applying* the SQL — needs Supabase project. Writing the file does not.

### DD-07 — RLS policies SQL
- **Goal:** `database/rls-policies.sql` with deny-by-default + per-table policies for applications, invite_codes, workspaces, workspace_members, products, events, event_inventory, orders, order_items, payment_records, send_later_orders, audit_logs.
- **Touches:** `database/rls-policies.sql`.
- **Acceptance:** policies named, RLS enabled, sane allow/deny rules per role.
- **Depends on:** DD-06.

### DD-08 — Seed SQL
- **Goal:** `database/seed.sql` for local dev — 1 admin, 1 demo workspace, 5 demo products, 1 demo event.
- **Touches:** `database/seed.sql`.
- **Acceptance:** local dev DB runs end-to-end after seeding.
- **Depends on:** DD-06, DD-07.

### DD-09 — Database TypeScript types
- **Goal:** generated `src/lib/database.types.ts` from schema.sql (or hand-written skeleton until Supabase CLI is wired).
- **Touches:** `src/lib/database.types.ts`.
- **Acceptance:** `Database['public']['Tables']['orders']['Row']` etc. compiles in TS.

### DD-10 — Supabase client libs
- **Goal:** browser, server (cookies), and admin (service-role) Supabase clients. Env vars read once at module load.
- **Touches:** `src/lib/supabase/client.ts`, `server.ts`, `admin.ts`, `middleware.ts`.
- **Acceptance:** importable from anywhere; ts-strict; admin client refuses to load on the client.
- **Depends on:** DD-09.

### DD-11 — Resend email lib
- **Goal:** `src/lib/email/resend.ts` with typed send helpers; templates in `src/lib/email/templates/`.
- **Touches:** `src/lib/email/resend.ts`, templates dir.
- **Acceptance:** unit-callable function returns success or typed error; no key = clean error message.

### DD-12 — Env management + setup README
- **Goal:** `.env.example`, `.env.local` is gitignored, README explains how to bootstrap Supabase + Resend.
- **Touches:** `.env.example`, `README.md`.
- **Acceptance:** a fresh dev who follows README can `npm run dev` against their own Supabase.

---

## Phase 1 — Public application flow (DD-13 → DD-22)

### DD-13 — Marketing landing /
- **Goal:** simple landing with hero ("POS for cat-product booth sellers"), apply CTA.
- **Touches:** `src/app/page.tsx`.
- **Acceptance:** mobile-first, links to /apply.

### DD-14 — /apply form UI
- **Goal:** form with all fields per USER_FLOW (owner_name, phone, email, brand_name, product_category, social_link, num_skus, events_per_year, message).
- **Touches:** `src/app/apply/page.tsx`, `src/app/apply/Form.tsx` (client component).
- **Acceptance:** form renders, all fields validated client-side via zod.

### DD-15 — /apply server action
- **Goal:** server action inserts row into `applications` and returns success.
- **Touches:** `src/app/apply/actions.ts`.
- **Acceptance:** row appears in Supabase; failures return typed error.
- **Blocker:** Supabase creds.

### DD-16 — /apply spam protection
- **Goal:** honeypot field + per-IP rate limit (Supabase function or Vercel KV).
- **Touches:** `src/app/apply/actions.ts`, helper.
- **Acceptance:** bot-form rejected silently; same IP limited to 3/day.

### DD-17 — /apply admin notification email
- **Goal:** new application emails admin via Resend.
- **Touches:** `src/lib/email/templates/new-application.tsx`, `actions.ts`.
- **Acceptance:** admin receives email within 1 min.
- **Blocker:** Resend creds.

### DD-18 — /apply success page
- **Goal:** /apply/success with what to expect next.
- **Touches:** `src/app/apply/success/page.tsx`.
- **Acceptance:** shown after submit.

### DD-19 — /apply/status check
- **Goal:** lightweight status checker — enter email, see status.
- **Touches:** `src/app/apply/status/page.tsx`, server action.
- **Acceptance:** returns one of pending / approved / rejected / invited / registered.

### DD-20 — TH/EN toggle on public pages
- **Goal:** language switcher on landing + /apply.
- **Touches:** `src/lib/i18n/`, public page components.
- **Acceptance:** switch persists in cookie; both languages render.

### DD-21 — Form analytics
- **Goal:** track funnel (visit → start form → submit) with privacy-friendly counter (Plausible-style or Vercel analytics).
- **Touches:** `src/app/apply/page.tsx`, analytics module.
- **Acceptance:** numbers visible to admin.

### DD-22 — /apply mobile responsive pass
- **Goal:** form usable on iPhone SE-sized viewport.
- **Touches:** `apply/Form.tsx` styles.
- **Acceptance:** no horizontal scroll, no clipped buttons, virtual keyboard does not cover inputs.

---

## Phase 2 — Admin approval (DD-23 → DD-32)

### DD-23 — Admin auth gate
- **Goal:** middleware redirects non-admin users away from `/admin/*`.
- **Touches:** `src/middleware.ts`, `src/lib/auth/admin-check.ts`.
- **Acceptance:** anonymous → /login; non-admin → /; admin → through.

### DD-24 — /admin/applications list
- **Goal:** server-rendered table with filter chips.
- **Touches:** `src/app/admin/applications/page.tsx`.
- **Acceptance:** shows all rows; sortable by created_at; filter by status works.

### DD-25 — Application search
- **Goal:** search by brand name / email / phone.
- **Touches:** `src/app/admin/applications/page.tsx`, search input component.
- **Acceptance:** debounced, server-side filtering.

### DD-26 — Approve / reject action
- **Goal:** action buttons on each row; updates applications.status.
- **Touches:** `src/app/admin/applications/actions.ts`.
- **Acceptance:** status flips; UI optimistically updates.

### DD-27 — Generate invite_code
- **Goal:** approve action also creates `invite_codes` row with 14-day expiry.
- **Touches:** `actions.ts`.
- **Acceptance:** code follows `CATBOOTH-XXXX-YYYY` pattern; unique.

### DD-28 — Invite email
- **Goal:** approve action sends Resend email with the code.
- **Touches:** `src/lib/email/templates/invite.tsx`, action.
- **Acceptance:** applicant receives email; copy is friendly.

### DD-29 — /admin/invite-codes list
- **Goal:** view all codes, status (active/used/expired/cancelled), filter.
- **Touches:** `src/app/admin/invite-codes/page.tsx`.
- **Acceptance:** matches applications by application_id.

### DD-30 — Resend invite
- **Goal:** button to re-send the email if the original was lost.
- **Touches:** `actions.ts`, list UI.
- **Acceptance:** sends, audit_log row written.

### DD-31 — Cancel invite
- **Goal:** mark a code cancelled, code can no longer be redeemed.
- **Touches:** `actions.ts`, list UI.
- **Acceptance:** redeem attempts return "code cancelled".

### DD-32 — Admin audit logging
- **Goal:** every approve/reject/issue/cancel writes an `audit_logs` row.
- **Touches:** action helpers.
- **Acceptance:** rows visible in /admin/audit-log (basic view).

---

## Phase 3 — Registration + workspace (DD-33 → DD-42)

### DD-33 — /register code-redemption page
- **Goal:** step 1 of registration: enter code.
- **Touches:** `src/app/register/page.tsx`.
- **Acceptance:** validates code format client-side.

### DD-34 — Code validation server action
- **Goal:** server checks `invite_codes.status = active`, not expired; returns brand + email.
- **Touches:** `src/app/register/actions.ts`.
- **Acceptance:** typed error on every failure mode (cancelled, expired, used, not-found).

### DD-35 — Supabase Auth signup
- **Goal:** create user with email from invite_code, password from form.
- **Touches:** `actions.ts`.
- **Acceptance:** user can log in immediately after.
- **Blocker:** Supabase Auth configured.

### DD-36 — Workspace creation
- **Goal:** create workspaces row with brand name from invite + chosen slug.
- **Touches:** `actions.ts`, `redeem_invite_code` Postgres function.
- **Acceptance:** transactional with auth signup; rollback on any failure.

### DD-37 — Slug uniqueness + suggestions
- **Goal:** auto-suggest a slug from brand name; user can edit; check uniqueness live.
- **Touches:** `register/Form.tsx`, action.
- **Acceptance:** never lets two workspaces share a slug.

### DD-38 — Owner workspace_member
- **Goal:** insert workspace_members row with role=owner.
- **Touches:** `redeem_invite_code` function.
- **Acceptance:** new user can SELECT their workspace under RLS.

### DD-39 — /login page
- **Goal:** email + password login via Supabase Auth.
- **Touches:** `src/app/login/page.tsx`, `actions.ts`.
- **Acceptance:** redirects to `/app` on success; error toast on fail.

### DD-40 — Forgot password / magic link
- **Goal:** "Forgot password" sends magic link via Supabase Auth.
- **Touches:** `src/app/login/forgot/page.tsx`, action.
- **Acceptance:** new password set; old session invalidated.

### DD-41 — Session middleware
- **Goal:** middleware refreshes Supabase session cookie on every request.
- **Touches:** `src/middleware.ts`.
- **Acceptance:** logged-in users don't get unexpectedly logged out.

### DD-42 — RLS smoke test
- **Goal:** integration test that user A cannot SELECT user B's workspace data.
- **Touches:** `tests/rls-isolation.test.ts`.
- **Acceptance:** test red without policies; green with them.
- **Depends on:** DD-07, DD-38.

---

## Phase 4 — Product setup (DD-43 → DD-54)

### DD-43 — /app/setup/products empty state
- **Goal:** post-registration landing page; "add your first product" CTA.
- **Touches:** `src/app/app/setup/products/page.tsx`.
- **Acceptance:** empty state visible; product list view ready when products exist.

### DD-44 — Create product modal
- **Goal:** form for SKU, name, category, price (THB), stock, send_later_enabled, image.
- **Touches:** `src/app/app/setup/products/CreateProductModal.tsx`.
- **Acceptance:** validates client-side; price input shows THB live preview.

### DD-45 — Image upload to Supabase Storage
- **Goal:** upload image to `product-images/{workspace_id}/{product_id}.webp`.
- **Touches:** `src/lib/storage/product-images.ts`.
- **Acceptance:** upload works; retry on failure; signed URL stored on row.
- **Blocker:** Supabase Storage bucket configured.

### DD-46 — Image client-side compression
- **Goal:** before upload, resize to max 1024px wide and convert to WebP.
- **Touches:** `src/lib/image/compress.ts`.
- **Acceptance:** 5MB phone photos become <250KB WebP.

### DD-47 — Edit product
- **Goal:** edit existing product card (everything except SKU).
- **Touches:** `EditProductModal.tsx`, `actions.ts`.
- **Acceptance:** updated row reflects in list.

### DD-48 — Soft delete product
- **Goal:** mark product `is_active = false` instead of hard-delete (preserves order_items history).
- **Touches:** `actions.ts`, list view filter.
- **Acceptance:** inactive products hidden from POS but still appear in past order receipts.

### DD-49 — CSV bulk import
- **Goal:** drop a CSV with SKU, name, category, price, stock; preview, confirm, insert.
- **Touches:** `src/app/app/setup/products/import/page.tsx`.
- **Acceptance:** 50 rows in <30s; errors per-row.

### DD-50 — Categories
- **Goal:** typed category column on products + /app/setup/categories admin.
- **Touches:** schema migration if needed; `src/app/app/setup/categories/page.tsx`.
- **Acceptance:** POS grid filters by category.

### DD-51 — SKU validation
- **Goal:** SKU unique within workspace; allowed chars only.
- **Touches:** schema constraint + form.
- **Acceptance:** double-add rejected with clear error.

### DD-52 — Active/inactive toggle
- **Goal:** quick switch on each product card.
- **Touches:** list view.
- **Acceptance:** instantly removes from POS visibility.

### DD-53 — Initial stock entry
- **Goal:** during product create, optionally enter initial stock that flows into the next event_inventory.
- **Touches:** create modal, action.
- **Acceptance:** stock value stored on products as `default_starting_qty`.

### DD-54 — Setup completion gate
- **Goal:** workspaces.setup_complete=true requires ≥3 active products. Block /app/pos until true.
- **Touches:** middleware, /app router, action.
- **Acceptance:** /app/pos redirects to /app/setup/products when not complete.

---

## Phase 5 — POS core (DD-55 → DD-74)

### DD-55 — /app/pos product grid
- **Goal:** translate meowmeow product card to React + Tailwind. Image, SKU chip, stock chip, price.
- **Touches:** `src/app/app/pos/ProductGrid.tsx`, `ProductCard.tsx`.
- **Acceptance:** visual parity with meowmeow on a 1024×768 tablet.

### DD-56 — Sticky cart panel
- **Goal:** right-side sticky cart on desktop; bottom drawer on mobile.
- **Touches:** `src/app/app/pos/CartPanel.tsx`.
- **Acceptance:** matches meowmeow layout.

### DD-57 — Add-to-cart logic
- **Goal:** client cart state (Zustand or React context); deduplicates lines by SKU.
- **Touches:** `src/lib/pos/cart-store.ts`.
- **Acceptance:** quantity bumps correctly; client-side reservation reflects optimistic stock.

### DD-58 — Quantity controls
- **Goal:** +/- buttons + number input. Disable - at 1 (auto-remove confirmation).
- **Touches:** `CartLine.tsx`.
- **Acceptance:** matches meowmeow.

### DD-59 — Remove line
- **Goal:** swipe-or-X to remove. Soft confirm if line value > 500 THB.
- **Touches:** `CartLine.tsx`.
- **Acceptance:** clean UX.

### DD-60 — Subtotal/discount/total
- **Goal:** live total in summary block; tabular-nums; accent-strong.
- **Touches:** `CartSummary.tsx`.
- **Acceptance:** integer satang math throughout.

### DD-61 — Discount input
- **Goal:** flat discount input (per-cart). Defaults: 0, 50, 100 chips.
- **Touches:** `CartSummary.tsx`.
- **Acceptance:** never goes below zero total.

### DD-62 — Payment method buttons
- **Goal:** cash, transfer, card, other. Active state matches meowmeow.
- **Touches:** `PaymentMethodPicker.tsx`.
- **Acceptance:** state stored in cart; required before confirm.

### DD-63 — PromptPay QR
- **Goal:** when transfer selected, show PromptPay QR with the exact total.
- **Touches:** `PromptPayQR.tsx`, lib.
- **Acceptance:** scanned in a real banking app yields the right amount.

### DD-64 — Receipt review screen
- **Goal:** modal with line items, total, payment method, customer optional fields. "Confirm sale" button.
- **Touches:** `ReviewSaleModal.tsx`.
- **Acceptance:** matches meowmeow review.

### DD-65 — Confirm order via RPC
- **Goal:** call `create_order` Postgres function from server action.
- **Touches:** `src/app/app/pos/actions.ts`, `database/functions/create_order.sql`.
- **Acceptance:** atomic sale write end-to-end.
- **Depends on:** DD-06, DD-07.

### DD-66 — Inventory atomicity
- **Goal:** create_order acquires row-level lock on event_inventory; rejects if qty < requested.
- **Touches:** `database/functions/create_order.sql`.
- **Acceptance:** concurrent test (two staff sell last unit) — exactly one succeeds.

### DD-67 — Receipt success page
- **Goal:** post-sale screen with order number, total, "next sale" CTA.
- **Touches:** `src/app/app/pos/success/[orderId]/page.tsx`.
- **Acceptance:** clear, fast.

### DD-68 — Print/share receipt
- **Goal:** "Send receipt" via email or copy a link.
- **Touches:** receipt page, action.
- **Acceptance:** email sends; link works for the customer (signed, time-limited).

### DD-69 — Cart clear after sale
- **Goal:** sale success clears the local cart.
- **Touches:** `cart-store.ts`.
- **Acceptance:** new sale starts empty.

### DD-70 — Customer info fields
- **Goal:** optional name/phone/email on order. For send-later: required.
- **Touches:** review modal.
- **Acceptance:** validation + persistence.

### DD-71 — Per-line note
- **Goal:** small note input per cart line (e.g., "no scarf").
- **Touches:** `CartLine.tsx`.
- **Acceptance:** stored on order_items.note.

### DD-72 — iPad layout pass
- **Goal:** verify on 1024×768 portrait tablet usage.
- **Touches:** styles.
- **Acceptance:** no overflow, large touch targets.

### DD-73 — Search + category filter
- **Goal:** product grid filterable by category and free-text search.
- **Touches:** `ProductGrid.tsx`.
- **Acceptance:** matches meowmeow's quick-filter UX.

### DD-74 — Sample/free-item handling
- **Goal:** support a per-cart "free sample" slot (no payment, deducts stock).
- **Touches:** cart UI + create_order payload.
- **Acceptance:** free units recorded; payment_method = "sample".

---

## Phase 6 — Send-later orders (DD-75 → DD-84)

### DD-75 — Cart fulfillment toggle
- **Goal:** per-line toggle: take_now vs send_later.
- **Touches:** `CartLine.tsx`.
- **Acceptance:** visual matches meowmeow's fulfillment badge.

### DD-76 — Send-later customer form
- **Goal:** when any line is send_later, customer name + phone + address required at review.
- **Touches:** review modal.
- **Acceptance:** can't confirm without complete shipping info.

### DD-77 — send_later_orders rows
- **Goal:** create_order writes one send_later_orders row per qualifying order.
- **Touches:** `create_order.sql`.
- **Acceptance:** linked to order_id.

### DD-78 — Shipping fee calc
- **Goal:** per-SKU shipping fee on products; aggregated and added to order total.
- **Touches:** schema (products.shipping_fee), cart logic, RPC.
- **Acceptance:** matches meowmeow Send Later fee behavior.

### DD-79 — /app/send-later list
- **Goal:** list of pending fulfillments with filters by status.
- **Touches:** `src/app/app/send-later/page.tsx`.
- **Acceptance:** filter by date, status; row shows customer + SKUs.

### DD-80 — Status flow
- **Goal:** pending → packed → shipped → completed; with optional cancelled.
- **Touches:** action + UI buttons.
- **Acceptance:** audit_log row per transition.

### DD-81 — Tracking number
- **Goal:** input on `shipped` action; saved on send_later_orders row.
- **Touches:** UI + action.
- **Acceptance:** customer email includes tracking.

### DD-82 — Customer notification on status change
- **Goal:** on packed/shipped/completed, email customer.
- **Touches:** `src/lib/email/templates/`.
- **Acceptance:** templates clear, in TH and EN.

### DD-83 — CSV export for shipping
- **Goal:** export pending fulfillments as CSV with all shipping fields.
- **Touches:** action.
- **Acceptance:** matches the format the user pastes into their courier portal.

### DD-84 — Cancellation flow
- **Goal:** cancel a send-later — refunds money, restores inventory if not yet shipped.
- **Touches:** action + RPC.
- **Acceptance:** audit + payment reversal.

---

## Phase 7 — Dashboard + end-of-day (DD-85 → DD-94)

### DD-85 — /app/dashboard today metrics
- **Goal:** total sales, # bills, avg bill — for today.
- **Touches:** `src/app/app/dashboard/page.tsx`.
- **Acceptance:** matches meowmeow tile look.

### DD-86 — Payment split tile
- **Goal:** cash/transfer/card breakdown.
- **Touches:** `PaymentSplitTile.tsx`.
- **Acceptance:** sums to total.

### DD-87 — Top sellers
- **Goal:** top 5 SKUs today with qty + revenue.
- **Touches:** `TopSellersTile.tsx`.
- **Acceptance:** matches meowmeow Top Sellers.

### DD-88 — Inventory remaining + low-stock alerts
- **Goal:** current event_inventory.current_qty per SKU; red chip if low.
- **Touches:** `InventoryRemaining.tsx`.
- **Acceptance:** updates after each sale.

### DD-89 — Day picker
- **Goal:** select an event day to view its dashboard.
- **Touches:** `DayPicker.tsx`.
- **Acceptance:** historical day data is read-only.

### DD-90 — Hour-by-hour chart
- **Goal:** sales by hour, with ghost bars for previous days.
- **Touches:** `HourBars.tsx`.
- **Acceptance:** matches meowmeow ghost-bar feature.

### DD-91 — Goal/pace strip
- **Goal:** target total + pace needed per remaining hour.
- **Touches:** `PaceStrip.tsx`.
- **Acceptance:** matches meowmeow goal + 4-day pace.

### DD-92 — End-of-day close
- **Goal:** close action sets event status, writes a close row, snapshots totals.
- **Touches:** `src/app/app/events/[id]/close/page.tsx`, action.
- **Acceptance:** day cannot be re-opened without admin override.

### DD-93 — Per-day CSV export
- **Goal:** export day CSV (orders, items, payments).
- **Touches:** action.
- **Acceptance:** byte-equivalent to meowmeow's day CSV.

### DD-94 — Bulk Export All Day CSVs
- **Goal:** zip of every day's CSV for a closed event.
- **Touches:** action.
- **Acceptance:** matches meowmeow's bulk export.

---

## Phase 8 — Polish + pilot readiness (DD-95 → DD-100)

### DD-95 — Inventory correction page
- **Goal:** /app/inventory adjust qty with reason. Owner-only.
- **Touches:** `src/app/app/inventory/page.tsx`, RPC.
- **Acceptance:** audit_log row written; current_qty updates.

### DD-96 — Bill correction / void
- **Goal:** correct an existing order or void it; respects atomicity.
- **Touches:** `src/app/app/correction/page.tsx`, `void_order` RPC, `correct_order` RPC.
- **Acceptance:** matches meowmeow's correction center.

### DD-97 — Audit log viewer
- **Goal:** /app/audit-log filterable by user, action, date.
- **Touches:** `src/app/app/audit-log/page.tsx`.
- **Acceptance:** export CSV.

### DD-98 — Error tracking
- **Goal:** Sentry (or PostHog) wired for client + server.
- **Touches:** `src/instrumentation.ts`, env.
- **Acceptance:** test error appears in dashboard within 1 min.
- **Blocker:** Sentry/PostHog account.

### DD-99 — Onboarding tour
- **Goal:** first-login walkthrough — setup → first product → first sale.
- **Touches:** `src/components/tour/`.
- **Acceptance:** dismissible; resumable.

### DD-100 — Pilot launch checklist + admin monitoring
- **Goal:** /admin/pilot-status with per-workspace health (last sale, low stock, send-later backlog).
- **Touches:** `src/app/admin/pilot-status/page.tsx`.
- **Acceptance:** founder can see all 5 brands at a glance.

---

## Phase boundaries (review checkpoints)

- After **DD-12**: foundation ready, real Supabase keys must be available before DD-15.
- After **DD-32**: full pre-registration funnel works end-to-end.
- After **DD-42**: a real client can register through invite flow; data isolation tested.
- After **DD-54**: a real client can prepare their catalog.
- After **DD-74**: a real sale can complete with money on a real card/PromptPay/cash.
- After **DD-84**: send-later fulfillment is operational.
- After **DD-94**: end-of-event experience matches meowmeow.
- After **DD-100**: pilot is live with admin oversight.

## Dependency notes

- DD-15, DD-17, DD-26, DD-28, DD-30, DD-35, DD-45, DD-65, DD-82 require live Supabase/Resend.
- DD-65, DD-66 require the `create_order` Postgres function to exist.
- DD-92, DD-94 are blocked by DD-65 (need real sale rows).
- DD-100 is blocked by everything before it.
