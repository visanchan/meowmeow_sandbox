# Shared Task Board — MeowMeow POS

Source of truth for work-in-progress. Both Claude and Codex must read this file **before** editing any project file, and update it **immediately after** claiming, completing, or releasing a batch.

## Protocol (read before editing)

0. **Integration branch is `main`.** All batch branches start from `main` and merge back into `main`. The legacy `start` branch is retired (its history is fully merged into `main` as of 2026-04-26).
1. **One agent per batch.** A batch is "claimed" the moment its `Owner` field is set. Do not edit any file a batch touches if another agent owns the batch.
2. **One batch in flight per agent.** Finish or release before claiming another.
3. **Claim by editing this file:** set `Owner: claude` or `Owner: codex`, set `Status: in-progress`, set `Branch: <branch-name>`, set `Claimed: <YYYY-MM-DD HH:MM>`. Commit this update before touching any other file.
4. **Branch per batch.** Branch name format: `batch/<letter>-<short-slug>` (e.g. `batch/a-operator-gate`). Never push directly to `main`. Branch from latest `main`.
5. **Merge serially.** Open a PR into `main`. Merge only after the other agent confirms no in-flight work conflicts. After merge, set `Status: done` and clear `Owner`/`Branch`.
6. **Stale claim recovery.** If `Claimed` is older than 24h with no commits on the branch, the other agent may set `Status: stale` and re-claim, but must announce it in the next session.
7. **Conflict prevention rules:**
   - Batches that touch the same code region are marked `BlockedBy: <batch-letter>`. Do not start a blocked batch until its blocker is `done`.
   - If you discover a region overlap not flagged here, stop, update this file with the new dependency, and switch to a different batch.
8. **README & this file are shared.** Edit them only when no batch is in flight, or as part of the batch that justifies the change. Never edit while another agent has any batch `in-progress`.

## Files allowed to edit

