# Shared Task Board — MeowMeow POS

Source of truth for work-in-progress. Both Claude and Codex must read this file **before** editing any project file, and update it **immediately after** claiming, completing, or releasing a batch.

> **Two-agent protocol RESUMED as of 2026-04-27 20:25** — Codex is back as planner/reviewer/workflow analyst and Claude is the default implementation executor for approved batches. Claim/release, branch-per-batch, and Codex review rules are active again unless the user explicitly assigns Codex implementation work.

> **Protocol refresh, 2026-04-28:** after the final Codex readiness fixes, the two-agent protocol is active again. Codex owns planning/review/workflow alignment; Claude is the default implementation executor unless the user explicitly assigns Codex execution.

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
  3. Convert the highest-friction admin paths first: `Clear Emails`, stock setup validation failures, inventory reversal reason, and export-empty/error messages if practical. `Clear Pending Send Later` is already done as a hotfix.
  4. Keep lightweight cart stock notices as toast-style messages where already appropriate.
  5. Use consistent button styling, title, message, and danger/secondary states across dialogs.
  6. Update README if user-facing admin behavior changes.
- **Touches:** dialog markup/CSS, alert/prompt/confirm call sites, `purgeSavedReceiptContacts`, `clearPendingSendLaterOrders`, stock setup validation paths, inventory reversal path, export empty/error paths, README if behavior is documented.
- **Do not change:** actual data cleared/exported/saved, passcodes except Batch Q reset passcode, CSV formats, inventory logic, or sales logic.
- **Acceptance checks:**
  - `Clear Emails` no longer uses browser `alert`; it shows an in-app result dialog.
  - `Clear Pending Send Later` remains in-app and does not regress to browser `prompt`/`confirm`.
  - Wrong passcodes or validation failures are visible in-app and do not perform the action.
  - Existing overlays can still close via intended buttons and Escape where appropriate.
  - `tests/smoke_event_pos.js` still passes.
- **Risks/assumptions:** There are many alert call sites. Claude should keep this batch focused on staff/admin flows and avoid rewriting every low-level storage failure path unless time allows.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:** 2026-04-27 21:05
- **BlockedBy:** Q
- **Notes:** Completed on `main` 2026-04-27. Claude implemented two reusable overlays (`#appNoticeOverlay` for OK-style notices and `#appPromptOverlay` for textarea reason prompts), and replaced every remaining `alert(...)` and `prompt(...)` call site with `showAppNotice(...)` / `openAppPrompt(...)`. Affected paths: `Clear Emails` result, Stock & Allocation Setup validation, Inventory Correction validation, Inventory Reverse top-up reason (textarea, Enter to submit, Cancel/Escape close), Send Later form validation, Send Later/Sale/End-of-Day/Void Audit CSV export empty/error, and the storage-failure save errors in `saveSales`/`saveVoidedSales`/`saveInventory`/`saveGlobalInventory`/`savePreorders`. Free-scarf out-of-stock cart message switched from `alert` to existing `showStockNotice` toast. Codex follow-up fixed Escape handling so app notice/prompt dialogs close before parent overlays. `tests/smoke_event_pos.js` passes.

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
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Shipped to `main` on 2026-04-27 alongside Batch R (fast-forward, top commit `3dabcf2`). Cream/brown v2 dashboard: event total vs goal, horizontal goal bar with quartile ticks, remaining + pace strip, today receipts/items/avg-bill/total tiles, today payment split (cash/transfer/card) bar + tiles, 4-day pace cards with Live badge for active day. `dashboardMetrics()` extended with today-only fields, `paySplit`, `openDays`, `paceNeeded`; empty state is NaN-safe. Codex follow-ups on `main` after merge: `dff9190` reset confirm action visibility, `5f8c186` pace-card tightening, `5756356` pace-metric alignment, `66d1e04` payment-tile wrap safety. ACCESS_CONTROL passcodes (`456` shared internal), EVENT_SALES_GOAL, discount-exception flags, free-gift paid/free format, sales storage, CSV, inventory carry-forward, and Batch R event-start gate all preserved. Smoke test extended for new dashboard selectors and passes.

### Batch V - Dashboard V3 Manager View
- **Business objective:** Upgrade the Internal Dashboard from a clean sales summary into a live manager view for booth decisions: goal progress, day pace, today performance, payment reconciliation, top sellers, and low-stock action.
- **Expected benefit:** Faster manager decisions during the event, clearer cash/transfer/card checking, earlier restock focus, and better visibility into which products are driving revenue.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Keep the current single-file HTML/CSS/JS app and reuse Batch U's dashboard data patterns. Do not add React, chart libraries, CDN dependencies, or a new storage model. Use CSS bars/cards for the visual dashboard.
- **Reference:** Use the Dashboard V3 reference image shared in chat, not a workspace file. If Claude cannot see the chat image, implement from this written structure: top event total vs goal card; horizontal 4-day timeline; today KPI section; payment split; top sellers; low-stock alerts.
- **Items:**
  1. Redesign the dashboard body into a manager-oriented V3 layout:
     - event total vs goal card with percent, progress bar, remaining amount, and pace needed
     - horizontal 4-day pace timeline with day number, live/open/closed state, total, receipt count, and item count
     - today section with receipts, items sold, average bill, and current day total
     - today payment split with cash / transfer / card totals and receipt counts
     - top sellers event card with simple horizontal bars
     - low stock alerts card based on current event remaining stock
  2. Extend `dashboardMetrics()` only with display data:
     - top sellers by event quantity and/or revenue
     - current low-stock products using the existing inventory snapshot / low-alert threshold
     - optional today hourly/peak-hour data if saved sale timestamps are reliable and it can be done without a chart library
  3. Preserve Batch U safety work:
     - payment tile wrap safety for THB 100,000+ values
     - 4-day receipt/item alignment
     - empty dashboard zero states with no `NaN`
  4. Update smoke assertions only where selectors or visible dashboard structure change.
- **Touches:** `meowmeow_pos_event.html` dashboard CSS/markup/rendering and `dashboardMetrics()`, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** product data, sales storage, localStorage keys, CSV shape, passcodes, reset behavior, Send Later behavior, inventory math, event-start confirmation behavior, free-gift item display format, or discount exception red flags.
- **Acceptance checks:**
  - Wrong dashboard PIN stays locked; correct internal PIN opens the dashboard.
  - With no sales, V3 dashboard shows clean zero states without broken bars or `NaN`.
  - Add cash, transfer, and card sales; payment split totals and receipt counts update correctly.
  - Add sales across different operating days; the 4-day timeline matches saved sales by operating day.
  - Top sellers exclude free gifts or clearly separate them from paid products.
  - Low-stock alerts match current event remaining stock and existing low-alert thresholds.
  - Discount exception red flags still appear on event/day totals where applicable.
  - Free-gift item counts keep the existing paid/free display format.
  - iPad/mobile widths do not overlap text; large THB values remain readable.
  - `tests/smoke_event_pos.js` passes.
