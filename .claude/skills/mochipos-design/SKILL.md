---
name: mochipos-design
description: Mochi POS design system for the pos-for-sell Next.js SaaS. Two layers — indigo/lavender SaaS chrome (landing, apply, onboarding, admin, dashboard, event setup, product setup, customers, settings, customer portal) and the cream/brown Meowmeow cashier flow (POS till + printed receipt). Covers brand tokens, palette-per-surface, component patterns, voice, and the post-purchase-CRM rule. Use when building, restyling, reviewing, or rebranding any pos-for-sell UI, applying Mochi brand/tokens, or when the user mentions the Mochi design system, the design handoff, or skinning the SaaS.
user-invocable: true
---

# Mochi POS — Design System

Apply the Mochi brand to **`pos-for-sell/`** (Next.js 16 · React 19 · Tailwind v4).
Strategy in one line: **"Sell fast at the booth. Build the customer relationship after the sale."**

## The one rule (non-negotiable)
**Customer + pet registration is post-purchase, never in checkout.** The cashier flow stays fast and low-typing. Pet name / allergies / contacts / loyalty live on the QR-linked customer portal (F12) and the returning-customer lookup (F14) — never as a checkout form. Reject any design that blocks the till with a CRM form.

## Two layers — pick the palette by surface
| Layer | Surfaces | Palette |
|---|---|---|
| **SaaS** (Mochi) | `/`, `/apply`, `/onboarding`, `/admin/*`, `/app/dashboard`, `/app/events*`, `/app/setup*`, `/app/customers`, `/app/settings`, `/register/[token]` portal | indigo / lavender / cream |
| **Cashier** (Meowmeow heritage) | `/app/pos`, `/app/pos/success/[orderId]` receipt | cream / brown |

The till + receipt keep the warm Meowmeow look on purpose (calm, museum-curatorial). Everything else is the friendly indigo Mochi brand.

## Tokens live in one file
The app is **token-driven**: `pos-for-sell/src/app/globals.css` defines `--color-*` / `--radius-*` / `--shadow-*` and exposes them to Tailwind v4 via `@theme inline`. Components consume the utilities (`bg-bg`, `text-accent`, `rounded-[var(--radius-xl)]`). **Re-skinning a layer = remap token VALUES in `globals.css` — not editing every component.**

> Today *every* surface uses the cream/brown values (CLAUDE.md hard rule #9 + `docs/DESIGN_TOKENS.md`). Adopting Mochi for SaaS surfaces means introducing the indigo values below and updating rule #9 — confirm the rebrand before mass-applying.

## SaaS palette (indigo/lavender) — target
- **Brand:** `--indigo #2d2960` (primary), `--lavender #b8a9f0` (accent = the "POS" half of the wordmark), `--cream #f4eedf` (receipt/order accents only).
- **Surfaces:** page `#f7f5fb` (gradient `#fbfaff → #f3eef9`), panel `#ffffff`, hairline `#e5dff0`. Text `#1c1838`, muted `#6b6489`.
- **Type:** Nunito 400/600/700/800/900 (Google Fonts — flagged substitute for the logo's custom face). Display 800–900 at `-.02/-.025em`; body 14–16px. `.num` = tabular numerics.
- **Shadows:** cool indigo-tinted only (`--shadow-rest / -card / -pop`), never warm-brown.
- **Radii:** generous 12 / 16 / 20 / 28 / 36; pills 999px. No sharp corners (mascot-roundness).
- **Buttons:** primary indigo gradient `#3d3686 → #2a2557`; accent flat lavender; secondary white + indigo text + hairline. Focus ring `0 0 0 4px var(--lavender-200)`.

## Cashier palette (cream/brown) — keep as-is
`--color-bg #f6f0e6`, `--color-accent #8d6236` / `--color-accent-strong #6e4b27`, text `#2b231d`. Fonts Aptos + Georgia display. Brown-tinted `--shadow-card`. This is the current `globals.css` — leave it for the till + receipt.

## Money & voice
- **Money:** `฿` prefix, no decimals on whole numbers, tabular numerics everywhere.
- **Voice (SaaS):** warm, founder-built, peer-to-peer ("Today's takings", not "Revenue"). Sentence-case UI, UPPER `.08em` eyebrows, second person. The portal addresses the customer about their pet by name.
- **Emoji:** only on the customer portal (🐱 🐶 🐰) + the receipt 🐾 glyph. Never in dashboards / admin / settings.

## Workflow (applying it)
1. Identify the surface's layer (table above).
2. SaaS surface: ensure Nunito is loaded; use the indigo/lavender tokens; match the closest reference screen.
3. Re-skin broadly by editing token VALUES in `globals.css`; touch components only for structure, never hard-coded color literals.
4. Keep the post-purchase rule. Run `npm run lint` + `npm run typecheck` (both green) before handing off.

## Reference (in repo — read for depth, don't duplicate)
- **Handoff:** `pos-for-sell/Mochi POS Design System-handoff/mochi-pos-design-system/`
  - SaaS tokens: `project/colors_and_type.css` · cashier tokens: `project/legacy/colors_and_type.css`
  - Anchor screens: `project/screens/{dashboard,event-setup,pet-portal}.html`
  - Component specimens: `project/preview/*.html` · legacy UI kits: `project/legacy/ui_kits/`
  - Assets: `project/assets/` (`mochi-wordmark.png`, `mochi-mascot.png`, `mochi-face.png`)
- **Current app:** `pos-for-sell/src/app/globals.css`, `pos-for-sell/docs/DESIGN_TOKENS.md`