- `meowmeow_pos_event.html` — main app. **Mutually exclusive** between agents (only one batch in flight against this file at a time, even when batches don't textually overlap, until we have confidence in the partition).
- `meowmeow_receipt_admin.html` — admin tool. Not part of this round; do not edit.
- `readme.md` — coordinated; update as part of the batch that changes behavior described in it.
- `TASKS.md` (this file) — coordinated; update on every claim/release/done.
- `CLAUDE.md`, `codex.md`, `AGENTS.md` — agent protocol files. Treat as documentation; only edit by explicit user request.

## Batches

Source plan: `C:\Users\USER\.claude\plans\read-all-code-in-polymorphic-kahn.md`

### Batch A — Operator Gate Trio
- **Items:** #1 sticky operator chip + gate `addToCart`; #2 stock validation at add-time + `aria-live`; #3 payment-confirm gate label on Save button.
- **Touches:** top selling-screen markup, `addToCart` / `updateQty`, `renderPayments`, Save button label inside `renderSuccess`.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Merged into `start` at 6895710 (2026-04-25). Unblocks Batch B.

### Batch B — Checkout Polish
- **Items:** #4 `Ship to` heading grouping; #5 inline edit on receipt lines; #6 inline email validation message.
- **Touches:** `renderSuccess` overlay markup, `finalizeSale` email-validation path, `state.pendingSale` round-trip.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:** A (overlaps Save button label region in `renderSuccess`).
- **Notes:** Completed locally on `batch/b-checkout-polish` (2026-04-26): Ship to grouping, receipt-line Edit return-to-cart, and inline email validation shipped.

### Batch C — Cart & Status Guards
- **Items:** #7 idle-cart prompt at 10 minutes; remove pay-later/pre-order status path so Send Later is paid at event.
- **Touches:** new idle-timer module on `state.cart` activity, `confirmClearCart`, `updatePreorderStatus`.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed locally on `start` (2026-04-26): idle-cart guard remains, and pre-order/pay-later paths were removed so Send Later is paid at event.

### Batch D — Sample Qty Per-Day Migration
- **Items:** #9 move `sampleQty` from `state.globalInventory` to `state.inventory[dayId]` with one-time migration.
- **Touches:** load/save of global inventory, `getProductInventorySnapshot`, `getCartAwareInventorySnapshot`, Stock & Allocation Setup UI, migration code in `loadGlobalInventory` / `loadInventory`.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `start` at 6e23815 (2026-04-26). Per-day `sampleQty` with one-time migration from legacy `globalInventory.sampleQty` into Day 1; Days 2-4 default to 0. Unblocks Batch E.

### Batch E — Render Memoization + Correction Stock Impact
- **Items:** #10 per-render-pass memoization for sold-count map; #8 stock-impact preview in correction review.
- **Touches:** `renderProducts` (per-pass cache context), `getCartAwareInventorySnapshot` signature, correction review markup (lines ~1067-1186).
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Merged into `main` at e35aabc (2026-04-26). Per-pass `cartReservedMap` and Bill Correction day re-alignment preview shipped.

### Batch F — Staff Login & Tap-in Dedup
- **Items:** replace operator chip with name+PIN login gate (Zamm=111, Ben=222, Kat=333, Staff=000); persist session in `localStorage`; add 🔒 Log out button in header (manual only); remove redundant "Operator tap-in" on review/finish-sale page since operator is known from login.
- **Touches:** operator-chip header markup, `addToCart` operator gate, `renderSuccess` (Operator tap-in region), new login overlay + auth state, `localStorage` session key.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `start` at f674cdb (2026-04-26): staff login overlay with PIN gate, persistent session, 🔒 Log out in header, and Operator tap-in removed from review/finish-sale page.

### Batch H — Void Bill from Correction Center
- **Items:** add an explicit "Void / delete this bill" path in Bill Correction. Today, zeroing every line in `buildCorrectionDraft` triggers `"At least one bill item must remain on the sale."` and review is blocked, so there is no way to delete a wrongly-saved bill. Add a separate **Void Bill** button (with reason + confirm dialog, behind the existing correction passcode) that removes the sale from `state.sales`, realigns inventory carry-forward via `realignInventoryCarryForward(saleDay(sale))`, and writes a `void` entry into `correctionHistory` so the action is auditable. The "items must remain" guard still applies to *edit* corrections so accidental zero-outs during normal edits stay protected.
- **Touches:** Bill Correction panel markup (new `Void Bill` button + confirm dialog), `buildCorrectionDraft` / `confirmCorrectionSave` (or a new `voidSale` flow that does not reuse the items-required guard), `state.sales` write path + `saveSales`, `realignInventoryCarryForward`, audit/history entry shape, and `readme.md` Correction Center section.
- **Owner:**
- **Status:** ready
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Reported 2026-04-26 — staff hit the "At least one bill item must remain" message when trying to delete a bill by zeroing all lines. Voiding must be reversible only via re-creating the sale; record `voidedAt`, `voidedBy` (logged-in operator), and `reason` so an auditor can see why a bill was removed. Verify carry-forward across all later days after the void.

### Batch G — Stock & Allocation Setup clarity
- **Items:**
  1. Re-evaluate the subtext under Warehouse and Remaining Event in `renderInventoryManagement`. Decide whether "No committed send later" and "Sold N" lines are useful information or visual noise — propose either removing them, hiding them when the value is 0/idle, or moving them into a tooltip / on-hover detail.
  2. Change `Added Today` semantics so it behaves as a **delta to apply**, not a stored running total: when staff press `Confirm Stock Setup`, the entered Added Today value is added into the day's running event stock (so Remaining Event reflects it), and the Added Today input resets to 0 in the UI for the next top-up. The audit log entry should still record the delta (this is roughly what `applyStockSetupDraft` does today via `addLog`, but the input box does not visually reset).
  3. Make the Added Today cell visually distinct from the other (stored-total) cells so staff understand it is a transient "amount to add now" field — different background/border, a "+" prefix, a hint label like "Top up now", or similar.
- **Touches:** `renderInventoryManagement` table markup (subtext under Warehouse/Remaining Event, Added Today cell styling), `applyStockSetupDraft` (post-save reset of Added Today field), `stockSetupSnapshot` if needed, the inventory CSS in `<style>`, and `readme.md` Inventory section.
- **Owner:**
- **Status:** ready
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Touches the live Stock & Allocation Setup UI that staff use during the event. Verify with both empty (zero everything) and mid-event (mixed sold + committed) states. Be careful: the existing `addLog` already records deltas for Added Today via `applyStockSetupDraft`; the change here is mainly UI-side (reset the input post-confirm + visual treatment), and a small tweak to make sure the "stored" model stays internally consistent.

## Suggested order (least-conflict first)

1. **A** (Claude or Codex) — fundamentals, unblocks B.
2. **C** (the other agent, after A merged) — disjoint region.
3. **B** (after A merged).
4. **D** — single owner; pause everything else.
5. **E** (after D merged).
6. **G** — Stock & Allocation Setup UI clarity (independent of A-F; touches `renderInventoryManagement`).
7. **H** — Void Bill from Correction Center (independent of A-G; touches Bill Correction panel + `state.sales` write path).

## Done

- **Batch B — Checkout Polish** — completed on `batch/b-checkout-polish` on 2026-04-26 by codex. Items #4, #5, #6 shipped.

(Move completed batches here with the merging commit SHA.)

- **Batch A — Operator Gate Trio** — merged into `start` at `6895710` on 2026-04-25 by claude. Items #1, #2, #3 shipped.
- **Batch C — Cart & Status Guards** — completed on `start` at `2cce88b` on 2026-04-26. Items #7 and pay-later removal shipped.
- **Batch F — Staff Login & Tap-in Dedup** — completed on `start` at `f674cdb` on 2026-04-26 by claude. Staff PIN login, persistent session, manual logout, redundant operator tap-in removed.
- **Batch D — Sample Qty Per-Day Migration** — merged into `start` at `28ffc31` on 2026-04-26 by claude. Per-day `sampleQty` shipped with one-time migration; unblocks Batch E.
- **Batch E — Render Memoization + Correction Stock Impact** — merged into `main` at `e35aabc` on 2026-04-26 by claude. Per-pass `cartReservedMap` reduces cart walks in `renderProducts`; Bill Correction review previews per-day starting-stock re-alignment.