- **Risks/assumptions:** The reference image is in chat, not the workspace. Hourly/peak-hour data depends on saved sale timestamps and should be skipped or kept simple if it risks false precision. Low-stock alerts must use current event remaining stock, not global warehouse stock. This batch overlaps the dashboard region, so do not run it in parallel with Batch S if both agents would edit `meowmeow_pos_event.html`.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:**
- **Notes:** Merged into `main` at `4c23c09` on 2026-04-27 by claude. V3 manager dashboard shipped: event goal card, horizontal 4-day pace timeline with Live badge, today KPI tiles, payment split bars, Top Sellers (paid items, top 5), Low Stock Alerts (active day SKUs at/below threshold). `dashboardMetrics()` extended with `topSellers`, `topSellerMaxQty`, `lowStock`, `anyEventStartConfirmed`, `activeDayId`, `activeDayLabel`. Smoke test extended. Codex post-merge cosmetic adjustments on `main`: `d352042` (move top sellers below today), `0a6833b` (docs: add Batch W to TASKS). Unblocks Batch W.

### Batch W - Today By Hour Dashboard Card
- **Business objective:** Help managers see the live sales rhythm during the event by hour, so they can judge when the booth is warming up, peaking, or slowing down.
- **Expected benefit:** Faster staffing, stock, and promotion decisions during the day; clearer view of peak selling time.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Use existing sale timestamps and plain HTML/CSS bars. No chart library, no new storage keys, and no data-shape changes.
- **Reference screenshot:** `dashboard re-design task/references/today-by-hour-reference.png`
- **Items:**
  1. Add a `Today By Hour` card in the empty dashboard space under `4-Day Pace`.
  2. Use hourly buckets:
     - `<10` for sales before 10:00
     - `10` through `20` for sales from 10:00-20:59
     - `>21` for sales at 21:00 or later
  3. Render compact vertical bars in the approved visual style:
     - cream/tan normal bars
     - darker brown peak bucket
     - compact amount labels above nonzero bars
     - peak note in the header, for example `peak THB 12k @ 15:00`
  4. Extend `dashboardMetrics()` only with display data for hourly bucket totals, receipt counts, and peak bucket.
  5. Preserve all existing dashboard totals, payment split, top sellers, low-stock alerts, discount flags, and free-gift display.
- **Touches:** `meowmeow_pos_event.html` dashboard markup/CSS/rendering and `dashboardMetrics()`, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** sales storage, localStorage keys, CSV shape, product data, passcodes, inventory math, Send Later behavior, reset behavior, or saved sale shape.
- **Acceptance checks:**
  - No sales today shows a clean empty state with no `NaN`.
  - Sale before 10:00 appears in `<10`.
  - Sales from 10:00 through 20:59 appear in matching buckets `10` through `20`.
  - Sale at 21:00 or later appears in `>21`.
  - Peak bucket is highlighted dark brown and peak text matches the bucket.
  - Dashboard remains readable on desktop, iPad, and mobile widths.
  - `tests/smoke_event_pos.js` passes.
- **Risks/assumptions:** Bucket by local device time using existing `sale.datetime`. Amount labels use compact THB formatting to avoid crowding. The reference screenshot is saved for implementation guidance only and should not be loaded by the POS app at runtime.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:**
- **BlockedBy:** V
- **Notes:** Completed by Codex on `batch/w-today-by-hour-dashboard` 2026-04-27. Added the Today By Hour dashboard card under 4-Day Pace with `<10`, `10`-`20`, and `>21` local-time buckets, compact vertical bars, dark-brown peak highlight, and peak note. `dashboardMetrics()` now exposes display-only hourly totals/receipt counts; no storage, CSV, product, passcode, inventory, Send Later, reset, discount flag, free-gift, top-seller, or low-stock behavior changed. Smoke and responsive layout sanity checks passed.

### Batch X - Inventory Flow Sample Visibility + Table Readability
- **Business objective:** Make sample-stock movement and key inventory quantities visible in Inventory Flow so staff/managers can reconcile booth stock faster.
- **Expected benefit:** Fewer questions about missing stock, clearer review of samples created during the event, and faster scanning of added/remaining stock during operations.
- **Implementation difficulty:** low to medium.
- **Cost/complexity tradeoff:** Reuse the existing per-day `sampleQty` inventory model and current Inventory Flow table instead of adding new storage, reports, or export formats.
- **Items:**
  1. Show per-day sample stock in the Inventory Flow summary area, visually grouped inside the existing `Added Stock` KPI card:
     - keep `Added Stock` visible as its own partition
     - add a `Sample` partition in the same card
     - show sample movement with a leading minus sign, e.g. `-1`, `-3`
     - show `-0` in a quiet state when no samples exist
  2. Show per-product sample stock in the Inventory Flow table:
     - keep the existing `Added Stock` column
     - add a compact `-N sample` chip/subline inside that column only when sample quantity is nonzero
     - do not add a new table column unless layout becomes unreadable
  3. Improve Inventory Flow table readability:
     - make numeric values larger and easier to scan
     - visually emphasize `Added Stock` and `Remaining Stock`
     - keep `Starting Stock` and `Sold Quantity` readable but less visually dominant
     - keep low/zero remaining stock easy to notice without making the table noisy
  4. Preserve current inventory math:
     - remaining stock must continue to equal `starting + added - sold - sample`
     - lowering `sampleQty` through `Correction Center > Inventory Correction` must automatically return stock to event remaining stock
     - do not change sample storage shape or correction save logic
  5. Update README Inventory notes to explain that Inventory Flow displays sample movement as `-N sample`, and that sample quantity reduces remaining event stock until corrected.
  6. Extend `tests/smoke_event_pos.js` with a focused sample visibility check.
- **Touches:** `meowmeow_pos_event.html`, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** sample storage shape, Stock & Allocation Setup sample editing logic, Inventory Correction save logic, sales CSV shape, end-of-day CSV shape, product data, passcodes, Send Later behavior, or dashboard behavior.
- **Acceptance checks:**
  - With Day 1 sample quantity set to `1` for a SKU, Inventory Flow summary shows `Sample -1` inside the same visual box as `Added Stock`.
  - The matching product row shows a visible `-1 sample` indicator.
  - Added Stock and Remaining Stock table numbers are larger/more visually prominent than the current plain table numbers.
  - Remaining stock still equals `starting + added - sold - sample`.
  - If Inventory Correction changes that SKU sample quantity from `1` back to `0`, Inventory Flow removes the row chip or returns it to zero state, and Remaining increases by `1`.
  - Free gift/scarf display keeps the existing parentheses formatting where relevant.
  - `tests/smoke_event_pos.js` passes.
