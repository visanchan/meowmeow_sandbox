# Batch Plan Vol 2 — DD-101 → DD-200

100 credential-free batches that can land before any Supabase/Resend/Vercel work. They make the original 100-batch plan in `BATCH_PLAN.md` faster to land once creds arrive.

Format: `DD-NNN — title — touches`.

## Wave 1 — Pure logic libraries (DD-101 → DD-110)

- DD-101 — PromptPay QR generator (EMVCo-compliant, with CRC16) — `src/lib/promptpay/`
- DD-102 — Slug generator (brand → URL slug, ASCII-folded) — `src/lib/slug/`
- DD-103 — Invite code generator (`CATBOOTH-XXXX-YYYY`, ambiguity-safe) — `src/lib/invite-code/`
- DD-104 — Order number generator (per-event sequence, e.g. `event_001`) — `src/lib/order-number/`
- DD-105 — Cart calculator (subtotal, shipping, discount, total) — `src/lib/pos/calc.ts`
- DD-106 — Image compression (canvas resize + WebP) — `src/lib/image/`
- DD-107 — SKU validator (allowed chars, length, uniqueness signal) — `src/lib/sku/`
- DD-108 — Phone normalizer (TH local + intl format) — `src/lib/phone/`
- DD-109 — CSV builder (RFC 4180 escaping) — `src/lib/csv/`
- DD-110 — Date / TH timezone helpers — `src/lib/date/`

## Wave 2 — Postgres RPC SQL files (DD-121 → DD-124)

Written but not applied. Ready to drop into Supabase SQL editor after schema is up.

- DD-121 — `database/functions/create_order.sql` — atomic sale write with FOR UPDATE on event_inventory; inserts orders + items + payment_records + send_later_orders + audit_logs.
- DD-122 — `database/functions/void_order.sql` — restores inventory, marks order voided, audit row.
- DD-123 — `database/functions/correct_order.sql` — diff-based correction; recomputes inventory delta vs original; audit row.
- DD-124 — `database/functions/redeem_invite_code.sql` — code validation + workspace creation + first member; uses Auth signup elsewhere then call this from server action.

## Wave 3 — Tests for Wave 1 (DD-111 → DD-120)

- DD-111 — Vitest config + npm scripts — `vitest.config.ts`, `package.json`
- DD-112 — Test PromptPay QR (known fixtures) — `tests/lib/promptpay.test.ts`
- DD-113 — Test slug generator — `tests/lib/slug.test.ts`
- DD-114 — Test invite code generator — `tests/lib/invite-code.test.ts`
- DD-115 — Test order number generator — `tests/lib/order-number.test.ts`
- DD-116 — Test cart calculator — `tests/lib/pos-calc.test.ts`
- DD-117 — Test SKU validator — `tests/lib/sku.test.ts`
- DD-118 — Test phone normalizer — `tests/lib/phone.test.ts`
- DD-119 — Test CSV builder — `tests/lib/csv.test.ts`
- DD-120 — Test date helpers — `tests/lib/date.test.ts`

## Wave 4 — Component library (DD-125 → DD-134)

Reusable visual primitives. Carry meowmeow style; minimum API surface.

- DD-125 — `Button` — `src/components/ui/Button.tsx`
- DD-126 — `TextInput` — `src/components/ui/TextInput.tsx`
- DD-127 — `NumberInput` — `src/components/ui/NumberInput.tsx`
- DD-128 — `Textarea` — `src/components/ui/Textarea.tsx`
- DD-129 — `Select` — `src/components/ui/Select.tsx`
- DD-130 — `Checkbox` + `Radio` — `src/components/ui/Checkbox.tsx`, `Radio.tsx`
- DD-131 — `Modal` (focus trap, escape close) — `src/components/ui/Modal.tsx`
- DD-132 — `Toast` (queue + dismiss + provider) — `src/components/ui/Toast.tsx`
- DD-133 — `Pill` / `Chip` — `src/components/ui/Pill.tsx`
- DD-134 — Skeleton / Empty / Error states — `src/components/ui/States.tsx`

## Wave 5 — Dashboard + admin mocks (DD-135 → DD-144)

UI-only renders against mock data; ready to swap in Supabase queries.

- DD-135 — `/app/dashboard` upgrade: today metrics tile + payment split tile (mock data) — `src/app/app/dashboard/`
- DD-136 — Top sellers tile (mock) — `src/app/app/dashboard/TopSellers.tsx`
- DD-137 — Inventory remaining tile + low-stock alerts (mock) — `src/app/app/dashboard/InventoryTile.tsx`
- DD-138 — Hour-by-hour bar chart (mock with ghost previous-day) — `src/app/app/dashboard/HourBars.tsx`
- DD-139 — Goal/pace strip (mock target) — `src/app/app/dashboard/PaceStrip.tsx`
- DD-140 — `/admin/invite-codes` mock list + filter — `src/app/admin/invite-codes/`
- DD-141 — `/admin/workspaces` mock list — `src/app/admin/workspaces/`
- DD-142 — `/admin/audit-log` mock list — `src/app/admin/audit-log/`
- DD-143 — `/admin/pilot-status` overview — `src/app/admin/pilot-status/`
- DD-144 — Approve / reject action shells on `/admin/applications` — `src/app/admin/applications/Actions.tsx`

## Wave 6 — Polish + a11y (DD-145 → DD-154)

