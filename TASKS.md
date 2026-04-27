# Shared Task Board — MeowMeow POS

Source of truth for work-in-progress. Both Claude and Codex must read this file **before** editing any project file, and update it **immediately after** claiming, completing, or releasing a batch.

> **Two-agent protocol RESUMED as of 2026-04-26** — Claude (executor) and Codex (planner/reviewer) are both active again. Follow the claim/release rules in the Protocol section below.

## Protocol (read before editing)

0. **Integration branch is `main`.** All batch branches start from `main` and merge back into `main`. The legacy `start` branch is retired (its history is fully merged into `main` as of 2026-04-26).
1. **Default team roles.** Codex is the planner/reviewer/workflow analyst. Claude is the primary implementation executor.
2. **Planning can run ahead.** Codex may create, refine, split, and review future batches while Claude executes the current implementation batch, as long as Codex does not edit files owned by Claude's in-progress batch.
3. **Parallel lanes.** Claude keeps the active implementation checkout. Codex may use a separate planning worktree to prepare future batches, review checklists, protocol updates, and low-risk documentation planning while Claude is coding.
4. **Implementation remains exclusive.** A batch is "claimed" for implementation the moment its `Owner` field is set with `Status: in-progress`. Do not edit any implementation file a claimed batch touches if another agent owns that batch.
5. **One implementation batch in flight.** Because `meowmeow_pos_event.html` is a single-file app, only one executor should edit it at a time. Finish, release, or request review before starting another implementation batch.
6. **Claim implementation by editing this file:** set `Owner: claude` unless the user explicitly assigns Codex execution, set `Status: in-progress`, set `Branch: <branch-name>`, set `Claimed: <YYYY-MM-DD HH:MM>`. Commit this update before touching any implementation file.
7. **Planning status.** Codex may use `Owner: codex`, `Status: planning` for batches being designed. When planning is complete, Codex clears `Owner`, sets `Status: ready-for-claude`, and leaves acceptance checks for Claude.
8. **Sync planning before implementation.** Before Claude claims the next implementation batch, merge or copy Codex's planning updates into this board so Claude sees the latest blockers, acceptance checks, and suggested order.
9. **Branch per batch.** Branch name format: `batch/<letter>-<short-slug>` (e.g. `batch/h-void-bill`). Never push directly to `main`. Branch from latest `main`.
10. **Merge serially.** Open a PR into `main`. Merge only after the user confirms or after delegated Codex review confirms no blocking issue. After merge, set `Status: done` and clear `Owner`/`Branch`.
11. **Stale claim recovery.** If `Claimed` is older than 24h with no commits on the branch, the other agent may set `Status: stale` and re-claim, but must announce it in the next session.
12. **Conflict prevention rules:**
   - Batches that touch the same code region are marked `BlockedBy: <batch-letter>`. Do not start a blocked batch until its blocker is `done`.
   - If you discover a region overlap not flagged here, stop, update this file with the new dependency, and switch to a different batch.
13. **README & this file are shared.** Edit them for planning/protocol updates, or as part of the implementation batch that justifies the change. Do not edit behavior docs in a way that contradicts an in-progress implementation.

## Files allowed to edit