- **Risks/assumptions:** Sample stock is already tracked per day in `state.inventory.days[dayId].sampleQty` and already reduces remaining event stock. This batch should be display/readability plus smoke coverage; any inventory-math change is a regression risk.
- **Owner:**
- **Status:** done
- **Branch:** batch/x-inventory-flow-samples
- **Claimed:** 2026-04-27
- **BlockedBy:**
- **Notes:** Completed by Codex on `batch/x-inventory-flow-samples` 2026-04-27. Inventory Flow now shows `Added` and `Sample -N` partitions inside the Added Stock KPI, displays per-row `-N sample` chips, adds an emoji/live sign to Current Flow, and uses larger highlighted table numbers for Added Stock and Remaining Stock. Existing sample math and Inventory Correction behavior unchanged; smoke coverage added and passing.

### Batch Y — Product Delivery Fee for Send Later Orders
- **Business objective:** Charge the correct delivery fee for Send Later orders using the per-SKU `Delivery Fee` values from `product/product list-event price.xlsx`.
- **Expected benefit:** Delivery orders cover real fulfillment cost, staff do not need to calculate shipping manually, and CSV/revenue totals reconcile with what the customer paid.
- **Implementation difficulty:** medium.
- **Cost/complexity tradeoff:** Add a small `deliveryFee` field to embedded product data and sale totals instead of adding a backend, separate shipping table, or manual checkout step. This keeps the booth workflow fast while letting fees vary by product.
- **Items:**
  1. Update embedded `PRODUCTS` entries from `product/product list-event price.xlsx` so each normal SKU has `deliveryFee` from the workbook's `Delivery Fee` column.
     - Confirmed workbook shape: `SKU`, `Description`, `RSP (ราคาขาย)`, `Promotion Price`, `Discount`, `Delivery Fee`, optional promotion note.
     - Example inspected values: SKU `002A` delivery fee `120`, SKU `007` delivery fee `200`, SKU `013` delivery fee `200`.
  2. Calculate delivery fee only for Send Later cart lines as `product.deliveryFee * sendLaterQty`, summed across all Send Later items.
  3. Show `Delivery Fee` as a separate summary row in the cart and review receipt whenever the total delivery fee is greater than 0.
  4. Include delivery fee in `cartTotals().chargeableTotal`, saved sale total, transfer QR amount, payment confirmation amount, receipt text, and day CSV sale-level fields.
  5. Add CSV fields for delivery fee without changing existing column meanings:
     - recommended sale-level fields: `saleDeliveryFee`, `deliveryFeePerUnit`, `lineDeliveryFee`
     - keep product merchandise line totals as product revenue; do not hide delivery inside product discount.
  6. Update README Fulfillment Later and Data/CSV notes to explain that Send Later adds per-SKU delivery fee from the product price workbook.
  7. Extend `tests/smoke_event_pos.js` with a focused Send Later delivery-fee check.