- DD-145 — Root `error.tsx` and `not-found.tsx` — `src/app/`
- DD-146 — `/app/*` `not-found.tsx` — `src/app/app/`
- DD-147 — Route-level `loading.tsx` — `src/app/{apply,admin,app}/loading.tsx`
- DD-148 — Toast provider wired in `layout.tsx` — `src/app/layout.tsx`
- DD-149 — Focus trap on Modal — `src/components/ui/Modal.tsx`
- DD-150 — Keyboard navigation across product grid — `src/app/app/pos/ProductGrid.tsx`
- DD-151 — ARIA labels pass on POS — `src/app/app/pos/`
- DD-152 — Respect `prefers-reduced-motion` — `src/app/globals.css`
- DD-153 — Image LCP via `next/image` where appropriate — `src/app/page.tsx`, etc.
- DD-154 — Bundle analyzer script — `package.json`, `next.config.ts`

## Wave 7 — Tests scaffolding (DD-155 → DD-164)

- DD-155 — Vitest config tightened (already set up in DD-111; this layers in coverage)
- DD-156 — Playwright config + first browser install instructions — `playwright.config.ts`
- DD-157 — Smoke: landing renders — `tests/e2e/landing.spec.ts`
- DD-158 — Smoke: apply form fields render and validate — `tests/e2e/apply.spec.ts`
- DD-159 — Smoke: POS add-to-cart — `tests/e2e/pos-add.spec.ts`
- DD-160 — Smoke: cart math live total — `tests/e2e/pos-totals.spec.ts`
- DD-161 — Smoke: payment picker — `tests/e2e/pos-payment.spec.ts`
- DD-162 — Smoke: review modal opens + closes — `tests/e2e/pos-review.spec.ts`
- DD-163 — Smoke: discount input clamps to 0+ — `tests/e2e/pos-discount.spec.ts`
- DD-164 — CI workflow file — `.github/workflows/ci.yml`

## Wave 8 — Docs (DD-165 → DD-174)

- DD-165 — `docs/ARCHITECTURE.md`
- DD-166 — `docs/SECURITY.md`
- DD-167 — `docs/PERFORMANCE.md`
- DD-168 — `docs/ACCESSIBILITY.md`
- DD-169 — `CONTRIBUTING.md`
- DD-170 — `docs/CODE_STYLE.md`
- DD-171 — `docs/ENV_VARS.md`
- DD-172 — `docs/DEPLOYMENT.md`
- DD-173 — `docs/INCIDENT_RESPONSE.md`
- DD-174 — `docs/GLOSSARY.md`

## Wave 9 — i18n scaffolding (DD-175 → DD-184)

- DD-175 — i18n core utility (cookie-driven) — `src/lib/i18n/`
- DD-176 — `LanguageSwitcher` component — `src/components/LanguageSwitcher.tsx`
- DD-177 — TH/EN dictionary: landing — `src/lib/i18n/dictionaries/landing.ts`
- DD-178 — TH/EN dictionary: apply — `src/lib/i18n/dictionaries/apply.ts`
- DD-179 — TH/EN dictionary: login/register — `src/lib/i18n/dictionaries/auth.ts`
- DD-180 — TH/EN dictionary: admin — `src/lib/i18n/dictionaries/admin.ts`
- DD-181 — TH/EN dictionary: POS — `src/lib/i18n/dictionaries/pos.ts`
- DD-182 — TH/EN dictionary: dashboard — `src/lib/i18n/dictionaries/dashboard.ts`
- DD-183 — TH/EN dictionary: emails — `src/lib/email/templates/i18n.ts`
- DD-184 — Plug i18n into landing/apply pages — `src/app/page.tsx`, `src/app/apply/`

## Wave 10 — Visual fidelity passes (DD-185 → DD-189)

- DD-185 — Sticky cart polish (matches meowmeow exactly) — `src/app/app/pos/CartPanel.tsx`
- DD-186 — Product card hover refinement — `src/app/app/pos/ProductCard.tsx`
- DD-187 — Receipt success page — `src/app/app/pos/success/[orderId]/page.tsx`
- DD-188 — PromptPay QR display when `promptpay` selected — `src/app/app/pos/PaymentPicker.tsx` + `PromptPayDisplay.tsx`
- DD-189 — Mobile bottom drawer polish — `src/app/app/pos/POSWorkspace.tsx`

## Wave 11 — Misc fillers (DD-190 → DD-200)

- DD-190 — `LowStockAlert` component (reused dashboard / inventory pages)
- DD-191 — `OrderSummary` component (reused review / receipt / dashboard)
- DD-192 — `useDebouncedValue` hook
- DD-193 — `useLocalStorageState` hook (UI-only state, opt-in)
- DD-194 — `cn` classnames helper — `src/lib/cn.ts`
- DD-195 — `BrandHeader` component — `src/components/chrome/BrandHeader.tsx`
- DD-196 — `Footer` component — `src/components/chrome/Footer.tsx`
- DD-197 — `RoleBadge` component — `src/components/RoleBadge.tsx`
- DD-198 — `Money` formatter component — `src/components/Money.tsx`
- DD-199 — favicon + open-graph image — `public/`
- DD-200 — Final memory + status doc — `docs/STATUS.md`

## Phase boundaries

- After Wave 1+3: pure logic provably correct.
- After Wave 2: mutations have a working contract Supabase can run.
- After Wave 4+10: visual primitives match meowmeow.
- After Wave 5: every key screen has a placeholder.
- After Wave 6+9: app is shippable to a non-English booth user.
- After Wave 7: regressions catchable.
- After Wave 8: a future contributor can ramp.
