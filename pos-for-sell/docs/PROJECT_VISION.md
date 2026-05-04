# Cat Booth POS SaaS — Project Vision

## What it is

A web-based POS for cat-product booth sellers. Hosted on Vercel. Database, auth, and image storage on Supabase. Each client is a separate workspace with row-level isolation.

## Who it's for

The pilot targets exactly **5 cat-product brands** that:

- Sell at booths/events (pet expos, weekend markets, brand fairs)
- Have 10–100 SKUs
- Take cash + PromptPay/transfer + card
- Sometimes need send-later fulfillment for stock-out items
- Are willing to give weekly feedback during the pilot

Reject (or politely defer) for the pilot:

- Restaurants, coffee shops, food vendors
- Multi-branch retailers
- Brands with thousands of SKUs
- Customers who require an official Thai tax-invoice (e-tax) system on day one
- Customers who need a barcode scanner / receipt printer integration on day one

## Why it exists

`meowmeow_pos_event.html` proved the booth-POS workflow works. But it's:

- localStorage-only (data lives on one device, no backup, no audit trail across devices)
- Single-tenant (one brand, hard-coded)
- Single-file HTML (hard to extend safely)

The new product fixes all three by moving to a real database, multi-tenant workspaces, and a Next.js codebase.

## Hard requirements

1. Customer applies → we approve → we send invite code → customer registers → they land in their own workspace.
2. Before opening POS, the customer must set up product cards (SKU, price, image) — uploaded to Supabase Storage, indexed in Postgres.
3. Every sale, every payment record, every stock movement, every send-later order is persisted in Supabase. Nothing important lives in localStorage.
4. Workspace data isolation enforced by Supabase Row Level Security, not by application logic alone.
5. The POS UI must feel like meowmeow — same cream/brown palette, large product cards, sticky cart, payment-method buttons. Existing meowmeow customers should not feel disoriented.

## Non-goals (for the pilot)

- Subscription billing — pilot users are invited free.
- Mobile native apps — web only, mobile-responsive.
- Barcode scanning, receipt-printer integration, e-invoice integration.
- AI recommendations.
- Multi-currency.
- Multi-language beyond TH/EN toggle.
- Marketplace, customer-facing storefront, online ordering.

## Success criteria for the pilot

- 5 brands successfully completed registration via invite code.
- Each ran at least one full event day with ≥30 sales recorded.
- Zero data-isolation incidents (no client ever saw another client's data).
- End-of-day report exported and matches the cash drawer / transfer slip total within ±0 satang.
- Each pilot client agrees the system is safe to use for their next event.

## Important business rule

The pilot is **invitation-only by design**. The /apply form is the front door, but registration only opens once the admin approves and issues an invite code. This lets us:

- Manage support load.
- Stay focused on the cat-niche.
- Give each pilot client real attention.
- Reject non-fits gently (just don't approve them — no rejection letter required).

## Pricing intent (post-pilot)

Out of scope for the 100-batch plan. The plan ends at "5 pilot clients running events successfully." Pricing model + Stripe wiring is its own future planning round.

## Glossary

- **Workspace**: one brand's isolated data tenant. `workspaces.id` ↔ `auth.users[N].id` via `workspace_members`.
- **Event**: one booth/fair (e.g., "Pet Expo 2026"). All sales happen within an event.
- **Order**: a customer transaction. Has 1+ order_items.
- **Order item fulfillment**: `take_now` (carried away) or `send_later` (we ship later).
- **Application**: a row in `applications` table — someone who filled the /apply form.
- **Invite code**: a one-shot signup token tied to one application.
- **Audit log**: append-only record of corrections, voids, refunds, stock adjustments.