- **Touches:** `meowmeow_pos_event.html` product catalog, `cartTotals`, receipt/cart summary markup, `completeSale`, `serializeCartLine`, transfer QR amount path, CSV helper(s), `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** normal booth-sale pricing, discount editing behavior, inventory math, Send Later warehouse reservation math, customer/shipping required fields, payment methods, passcodes, or existing localStorage keys unless a backwards-compatible sale field is needed.
- **Acceptance checks:**
  - Normal non-Send-Later sale has no delivery fee row and existing totals remain unchanged.
  - One Send Later SKU with `Delivery Fee = 120` and qty `1` adds THB 120 to total due.
  - Same SKU qty `2` adds THB 240 delivery fee.
  - Mixed Send Later SKUs with different delivery fees sum correctly, e.g. `120 + 200`.
  - Mixed cart with booth item + Send Later item charges delivery only for the Send Later item.
  - Receipt slip, copied/emailed receipt text, transfer QR amount, and saved sale total all include the delivery fee.
  - Day CSV exports delivery fee fields clearly enough for Excel reconciliation.
  - Send Later queue CSV still exports the order details and remains paid-at-event.
  - `tests/smoke_event_pos.js` passes.
- **Risks/assumptions:** The workbook is the source for delivery fee values, but the running app still uses embedded constants; Claude must manually sync the values into `PRODUCTS`. Delivery fee should be a sale charge, not an inventory item. Codex review recommended because this touches payment totals, receipts, QR amount, and CSV reconciliation.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:** 2026-04-28 14:30
- **BlockedBy:**
- **Notes:** Implemented by Claude on `batch/y-send-later-delivery-fee` (head `e1482df`). All assertions pass in the local smoke test (`local smoke passed for meowmeow_pos_event.html`), including the two new correction scenarios added after Codex review. Codex review requested before merge because the change touches payment totals, transfer QR amount, receipt, and CSV reconciliation.

  Codex review round 1 (2026-04-28) flagged two High issues, both now fixed in `e1482df`:
  - **Card surcharge dropped/mismatched on correction.** `correctionTotalsFromItems` now takes the corrected `payment` and returns `cardSurcharge` (3% of `merchandise + deliveryFee`) baked into `total`. `buildCorrectionDraft` passes `after.payment` and captures `beforeTotals.cardSurcharge`; `confirmCorrectionSave` persists `sale.cardSurcharge` on save and rolls back on failure. The receipt identity `Total === Merchandise - Discount + Delivery + CardSurcharge` now holds after a card Send Later correction. Cash↔card switches without a qty change also trigger the `saleTotals` change flag.
  - **Legacy Send Later sales gaining a retroactive delivery fee.** `rebuildCorrectionItem` now defaults missing `deliveryFeePerUnit` to `0` instead of `productDeliveryFee(sku)`. Pre-Batch-Y bills (no delivery fields) stay at 0 even when staff correct only email/payment/tags or change quantity; new Batch Y sales already serialize the field, so they still correct correctly.

  Smoke coverage added for both fixes: card Send Later correction asserts pre/post values to two decimals (1586.20 → 793.10) and the receipt identity, plus the cash cross-check that surcharge zeros out; legacy Send Later correction asserts that an untouched bill records 0 delivery, that card surcharge then applies to merchandise only (preserves pre-Y math), and that a quantity-reduced legacy correction still records 0 delivery.

  Workbook delivery fees synced into `PRODUCTS`: 002A/002B/003/004/005/006 = 120, 007 = 200, 010/012 = 120, 013 = 200, 014 = 120, 015/016 = 200, 017 = 50, 018 = 0 (workbook blank), 019/020 = 50, 021/022 = 0 (stickers, workbook blank), GIFT-SCARF = 0.

  Implementation summary:
  - New helpers `productDeliveryFee(sku)` / `lineDeliveryFee(line)` (Send Later lines only).
  - `cartTotals()` now returns `deliveryFee` and bakes it into `chargeableTotal`. Card surcharge is calculated on `merchandise + deliveryFee` so the 3% matches the real transaction amount.
  - New `Delivery Fee` summary row in the cart panel (`#summaryDeliveryFeeRow` / `#summaryDeliveryFee`) and in the review-receipt slip (`#receiptDeliveryFeeRow` / `#receiptDeliveryFee`); both hidden when 0.
  - `completeSale` persists `pendingSale.deliveryFee`. `serializeCartLine` records `deliveryFeePerUnit` / `lineDeliveryFee` per saved item.
  - Bill Correction: `correctionTotalsFromItems` returns `{subtotal, discount, total, deliveryFee}` (recomputed from updated Send Later items), `confirmCorrectionSave` persists/rolls back `sale.deliveryFee`, `rebuildCorrectionItem` rebuilds per-line delivery fee on qty changes, and the correction review summary surfaces the fee when > 0.
  - Transfer QR amount: `refreshTransferQr` switched to `totals.chargeableTotal` so the QR encodes the full chargeable amount (including delivery fee). `renderPendingTransferQr` already used `sale.total` (now chargeable) — unchanged.
  - `receiptText` includes a `Delivery Fee:` line when > 0 (copied/emailed receipt).
  - CSV: `saleDeliveryFee`, `deliveryFeePerUnit`, `lineDeliveryFee` appended at the end of `saleToCsvRows` and `daySalesToCsv` headers + per-row data; existing column meanings preserved. Booth lines record `0`. Send Later queue CSV is unchanged (paid-at-event only).
  - Legacy saved sales without `sale.deliveryFee` / `item.deliveryFeePerUnit` render safely (defaults to 0 everywhere).
  - README: Fulfillment Later and Data, Storage & CSV sections updated. Recently Changed entry added.

  Smoke coverage (Batch Y scenario, end of `tests/smoke_event_pos.js`): empty cart hides the row, booth-only sale charges no delivery, 002A x1 = THB 120 with row visible, 002A x2 = THB 240, 002A + 007 = THB 320, mixed booth + Send Later charges only the Send Later line, card surcharge = 3% × (merchandise + delivery), serialized line records per-unit + line fee, saved sale persists `deliveryFee`, day CSV header has the three new columns and the row exports `200/200/200` for a 013 Send Later sale, pending sale total equals `cartTotals().chargeableTotal` so the transfer QR amount includes delivery. Final `pageErrors`/`browserDialogs` gate re-asserted after the new scenario.

  Files touched: `meowmeow_pos_event.html`, `readme.md`, `tests/smoke_event_pos.js`. Out of scope per spec: Send Later queue CSV shape, inventory/Send Later reservation math, passcodes, localStorage keys, normal booth-sale pricing.

  Open assumptions for Codex review:
  - SKU 018 (Lobster Doll) has a blank `Delivery Fee` cell in the workbook → I default it to 0. If the operator expects 50 (matching the other Modern Friends plush 017), update the workbook and the constant.
  - SKU 021/022 (Stickers) likewise default to 0; this lines up with the upcoming Batch Z sticker-promo intent.
  - Card surcharge now applies to `merchandise + deliveryFee`; pre-Y behavior applied 3% to merchandise only. Surfacing this to flag the user-visible total change.

### Batch Z — Replace Free Scarf Promo with Sticker Choice Promo
- **Business objective:** Update the event promotion from free scarf to a lower-threshold sticker gift that matches the current offer: `ซื้อครบ 1200 บาท (Meowsuem+Modern Friends) ฟรี Sticker Meowsuem 1 ชิ้น(sku:021 or 022) มูลค่า 100 บาท`.
- **Expected benefit:** Staff follow the real promotion in the POS, customers can choose the sticker variant, and inventory/CSV correctly track free sticker movement by SKU.
- **Implementation difficulty:** high.
- **Cost/complexity tradeoff:** Rework the existing free-gift engine instead of adding a separate promo app or manual discount process. This is more complex than copy changes because the current logic is scarf-specific and uses a dedicated `GIFT-SCARF` SKU, while the new promo uses real sellable SKUs `021` or `022` that can also be bought normally.
- **Items:**
  1. Replace the current free scarf rule (`THB 2,000` earns `GIFT-SCARF`) with the new sticker rule:
     - qualifying cart total threshold: THB 1,200
     - qualifying paid items: Meowseum + Modern Friends products
     - free gift: one Sticker Meowsuem item per threshold, selectable as SKU `021` or `022`
     - gift value display: THB 100
  2. Add a simple staff choice flow for the free sticker:
     - when entitlement is reached, show/enable a gift choice between SKU `021` and SKU `022`
     - preserve quick flow; staff should not need to leave checkout
     - if only one sticker SKU has stock, make the available choice obvious
  3. Track free stickers using the real SKU selected (`021` or `022`) with `isFreeGift` metadata so inventory deducts from the same sticker stock as paid sticker sales.
  4. Preserve paid-vs-free display format for inventory and dashboard for sticker SKUs, not only the old scarf SKU.
  5. Update cart, receipt, review, correction, CSV, and dashboard labels from scarf language to sticker language.
  6. Keep manual gift override only behind the existing in-app confirmation pattern, updated for sticker wording and selected SKU.
  7. Remove or retire user-facing `GIFT-SCARF` behavior. If backwards compatibility is needed for old saved sales, keep display helpers able to read old `GIFT-SCARF` records without awarding new scarves.
  8. Update README Free Gift Rules and Event-Day Verification Checklist for the sticker promo.
  9. Extend `tests/smoke_event_pos.js` with the new threshold and sticker-choice behavior.
