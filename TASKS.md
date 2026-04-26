# Shared Task Board — MeowMeow POS

Source of truth for work-in-progress. Both Claude and Codex must read this file **before** editing any project file, and update it **immediately after** claiming, completing, or releasing a batch.

## Protocol (read before editing)

1. **One agent per batch.** A batch is "claimed" the moment its `Owner` field is set. Do not edit any file a batch touches if another agent owns the batch.
2. **One batch in flight per agent.** Finish or release before claiming another.
3. **Claim by editing this file:** set `Owner: claude` or `Owner: codex`, set `Status: in-progress`, set `Branch: <branch-name>`, set `Claimed: <YYYY-MM-DD HH:MM>`. Commit this update before touching any other file.
4. **Branch per batch.** Branch name format: `batch/<letter>-<short-slug>` (e.g. `batch/a-operator-gate`). Never push directly to `main`.
5. **Merge serially.** Open a PR. Merge to `main` only after the other agent confirms no in-flight work conflicts. After merge, set `Status: done` and clear `Owner`/`Branch`.
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
- **Status:** ready
- **Branch:**
- **Claimed:**
- **BlockedBy:** A (overlaps Save button label region in `renderSuccess`).

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
- **Status:** ready
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** large data-model change. Verify `localStorage` migration with both empty and populated existing data. Update `readme.md` Inventory section as part of this batch.

### Batch E — Render Memoization + Correction Stock Impact
- **Items:** #10 per-render-pass memoization for sold-count map; #8 stock-impact preview in correction review.
- **Touches:** `renderProducts` (per-pass cache context), `getCartAwareInventorySnapshot` signature, correction review markup (lines ~1067-1186).
- **Owner:**
- **Status:** ready
- **Branch:**
- **Claimed:**
- **BlockedBy:** D (touches the same snapshot helpers).

### Batch F — Staff Login & Tap-in Dedup
- **Items:** replace operator chip with name+PIN login gate (Zamm=111, Ben=222, Kat=333, Staff=000); persist session in `localStorage`; add 🔒 Log out button in header (manual only); remove redundant "Operator tap-in" on review/finish-sale page since operator is known from login.
- **Touches:** operator-chip header markup, `addToCart` operator gate, `renderSuccess` (Operator tap-in region), new login overlay + auth state, `localStorage` session key.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `start` at f674cdb (2026-04-26): staff login overlay with PIN gate, persistent session, 🔒 Log out in header, and Operator tap-in removed from review/finish-sale page.

## Suggested order (least-conflict first)

1. **A** (Claude or Codex) — fundamentals, unblocks B.
2. **C** (the other agent, after A merged) — disjoint region.
3. **B** (after A merged).
4. **D** — single owner; pause everything else.
5. **E** (after D merged).

## Done

(Move completed batches here with the merging commit SHA.)

- **Batch A — Operator Gate Trio** — merged into `start` at `6895710` on 2026-04-25 by claude. Items #1, #2, #3 shipped.
- **Batch C — Cart & Status Guards** — completed on `start` at `2cce88b` on 2026-04-26. Items #7 and pay-later removal shipped.
- **Batch F — Staff Login & Tap-in Dedup** — completed on `start` at `f674cdb` on 2026-04-26 by claude. Staff PIN login, persistent session, manual logout, redundant operator tap-in removed.
