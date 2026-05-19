# MeowMeow Event POS

Browser-based event POS for the Meowseum booth. The main selling app is [meowmeow_pos_event.html](meowmeow_pos_event.html); the post-sale visual receipt helper is [meowmeow_receipt_admin.html](meowmeow_receipt_admin.html).

## Table of Contents

- [Overview](#overview)
- [Files](#files)
- [Sister project — MochiPOS SaaS](#sister-project--mochipos-saas)
- [Working Rules for Future Sessions](#working-rules-for-future-sessions)
- [Architecture & Constraints](#architecture--constraints)
- [Operator Selling Flow](#operator-selling-flow)
- [Free Gift Rules](#free-gift-rules)
- [Fulfillment Later (Send Later)](#fulfillment-later-send-later)
- [Inventory](#inventory)
- [Correction Center](#correction-center)
- [Receipts & Branding](#receipts--branding)
- [Data, Storage & CSV](#data-storage--csv)
- [Layout & Visual Rules](#layout--visual-rules)
- [Passcodes](#passcodes)
- [Event-Day Verification Checklist](#event-day-verification-checklist)
- [Pre-Event Data Hygiene](#pre-event-data-hygiene)
- [Recently Changed](#recently-changed)
- [How To Continue Next Time](#how-to-continue-next-time)

## Overview

This is a single-file browser POS used at pet-expo booths over a 4-day event. The product direction is:

- make booth selling fast for staff
- keep the UI compact and readable on iPad landscape
- keep the selling flow self-contained in the main HTML file
- protect inventory and internal controls from the normal selling flow
- keep receipt follow-up practical for post-sale admin work

Target users are booth staff (fast checkout), booth managers (inventory and corrections), and post-sale admin (receipt follow-up).

## Files

- [meowmeow_pos_event.html](meowmeow_pos_event.html): full POS app
- [meowmeow_receipt_admin.html](meowmeow_receipt_admin.html): admin receipt and follow-up workflow from exported day CSV files
- [readme.md](readme.md): continuation notes for future sessions
- [TASKS.md](TASKS.md): shared task board for the two-agent workflow (claim/release per batch)
- [CLAUDE.md](CLAUDE.md): protocol for Claude sessions
- [codex.md](codex.md): protocol for Codex sessions
- [AGENTS.md](AGENTS.md): auto-load pointer for Codex sessions

## Sister project — MochiPOS SaaS

This repo also hosts an active SaaS sibling at [`pos-for-sell/`](pos-for-sell/) — a multi-tenant Next.js + Supabase POS for cat-product booth sellers, distilled from the `meowmeow_pos_event.html` field experience. It is a **distinct project** with its own protocol, batch namespace (`DD-XX` / `Wave NN`), and architecture. Do not edit it from a meowmeow event POS batch (and vice versa).

Entry points for the SaaS:

- [`pos-for-sell/README.md`](pos-for-sell/README.md) — setup + quick links.
- [`pos-for-sell/CLAUDE.md`](pos-for-sell/CLAUDE.md) — execution protocol for the SaaS (overrides root CLAUDE.md inside `pos-for-sell/`).
- [`pos-for-sell/docs/LEARNING.md`](pos-for-sell/docs/LEARNING.md) — founder learning curriculum (5 levels).
- [`pos-for-sell/docs/ROADMAP.md`](pos-for-sell/docs/ROADMAP.md) — strategic direction (beachhead, modules, pricing).
- [`pos-for-sell/docs/STATUS.md`](pos-for-sell/docs/STATUS.md) — current-state snapshot (routes, tests, waves).

## Working Rules for Future Sessions

- This project is co-developed by two AI agents. Codex is the default planner/reviewer/workflow analyst; Claude is the default implementation executor for approved batches. Before any code change, also read [TASKS.md](TASKS.md) and the agent protocol file for your tool ([CLAUDE.md](CLAUDE.md) or [codex.md](codex.md)). Never edit a file owned by another agent's in-progress batch.
- Before making any code change, read this `readme.md` first.
- After finishing any change, update this `readme.md` so it stays aligned with the current product direction and implementation.
- Treat this file as the shared continuity guide for future developers and future sessions.
- If behavior, workflow, UI direction, passcodes, CSV shape, or correction logic changes, document that change here before closing the task.
- Before starting substantial work, review this `readme.md` again and use it as the first checklist for scope, constraints, and continuity.
- For larger or multi-part tasks, prefer splitting the work into focused sub-tasks so parallel agents can handle independent parts with smaller context.
- Use Codex planning to split and review work before Claude implementation when the task has workflow risk, inventory risk, correction risk, or unclear scope.
- Use multi-agent delegation only when the task can be split cleanly without creating overlap or merge risk.
- Keep each sub-task narrow and self-contained to reduce context-window pressure and improve review quality.
- After sub-tasks finish, consolidate the result into one final implementation and update this README if the behavior or workflow changed.

## Architecture & Constraints

- Single-file vanilla HTML + CSS + JavaScript. No framework, no build step, no CDN dependencies.
- All product photos are embedded as base64 data URIs in the `PRODUCT_IMAGE_DATA` map so the file can be moved to iPad and opened offline in Edge without a separate asset folder.
- All persistence is local: `localStorage` only. No backend sync. CSV export is the primary backup/handoff path.
- `meowmeow_pos_event.html` contains:
  - product catalog
  - cart and checkout flow
  - payment QR flow
  - free gift logic
  - fulfillment-later queue for paid Send Later reservations
  - operator/tagging flow
  - sales storage and CSV export
  - dashboard
  - developer stock and allocation tools
  - Correction Center for exceptional saved-bill fixes and inventory corrections
- `meowmeow_receipt_admin.html` is a local admin helper that imports exported day CSV files, rebuilds the branded visual receipt, and supports manual post-sale email workflow.

## Operator Selling Flow

- Staff log in before using the app. On first load (or after logout) a blocking login overlay asks the staff to pick a name and enter a 3-digit PIN. Built-in PINs: Zamm `111`, Ben `222`, Kat `333`, Staff `000`. PINs are hardcoded in the single-file source — accepted limitation for this client-only POS.
- The logged-in operator persists across sales and page reloads via `localStorage` (`meowseum_event_selected_operator_v1` + `meowseum_event_operator_authed_v1`). The session does not auto-expire; staff log out manually with the 🔒 Log out button shown on the cart-side operator row.
- Until staff are logged in, `addToCart` and Send Later both refuse to add items (and re-open the login overlay).
- Staff tap product cards to build the cart.
- Product-card remaining stock should update immediately when staff add, remove, or change quantities in the current cart.
- Stock is validated at add-time. Blocked adds (sold-out, not enough event stock, not enough warehouse stock for Send Later) surface as a non-blocking toast inside the cart panel; the toast also acts as a polite `aria-live` announcement and clears itself after a few seconds. The same validation re-runs at save-time as defense-in-depth.
- For card or bank transfer sales, the `Save & New Sale` button reads `Confirm payment first` and uses a red-bordered blocked style until the `Payment confirmation` checkbox is ticked. Cash sales save immediately. The `Payment confirmation` row also gains a red outline while it is the blocker.
- Payment methods include cash, bank transfer, and card.
- Card payments apply a 3% surcharge on top of the cart total. The surcharge is computed in `cartTotals()`, shown as a `Card Surcharge (3%)` row in the cart summary and receipt slip, and stored in the sale record as `cardSurcharge`.
- Every saved transaction must use a real event payment method: cash, bank transfer, or card. Pay-later checkout is not available.
- Transfer payments can show PromptPay QR after order confirmation.
- The `Review & Finish Sale` overlay is split into two desktop columns:
  - left: customer-facing receipt and receipt-share area
  - right: salesperson controls such as QR, payment confirmation, tags, and finish (the operator is taken from the login session — no per-sale operator tap-in)
- Both columns scroll independently on desktop and collapse back to a normal single-column flow on smaller screens.
- Send Later customer details are grouped with a clear `Ship to` heading so staff can quickly identify the delivery/pickup destination fields.
- Each receipt line has an inline `Edit` button. Staff can jump back to the cart, adjust quantities/discounts, and return to review without losing customer, shipping, email, payment reference, or tag details already entered.

## Free Gift Rules

- The current promo is: every `THB 1,200` of qualifying paid Meowseum + Modern Friends cart value earns `1` free Sticker Meowsuem.
- Staff can choose the free sticker SKU in the cart: `021`, `022`, or split multiple free stickers across both SKUs.
- Free stickers use the real sticker SKU with `isFreeGift` metadata, so paid and free sticker movement deduct from the same stock bucket.
- User-facing displays label free sticker rows as `(Free item)` so staff and customers can separate paid sticker purchases from promo gifts.
- The old `GIFT-SCARF` SKU is retired for new sales. Old saved scarf bills can still display as legacy free items, but the POS no longer awards new scarves.
- In inventory view and internal dashboard, sold counts split paid vs free-gift quantity using the format `paid (free)` when free gifts exist.
  Example: `80 (9)` means `80` paid units sold and `9` free gifts given, while stock still deducts all `89`.
- If a SKU has only free-gift movement and no paid movement, display only the free quantity in parentheses, such as `(4)`, instead of `0 (4)`.
- Inventory Flow shows sample movement inside the `Added Stock` summary card as `Sample -N`, and product rows show `-N sample` when staff turned event stock into samples that day. Sample stock reduces remaining event stock until an Inventory Correction changes the sample quantity back down.
- The sticker can also be manually added beyond entitlement, but that requires in-app confirmation and is exported as a manual override.
- The sticker gift line stays at the bottom of the cart.
- Each sticker gift row has its own `+` and `-` controls plus a `Sticker SKU` choice between `021` and `022`.
- The gift button toggles the sticker gift line.

## Fulfillment Later (Send Later)

- A separate Send Later queue is available from the truck emoji button placed beside the Inventory Flow emoji in the top bar.
- Use the queue for paid `Send Later` reservations only.
- Product cards offer a compact `Send Later` action inside the normal card footprint.
- Quick fulfillment actions appear as compact emoji overlays pinned on the product photo so they do not push the text layout.
- Quick fulfillment-later actions add a labeled line into the live cart instead of forcing staff to open the queue panel first.
- Product-card stock should use the shortest readable badge:
  - exact count only for normal and low-stock states
  - `Sold out` and `Closed` for no-stock or closed-day states
- Cart fulfillment-later lines should:
  - stay the same size as normal cart lines
  - keep the same discount editing controls as normal cart lines
  - show a compact business label: `Send Later`
  - avoid extra explanatory helper sentences inside the cart row
- In-stock `Send Later` lines:
  - use warehouse stock, not event booth stock
  - cannot be added to cart if warehouse stock is not enough
  - reserve committed warehouse stock once the sale is saved
  - default to and stay `Paid at event`
  - charge a per-SKU `Delivery Fee` taken from `product/product list-event price.xlsx`. The fee is added once per Send Later unit (`deliveryFee × qty`), summed across all Send Later lines in the cart, and shown as a separate `Delivery Fee` row in the cart and review-receipt summary whenever it is greater than zero.
  - Delivery Fee is included in the chargeable total, the saved sale total, the transfer QR amount, the payment confirmation amount, and the receipt slip. Booth-only items are not charged a delivery fee.
  - When the payment method is Card, the 3% card surcharge is calculated on `merchandise + delivery fee` so the surcharge matches the real transaction amount.
- Mixed carts can contain live stock items and `Send Later` items in the same checkout.
- If a cart is inactive for 10 minutes, the app prompts staff to keep or clear it so unsaved Send Later holds do not keep confusing warehouse availability during the session.
- The Send Later Queue is monitor-only. Staff should not manually create Send Later records from that page.
- Staff create Send Later orders only from product cards/cart/checkout so stock validation and payment details stay connected.
- The queue has a passcode-protected `Clear Pending Send Later` button for cleanup after testing or mistaken pending records.
- Clearing pending Send Later records removes only `Pending` Send Later queue entries from local storage and frees their committed warehouse quantity; it does not delete saved sales or packed/shipped/cancelled queue entries.
- Each Send Later entry should capture:
  - event day
  - product
  - quantity
  - customer name
  - phone
  - email (optional)
  - line ID (optional)
  - receive location
  - payment status
  - note
  - status
- Customer name, phone, and receive location are required before saving any Send Later checkout.
- In `Review & Finish Sale`, those same customer/shipping fields should appear only when the checkout contains one or more fulfillment-later lines.
- Customer name, phone, email, line ID, and receive location entered in `Review & Finish Sale` should auto-fill all linked `Send Later` records from that checkout.
- The queue should show sold-out and low-stock signals to help staff decide when Send Later is useful.
- Send Later records are stored locally on the device and can be exported as CSV for follow-up work after the event.
- Send Later status options are:
  - `Pending`
  - `Packed`
  - `Shipped`
  - `Cancelled`

## Inventory

- Staff should not edit inventory from the normal selling flow.
- Inventory editing belongs in passcode-protected Developer Tools.
- Developer Tools has one unified `Stock & Allocation Setup` page (no separate Daily Stock and Allocation Setup tabs).
- New/reset POS data uses `inventory/inventory_default.xlsx` as the built-in planning baseline: `Global` and `Online` come from the workbook so staff do not enter those by hand.
- Day 1 `Event Start` is intentionally left blank on a fresh setup. Staff must physically count booth stock and enter the actual quantity in Stock & Allocation Setup before selling starts; the workbook is for planning only, not a confirmed event-start count.
- Unconfirmed Event Start cells render with a red outline, an empty input, a `count` placeholder, a `Count needed` hint under the input, and a `Not counted` warning beside Remaining Event so the missing count is visually obvious.
- `addToCart` is blocked for any SKU whose Event Start has not been counted yet; the cart toast tells the operator to open Stock & Allocation Setup and count it first.
- Product cards for unconfirmed SKUs render a `Count` stock chip with the `.is-uncounted` visual hook (red border) instead of the `Sold out` chip, and stay clickable so tapping the card surfaces the same "event start has not been counted" toast.
- Send Later (warehouse-pool flow) intentionally remains usable before Event Start is counted, since Send Later draws from warehouse stock, not booth stock. The Event Start gate only protects the normal selling-from-booth path.
- Saving an Event Start through `Confirm Stock Setup` both stores the counted quantity and confirms the SKU, which removes the visual warnings and unblocks selling for that SKU.
- Closing an operating day automatically confirms Event Start for the next day, since the carry-forward quantity is the source of truth and no recount is needed.
- The unified setup table shows SKU, product, global stock, online stock, event starting stock, added-today stock, sample stock, warehouse stock, remaining event stock, and low alert.
- Staff should use the `+` and `-` buttons for stock edits, with number inputs kept as backup.
- Stock setup changes are staged across many products and saved with one `Confirm Stock Setup` review action.
- In Stock & Allocation Setup, `Added Today` is a temporary `Top up now` input. Enter only the quantity being added in this moment; after confirm, the stored added-stock total increases and the input resets to `0`.
- Warehouse stock is derived from a cumulative-allocated invariant: `warehouse = global − online − cumulativeAllocated − committed`, where `cumulativeAllocated = day 1 starting stock + sum of every day's added-today stock`. This means warehouse decreases only when stock physically moves from the warehouse to the booth (initial allocation or a top-up). Day rollover, sales, samples, voids, and corrections do not move stock between warehouse and booth, so they must not change warehouse — the cumulative formula guarantees that. The earlier per-day formula (`global − online − dayN.startingStock − dayN.addedToday − committed`) drifted on day 2+ because it treated carry-forward as a fresh allocation; the cumulative formula is invariant to carry-forward.
- Sample stock is reserved at the booth (taken from event booth inventory), so it reduces remaining event stock and sellable quantity but does not decrease warehouse stock — the units are still attributed to the booth allocation.
- Sample stock is one event-long bucket per SKU (Batch DD): the same number is visible from every day, so a sample created on Day 1 is still tracked and editable on Day 2, 3, and 4. The previous per-day model is migrated on first load by taking the maximum sampleQty across days into the new global bucket, then zeroing per-day fields. Migration is one-shot (`sampleQtyGlobalMigrated` flag).
- Move stock between event and sample with the explicit buttons in `Stock & Allocation Setup`: `+1 Make` takes one unit from the current day's event remaining and adds it to the sample bucket (`SAMPLE_OUT` movement). `-1 Return` takes one unit from sample and adds it back to the current day's event remaining (`SAMPLE_IN` movement) — useful when staff want to sell a unit that was previously a sample.
- Make / Return Sample buttons require the operating day to be open. Make is disabled when the current day's event remaining is zero; Return is disabled when the sample bucket is zero.
- Carry-forward (day close, bill correction, inventory correction) propagates `starting + added − sold` (physical at booth, including samples) into the next day's starting stock, so the sample count is preserved across day rollover and never silently leaks back to warehouse.
- After the first saved sale exists, normal Stock & Allocation Setup locks `Global`, `Online`, and `Event Start` so opening inventory cannot be casually changed mid-selling.
- After sales begin, staff can still edit `Added Today`, `Sample`, and `Low Alert`; controlled fixes to locked fields belong in `Correction Center > Inventory Correction`.
- Public inventory flow is read-only except for reversing same-day top-up log entries.
- Reversing a stock top-up from Inventory Flow requires correction passcode `888` first, then a required reversal reason, before stock is reduced.
- Day 1 starting stock is editable only before Day 1 has sales and before Day 1 is closed.
- Inventory Correction `startingStock` field is locked to Day 1 (Batch DD). After Day 1 closes, starting stock for later days is a derivation of carry-forward, not a fresh allocation; correcting it would create phantom stock without affecting warehouse. To add stock from warehouse on a later day, use `Added Stock` correction or a Stock Setup top-up. To remove stock added by mistake, use the ↩ reversal button on the Inventory Flow log entry, or an `Added Stock` correction with a smaller value.
- Stock Setup live-preview and Inventory Correction validation both compute warehouse from `cumulativeAllocatedQty` (Batch DD), not from current-day fields, so the preview matches the saved `stockSetupSnapshot` warehouse on Day 2 and later.
- Low-stock alerts remain editable in developer mode.
- End-of-day export and stock carry-forward should keep working without requiring staff to understand the internal data model.
- Adding an item to cart must re-check stock against both saved sales and the quantities already reserved in the current unsaved cart.
- Product cards and cart `+` actions should stop adding units once the cart has already reserved the last remaining stock for that SKU.
- `Close Day & Export CSV` is passcode-protected and the dialog uses only the passcode keypad flow without an extra cancel button.
- After a saved bill is corrected, inventory carry-forward must be realigned across later event days so Day 2, Day 3, and Day 4 starting stock stay consistent with the corrected earlier day.
- Bill correction stock allowance (Batch EE): booth-fulfilled lines are validated against current-day booth remaining + original qty; Send Later lines are validated against warehouse remaining + original qty. Increasing a Send Later qty when warehouse has stock is allowed even if booth is empty; increasing a booth-fulfilled qty when only warehouse has stock is rejected. The status banner names the constraint (`event booth` or `warehouse`) so staff can see which limit was hit.
- Bill correction Send Later queue rebuild (Batch EE): when a correction changes Send Later quantities (or adds / removes Send Later lines), `state.preorders` is rebuilt for that bill so `committed` (used in the warehouse formula) tracks the corrected reservation. Queue entries with matching deterministic IDs (`PRE-{billId}-{sku}-{fulfillmentType}`) preserve `status`, `note`, and `createdAt` so previously packed/shipped entries are not silently reset to `pending`. Queue entries linked to other bills are untouched.
- Sold-count calculations are cached in-memory during runtime to reduce repeated inventory recomputation on every render.
- Cart-reserved quantities are computed once per `renderProducts` pass and reused across all product cards, so the cart is walked once per render instead of once per visible SKU.

## Correction Center

- The Correction Center is an exception workflow, not a normal selling workflow.
- Access stays behind passcode `888`.
- It has two sub-tabs:
  - `Bill Correction`
  - `Inventory Correction`
- Staff first unlock the tool, then review a warning before editing.
- Bill Correction follows a controlled flow:
  - select bill
  - edit allowed fields
  - review changes
  - confirm correction
- Only these fields should be editable:
  - item quantities
  - customer email
  - receipt requested
  - payment method
  - payment reference
  - operator
  - tags
- Do not allow direct editing of bill ID, datetime, raw totals, SKU text, or item prices.
- Item quantities must not exceed the real inventory available for that bill's operating day.
- Saving a correction updates the saved sale, and inventory follows automatically because sold stock is derived from saved sales.
- Saving a correction must also realign later-day carried stock, not just the edited bill's own day.
- The Bill Correction review stage previews the per-SKU stock movement and the projected starting stock for each later day so staff can see the carry-forward effect before confirming.
- Wrongly saved bills can be removed only through the separate `Void Bill` action inside passcode-protected Bill Correction.
- Voiding a bill requires a reason, removes the sale from saved sales, stores a void audit snapshot in local storage, and realigns later-day carried stock.
- Voided bills are not restored automatically; recreating the sale is the reversal path.
- Changing a corrected sale from one payment method to another must not silently auto-confirm a non-cash payment.
- After correction:
  - cash should stay `confirmed`
  - transfer/card should stay `confirmed` only if the sale was already confirmed and the payment method did not change
  - transfer/card should return to `pending` if the payment method changes during correction
- Correction history should stay business-readable and include:
  - `at`
  - `reason`
  - `changedFields`
  - `before`
  - `after`
  - `inventoryImpact`
- Normal CSV exports should keep only concise correction summary fields, not full correction blobs.
- Voids are auditable: the bill id, voided-at timestamp, voided-by operator (from the staff login session), reason, operating day, total, item count, and a full snapshot of the voided sale are written into a separate void audit log.
- Bill Correction has a `Void Audit` section that lists recent voided bills (bill id, time, operator, day, total, item count, reason) without opening developer tools.
- The void audit list is capped to the most recent 12 entries on screen; the `Export Void Audit CSV` button writes the full log with concise audit columns (`bill_id, voided_at, voided_by, operating_day, total_thb, item_count, reason`) and applies the same spreadsheet-injection guard used by sales CSV.
- The void CSV must not include the full `saleSnapshot`; that snapshot stays in `localStorage` only.
- Inventory Correction is for stock mistakes such as wrong starting stock, wrong added-today quantity, wrong sample quantity, wrong global/online allocation, or mistaken stock movement.
- Inventory Correction must require a reason, show before vs after quantity, require review before save, prevent negative event or warehouse stock, and write an audit entry labeled `Inventory Correction`.
- Inventory corrections are separate from normal Add Today records, although they may appear near stock history for review.
- Inventory Correction audit display should show each saved correction once, even when the same correction is stored in more than one local audit structure for traceability.

## Receipts & Branding

- The visual receipt uses a stacked wordmark:
  - `THE`
  - `Meow`
  - `SEUM`
- The receipt also includes:
  - `PHIPHETTHAPHAN`
  - `Meowseum | Modern Friends`
- Footer copy is:
  - `Thank you for supporting Phiphetthaphan.`
  - `Thank you for letting us be part of your pet's daily joy.`
  - `For inquiries, please contact phiphetthaphan@gmail.com`
- The POS receipt preview and admin receipt page should stay visually aligned.
- The customer email field is always available.
- That email can be collected even if the customer does not request a receipt email, for example for future marketing/contact use.
- The `Send me an email receipt` checkbox is specifically for post-sale receipt sending.
- If that checkbox is checked, customer email becomes required before the sale can be saved.
- Invalid customer email is shown beside the email field with a red inline helper, and `Save & New Sale` stays disabled until the format is corrected.
- When the checkbox is checked, the app shows an in-app reminder that the receipt will arrive in `3-4 days`.
- The sale record keeps both:
  - `receiptEmail`
  - `receiptEmailRequested`
- CSV exports include both the customer email and the explicit receipt-request flag so admin can filter only customers who asked for the emailed receipt.

## Data, Storage & CSV

### localStorage keys

- `meowseum_event_sales_v1` — all saved sales with full transaction history
- `meowseum_event_inventory_v1` — per-day inventory snapshots
- `meowseum_global_inventory_v1` — global allocation and audit logs
- `meowseum_event_preorders_v1` — Send Later queue
- `meowseum_event_voided_sales_v1` — audit snapshots for bills removed through Correction Center voiding
- `meowseum_event_movements_v1` — append-only movement journal: one row per inventory mutation (sell, sell_free, reserve, void, stock setup, top-up reversal, inventory correction). Defensive: never throws back into the calling path; logging failures fall back to a console warning so a movement record cannot block a sale, void, or correction. Wiped by Reset Data alongside saved sales and the void audit log.
- `meowseum_event_selected_operator_v1` — name of the logged-in operator
- `meowseum_event_operator_authed_v1` — `"1"` while a staff session is active; cleared on logout

### Rules

- Sales are stored in `localStorage`.
- Old sales should continue loading safely even when newer fields are added.
- CSV export is part of the operating workflow and should stay stable.
- CSV text fields harden against spreadsheet formula injection:
  - user-entered text such as emails, tags, bill text, and correction notes must be neutralized if they begin with spreadsheet formula trigger characters
  - SKU fields should keep spreadsheet-safe formula-style export only for preserving leading zeros
- If a salesperson gives a per-item discount above the spreadsheet guideline, the sale should record that exception with:
  - `hasExtraDiscount`
  - `extraDiscountItemCount`
  - `extraDiscountAmount`
- Normal sale CSV and end-of-day CSV should include those extra-discount fields for later internal review.
- The default SKU prices in the POS should follow `product/product list-event price.xlsx`.
- Use the spreadsheet `RSP (ราคาขาย)` column as each SKU's base price in the cart and sale record.
- Use the spreadsheet `Discount` column as each SKU's default per-item event discount.
- The live booth sell result should therefore default to the spreadsheet `Promotion Price (event price)` value.
- Product cards can continue showing the event selling price for fast booth use, but cart lines should show the RSP base price, the applied discount, and the resulting event/unit price clearly.
- Salespeople should be able to adjust the cart-line discount by typing directly into the discount input at any time.
- The cart discount UI should be touch-first: the typed discount box is the primary control and the only helper beside it should be a single `Default` button.
- The discount box should start with the SKU's default event discount as soon as the item is added to cart, then staff can tap the box anytime to adjust it.
- Keep the discount input and `Default` button in a flexible inline layout so they do not overlap when the cart row gets narrow.
- Show a compact `Discount` word before the input box so staff can immediately tell that the box is for discount adjustment.
- The typed discount box should keep a stable visual width across cart rows and should not shrink narrower while staff type numbers.
- Avoid adjacent native `select` + input layouts for cart discount editing because touch browsers can give the select a larger invisible hitbox.
- Use a plain numeric text field with mobile numeric keypad hints for the cart discount input so touch devices can edit the discount reliably at any time.
- Tapping the discount box itself should always focus and highlight the current value so staff can adjust it by touch anytime during cart editing.
- The `Default` button should simply restore the spreadsheet default discount for that SKU and must never lock typing.
- If the discount input is focused, tapping `Default` must still work reliably on touch devices and should not be interrupted by a cart rerender during input blur.
- Keep the discount input and `Default` button as clear 40px+ touch targets so they are easier to hit on iPad landscape.
- This is still a local browser app, so passcodes and local-storage data protect normal booth workflow only.
- Current receipt-related CSV fields include:
  - `receiptEmailRequested`
  - `customerEmail`
- Sales CSV and end-of-day CSV also include:
  - `isFulfillmentLater`
  - `fulfillmentType`
  - `orderValue`
  - `customerName`
  - `customerPhone`
  - `customerLineId`
  - `customerReceiveLocation`
  - `saleDeliveryFee` — total delivery fee charged on the sale (sum of all Send Later lines).
  - `deliveryFeePerUnit` — per-unit delivery fee for the line; non-zero only on Send Later lines, taken from `product/product list-event price.xlsx`.
  - `lineDeliveryFee` — `deliveryFeePerUnit × qty` for the line. Booth (non-Send-Later) lines record `0`.
- Send Later CSV includes split customer/shipping fields plus `linkedBillId` and paid-at-event payment status.
- CSV exports from both the POS app and the admin tool should emit SKU values in spreadsheet-safe text form so leading zeros stay intact during sorting, syncing, and post-processing.
- Free-gift CSV detail also includes gift metadata such as auto/manual gift quantities.
- The admin receipt tool protects browser performance by limiting oversized CSV imports and generating receipt PNGs on demand instead of pre-rendering every imported bill at once.
- Admin can only mark a receipt bill as sent when the edited customer email still matches a valid email format.
- The admin receipt tool should persist queue state without storing large generated receipt image payloads in `localStorage`.
- Developer Tools include a manual `Clear Saved Customer Emails` action for privacy cleanup on shared devices.
- The admin screen should keep reminding staff to reset the saved queue after follow-up work is finished on a shared device.

## Layout & Visual Rules

- Optimize for iPad landscape first, then desktop, then mobile.
- Avoid decorative clutter.
- Keep product cards compact and scan-friendly.
- Product cards should be photo-first whenever a confirmed SKU image is available.
- Product cards should stay short and scan-friendly:
  - stock badge should stay pinned as a photo overlay
  - quick fulfillment emoji should stay pinned as a photo overlay
  - color-variant SKUs should show a small color emoji overlay on the photo
  - the product name area underneath should stay full-width so longer names are easier to read
  - the card should prefer a shorter compact height over decorative empty space
- Visible selling UI should avoid non-essential category labels such as `Premium`, `Classic`, or `Accessory`; keep SKU visible and keep category only in underlying data/export where needed.
- Product photos must stay embedded inside `meowmeow_pos_event.html` as inline data so the file can be moved to iPad and opened offline in Edge without a separate asset folder.
- Embedded product photos should be resized and compressed before pasting into the HTML. Product-card images should normally be no wider than 600 px, with JPEG thumbnail quality preferred unless transparency is truly required.
- Do not paste full-resolution source photos into `PRODUCT_IMAGE_DATA`; keep full-size originals outside the POS file if they are needed for future editing.
- Current embedded image coverage:
  - `002A`, `002B`, `003`, `004`, `005`, `006`, `007`, `010`, `011`, `012`, `013`, `014`
  - `015`, `016`, `017`, `018`, `019`, `020`, `021`, `022`, `023`, `024`, `025`
  - All SKUs now have embedded images. `019`/`020` share the Pencil Tie image; `021`/`022` share the Ribbon Bow image.
- When new product photos become available for the remaining SKUs, follow the same pattern as the current embedded set:
  - confirm the local image file matches the intended SKU before embedding
  - keep the image stored in the `PRODUCT_IMAGE_DATA` map keyed by SKU
  - preserve the same compact product-card layout, image aspect ratio, and price-row emoji actions
  - keep missing-image SKUs on the existing placeholder fallback until their match is confirmed
  - update the image-coverage list in this section after each newly embedded SKU
- SKUs without a confirmed local image should keep a stable `Photo coming soon` placeholder so the grid does not shift or break.
- Product price should stay in the lower text area of the card, while stock and quick fulfillment controls stay as overlays on the photo area so they do not move the text block.
- Internal inventory and developer screens should reuse the same compact sticker-name display style as the product cards, including color symbols for the sticker variants.
- Internal dashboard totals should flag discount exceptions in red as `(x)` after the money amount.
  - The value should be the extra discount money given above the default discount guideline, shown in compact number-only form such as `(120)` or `(1,360)`.
  - That red amount should read as a smaller secondary note, but stay on the same line level as the main total.
  - Show that both on the overall total sales value and on each daily sales total card.
- Internal Dashboard uses a manager-focused cream/brown layout: event total vs goal, goal progress bar, remaining pace, the 4-Day Pace timeline (numbered Day 1→Day 4 dots with connector and per-day total/receipts/items cells underneath), Today By Hour bars (`<10`, `10`-`20`, `>21`), today stats, today payment split, Top Sellers card (paid items only, top 5 horizontal bars by units sold then revenue), and Low Stock Alerts card (SKUs whose remaining is at or below their low-stock threshold on the active day, sorted by remaining ascending).
- The 4-Day Pace timeline doubles as the day view picker. Tapping any day's dot OR its per-day total cell selects that day; both surfaces are live tap targets so the manager has a wide hit area. The selected day is highlighted with a deeper brown accent (`is-active`) on both the dot and the cell. The current operating day still renders with the existing "Live" badge regardless of selection, so the manager can always see which day is the real one.
- Selecting a day drives every "today"-labeled widget on the dashboard: Today header, Today By Hour, Payment split, Receipts/Items/Avg Bill tiles, and Low Stock Alerts. Default = the live operating day (live behavior unchanged on first open). Cumulative widgets (Event total, Goal, the 4-Day Pace timeline aggregates themselves, Top Sellers · Event when on the live day) stay event-wide.
- A small hint line beside the "4-Day Pace" heading reflects the current selection: `Showing live operating day · Day X` when on the operating day; `Viewing closed day · Day Y · tap a day to switch` when historical. The Today, Today By Hour, and Payment split titles swap to `Viewing · Day X`, `Day X By Hour`, and `Payment split · Day X` when a non-current day is selected so the historical context is unambiguous.
- Each KPI on the Today card (sales total, receipts, items sold, average bill) shows a small `↑/↓ vs Day N-1: <value> (±%)` footer when a prior event day exists. Direction is colored green (up), amber (down), or neutral (flat). On Day 1 the footer is hidden because there is no prior day to compare. The comparison is full-day-vs-full-day, so for a live day in progress it reads as a target the manager can pace against; for closed days it reads as a settled comparison.
- The Today By Hour chart overlays a dashed-outline "ghost bar" behind each hour bucket showing the prior day's same-hour total at the same scale. When today's bar matches or exceeds the ghost outline, the manager is on or ahead of pace at that hour; when the ghost extends above today's bar, that hour is behind. The peak note appends `· ghost = Day N-1` so the legend is unambiguous. Hidden on day 1 (no prior day).
- The picker selection is in-memory only; reloading the page resets it to the live operating day.
- "Today" filtering for dashboard widgets is operating-day based (sale.operatingDay), not calendar-date based, so a sale saved at 23:59 on the operator's day is still attributed to that operating day even if the device clock has rolled past midnight.
- Low Stock Alerts only counts SKUs whose Event Start has been confirmed for the active day; before counting, the card shows a friendly "Count Event Start in Stock & Allocation Setup" hint instead of marking every SKU sold-out at zero.
- Top Sellers excludes free gifts and Send Later preorders; revenue per row is summed `lineTotal`. The card is picker-aware: when viewing the live operating day it shows event-wide cumulative top sellers (title `Top Sellers · Event`); when the manager picks a non-current day it shows that day's top sellers (title `Top Sellers · Day X`, hint `paid items on Day X`). Manager who wants both lenses can toggle via the Day View picker.
- Dashboard payment split is for booth checking only; it does not change saved sales or CSV export.
- Keep selling actions obvious and low-friction.
- Keep confirmation and reminder dialogs in-app and visually consistent.
- When refining the receipt wordmark, preserve the stacked logo direction the user has been iterating on.

## Passcodes

Passcodes are grouped in a single `ACCESS_CONTROL` config block in the POS source so future changes do not scatter internal access rules. They protect normal booth workflow only and are not a true security boundary against someone with direct device access and browser developer tools.

- `345` — Stock & Allocation Setup (Developer Tools)
- `987` — Internal Dashboard
- `123` — Close Day & Export CSV
- `888` — Correction Center, Inventory Flow stock top-up reversal

## Event-Day Verification Checklist

Run this checklist on the event device before booth selling starts. Use test data first, then clear it before real sales.

- Optional automated first pass: run `tests/smoke_event_pos.js` with the Codex Node/Playwright runtime before manual checks. In this workspace, the command is:

```powershell
$env:NODE_PATH='C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; $env:PLAYWRIGHT_BROWSER_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'; & 'C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'tests\smoke_event_pos.js'
```

The smoke test now covers PIN-gated workflows (operator login, Dashboard, Inventory, Correction lock screens), Today By Hour dashboard buckets, Inventory Flow sample visibility, void/carry-forward, stock top-up reset, Send Later delivery fee totals, sticker promo behavior, a combined booth + Send Later + sticker gift cart, and the destructive Reset Data gate.

- Staff login: log in as each expected staff role and confirm product taps are blocked after logout.
- Cash sale: save one normal cash sale and confirm it appears in dashboard, inventory, receipt text, and CSV export.
- Card/transfer sale: confirm `Save & New Sale` stays blocked until payment confirmation is checked.
- Send Later sale: add one Send Later line, enter customer name, phone, and receive location, then confirm the queue record is created as paid at event.
- Free gift: create a qualifying cart above `THB 1,200`, choose sticker SKU `021` or `022`, and confirm the selected sticker deducts stock and shows as a free item.
- Stock top-up: enter `Added Today` as a top-up amount, confirm setup, verify remaining event stock increases, and verify the input resets to `0`.
- Day close/export: close a test day, confirm CSV downloads, and confirm remaining stock carries into the next day.
- Bill correction: edit a saved bill quantity with a reason and confirm inventory carry-forward updates.
- Void bill: void a test bill with a reason, confirm it disappears from saved sales, and confirm the void audit snapshot exists.
- Inventory correction: adjust one controlled stock field with a reason and confirm the audit entry appears once.

## Pre-Event Data Hygiene

- Before real selling, export anything worth keeping, then use the Developer Tools `🚨 Reset Data` button to clear test data on this device.
- `🚨 Reset Data` opens a severe-styled confirmation dialog with a hazard banner and a 3-digit reset passcode keypad. Enter the reset passcode (`888`) before the `Erase Everything` button becomes enabled. Wrong passcodes show an in-app error and keep the action blocked.
- The reset confirmation dialog is the source of truth for what is touched: it lists what gets cleared (saved sales, void audit log, per-day inventory, global/online/event allocation) and what stays (Send Later queue, operator login, saved customer emails). Each kept item has its own dedicated cleanup control.
- Use `Clear Pending Send Later` to remove test Send Later records; packed, shipped, cancelled records, and saved sales are not deleted by this cleanup.
- Use `Clear Saved Customer Emails` on shared devices after receipt follow-up work or before handing the device to another team.
- Export day CSV files before clearing or resetting data. This app is local-only, so CSV is the practical backup.
- Do not clear data during live selling unless a manager confirms the current device is only holding test data.
- `🚨 Reset Data` is a destructive developer/admin action. It does not log who reset, so it should be used before live selling, not during.

## Inventory Reconciliation

- Developer Tools includes a `🧮 Reconcile Inventory` button (next to bulk CSV export) that runs a per-SKU integrity check on the inventory ledgers.
- The reconciler verifies, per SKU:
  - `cumulativeAllocated == booth remaining + sold + samples` (allocated balance equation; holds across day rollover by construction)
  - `global − online − cumulativeAllocated − committed ≥ 0` (warehouse non-negative)
- A clean run shows `✅ Inventory reconciled · All N SKUs reconcile cleanly`. A run with drift lists the offending SKUs with the delta, the cumulative count, the expected count (booth + sold + samples), and a hint that the most likely cause is a manual correction touching `startingStock` for a non-day-1 day; the suggested fix is to record a top-up via `Inventory Correction → addedStock`.
- The button is gated by the existing Developer Tools passcode (`345`); no separate passcode.
- Inventory Correction now also runs `realignInventoryCarryForward` after corrections to `startingStock`, `addedStock`, or `sampleQty`, so day 2/3/4 starting stocks stay consistent with a corrected earlier day.
- The Internal Dashboard also auto-runs the reconciler on every render and surfaces a tappable warning banner when any SKU has allocated drift or warehouse underflow. The banner stays hidden when ledgers are clean. Click the banner to open the same detailed report that `🧮 Reconcile Inventory` produces.
- Developer Tools also has a `📤 Reconcile CSV` button that exports the per-SKU reconciliation report (sku, name, global, online, committed, cumulativeAllocated, soldTotal, sampleTotal, boothRemainingCurrentDay, expected, allocatedDelta, warehouse, isOk, warehouseUnderflow). Filename is `meowseum-reconcile-YYYY-MM-DD.csv`. Pair this with `📤 Export All Day CSVs` for a complete end-of-event archive (sales per day + per-SKU reconciliation snapshot).
- Developer Tools has a `📦 Save Event Archive` primary button that runs all five export streams in one click: per-day sales CSVs, the reconciliation snapshot, the movement journal, the Send Later queue, and the void audit. Shows a single summary notice when the staggered downloads complete. Use this at the end of the event to save a complete archive in one operation.
- The reconcile report and the Reconcile CSV now also include `journalSold`, `journalSoldDelta`, and `journalConsistent` per SKU. These compare the movement-journal projection (sum of SELL + SELL_FREE + VOID for the SKU) to the ledger-derived sold count. A non-zero `journalSoldDelta` does not by itself break the warehouse formula — it indicates the journal hooks did not see a particular sale (e.g., the sale was added before the iter 5 hooks shipped). Tap the Reconcile dialog to see whether journal and ledger agree; the dashboard banner stays driven by the warehouse-formula `isOk`, so journal-only gaps surface in the detail dialog rather than as a blocking warning.
- Developer Tools also has a `📋 Movement Log` button that opens an in-app viewer for the append-only inventory movement journal. The viewer lists movements newest-first with a type-pill row coloring (sell, void, adjust, setup, reverse) and supports filter by type and SKU. The viewer's `📤 Export CSV` button emits `meowseum-movements-YYYY-MM-DD.csv` with columns `id, ts, type, sku, qty, dayId, reason, refId, actor`. Movement types: `SELL`, `SELL_FREE`, `RESERVE` (Send Later), `VOID` (negative qty referencing the original bill), `ADJUST_*` (inventory correction, key suffix names the field), `SETUP_*` (stock setup row, key suffix names the field), `REVERSE_TOPUP`. The journal is the foundation for future event-sourced inventory if the project moves that way; today it stands alone as a defensive audit trail that survives any drift in the live ledgers.

## Bulk Day-CSV Export

- Developer Tools includes a `📤 Export All Day CSVs` button beside the Reset and Clear Emails actions.
- The button re-emits one sales CSV per event day from current saved data, using the same shape and filename pattern as the day-close export (`meowseum-{dayId}-sales.csv`).
- Days with no saved sales are skipped; the post-export notice lists which days were skipped so staff can confirm coverage.
- Use this at the end of the event for reconciliation: if a past day was corrected after its original day-close export, this button regenerates that day's CSV with the corrected totals, so the saved files match the live Correction Center state.
- The button is gated by the existing Developer Tools passcode (`345`); no separate passcode.

## Recently Changed

- **May 2026 (Iter 11 — 4-Day Pace timeline IS the day picker)** — UX change. The standalone Day View picker card (added in BB) is removed. The 4-Day Pace timeline now serves as the day picker: tap any day's dot or its per-day total cell to drill into that day's snapshot. Selected day highlights with a deeper brown accent on both the dot and the cell. The hint text moved to a small subtitle next to the "4-Day Pace" heading and reflects whether the manager is viewing the live operating day or a historical day. Bonus fix: the timeline now distinguishes "Live" (the actual operating day, computed from `state.inventory.currentDay`) from "Active" (the user's current selection) — previously the picker reused the same class for both, which made closed-day selection visually confusing. Smoke updated to query the timeline cell row as the canonical button list.
- **May 2026 (Iter 9+10 — End-of-event archive + journal projection)** — (a) New `📦 Save Event Archive` primary button in Developer Tools triggers all five export streams (per-day sales, reconcile snapshot, movement journal, send later queue, void audit) in one click, with a single summary notice fired after the staggered downloads complete. (b) `reconcileInventoryReport()` now exposes `journalSold`, `journalSoldDelta`, and `journalConsistent` per SKU — a defense-in-depth check that the movement journal's net sold count (SELL + SELL_FREE + VOID) matches the ledger's sold count. Reconcile CSV gains the matching three columns. Reconcile dialog mentions journal gaps without escalating them — they are an integrity signal, not a current-state drift, since the ledger formula remains the authoritative source. Smoke covers: archive button triggers ≥4 downloads (incl. reconcile, movements, day CSVs); injecting a phantom +5 SELL movement shifts journalSoldDelta by exactly +5 and trips journalConsistent without breaking the ledger isOk; popping the injection restores the prior delta.
- **May 2026 (Iter 6+7+8 polish)** — three small improvements bundled into one cleanup commit. (a) **Top Sellers card is picker-aware**: live current-day view stays cumulative event-wide (`Top Sellers · Event`); selecting a non-current day swaps to that day's top sellers (`Top Sellers · Day X`, hint `paid items on Day X`). Manager toggles via the Day View picker. (b) **Movement log in-app viewer**: the previous `📋 Movements CSV` button is replaced by `📋 Movement Log`, which opens a dashboard-style overlay listing movements newest-first with type and SKU filters and a CSS color-pill per movement type (sell, void, adjust, setup, reverse). The overlay has its own `📤 Export CSV` button so the CSV-only workflow is preserved. (c) **Hour-by-hour ghost bars**: the Today By Hour chart now overlays a dashed-outline ghost bar behind each hour bucket showing the prior day's same-hour total at the same scale. The peak note appends `· ghost = Day N-1` for legend clarity. Hidden on day 1. Smoke covers all three: Top Sellers title swap on picker change, viewer overlay open/render/filter/close, and ghost bar element existence when prior-day data is present.
- **May 2026 (Batch CC iter5 — Movement Audit Journal)** — Append-only inventory movement log persisted to `meowseum_event_movements_v1`. New `appendMovement()` is invoked from the success paths of `finalizeSale` (SELL/SELL_FREE/RESERVE per item), `confirmVoidSale` (VOID with negative qty referencing the bill), `applyStockSetupDraft` (SETUP_* per changed field), `confirmInventoryCorrection` (ADJUST_*), and `confirmInventoryReverse` (REVERSE_TOPUP). All hooks are wrapped in defensive try/catch — a logging failure can never block a sale or correction. New `📋 Movements CSV` button in Developer Tools emits `meowseum-movements-YYYY-MM-DD.csv` with `id, ts, type, sku, qty, dayId, reason, refId, actor`. Reset Data also clears the movements log. Provides the audit trail the research-recommended event-sourced inventory model is built on, without changing existing ledger behavior. Smoke test asserts the SELL/RESERVE/ADJUST/REVERSE_TOPUP hooks produce entries, that `appendVoidMovements` produces a -qty VOID with the bill refId, that the CSV export emits a single date-stamped download, and that `resetSavedSales` clears `state.movements` plus its localStorage key.
- **May 2026 (Batch CC — Inventory Accounting Overhaul)** — Fixes the warehouse-drift bug observed at the live event. The warehouse formula is now `global − online − cumulativeAllocated − committed`, where `cumulativeAllocated = day 1 starting stock + Σ every day's added-today stock`. The previous per-day formula (`global − online − dayN.startingStock − dayN.addedToday − committed`) drifted on day 2+ because it conflated carry-forward with fresh allocation; in a typical event-day-rollover scenario it could spuriously change warehouse by tens of units after a correction or void. The new formula is invariant to carry-forward. Also: (a) `confirmInventoryCorrection` now runs `realignInventoryCarryForward` after `startingStock`/`addedStock`/`sampleQty` corrections so downstream day starting stocks stay consistent; (b) Developer Tools gains a `🧮 Reconcile Inventory` button that asserts `cumulativeAllocated == booth remaining + sold + samples` per SKU and surfaces any drift; (c) the smoke test now includes a scripted day-rollover scenario that reproduces the original drift and asserts the fix, plus a deliberate-corruption check that the reconciler detects and reports the gap. No localStorage shape changes; the legacy `gi.eventAllocated` field stays for backwards-compat but is no longer read.
- **May 2026 (Batch BB iter4 — Day-over-day Compare Footers)** — Each Today-card KPI (total sales, receipts, items, average bill) now shows a small `↑/↓ vs Day N-1: value (±%)` footer when the picker is on day 2+. Hidden on day 1. Direction is color-coded: green up, amber down, neutral flat. Serves the "predict sale" manager workflow — compare current pace to the prior day at a glance without leaving the dashboard. `dashboardMetrics` returns `priorDayId`, `priorDayLabel`, and a `todayCompare` block with delta + direction per KPI. Smoke covers the populated day-2 view (sales=150 vs prior=300 → -50% down) and the hidden day-1 case.
- **May 2026 (Batch BB — Dashboard Historical Day View)** — Internal Dashboard gains a Day View picker tab strip with live/closed status indicators. Picking a non-current day swaps every today-labeled widget (Today header, Today By Hour, Payment split, Receipts/Items/Avg Bill tiles, Low Stock Alerts) to that day's snapshot, while cumulative widgets (Event total, 4-Day Pace timeline, Top Sellers · Event) stay event-wide. Default = current operating day, so live behavior is unchanged on first open. Internal change: dashboard "today" filtering is now operating-day-based (`sale.operatingDay`) rather than calendar-date-based, fixing the edge case where a sale saved at 23:59 on the operator's day was attributed to the calendar-next-day. The picker selection is in-memory only and resets to live on page reload. Smoke test extended.
- **May 2026 (Batch AA — Bulk Day-CSV Export)** — Developer Tools gains an `📤 Export All Day CSVs` button that re-emits one sales CSV per event day with saved sales (skipping days with no sales). Uses the existing `meowseum-{dayId}-sales.csv` shape and the same `daySalesToCsv()` source as the per-day close export, so corrections made to past days after their original close-day export are picked up at end-of-event reconciliation. Smoke test extended.
- **Apr 2026** — global inventory, send later, stock reversal, queue rename, nav reorg.
- **Apr 2026 (README restructure)** — readme.md reorganized into a navigable sectioned guide with table of contents; no behavior change.
- **Apr 2026 (Batch A — Operator Gate Trio)** — sticky operator chip row in the cart panel with amber banner when no operator is selected; selected operator persists across sales and reloads via `localStorage`; `addToCart` and `Send Later` quick-add are gated on operator presence; stock validation runs at add-time and surfaces a non-blocking in-cart toast (also a polite `aria-live` announce); the `Save & New Sale` button switches to a red `Confirm payment first` blocked state while card/transfer payments are unconfirmed.
- **Apr 2026 (Batch C — Cart & Status Guards)** — carts that stay inactive for 10 minutes prompt staff to keep or clear them, with clear refreshing product/cart inventory immediately; Send Later is paid at the event and no longer supports pay-later status.
- **Apr 2026 (Batch B — Checkout Polish)** — Send Later customer details now group delivery/pickup fields under `Ship to`; receipt lines have inline `Edit` buttons that return to cart review without losing entered checkout details; customer email validation is shown inline and blocks save until fixed.
- **Apr 2026 (Batch D — Sample Qty Per-Day Migration)** — Sample stock moved from a single global field to a per-event-day field; one-time migration copies the legacy global value into Day 1, with Days 2-4 starting at 0.
- **Apr 2026 (Batch E — Render Memo + Correction Stock Impact)** — Cart-reserved quantities are computed once per `renderProducts` pass instead of once per visible SKU; the Bill Correction review now previews the per-SKU stock movement and the projected starting stock for each later event day.
- **Apr 2026 (Batch H — Void Bill from Correction Center)** — Bill Correction now has a separate reason-required `Void Bill` path for wrongly saved bills; voiding removes the sale, saves an audit snapshot, and realigns inventory carry-forward.
- **Apr 2026 (Batch L — Void Audit Review & Export)** — Bill Correction now displays a `Void Audit` list (bill id, time, operator, day, total, items, reason) and exports the full void audit log as a CSV with concise columns; full sale snapshots stay in localStorage only.
- **Apr 2026 (Batch M — Safer Test Data Reset Cleanup)** — `⚠️ Reset Data` confirmation now lists exactly what is cleared (saved sales, void audit, per-day inventory, allocation) and what stays (Send Later queue, login session, saved emails); reset also clears `meowseum_event_voided_sales_v1` and refreshes Correction Center if open.

- **Apr 2026 (Batch P — Restore UTF-8 Symbols After Inventory Baseline)** — Repaired baht (`฿`), emoji (🎁/🚚/🔒/⚠️/📧/📤/✅/🧣/🐱/⭐/💰/📦/🔁), color markers (🔵/🟡/🟤/⚫/⚪), bullets (`•`), em dashes (`—`), and arrows (`→`) that were lost when Batch O wrote the file with system-default encoding. Batch O inventory baseline (`DEFAULT_GLOBAL_STOCK`, `DEFAULT_ONLINE_STOCK`, Day 1 `Event Start = Global - Online`) and Batch N compressed product images are preserved.
- **Apr 2026 (Batch Q — Destructive Reset Passcode & Severity)** — `Reset Data` is now visually severe (🚨 icon, hazard banner, deeper crimson button) and gated behind a 3-digit reset passcode (`888`). The confirm button stays disabled until the correct passcode is entered; wrong passcodes show an in-app error and clear the entry. Cancelling the dialog or closing the app resets the passcode state. The smoke test now covers the gate.
- **Apr 2026 (Batch T — Smoke Coverage for PIN-Gated Workflows)** — Test-only batch. The smoke test now drives the operator login overlay, Dashboard lock, Inventory lock, and Correction lock through both wrong-PIN and correct-PIN paths, asserting overlay state, error text, and PIN clearing. No app behavior changed.
- **Apr 2026 (Batch R — Manual Event Start Count)** — Day 1 `Event Start` no longer auto-defaults to `Global - Online`; it starts unconfirmed so staff must physically count booth stock and enter it in Stock & Allocation Setup. Unconfirmed cells render with a red outline, empty input, `count` placeholder, `Count needed` hint, and `Not counted` warning beside Remaining Event. `addToCart` is blocked for unconfirmed SKUs with a stock toast pointing staff to the setup page. Saving an Event Start through `Confirm Stock Setup` confirms the SKU and unblocks selling. Closing a day auto-confirms the next day's Event Start (carry-forward is the source of truth). Smoke test extended.
- **Apr 2026 (Batch U — Internal Dashboard Redesign)** — Internal Dashboard now uses the cream/brown redesign with a larger event-total goal bar, remaining pace, 4-day pace cards, today-focused stats, and a cash/transfer/card payment split for manager checks.
- **Apr 2026 (Batch V — Dashboard V3 Manager View)** — 4-day pace card converted from a grid into a horizontal timeline (numbered Day 1→Day 4 dots + connector with per-day total/receipts/items cells underneath); added Top Sellers card (paid items, top 5 by units then revenue) and Low Stock Alerts card (active-day SKUs at or below their low-stock threshold, sorted by remaining; suppressed before staff count Event Start). `dashboardMetrics()` extended with `topSellers`, `topSellerMaxQty`, `lowStock`, `anyEventStartConfirmed`, `activeDayId`, `activeDayLabel`. PINs/CSV/storage/inventory math/Send Later/reset behavior unchanged. Smoke covers empty and populated V3 dashboard states.
- **Apr 2026 (Batch W — Today By Hour Dashboard Card)** — Internal Dashboard now adds a compact Today By Hour bar card under 4-Day Pace. It buckets local sale timestamps into `<10`, `10`-`20`, and `>21`, highlights the peak bucket, and keeps this as display-only dashboard data with no storage or CSV changes. Smoke covers empty and populated bucket states.
- **Apr 2026 (Batch S — In-App Dialogs Replace Browser Alerts)** — Browser `alert`/`prompt` boxes across the admin/staff flows are now replaced with in-app overlay dialogs that match the existing confirm-card style. Affected paths: `Clear Emails` (result message), Stock & Allocation Setup validation failures, Inventory Correction validation failures, Inventory Reverse top-up reason (now a dialog with a textarea, Enter to submit), Send Later form validation, Send Later/Sale/End-of-Day/Void Audit CSV export empty/error messages, and storage-failure save errors. `Clear Pending Send Later` and the Free-scarf out-of-stock cart notice were already in-app and stay unchanged. ESC closes the topmost dialog first without closing the screen underneath.
- **Apr 2026 (Batch Y — Product Delivery Fee for Send Later Orders)** — Per-SKU `Delivery Fee` from `product/product list-event price.xlsx` is now charged on Send Later cart lines (`deliveryFee × qty`, summed). The fee shows as a separate `Delivery Fee` row in the cart and review-receipt summary when nonzero, and is included in the chargeable total, saved sale total, transfer QR amount, payment confirmation amount, and the receipt slip. Booth-only sales are unchanged. Card surcharge (3%) now calculates on `merchandise + delivery fee`. Sale CSV and end-of-day CSV gain `saleDeliveryFee`, `deliveryFeePerUnit`, and `lineDeliveryFee` columns; existing column meanings are preserved. Bill Correction recomputes the delivery fee from the updated Send Later items. Smoke test extended.
- **Apr 2026 (Batch Z — Sticker Choice Promo)** — The free-scarf promo is replaced by the sticker promo: every `THB 1,200` of qualifying paid Meowseum + Modern Friends cart value earns one free Sticker Meowsuem. Staff can choose SKU `021` or `022` in the cart; free stickers use the real selected SKU with `isFreeGift` metadata, so paid/free sticker quantities coexist in inventory, dashboard, receipts, correction, and CSV. Legacy `GIFT-SCARF` records still display as old free items but are no longer awarded. Smoke test extended.
- **Apr 2026 (Batch G - Stock Setup Clarity)** - Stock & Allocation Setup now treats `Added Today` as a temporary top-up field that resets to `0`, and hides idle warehouse/sold helper text.
- **Apr 2026 (Stabilization docs)** - Added pre-event verification and shared-device data hygiene checklists for safer event setup.

## Planned (Workflow Alignment & Inventory Consistency Round)

Remaining items, designed and approved but not yet shipped. The original source plan lives in a local Claude planning file (outside this repo). See [TASKS.md](TASKS.md) for live status, which is the source of truth contributors should use.

- (Round complete — see Recent Changes for shipped batches.)

## How To Continue Next Time

- Read this README first.
- Then inspect the current HTML before making assumptions.
- After you finish a change, update this README before you stop.
- Preserve the compact event-sales flow unless the user explicitly asks for a redesign.
- Keep the POS receipt and admin receipt visually in sync.
- Treat `receiptEmailRequested` as the source-of-truth for who actually asked for an emailed receipt.
- Avoid undoing existing modal/confirmation patterns unless requested.
- If changing gift logic, inventory logic, or CSV shape, check the whole end-to-end flow before finalizing.