- **Touches:** `meowmeow_pos_event.html` free-gift constants/helpers, gift button/cart UI, gift confirmation dialog, inventory free-gift maps/display helpers, dashboard paid/free counts, receipt rendering, correction item rebuild/labels, CSV helpers, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** paid sticker product price/discount behavior, non-gift product pricing, delivery-fee behavior from Batch Y, Send Later warehouse reservation math, payment methods, passcodes, localStorage keys, or inventory correction rules.
- **Acceptance checks:**
  - Cart below THB 1,200 earns no automatic gift.
  - Qualifying paid cart at or above THB 1,200 unlocks one free sticker choice.
  - Cart at THB 2,400 unlocks two free sticker gifts if stock allows.
  - Staff can choose SKU `021` or `022`; the selected SKU appears in cart/receipt as a free item at THB 0.
  - Paid SKU `021`/`022` purchases still work as normal paid items when added directly.
  - Inventory deducts free sticker quantity from the selected sticker SKU and displays paid/free counts in parentheses.
  - If one sticker SKU is out of stock, staff cannot award that SKU but can choose the other if available.
  - Manual extra sticker gift requires confirmation and is marked as manual override in CSV.
  - Old saved scarf bills, if present in localStorage, still render without crashing.
  - `tests/smoke_event_pos.js` passes.
- **Risks/assumptions:** "Meowsuem+Modern Friends" is interpreted as qualifying paid products in the `meowseum` and `modernfriend` tabs, excluding promo/free-gift lines. Because this replaces a dedicated gift SKU with selectable real SKUs, Codex review is strongly recommended before event use.
- **Owner:**
- **Status:** done
- **Branch:** batch/z-sticker-promo
- **Claimed:** 2026-04-28 16:00
- **BlockedBy:**
- **Notes:** User described this as likely the last batch. Keep after Batch Y to avoid mixing pricing/receipt total changes with promo-inventory changes. Y is merged on `main`; Z claimed by Claude 2026-04-28. Claude hit rate limit mid-implementation; user paused the two-agent protocol and asked Codex to finish solo. Codex completed the sticker-choice promo on `batch/z-sticker-promo`: retired new `GIFT-SCARF` awards, added THB 1,200 Meowseum + Modern Friends entitlement, added cart choice buttons for SKU `021`/`022`, preserved paid/free sticker coexistence with real SKU inventory deduction, updated README, and extended smoke coverage for threshold, double entitlement, SKU choice, paid/free coexistence, out-of-stock fallback, manual override, immediate catalog stock refresh, split brown/black gifts, and the minus-then-plus quota restore flow. User tested the app and confirmed the final split-sticker behavior is good. `tests/smoke_event_pos.js` passes.

### Batch FINAL_REVIEW — Event Readiness Bug Fix & Full Workflow Check
- **Business objective:** Do one final bug-fix and readiness pass after delivery fees and the sticker promo are implemented, so the POS is safe to use on the event device.
- **Expected benefit:** Fewer live-booth surprises, cleaner staff workflow, more reliable payment/CSV/inventory totals, and higher confidence before real sales start.
- **Implementation difficulty:** medium to high, depending on findings.
- **Cost/complexity tradeoff:** Focus on targeted fixes and verification, not new features. This keeps the single-file POS stable and avoids adding complexity right before event use.
- **Items:**
  1. Run the full local smoke test and fix any failing coverage.
  2. Manually test the highest-risk end-to-end workflows:
     - staff login/logout
     - Event Start count gate
     - normal cash sale
     - transfer/card payment confirmation
     - Send Later with per-SKU delivery fee
     - sticker gift entitlement and selected SKU inventory deduction
     - mixed cart with booth item + Send Later item + sticker promo
     - close day/export CSV
     - dashboard totals/payment split/top sellers/low-stock alerts
     - Bill Correction, Void Bill, and Inventory Correction
     - Reset Data and cleanup controls
  3. Compare totals across cart, review receipt, saved sale, dashboard, transfer QR amount, day CSV, and Send Later CSV.
  4. Check mobile/iPad layout for overlapping text, hidden buttons, and unreadable long THB values.
  5. Review README and TASKS for behavior drift after Batches Y and Z.
  6. Fix only blocking or event-readiness bugs found during the review; log nice-to-have improvements as future notes instead of expanding scope.
- **Touches:** likely `meowmeow_pos_event.html`, `tests/smoke_event_pos.js`, `readme.md`, and `TASKS.md`; exact code regions depend on findings.
- **Do not change:** product pricing/promo rules unless a bug is proven, localStorage key strategy, passcodes, CSV column meanings except bug-compatible additions, or UI design direction.
- **Acceptance checks:**
  - `tests/smoke_event_pos.js` passes.
  - No browser console errors during normal selling, Send Later, promo gift, dashboard, correction, void, reset, and CSV export flows.
  - Cart total, review receipt total, saved sale total, dashboard total, transfer QR amount, and CSV sale total match for tested cases.
  - Inventory remaining stock matches expected movement for paid sales, Send Later warehouse reservations, samples, corrections, voids, and free sticker gifts.
  - Staff can complete a sale without developer tools, page refreshes, or manual calculator work.
  - README's Event-Day Verification Checklist matches the current behavior.
- **Risks/assumptions:** This is a final stabilization batch, not a redesign batch. If a major structural problem is discovered, stop and split it into a focused emergency batch instead of mixing large changes into final review.
- **Owner:** codex
- **Status:** ready-for-review
- **Branch:** batch/final-review
- **Claimed:** 2026-04-28 18:30
- **BlockedBy:**
- **Notes:** Final readiness pass requested by user on 2026-04-28. Codex executed this solo after Batch Z was tested by the user and merged locally into `main`. Full smoke passes on `batch/final-review`. Final-review coverage added one combined high-risk checkout scenario: paid booth items + Send Later delivery fee + card surcharge + automatic sticker gifts, asserting pending sale total, saved sale total, delivery fee, card surcharge, free sticker inventory movement, Send Later non-event-stock movement, and day CSV rows all agree. Static drift scan found only historical/legacy scarf references in docs and legacy compatibility code; no live `FREE_GIFT_SKU` or browser-dialog regression found.