- `meowmeow_pos_event.html` — main app. **Mutually exclusive** between agents (only one batch in flight against this file at a time, even when batches don't textually overlap, until we have confidence in the partition).
- `meowmeow_receipt_admin.html` — admin tool. Not part of this round; do not edit.
- `readme.md` — coordinated; update as part of the batch that changes behavior described in it.
- `TASKS.md` (this file) — coordinated; update on every claim/release/done.
- `CLAUDE.md`, `codex.md`, `AGENTS.md` — agent protocol files. Treat as planning/protocol documentation; Codex may edit when the user asks to change the team workflow.

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
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Merged into `main` at `b45838b` on 2026-04-26. Void Bill button gated behind existing correction passcode; opens reason-required confirm dialog; on confirm, removes sale from `state.sales`, writes audit entry to `meowseum_event_voided_sales_v1`, and calls `realignInventoryCarryForward(saleDay(sale))`. Edit-correction "items must remain" guard untouched. Codex smoke review passed 2026-04-26: inline script parse, browser load, and automated Day 1 void/carry-forward check passed.

### Batch G — Stock & Allocation Setup clarity
- **Business objective:** Make stock top-ups during the event easier and less error-prone for staff/managers using the live Stock & Allocation Setup page.
- **Expected benefit:** Faster top-up entry, less confusion between stored stock totals and "add now" quantity, cleaner audit logs, and fewer accidental warehouse/event stock mistakes.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Keep the existing table and local-storage model, but improve the semantics and visual treatment of `Added Today`. This avoids a bigger inventory redesign while solving the confusing staff workflow.
- **Items:**
  1. Re-evaluate the subtext under Warehouse and Remaining Event in `renderInventoryManagement`. Decide whether "No committed send later" and "Sold N" lines are useful information or visual noise — propose either removing them, hiding them when the value is 0/idle, or moving them into a tooltip / on-hover detail.
  2. Change `Added Today` semantics so it behaves as a **delta to apply**, not a stored running total: when staff press `Confirm Stock Setup`, the entered Added Today value is added into the day's running event stock (so Remaining Event reflects it), and the Added Today input resets to 0 in the UI for the next top-up. The audit log entry should still record the delta (this is roughly what `applyStockSetupDraft` does today via `addLog`, but the input box does not visually reset).
  3. Make the Added Today cell visually distinct from the other (stored-total) cells so staff understand it is a transient "amount to add now" field — different background/border, a "+" prefix, a hint label like "Top up now", or similar.
- **Touches:** `renderInventoryManagement` table markup (subtext under Warehouse/Remaining Event, Added Today cell styling), `applyStockSetupDraft` (post-save reset of Added Today field), `stockSetupSnapshot` if needed, the inventory CSS in `<style>`, and `readme.md` Inventory section.
- **Do not change:** public Inventory Flow totals, existing sample-stock semantics, existing locked-field rules after sales begin, Send Later reservation math, or CSV export shape.
- **Recommended implementation notes:**
  - Treat the visible `Added Today` input as a top-up delta. On confirm, add that delta to `dayRecord.addedStock[sku]` instead of replacing the stored total with the input value.
  - After a successful confirm, rerender the setup table with `Added Today` inputs showing `0`, while stored `dayRecord.addedStock[sku]` remains increased and Remaining Event reflects the new total.
  - Keep `stockSetupSnapshot(sku).addedToday` as the stored accumulated added stock if other views depend on it; use a separate render value for the delta input instead of changing the meaning globally.
  - Hide noisy subtext when idle: show committed Send Later only when `snap.committed > 0`; show Sold only when `snap.sold > 0`. Keep the strong Warehouse and Remaining Event numbers visible at all times.
- **Acceptance checks:**
  - Empty state: with no sales/committed Send Later, Warehouse and Remaining Event rows do not show noisy `No committed send later` / `Sold 0` lines.
  - Mid-event state: if a SKU has committed Send Later or sold units, those details are still visible near the relevant stock number.
  - Enter `Added Today = 5`, confirm setup, and verify Remaining Event increases by 5 while the Added Today input resets to 0.
  - Enter another `Added Today = 3`, confirm setup, and verify stored added stock becomes prior added total + 3, not just 3.
  - Verify `addLog` records each top-up delta separately with SKU, quantity, day, timestamp, and stock setup reason.
  - Verify global/online/event-start fields remain locked after a saved sale, while Added Today, Sample, and Low Alert still behave correctly.
  - Update README Inventory notes to explain Added Today as a "top up now" field that resets after confirm.
- **Risks/assumptions:**
  - `stockSetupChangeList()` currently compares the input against stored `snap.addedToday`; Claude must adjust change detection so a positive top-up delta is recognized even when the stored total is different.
  - `stockSetupDraftIssue()` must validate warehouse/event stock using stored added stock plus the entered top-up delta, not only the delta by itself.
  - Review is recommended before merge because this affects live stock setup and staff understanding during the event.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Merged into `main` at `1923f0c` on 2026-04-26. `Added Today` now renders as a `Top up now` delta input, applies deltas to stored added stock, and resets to `0` after confirm. Idle `No committed send later` / `Sold 0` helper text is hidden; nonzero committed/sold detail still appears. Codex smoke review passed: inline script parse and browser stock-setup acceptance check.

### Batch K — Local Smoke Test Script
- **Business objective:** Give the owner and future agents a repeatable, low-cost first check before manual event testing.
- **Expected benefit:** Faster confidence after edits, fewer missed regressions in void/carry-forward and stock top-up behavior, and easier handoff to non-expert operators.
- **Implementation difficulty:** low.
- **Cost/complexity tradeoff:** Add one local Node/Playwright smoke script without changing app runtime dependencies or adding a build step.
- **Items:**
  1. Add a local smoke script that loads `meowmeow_pos_event.html` in a temporary browser profile and fails on page errors.
  2. Include checks for the two highest-risk recent workflows: Batch H void/carry-forward and Batch G stock top-up reset.
  3. Document how to run it with the cached Codex Node/Playwright runtime used in this workspace.
- **Touches:** new `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** POS app behavior, CSV shape, localStorage keys, or product data.
- **Acceptance checks:**
  - Running the smoke script prints a pass message.
  - Script uses an isolated browser context and clears only that temporary context's `localStorage`.
  - README explains this is a first-pass check, not a replacement for the manual event checklist.
- **Risks/assumptions:** The script expects Playwright and Edge/Chromium to be available through the existing Codex runtime environment.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `batch/k-local-smoke-test` (2026-04-26). Added `tests/smoke_event_pos.js`, documented the run command in README, and verified it passes with the cached Codex Node/Playwright runtime.

### Batch L — Void Audit Review & Export
- **Business objective:** Make voided bills auditable by a booth manager without opening browser developer tools.
- **Expected benefit:** Better control after mistakes, easier end-of-event review, and clearer evidence for why sales totals changed.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Reuse the existing Correction Center and local `meowseum_event_voided_sales_v1` data instead of building a new admin screen or backend.
- **Items:**
  1. Add a compact `Void Audit` section inside `Correction Center > Bill Correction` showing recent voided bills from `state.voidedSales`.
  2. Each row should show bill id, voided time, voided-by operator, operating day, total, item count, and reason.
  3. Add an `Export Void Audit CSV` button that exports the void audit log with spreadsheet-safe text cells.
  4. Keep the full `saleSnapshot` out of the CSV; export concise audit fields only.
- **Touches:** `meowmeow_pos_event.html` Correction Center markup/rendering, void audit CSV helper, `readme.md` Correction Center/Data notes, `tests/smoke_event_pos.js` if useful.
- **Do not change:** void creation behavior, `meowseum_event_voided_sales_v1` storage shape, normal sales CSV shape, or existing Bill Correction edit flow.
- **Acceptance checks:**
  - With no voids, Correction Center shows a quiet empty state for void audit.
  - After voiding a bill, the audit row appears without a page refresh and shows bill id, reason, operator, day, total, and item count.
  - Reloading the app preserves and displays the void audit row from localStorage.
  - Exported void CSV includes concise audit columns and protects text fields against spreadsheet formula injection.
  - Running `tests/smoke_event_pos.js` still passes.
- **Risks/assumptions:** Void audit should be visible only after the existing Correction Center passcode unlock; no separate passcode is needed.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Merged into `main` on 2026-04-26 after Codex review. Adds a `Void Audit` card inside Bill Correction that lists the most recent 12 voided bills (bill id, time, operator, day, total, item count, reason) with empty/overflow states, plus an `Export Void Audit CSV` button that exports concise audit columns (`bill_id, voided_at, voided_by, operating_day, total_thb, item_count, reason`) using spreadsheet-injection guards; the full `saleSnapshot` stays out of the CSV. Codex fixed the bill-id CSV export to use protected text, extended the smoke check for that guard, and verified `tests/smoke_event_pos.js` passes.

### Batch M — Safer Test Data Reset Cleanup
- **Business objective:** Make pre-event cleanup safer and clearer so test sales, test voids, and test queue records do not pollute event reporting.
- **Expected benefit:** Cleaner opening state before the booth starts, fewer confusing old audit rows, and lower risk of staff clearing the wrong data during live selling.
- **Implementation difficulty:** low to medium.
- **Cost/complexity tradeoff:** Extend existing local cleanup controls and warning copy rather than adding a separate reset wizard.
- **Items:**
  1. Update the `Reset Data` confirmation copy to explicitly list what will be cleared and what will remain.
  2. Include `state.voidedSales` / `meowseum_event_voided_sales_v1` in the reset path only when the user confirms the destructive reset, so test void audits are cleared with test sales.
  3. Keep `Clear Pending Send Later` as the separate queue cleanup path; do not silently delete packed/shipped/cancelled queue records from Reset Data.
  4. After reset, refresh Correction Center views if open so bill lists, void audit rows, dashboard, inventory, and product cards show the clean state.
  5. Update README Pre-Event Data Hygiene to state that `Reset Data` clears saved sales, inventory setup, allocation data, and void audit logs, while Send Later cleanup remains separate.
- **Touches:** `resetSavedSales`, reset confirmation dialog copy, correction/void audit refresh paths, README hygiene notes, `tests/smoke_event_pos.js` if needed.
- **Do not change:** operator login persistence, pending/packed/shipped/cancelled Send Later cleanup behavior, or CSV export formats.
- **Acceptance checks:**
  - Create a test sale and void it; confirm `Reset Data` clears saved sales and the void audit log after confirmation.
  - Confirm inventory/global allocation resets as before.
  - Confirm pending Send Later records are not removed by Reset Data and still require `Clear Pending Send Later`.
  - Confirm dashboard, product grid, Inventory Flow, and Correction Center refresh after reset.
  - Running `tests/smoke_event_pos.js` still passes.
- **Risks/assumptions:** Reset Data is already a destructive developer/admin action; clearing void audit there is acceptable for test cleanup but must be clearly documented.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Shipped on `main` 2026-04-26 under single-agent mode. Reset confirmation now lists exactly what is cleared (saved sales, void audit, per-day inventory, allocation) and what stays (Send Later queue, login session, saved emails); `resetSavedSales` clears `state.voidedSales` + `meowseum_event_voided_sales_v1`, calls `refreshInventoryUi`, and re-renders Correction Center bill list / void audit if open. README Pre-Event Data Hygiene rewritten and a Recently Changed entry added. Smoke test extended with a reset scenario verifying void-audit clear + Send Later preservation.

### Batch N - Compress Embedded Product Images
- **Business objective:** Reduce the offline POS HTML file size so it is faster to copy, open, and load on event devices while keeping the single-file offline workflow.
- **Expected benefit:** Smaller deployment file, quicker browser load, and less storage/memory pressure on iPad/Edge without changing staff workflow.
- **Implementation difficulty:** low.
- **Cost/complexity tradeoff:** Resize and recompress the existing embedded base64 images in place instead of introducing a separate asset folder or build step.
- **Items:**
  1. Resize embedded `PRODUCT_IMAGE_DATA` images to product-card-friendly dimensions, targeting a maximum width of 600 px.
  2. Recompress converted images with thumbnail-quality JPEG settings suitable for small cards.
  3. Update README notes so future agents know embedded photos should stay compressed before being pasted into the HTML.
- **Touches:** `meowmeow_pos_event.html` product image data block, `readme.md`, `TASKS.md`.
- **Do not change:** product catalog SKUs/names/prices, app behavior, storage keys, CSV formats, or the single-file offline app structure.
- **Acceptance checks:**
  - POS inline script still parses.
  - Local smoke test still passes.
  - HTML file size is materially smaller than before compression.
  - Product image data remains embedded in `meowmeow_pos_event.html`.
- **Risks/assumptions:** Compression may slightly reduce image sharpness, but product cards only need thumbnail-quality images.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed by Codex on `batch/n-compress-embedded-images` on 2026-04-27. Embedded product images were flattened/recompressed as JPEG thumbnails with max width 600 px. `meowmeow_pos_event.html` dropped from 13,426,711 bytes to 1,277,688 bytes; total embedded image payload dropped from 9,833,150 bytes to 721,521 bytes. Local smoke test passed.

### Batch O - Default Inventory Baseline
- **Business objective:** Start event-day inventory from the prepared `inventory/inventory_default.xlsx` baseline so staff only need small live adjustments.
- **Expected benefit:** Less opening setup work, fewer manual stock-entry mistakes, and faster booth readiness.
- **Implementation difficulty:** low.
- **Cost/complexity tradeoff:** Hardcode the workbook values into the offline HTML defaults instead of adding browser-side Excel import or a build step.
- **Items:** Set new/reset POS defaults for global stock, online stock, and Day 1 event starting stock (`global - online`). Document the workflow in README.
- **Touches:** `meowmeow_pos_event.html`, `readme.md`, `TASKS.md`.
- **Do not change:** saved localStorage inventory on already-used devices, product prices, sales behavior, CSV formats, or event-day carry-forward logic.
- **Acceptance checks:** New/reset data uses workbook baseline; Day 1 Event Start equals Global minus Online; local smoke test passes.
- **Risks/assumptions:** The workbook has no separate Event Start column, so Event Start is derived as `Global - Online`.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed by Codex on `batch/o-default-inventory-baseline` on 2026-04-27. New/reset inventory now uses the prepared workbook baseline: global and online values from `inventory/inventory_default.xlsx`, with Day 1 Event Start derived as Global minus Online. Local smoke test passed.

### Batch P — Restore UTF-8 Symbols After Inventory Baseline
- **Business objective:** Restore corrupted symbols, emoji, Thai baht marks, and UI icons so the POS is readable and professional for staff on event day.
- **Expected benefit:** Staff can clearly read prices, product color markers, cart/free-gift messages, tool buttons, and correction/dashboard labels without confusing `?` placeholders.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Repair the damaged text in the single HTML app and keep Batch O's inventory default logic, instead of redesigning the UI or adding icon libraries.
- **Items:**
  1. Use commit `57e9b31` as the clean reference for `meowmeow_pos_event.html` symbols and emoji because that version had compressed images before the encoding damage.
  2. Restore corrupted characters in `meowmeow_pos_event.html`, especially `฿`, gift/truck/lock/tool/dashboard icons, product color markers, tag labels, reset/clear/export labels, and receipt/status text.
  3. Preserve Batch O default inventory logic exactly: `DEFAULT_GLOBAL_STOCK`, `DEFAULT_ONLINE_STOCK`, and Day 1 `Event Start = Global - Online`.
  4. Save edited text as UTF-8. Do not use PowerShell `Encoding.Default` or any system-default encoding write path.
  5. Inspect `readme.md` and `TASKS.md` for visible mojibake related to the app-facing docs, but prioritize the POS UI file.
- **Touches:** `meowmeow_pos_event.html`, optionally `readme.md` and `TASKS.md` if mojibake is corrected in documentation.
- **Do not change:** inventory baseline values from Batch O, product prices, product SKUs, sales/void/correction behavior, CSV formats, localStorage keys, or embedded product images.
- **Acceptance checks:**
  - Product card prices show `฿`, not `?`.
  - Free scarf, Send Later/truck, logout/lock, dashboard, correction, reset, clear, and export symbols display correctly.
  - Product names/color markers no longer show corrupted `?` where emoji or intended symbols should appear.
  - `DEFAULT_GLOBAL_STOCK`, `DEFAULT_ONLINE_STOCK`, and `defaultEventStartingStock` still exist and match `inventory/inventory_default.xlsx`.
  - Run `tests/smoke_event_pos.js` and confirm it passes.
  - Open the POS visually and compare the selling screen against the pre-corruption screenshot.
- **Risks/assumptions:** The corruption was likely introduced by writing the HTML with the system default encoding during Batch O. Claude must use a UTF-8-safe edit path.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `batch/p-restore-utf8-symbols` 2026-04-27. Rebuilt `meowmeow_pos_event.html` from `6ed423e` (Batch M, last commit with intact UTF-8) by splicing in the Batch N compressed `PRODUCT_IMAGE_DATA` block and re-applying the Batch O inventory-baseline edits (`DEFAULT_GLOBAL_STOCK`, `DEFAULT_ONLINE_STOCK`, `defaultEventStartingStock`, updated `createDefaultInventory` / `createDefaultGlobalInventory`). File written as UTF-8 (with the same BOM the file has carried since Batch M) via Node `Buffer.from(text,"utf8")`. Non-ASCII byte count restored from 44 to 325 (matches `6ed423e`). `tests/smoke_event_pos.js` passes. Headed-Edge visual check confirms `฿`, 🧣 free-gift button, ⚠️/📧/📤 dashboard tools, `•` separators, and `—` em dashes render correctly on the selling screen and dashboard tab.

### Batch Q — Destructive Reset Passcode & Severity
- **Business objective:** Make `Reset Data` clearly more dangerous than normal admin actions and prevent accidental pre-event/live-event data loss.
- **Expected benefit:** Lower risk of staff clearing sales, inventory setup, void audit logs, and allocation data by mistake; clearer control for managers.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Reuse the existing in-app reset confirmation overlay, but make it visually severe and require a simple reset passcode (`888`) before enabling the final destructive action. This avoids adding user accounts or a backend while improving safety.
- **Items:**
  1. Restyle the `Reset Data` button and confirmation overlay so it looks materially more severe than `Save Stock`, `Corrections`, and `Clear Emails` (danger color, warning title, stronger border/background, and explicit destructive copy).
  2. Add a reset passcode field/keypad or typed input to the reset confirmation flow. The reset should only execute after entering `888`.
  3. Keep the confirmation copy explicit about what is cleared and what remains.
  4. Show an in-app error state for wrong/empty passcode; do not use browser `alert`.
  5. Update README Pre-Event Data Hygiene with the reset passcode rule.
- **Touches:** `meowmeow_pos_event.html` reset button styling, `confirmResetSalesOverlay`, `resetSavedSales` trigger path, reset event handlers, CSS, `readme.md`, `TASKS.md`.
- **Do not change:** what reset clears/keeps, Send Later cleanup behavior, operator login persistence, saved email cleanup behavior, CSV formats, or inventory carry-forward logic.
- **Acceptance checks:**
  - `Reset Data` is visually more severe than the other Developer Tools actions.
  - Clicking `Reset Data` opens an in-app severe warning dialog.
  - Confirm/reset button stays blocked until passcode `888` is entered.
  - Wrong passcode shows an in-app message and does not clear data.
  - Correct passcode clears the same data as today and refreshes dashboard, product grid, Inventory Flow, and Correction Center.
  - `tests/smoke_event_pos.js` still passes.
- **Risks/assumptions:** Passcode `888` is intentionally simple and local; this is an operational guard, not strong security.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `batch/q-reset-passcode-severity` 2026-04-27. Reset Data button is now `🚨` with `.action-btn.severe` styling (deeper crimson, darker border, inset highlight) versus the lighter `⚠️` Corrections button. The confirm overlay uses `.confirm-card.severe` (hazard banner, 3px border, red header, 🚨 in title), embeds a 3-digit passcode keypad mirroring the dashboard PIN pattern, and the `Erase Everything` confirm button starts disabled and only enables once `state.resetPin === ACCESS_CONTROL.resetPasscode` (`888`). Wrong passcodes clear the entry and show an in-app error (no browser `alert`). Closing or cancelling the dialog clears the passcode state. README Pre-Event Data Hygiene rewritten to document the new flow. Smoke test extended with 4 new gate assertions (initial-disabled, wrong-rejects, correct-enables, close-clears) all passing.

### Batch R — Manual Event Start Count
- **Business objective:** Keep the workbook as the stock planning baseline while forcing staff to count and enter actual event-start stock before selling.
- **Expected benefit:** Less risk of opening the event with unverified stock numbers; staff still benefit from prepared `Global` and `Online` defaults but must confirm booth stock physically.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Keep `inventory_default.xlsx` wired into `Global` and `Online`, but leave `Event Start` blank in Stock & Allocation Setup until staff enter actual counted quantity. This avoids a bigger import flow while improving opening accuracy.
- **Items:**
  1. Change new/reset inventory defaults so Day 1 `Event Start` starts empty/unset in the setup UI, not prefilled as `Global - Online`.
  2. Preserve default `Global` and `Online` values from `inventory/inventory_default.xlsx`.
  3. Decide implementation shape for empty numeric stock safely, such as using an explicit `eventStartConfirmed`/`eventStartTouched` map or `null` draft state, without breaking existing numeric calculations.
  4. Prevent selling or clearly block product adds until required Event Start counts are entered for sellable SKUs, or at minimum make zero/unset visually obvious before event use.
  5. Keep Day 2-4 carry-forward behavior unchanged after Day 1 closes.
  6. Update README Inventory notes to explain that Event Start waits for staff count at the start of the day.
- **Touches:** default inventory creation, `renderInventoryManagement`, stock setup draft/read/validation logic, add-to-cart stock guard if blocking unset Event Start, README Inventory section, tests if useful.
- **Do not change:** `Global` and `Online` default values, product prices, CSV formats, Send Later reservation math, Day 2-4 carry-forward logic after close day, or Batch P UTF-8 restoration.
- **Acceptance checks:**
  - After reset/new localStorage, `Global` and `Online` are prefilled from `inventory_default.xlsx`.
  - `Event Start` fields visually appear empty/unconfirmed for staff counting.
  - Staff can enter Event Start counts and save through existing `Confirm Stock Setup`.
  - Saved Event Start counts then drive product remaining stock normally.
  - Selling cannot silently proceed with misleading uncounted stock.
  - `tests/smoke_event_pos.js` still passes or is updated for the new required-count behavior.
- **Risks/assumptions:** Existing code clamps missing stock to `0`, so Claude must avoid representing "empty/unconfirmed" in a way that silently looks like confirmed zero stock.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Implemented on `batch/r-manual-event-start-count` 2026-04-27. Per-day `eventStartConfirmed[sku]` map; default Day 1 Event Start renders empty/unconfirmed (red outline + `Count needed` hint + `Not counted` warning); `addToCart` blocked for unconfirmed SKUs with stock toast; saving an Event Start through Stock & Allocation Setup flips the SKU to confirmed and unblocks selling; `closeOperatingDay` auto-confirms the next day. Legacy nonzero startingStock treated as already-confirmed for backwards compatibility. Smoke test extended with Batch R scenario (11 new assertions) and adjusted seed sites in void/top-up scenarios; full smoke passes.

### Batch S - Replace Remaining Browser Alerts With In-App Dialogs
- **Business objective:** Make admin confirmations and errors feel smooth and consistent on iPad/Edge instead of using disruptive browser `alert`, `confirm`, and `prompt` boxes.
- **Expected benefit:** Better staff confidence, fewer awkward browser popups, clearer passcode/error messaging, and more professional internal-tool flow.
- **Implementation difficulty:** medium to high depending on how many alert paths are converted in this pass.
- **Cost/complexity tradeoff:** Extend the app's existing overlay/dialog pattern instead of adding a modal library or framework.
- **Items:**
  1. Replace the `Clear Emails` browser `alert` result with an in-app confirmation/result dialog.
  2. Audit current `alert`, `confirm`, and `prompt` usages and group them into priority tiers.
  3. Convert the highest-friction admin paths first: `Clear Emails`, `Clear Pending Send Later`, stock setup validation failures, inventory reversal reason, and export-empty/error messages if practical.
  4. Keep lightweight cart stock notices as toast-style messages where already appropriate.
  5. Use consistent button styling, title, message, and danger/secondary states across dialogs.
  6. Update README if user-facing admin behavior changes.
- **Touches:** dialog markup/CSS, alert/prompt/confirm call sites, `purgeSavedReceiptContacts`, `clearPendingSendLaterOrders`, stock setup validation paths, inventory reversal path, export empty/error paths, README if behavior is documented.
- **Do not change:** actual data cleared/exported/saved, passcodes except Batch Q reset passcode, CSV formats, inventory logic, or sales logic.
- **Acceptance checks:**
  - `Clear Emails` no longer uses browser `alert`; it shows an in-app result dialog.
  - `Clear Pending Send Later` no longer uses browser `prompt`/`confirm` if included in this batch; passcode and final confirmation are in-app.
  - Wrong passcodes or validation failures are visible in-app and do not perform the action.
  - Existing overlays can still close via intended buttons and Escape where appropriate.
  - `tests/smoke_event_pos.js` still passes.
- **Risks/assumptions:** There are many alert call sites. Claude should keep this batch focused on staff/admin flows and avoid rewriting every low-level storage failure path unless time allows.
- **Owner:**
- **Status:** ready-for-claude
- **Branch:**
- **Claimed:**
- **BlockedBy:** Q
- **Notes:** User specifically called out `Clear Emails` as still using browser alert and asked for smoother aligned confirmations.

### Batch T — Smoke Coverage for PIN-Gated Workflows
- **Business objective:** Catch regressions in the PIN-gated entry points before they reach a live event.
- **Expected benefit:** Less risk that future symbol, encoding, dialog, or refactor work silently breaks operator login, Dashboard, Inventory, or Correction access.
- **Implementation difficulty:** low.
- **Cost/complexity tradeoff:** Extend the existing Playwright smoke script instead of adding a new test framework, backend, or separate manual checklist.
- **Items:**
  1. Add a PIN-flow scenario near the start of `tests/smoke_event_pos.js` that asserts `#loginOverlay.open` is visible on fresh init with no persisted operator.
  2. Test a wrong operator PIN, such as selecting `Zamm` and entering `999`, and assert the login overlay stays open with `#loginPinError` text.
  3. Test a correct operator PIN by selecting `Zamm`, entering `111`, and asserting the overlay closes and the page state/operator UI reflects `Zamm`.
  4. Add Dashboard lock coverage: wrong PIN remains blocked with an error, correct shared internal PIN opens `#dashboardPanel`, and `#dashboardTotalSales` renders a currency string with `฿`.
  5. Add Inventory lock coverage: wrong PIN remains blocked with an error, correct shared internal PIN opens the inventory panel and `Stock & Allocation Setup` is visible.
  6. Add Correction lock coverage: wrong PIN remains blocked with an error, correct shared internal PIN opens `#correctionPanel`, and the Void Audit list renders (empty state is OK).
  7. Keep existing void/carry-forward and stock-top-up smoke scenarios intact; PIN scenarios should run before deeper workflow checks.
  8. Update README smoke-test notes with one line saying PIN-gated flows are covered.
- **Touches:** `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** POS app behavior, `meowmeow_pos_event.html`, CSV shape, localStorage keys, product data, or PIN values.
- **Acceptance checks:**
  - Running the smoke script still prints one clear pass message.
  - If operator login wrong-PIN logic is bypassed, the smoke test fails with a recognizable assertion message.
  - If the shared internal passcode changes or a lock screen stops accepting it, the smoke test fails with a clear PIN/lock assertion rather than a generic timeout.
  - Dashboard, Inventory, and Correction lock scenarios each test wrong PIN and correct PIN paths.
  - README smoke-test section mentions PIN-gated workflow coverage.
- **Risks/assumptions:** The smoke test will repeat PIN values already present in the production HTML. This is no new disclosure, but future reviewers should remember these are local operational passcodes, not strong secrets.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Completed on `batch/t-pin-smoke-coverage` 2026-04-27. Smoke test now drives login (auto-open + wrong/right Zamm PIN), Dashboard lock (wrong/right shared PIN), Inventory lock (wrong/right shared PIN, opened via `developerAccessBtn`), and Correction lock (wrong/right correction PIN, opened via the inventory-panel-nested `correctionAccessBtn` which also exercises the "I Understand" confirm dialog). 12 new assertions cover overlay-open/closed, panel-hidden, error text, PIN cleared, and panel-rendered states. Spec called for `฿` in the dashboard total but the dashboard uses `Intl.NumberFormat` with `THB ` prefix — assertion adjusted to match real app behavior. README smoke-test note updated.

### Batch U — Internal Dashboard Redesign
- **Business objective:** Make the passcode-protected Internal Dashboard easier for managers to read during the event: total sales, today performance, payment mix, goal progress, and 4-day pace.
- **Expected benefit:** Faster booth decisions, clearer cash/transfer/card checking, and easier sales goal tracking.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Reuse the single-file vanilla HTML/CSS/JS app and the existing dashboard passcode flow; use `dashboard re-design task` only as reference, with no React/Babel/CDN/design-canvas dependency.
- **Items:**
  1. Replace the dashboard body with the cream/brown v2 structure: event total vs goal, horizontal goal bar, remaining-to-goal, needed pace per open day, 4-day pace cards, today stats, and payment split.
  2. Extend `dashboardMetrics()` only for display data: today receipt/item/free-gift counts, today average bill, payment split totals/counts, open days, and pace needed.
  3. Preserve passcode `987`, sales goal constant, discount exception flags, free-gift count format, storage, CSV, and Batch R event-start behavior.
  4. Update smoke coverage for the new dashboard selectors.
- **Touches:** `meowmeow_pos_event.html` dashboard CSS/markup/rendering, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** product data, sales storage, CSV shape, inventory behavior, localStorage keys, PIN values, or the React design-board files.
- **Acceptance checks:**
  - Wrong Dashboard PIN remains blocked; correct `987` opens the redesigned dashboard.
  - Empty dashboard renders clean zero states without `NaN`.
  - Dashboard shows event total, goal progress, remaining amount, pace/day, 4-day cards, today stats, and cash/transfer/card split.
  - Discount exception flags still appear on event and day totals.
  - Free-gift sold counts keep the existing paid/free parentheses format.
  - `tests/smoke_event_pos.js` passes.
- **Risks/assumptions:** Implemented on top of the current Batch R checkout because the user asked Codex to implement now while Batch R edits were present. The copied `dashboard re-design task/Meowmeow POS.html` was not bulk-merged.
- **Owner:** codex
- **Status:** review-ready
- **Branch:** batch/r-manual-event-start-count
- **Claimed:** 2026-04-27 10:30
- **BlockedBy:**
- **Notes:** Implementation complete and ready for final review/merge prep with Batch R. Dashboard now renders the v2 cream/brown layout with goal bar, remaining pace, 4-day pace cards, today stats, and payment split. Smoke test updated and passing with the documented Codex Node/Playwright command.

## Suggested order (least-conflict first)

1. **A** (Claude or Codex) — fundamentals, unblocks B.
2. **C** (the other agent, after A merged) — disjoint region.
3. **B** (after A merged).
4. **D** — single owner; pause everything else.
5. **E** (after D merged).
6. **G** — Stock & Allocation Setup UI clarity (Claude execution; Codex review recommended because it affects live inventory setup).
7. **H** — Void Bill from Correction Center (Claude execution; Codex review recommended because it affects saved sales, inventory carry-forward, and audit history).
8. **L** — Void Audit Review & Export.
9. **M** — Safer Test Data Reset Cleanup.

10. **P** - Restore UTF-8 symbols after Batch O before any event-device deployment.
11. **Q** - Destructive Reset Passcode & Severity.
12. **R** - Manual Event Start Count after reset safety is clear.
13. **S** - Replace Remaining Browser Alerts With In-App Dialogs after reset/dialog patterns are settled.
14. **T** - Smoke Coverage for PIN-Gated Workflows after Batch Q updates passcode/reset patterns.

## Done

- **Batch B — Checkout Polish** — completed on `batch/b-checkout-polish` on 2026-04-26 by codex. Items #4, #5, #6 shipped.

(Move completed batches here with the merging commit SHA.)

- **Batch A — Operator Gate Trio** — merged into `start` at `6895710` on 2026-04-25 by claude. Items #1, #2, #3 shipped.
- **Batch C — Cart & Status Guards** — completed on `start` at `2cce88b` on 2026-04-26. Items #7 and pay-later removal shipped.
- **Batch F — Staff Login & Tap-in Dedup** — completed on `start` at `f674cdb` on 2026-04-26 by claude. Staff PIN login, persistent session, manual logout, redundant operator tap-in removed.
- **Batch D — Sample Qty Per-Day Migration** — merged into `start` at `28ffc31` on 2026-04-26 by claude. Per-day `sampleQty` shipped with one-time migration; unblocks Batch E.
- **Batch E — Render Memoization + Correction Stock Impact** — merged into `main` at `e35aabc` on 2026-04-26 by claude. Per-pass `cartReservedMap` reduces cart walks in `renderProducts`; Bill Correction review previews per-day starting-stock re-alignment.
- **Batch H — Void Bill from Correction Center** — merged into `main` at `b45838b` on 2026-04-26. Reason-required bill void flow shipped with audit snapshots and inventory carry-forward realignment.
- **Batch G — Stock & Allocation Setup clarity** — merged into `main` at `1923f0c` on 2026-04-26. Added Today now works as a top-up delta input, resets after confirm, and hides idle stock helper noise.
- **Batch I — Event-Day Verification Checklist** — documentation-only stabilization pass completed on `main` on 2026-04-26. README now lists the high-risk pre-event manual checks and expected business result for each.
- **Batch J — Pre-Event Data Hygiene Pass** — documentation-only stabilization pass completed on `main` on 2026-04-26. README now documents safe cleanup paths for test sales, pending Send Later records, saved customer emails, and CSV backup expectations.
- **Batch K — Local Smoke Test Script** — completed on `batch/k-local-smoke-test` on 2026-04-26. Adds a repeatable Playwright smoke check for page load, void/carry-forward, and stock top-up reset behavior.
- **Batch L — Void Audit Review & Export** — merged into `main` at `aba934c` on 2026-04-26. Adds a `Void Audit` list and concise CSV export inside Bill Correction; refreshes live on void/cross-tab; smoke test extended.
- **Batch M — Safer Test Data Reset Cleanup** — shipped to `main` on 2026-04-26 under single-agent mode. Explicit reset confirm copy, void audit cleared with reset, Correction Center re-renders after reset, smoke test extended.
- **Batch P — Restore UTF-8 Symbols After Inventory Baseline** — merged into `main` at `33bd06f` on 2026-04-27 by claude after Codex review (safe to merge, BOM/note mismatch corrected). Rebuilt the POS HTML from Batch M's intact-symbol baseline, re-spliced Batch N's compressed images and Batch O's inventory baseline, and wrote as UTF-8 with the file's pre-existing BOM. Smoke test and visual selling-screen check pass.
- **Batch Q — Destructive Reset Passcode & Severity** — merged into `main` at `5a50bd6` on 2026-04-27 by claude (Codex push-review). Reset Data button restyled to `🚨` `.action-btn.severe`; reset overlay restyled to `.confirm-card.severe` with hazard banner; 3-digit passcode keypad gates the destructive button, which starts disabled and only enables after entering `888`. Wrong passcode shows in-app error and clears entry; cancel/close clears state. Smoke test extended with 4 gate assertions; README Pre-Event Data Hygiene rewritten. Unblocks R, S, T.
- **Batch T — Smoke Coverage for PIN-Gated Workflows** — merged into `main` at `ebb87c0` on 2026-04-27 by claude. Smoke test now drives login overlay + Dashboard/Inventory/Correction lock screens through wrong-PIN and right-PIN paths (12 new assertions). Test-only batch; no app behavior changed.
- **Batch R — Manual Event Start Count** — implemented on `batch/r-manual-event-start-count` on 2026-04-27 by claude (PR pending). Per-day `eventStartConfirmed[sku]` map; Day 1 Event Start renders empty/unconfirmed by default; `addToCart` blocked for unconfirmed SKUs; saving through Stock & Allocation Setup confirms and unblocks; closing a day auto-confirms the next. Smoke test extended with Batch R scenario.
