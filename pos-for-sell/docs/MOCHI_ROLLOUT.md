# Mochi POS — Design Rollout

Tracks the migration of `pos-for-sell` to the Mochi design system — one unified indigo/lavender brand across the whole app. See `.claude/skills/mochipos-design/SKILL.md` and `docs/DESIGN_TOKENS.md`.

## Done (PR #73)
- **Token foundation** — `globals.css` `:root` remapped to Mochi indigo/lavender; Nunito; cool indigo-tinted shadows; radii 16/20/28; `.btn-accent` / `.panel` tokenised so helpers follow the tokens.
- **Per-surface recolor** — all hard-coded brown/cream hex literals across ~24 component files converted to the indigo system. Categorical colors (Shopee orange, Lazada blue, ok-greens) preserved on purpose.
- **Verified** — `npm run build` (29 routes) + lint (0 errors) + typecheck green.
- **Accessibility (WCAG AA)** — contrast audit of the token palette: every real text pair passes ≥4.5:1 (text/bg 15.7 · muted/bg 5.1 · accent/bg 12.2 · status pairs 5.6–6.5 · white-on-indigo-button 10.1–14.0). The lavender highlight (`--color-gold` `#b8a9f0`) measures 2.1 on white, so keep it to backgrounds/accents only — it is not used as text anywhere today.

## Backlog (prioritized) — discretionary polish, best reviewed visually
Each loop fire takes the top unblocked item. Items marked 👁 want a visual eyeball.

1. ✅ **Brand identity** — Mochi wordmark ("Mochi" indigo + "POS" lavender) + mascot now in the app header (`app/layout.tsx`), the `/apply` topbar, and the landing `/` (topbar + hero brand card). Assets in `public/mochi-mascot.png` (from the handoff `project/assets/`).
2. ✅ **Landing `/`** — redesigned to the Mochi system: brand topbar, two-column hero (pitch + mascot/wordmark brand card carrying the value-prop tagline), Mochi feature cards, closing CTA band. Existing EN/TH copy preserved; added one additive `landing.tagline` i18n key.
3. ✅ **Dashboard `/app/dashboard`** — redesigned to the Mochi mockup; multi-period `DashboardLive` composed in (PR #76, building on the #73 wiring).
4. **Event setup `/app/events*`** 👁 — `screens/event-setup.html`: stock allocator + sample bucket. *(Likely net-new — no `/app/events*` route exists yet.)*
5. ✅ **Customer portal `/register/[token]`** — redesigned to `screens/pet-portal.html` (PR #77).
6. **Onboarding / apply / admin** — ✅ onboarding (PR #79) + apply (PR #78) done; ⏳ **admin** `/admin/*` tables/forms still owe the Mochi convention pass (labels above fields, 4-state status chips, one primary CTA per view).
7. **POS till + receipt** 👁 — confirm the indigo reads well at booth speed (large touch targets, PAY prominence). *(Next up.)*

## Resolved founder decisions
- **CLAUDE.md rule #9** — ✅ Resolved (no change needed). `pos-for-sell/CLAUDE.md` rule #9 already reads *"Visual language follows Mochi. Unified indigo/lavender brand across the whole app…"*.
- **ok-greens** — ✅ Resolved: keep as-is. Every UI green already routes through the `--color-ok-soft-*` tokens (`#195e3b` on `#d8efe2`), which *are* the Mochi design skill's canonical ok-status color — no stray "original" greens remain in `src` (Pill `ok`, Toast, qty steppers, onboarding, register all use the tokens). The earlier `#1f7a4d` target was off-spec: lighter than `#195e3b`, it would lower contrast on the soft-bg and risk the WCAG-AA the palette already passes.

## Working rules
- Per-surface work goes on its own branch + PR; never to `main` directly; no self-merge.
- Keep `npm run build` + lint + typecheck green.
- Keep the post-purchase-CRM rule: no customer/pet capture in the checkout flow.