### Batch AA — Manager Action Dashboard V1
- **Business objective:** Turn the Internal Dashboard from "nice reporting" into "what should I do right now?". Layer manager-oriented action prompts on top of the existing V3 + Today By Hour dashboard so the owner/staff can see at a glance what needs attention, instead of scanning numbers and inferring decisions.
- **Expected benefit:** Fewer missed stock/payment/fulfillment issues during a live event; faster restock and promo decisions; smoother end-of-day closeout; easier daily updates to family/team members without manual spreadsheet copying.
- **Implementation difficulty:** medium. Five sub-features, all display-only and reading from existing state.
- **Cost/complexity tradeoff:** Reuse existing `dashboardMetrics()`, `state.sales`, `state.inventory`, `state.preorders`, and the dashboard panel CSS. No new storage keys, no new CSV shapes, no chart libraries, no new payment/inventory math. The whole batch is a read-only manager layer above already-correct data.
- **Reference:** Source recommendation drafted by user 2026-05-05 after exploring the `app ui improvement-handoff/` mockups. Treat the handoff folder as visual reference only — do not load any handoff file from `meowmeow_pos_event.html` at runtime.
- **Items:**
  1. **Today Action Panel** — top-of-dashboard alert row that surfaces only the conditions currently true:
     - "Sales behind goal" — when today total / open-day pace falls below the per-day pace needed from `dashboardMetrics()`.
     - "Low stock items" — list of SKUs at or below their low-alert threshold (already computed for Batch V's Low Stock Alerts card; reuse it).
     - "Cash/transfer/card reconciliation warning" — when `paySplit` cash + transfer + card total disagrees with today total beyond a small float tolerance.
     - "Pending Send Later orders" — count of orders in pending status from `state.preorders`, with a one-click jump to the queue.
     - Empty state when no condition fires: a quiet "All clear" line. Do not show zero-count alerts.
  2. **Inventory Recommendations** — short action chips next to the Low Stock Alerts card. Each chip is read-only display text generated from existing inventory + sales velocity:
     - "Restock this item" — when remaining ≤ low-alert threshold AND the SKU has sold today.
     - "Push this alternative SKU" — when an out-of-stock SKU has a same-tab sibling with healthy stock (use `tab` grouping from `PRODUCTS`).
     - "Switch to Send Later" — when remaining stock is 0 but the SKU has Send Later eligibility.
     - "Selling fast — do not discount yet" — when today qty for the SKU is in the top quartile of all sold SKUs.
     - Recommendations are advisory text; no automated action is taken.
  3. **End-of-Day Checklist** — collapsible panel near the bottom of the dashboard with five hand-checkable items:
     - Export sales CSV (links to the existing day-CSV button).
     - Cash count matches dashboard cash total (manual confirmation).
     - Transfer total matches expected (manual confirmation).
     - Card total matches expected (manual confirmation).
     - Review pending Send Later orders (links to the queue).
     - Save daily archive (links to the existing day archive).
     - Checks persist in `localStorage` per operating day under a new key (`meowseum_event_eod_checklist_v1`) and clear on reset.
  4. **Goal Pace Forecast** — extends the existing goal/pace strip with a projection block:
     - Current revenue (already shown).
     - Projected event total = `currentRevenue + paceSoFar × remainingOpenDays`, clearly labelled as a projection.
     - Amount still needed to hit `EVENT_SALES_GOAL`.
     - Required sales per remaining day AND per remaining hour for the active day (using event hours window, e.g. 10:00-21:00 from existing buckets).
     - Show "Projection unavailable — no sales today" empty state instead of NaN/Infinity when `paceSoFar = 0`.
  5. **Daily Summary Export** — single "Copy Today Summary" button that builds a clipboard-friendly text block with: today total, payment split, top sellers (paid only, top 5), low-stock items, pending Send Later count, and timestamp. Uses existing `navigator.clipboard.writeText` pattern from receipt-text. No CSV, no email — just text for WhatsApp/Excel paste.
- **Touches:** `meowmeow_pos_event.html` dashboard markup/CSS/rendering, `dashboardMetrics()` (extend with `paySplitMismatch`, `pendingPreorderCount`, `recommendations`, `projectedEventTotal`, `requiredPerDay`, `requiredPerHour`, `dailySummaryText`), one new `localStorage` key for checklist state, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** product data, sales storage, CSV shape, transfer QR amount path, passcodes, inventory math, Send Later reservation math, free-gift display format, discount exception flags, payment split totals, or anything in the Correction Center / Bill Correction / Void Audit flows. Specifically, do not introduce CRM features, AI forecasting, full accounting, or staff ranking — those are explicitly deferred per the source recommendation.
- **Acceptance checks:**
  - With no sales and clean state, Today Action Panel shows the "All clear" empty line.
  - Adding a low-stock SKU surfaces both the low-stock alert and the matching "Restock this item" recommendation chip.
  - Marking off an end-of-day checklist item persists across panel close/reopen and across page refresh, and is cleared by Reset Data and by closing the operating day.
  - Goal Pace Forecast shows the projection unavailable state with no sales, and a finite THB projection once at least one sale exists.
  - "Copy Today Summary" puts a non-empty text block on the clipboard that includes today total, payment split, top 5 sellers, and low-stock list.
  - Wrong dashboard PIN still blocks access; correct internal PIN still opens the redesigned panel.
  - `tests/smoke_event_pos.js` extended with one focused scenario per sub-feature; full smoke passes.
  - README Internal Dashboard section updated with the new manager-action layer.
- **Risks/assumptions:**
  - Source assumption from the recommendation: current POS data must give reliable sales / stock / payment / send-later counts. If any of those numbers are still being stabilized, defer the matching alert rather than ship a misleading recommendation.
  - The "selling fast — do not discount yet" recommendation depends on today qty being non-trivial; below a small minimum, suppress it to avoid noise on slow days.
  - Codex review recommended before merge because the alert layer affects manager decision-making during live event operations, even though no underlying data path changes.
- **Owner:**
- **Status:** planned
- **Branch:**
- **Claimed:**
- **BlockedBy:** FINAL_REVIEW (post-event readiness pass should land first so the layer reads from a stable base).
- **Notes:** Drafted 2026-05-05 from the user's recommendation after exploring `app ui improvement-handoff/`. Five sub-features intentionally scoped as one batch because they share the same dashboard region and the same `dashboardMetrics()` extension; splitting would multiply CSS/markup churn. Sister entry exists in `pos-for-sell/docs/BATCH_PLAN.md` Phase 9 so the SaaS version inherits the same manager-action concept after Phase 7 reaches parity.

### Batch EE — Send Later Correction Fixes
- **Business objective:** Close two pre-existing Send Later correction bugs surfaced by the deep-trace math audit during Batch DD verification, so the app is fully ready for the next event.
- **Expected benefit:** Bill corrections that change Send Later quantities update both the customer-paid total and the warehouse reservation queue; allowance checks correctly distinguish booth stock from warehouse stock; staff receive a clear "event booth" vs "warehouse" message when a correction would exceed available stock.
- **Implementation difficulty:** low. Two surgical functions; no new state shape; no migration.
- **Cost/complexity tradeoff:** Touches the same correction code region as Batch DD; lands as a separate batch with its own PR for review independence.
- **Bugs closed:**
  - **Bug G1** — `confirmCorrectionSave` updated `sale.items` but did not rebuild `state.preorders` for the bill's Send Later lines. Result: a bill corrected from 5 to 8 Send Later units would charge the customer for 8 but keep `committed=5` in `sendLaterReservedQty`, under-counting the warehouse reservation by 3 units.
  - **Bug G2** — `correctionStockAllowance` aggregated all SKU qty (booth + Send Later) and validated against booth remaining only. Increasing a Send Later qty was rejected when booth was empty, even when warehouse had stock; falsely permissive in the reverse direction is harmless but the rejection blocked legitimate corrections.
- **Items:**
  1. Split `correctionStockAllowance` aggregation by `(sku, isFulfillmentLater)`. Booth bucket validates against `getProductInventorySnapshot(dayId, sku).remaining + originalQty`; Send Later bucket validates against `warehouseRemaining(sku) + originalQty`. Issues carry a `kind` discriminator (`booth` / `warehouse`).
  2. Update the status banner in `buildCorrectionDraft` to read the `kind` and name the limit (`event booth stock is not enough` vs `warehouse stock is not enough`).
  3. New `rebuildSendLaterQueueForSale(sale)` helper. Builds new preorder entries via `normalizePreorder` keyed by deterministic `PRE-{billId}-{sku}-{fulfillmentType}` IDs; for each ID with a matching existing entry, preserves `status`, `note`, and `createdAt`; replaces `state.preorders` for this bill with the new set; leaves entries linked to other bills untouched.
  4. Wire `rebuildSendLaterQueueForSale(sale)` into `confirmCorrectionSave` after `saveSales()` succeeds and before `realignInventoryCarryForward`. Add `renderPreorders()` to the post-correction render pass so the queue panel reflects the rebuild without a manual refresh.
- **Touches:** `meowmeow_pos_event.html`, `tests/smoke_event_pos.js`, `readme.md`, `TASKS.md`.
- **Do not change:** `finalizeSale` preorder creation, the deterministic ID format, free-gift handling, sample bucket logic, dashboard or void audit.
- **Acceptance checks:**
  - Increasing a Send Later qty in correction is allowed when warehouse has stock and booth is empty.
  - Increasing a booth-fulfilled qty when only warehouse has stock is rejected with an `event booth` message.
  - After increasing a Send Later qty, `state.preorders` entry for the bill matches the new qty and `sendLaterReservedQty(sku)` reflects it.
  - After removing a Send Later line via correction, the queue entry for that bill is dropped.
  - After adding a new Send Later line via correction, a new queue entry is created with `status: pending`.
  - Existing queue entries with `status: packed` or `status: shipped` keep their status when the corresponding correction simply changes qty (status preservation).
  - Smoke test extends with five EE scenarios and existing scenarios still pass.
- **Risks/assumptions:**
  - Status preservation assumes shipped/packed entries shouldn't be reverted to pending on correction. If a correction reduces the Send Later qty below what was already shipped, the new entry qty may be less than what physically went out — staff are expected to reconcile manually via Send Later queue UI; this batch does not auto-detect that case.
  - Codex review recommended before merge because the rebuild touches Send Later operational state and the warehouse formula's `committed` input.
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:** 2026-05-06 13:30
- **BlockedBy:**
- **Notes:** Merged into `main` at `a40fc94` on 2026-05-06 (PR #3, rebased onto main after PR #2's base branch was deleted by PR #1's squash-merge). Both bugs closed; smoke green with five new EE scenarios.

### Batch DD — Sample Bucket Refactor + Warehouse Formula Repair
- **Business objective:** Fix the post-event findings the user surfaced 2026-05-06: samples set on a past day cannot be edited from a later day; "Added Today" + sample interactions appear to leak event stock back to warehouse; staff want an easy way to convert event stock ↔ sample (because they sometimes sell a sample as a product).
- **Expected benefit:** Sample stock is one persistent number visible from any day; converting event ↔ sample is a one-click action with audit trail; warehouse formula is consistent across Stock Setup live preview and Inventory Correction validation; phantom-stock paths through non-Day-1 startingStock corrections are closed.
- **Implementation difficulty:** medium-high. Touches inventory state machine, correction validation, carry-forward, reconciler, smoke tests.
- **Cost/complexity tradeoff:** One batch covering all six bugs because the sample model touches the same code regions as the formula repairs; splitting would multiply churn in `meowmeow_pos_event.html`.
- **Bugs closed (with line refs):**
  - **Bug A** — Past-day sample is unreachable. `applyStockSetupDraft` (line 1934) and `confirmInventoryCorrection` (line 2157) only write current-day `dayRecord.sampleQty`. Once Day 1 closes, no UI path edits its sample.
  - **Bug B** — Phantom stock via non-Day-1 startingStock correction. `cumulativeAllocatedQty` (line 1909) reads only `day1.startingStock`, so editing Day 2 startingStock via Inventory Correction creates remaining stock without affecting warehouse.
  - **Bug C** — Stock Setup live-preview warehouse formula wrong on Day 2+. `refreshPreview` (line 2213) uses `row.eventStarting` instead of `cumulativeAllocatedQty`, displaying inflated warehouse while editing locked fields.
  - **Bug D** — Inventory Correction validation uses the same broken formula. `buildInventoryCorrectionDraft` (line 2155) can pass corrections that put real warehouse negative.
  - **Bug E** — Per-day sample model causes visibility gap. Sample on Day 1 invisible from Day 2's UI; if user re-enters the count on Day 2, `totalSampleQty` (line 1910) double-counts and reconciler flags drift.
  - **Bug F** — No "sell sample" path. Two-step error-prone field edit, no audit linkage between sample reduction and the subsequent sale.
- **Items:**
  1. Move sample to event-level: `state.globalInventory.sampleQty[sku]` (single number per SKU). One-time migration sums via `Math.max` across days; sets `sampleQtyGlobalMigrated:true`. Per-day `dayRecord.sampleQty` zeroed after migration but retained in shape for backward read compatibility.
  2. Update `getDayRemainingMap`: subtract `globalInventory.sampleQty` (not per-day). Carry-forward formula in `closeOperatingDay` and `realignInventoryCarryForward` becomes `starting + added - sold` (no sample sub) so samples persist physically across days.
  3. Update `totalSampleQty`, `stockSetupSnapshot`, `inventoryCorrectionCurrentValue`, `reconcileInventoryReport` to read global sample.
  4. Replace sample stepper in Stock & Allocation Setup with read-only `Sample N` value plus 🔬 `Make sample (+1)` and `Return sample (−1)` buttons. New handlers `convertEventToSample(sku, qty=1)` and `convertSampleToEvent(sku, qty=1)` write `globalInventory.sampleQty` and append `SAMPLE_OUT` / `SAMPLE_IN` movement journal entries with auto reasons.
  5. Inventory Correction `sampleQty` field now writes `state.globalInventory.sampleQty[sku]` instead of `dayRecord.sampleQty[draft.sku]`. The `dayId` selector becomes irrelevant for sample (still recorded for audit but writes are global).
  6. Fix `refreshPreview` (line 2213) and `buildInventoryCorrectionDraft` (line 2155) warehouse formulas: use `cumulativeAllocatedQty(sku) + clampCount(row.addedToday delta)` style. Lock `startingStock` correction to Day 1 only; on Day 2+ disable the option and direct the user to use `addedStock` correction instead.
  7. README inventory section updated: explain global sample, conversion buttons, Day 2+ correction routing.
  8. Smoke test extensions: past-day sample reachability, Make/Return sample buttons, Day 2 startingStock correction lockout, refreshPreview formula correctness on Day 2, reconciler invariant with global sample.
- **Touches:** `meowmeow_pos_event.html` (state shape, formulas, UI, correction flow, reconciler), `tests/smoke_event_pos.js` (new scenarios + update existing per-day sample test from Batch X), `readme.md` (inventory + correction sections), `TASKS.md`.
- **Do not change:** sales storage, CSV shape, void audit, send-later reservation math, dashboard layout, PINs, payment flows, free-gift logic, addedStock top-up flow (Batch G semantics preserved).
- **Acceptance checks:**
  - Migration: existing localStorage with per-day sampleQty rolls into a single global sample number; flag prevents re-running; per-day sampleQty zeroed.
  - Day 1 sample created with Make Sample button: globalSample +1, Day 1 remaining −1, warehouse unchanged, `SAMPLE_OUT` movement logged.
  - Day 1 closes. Day 2 active. Sample visible from Day 2's Stock Setup with the same value. Return Sample button reduces global sample, current day remaining +1, `SAMPLE_IN` movement logged.
  - Inventory Correction startingStock field disabled on Day 2+; reason text explains routing through addedStock.
  - Stock Setup live preview warehouse value matches `stockSetupSnapshot(sku).warehouse` after every keystroke on Day 2.
  - Reconciler: `cumulativeAllocated = remainingCurrentDay + globalSample + totalSold` invariant holds. No drift after sample conversion or addedStock correction.
  - Existing smoke scenarios still pass (no regression in void/carry-forward, top-up reset, dashboard, void audit, drift detection, bulk export).
- **Risks/assumptions:**
  - Migration heuristic uses `Math.max` across days — overestimates if user reduced sample mid-event; user can correct via Return Sample button afterward. Underestimating would silently lose physical samples; overestimating is recoverable.
  - Locking startingStock correction on Day 2+ removes a flexibility some advanced users may rely on; the addedStock route handles the same intent correctly.
  - Codex review required before merge per CLAUDE.md (touches inventory + correction).
- **Owner:**
- **Status:** done
- **Branch:**
- **Claimed:** 2026-05-06 12:00
- **BlockedBy:**
- **Notes:** Merged into `main` at `8a141aa` on 2026-05-06 (PR #1). Six post-event findings closed in one cohesive batch. Sample is now a global event-long bucket with Make/Return UI; warehouse formulas in live preview + correction validation rebuilt to use cumulativeAllocatedQty; Day 2+ startingStock correction blocked; reconciler invariant intact. Smoke extended with 11 new scenarios (6 core + 5 interaction).

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
15. **V** - Dashboard V3 Manager View after Batch U dashboard base is merged.
16. **W** - Today By Hour Dashboard Card after Batch V layout is stable.
17. **X** - Inventory Flow Sample Visibility + Table Readability after Batch W dashboard work is stable.
18. **Y** - Product Delivery Fee for Send Later Orders.
19. **Z** - Replace Free Scarf Promo with Sticker Choice Promo after Batch Y is reviewed.
20. **FINAL_REVIEW** - Event readiness bug fix and full workflow check after Batch Z is reviewed.
21. **AA** - Manager Action Dashboard V1 (alerts, recommendations, end-of-day checklist, goal pace forecast, copyable daily summary). Planned, not claimed; lands after FINAL_REVIEW so the action layer reads from a stable post-event base.
22. **DD** - Sample Bucket Refactor + Warehouse Formula Repair. Claimed 2026-05-06; closes six post-event findings around sample/Added-Today/warehouse interactions. Codex review required before merge.
23. **EE** - Send Later Correction fixes. Claimed 2026-05-06; closes two pre-existing edge cases surfaced by the deep-trace audit during DD verification (queue rebuild on bill correction; warehouse-aware allowance check for Send Later lines). Branched off DD; merge after DD.

## Done

- **Batch DD — Sample Bucket Refactor + Warehouse Formula Repair** — merged into `main` at `8a141aa` on 2026-05-06 by claude (PR #1). Six post-event findings closed: past-day sample reachable, phantom-stock via non-Day-1 startingStock correction blocked, live-preview and correction-validation warehouse formulas rebuilt, per-day sample collapsed into a global event-long bucket with Make / Return UI, sample double-count drift removed. Smoke extended with 11 new scenarios; reconciler invariant verified by deep-trace audit.
- **Batch EE — Send Later Correction Fixes** — merged into `main` at `a40fc94` on 2026-05-06 by claude (PR #3, rebased onto main after PR #2's base disappeared). Two pre-existing edge cases closed: bill-correction Send Later queue rebuild via deterministic IDs (status / note preserved), and warehouse-aware allowance check on Send Later corrections so booth-empty + warehouse-stocked is allowed. Smoke extended with five EE scenarios.
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
- **Batch R — Manual Event Start Count** — merged into `main` at `e7082ab` on 2026-04-27 by claude after Codex review. Per-day `eventStartConfirmed[sku]` map; Day 1 Event Start renders empty/unconfirmed by default; `addToCart` blocked for unconfirmed SKUs; saving through Stock & Allocation Setup confirms and unblocks; closing a day auto-confirms the next. Codex review finding #1 fix: unconfirmed product cards render `Count` chip with `.is-uncounted` red border (not `Sold out`) and stay clickable so the toast surfaces. Smoke test extended with Batch R scenario including the product-card UI path.
- **Batch U — Internal Dashboard Redesign** — merged into `main` at `3dabcf2` on 2026-04-27 by codex (Claude review-prep). Cream/brown v2 layout with goal bar + quartile ticks, remaining/pace strip, today receipts/items/avg-bill/total tiles, today payment split (cash/transfer/card), 4-day pace cards with Live badge. `dashboardMetrics()` extended with display-only today fields, `paySplit`, `openDays`, `paceNeeded`; empty state NaN-safe. Codex follow-ups on `main`: `dff9190`, `5f8c186`, `5756356`, `66d1e04` (reset-confirm visibility, pace-card tightening, pace-metric alignment, payment-tile wrap safety). PINs/CSV/storage/carry-forward unchanged. Smoke extended for new dashboard selectors.
