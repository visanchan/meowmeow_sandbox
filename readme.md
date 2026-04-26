# MeowMeow Event POS

Browser-based event POS for the Meowseum booth. The main selling app is [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html); the post-sale visual receipt helper is [meowmeow_receipt_admin.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_receipt_admin.html).

## Table of Contents

- [Overview](#overview)
- [Files](#files)
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

- The promo scarf is a real tracked SKU: `GIFT-SCARF`.
- Free scarf inventory follows the same stock flow as normal SKUs.
- User-facing displays should label the promo scarf as `(Free item)` so staff and customers are not confused, while the same SKU still stays in inventory flow and CSV records.
- In inventory view and internal dashboard, sold counts should split paid vs free-gift quantity using the format `paid (free)` when free gifts exist.
  Example: `80 (9)` means `80` paid units sold and `9` free gifts given, while stock still deducts all `89`.
- If a SKU has only free-gift movement and no paid movement, display only the free quantity in parentheses, such as `(4)`, instead of `0 (4)`.
- In Inventory Flow, any scarf-specific count shown for the `GIFT-SCARF` SKU should use parentheses formatting, including starting, added, sold-only-free, remaining, and top-up log quantity displays.
- The Inventory Flow summary cards should follow the same split style:
  - `Starting Stock`, `Added Stock`, and `Remaining` should show `main (scarf)` when the scarf contributes to that total.
  - `Sold` should keep the paid-vs-free split style, such as `16 (4)`.
- The scarf can auto-award based on cart total:
  - every `THB 2,000` of qualifying cart total earns `1` scarf
- The scarf can also be manually added beyond entitlement, but that requires in-app confirmation.
- The scarf line stays at the bottom of the cart.
- The scarf row has its own `+` and `-` controls.
- The scarf emoji acts as a toggle for the gift line.

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
- The unified setup table shows SKU, product, global stock, online stock, event starting stock, added-today stock, sample stock, warehouse stock, remaining event stock, and low alert.
- Staff should use the `+` and `-` buttons for stock edits, with number inputs kept as backup.
- Stock setup changes are staged across many products and saved with one `Confirm Stock Setup` review action.
- In Stock & Allocation Setup, `Added Today` is a temporary `Top up now` input. Enter only the quantity being added in this moment; after confirm, the stored added-stock total increases and the input resets to `0`.
- Warehouse stock is calculated as global stock minus online stock, event starting stock, added-today stock, and committed Send Later quantity.
- Sample stock is taken from event booth inventory, so it reduces remaining event stock and sellable quantity.
- Sample stock is tracked per event day, so each day can record its own sample quantity without polluting the other days.
- On first load after upgrade, the prior global sample quantity is migrated into Day 1's sample stock; Days 2-4 start at zero.
- After the first saved sale exists, normal Stock & Allocation Setup locks `Global`, `Online`, and `Event Start` so opening inventory cannot be casually changed mid-selling.
- After sales begin, staff can still edit `Added Today`, `Sample`, and `Low Alert`; controlled fixes to locked fields belong in `Correction Center > Inventory Correction`.
- Public inventory flow is read-only.
- Day 1 starting stock is editable only before Day 1 has sales and before Day 1 is closed.
- Low-stock alerts remain editable in developer mode.
- End-of-day export and stock carry-forward should keep working without requiring staff to understand the internal data model.
- Adding an item to cart must re-check stock against both saved sales and the quantities already reserved in the current unsaved cart.
- Product cards and cart `+` actions should stop adding units once the cart has already reserved the last remaining stock for that SKU.
- `Close Day & Export CSV` is passcode-protected and the dialog uses only the passcode keypad flow without an extra cancel button.
- After a saved bill is corrected, inventory carry-forward must be realigned across later event days so Day 2, Day 3, and Day 4 starting stock stay consistent with the corrected earlier day.
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
- Keep selling actions obvious and low-friction.
- Keep confirmation and reminder dialogs in-app and visually consistent.
- When refining the receipt wordmark, preserve the stacked logo direction the user has been iterating on.

## Passcodes

Passcodes are grouped in a single `ACCESS_CONTROL` config block in the POS source so future changes do not scatter internal access rules. They protect normal booth workflow only and are not a true security boundary against someone with direct device access and browser developer tools.

- `345` — Stock & Allocation Setup (Developer Tools)
- `987` — Internal Dashboard
- `123` — Close Day & Export CSV
- `888` — Correction Center

## Recently Changed

- **Apr 2026** — global inventory, send later, stock reversal, queue rename, nav reorg.
- **Apr 2026 (README restructure)** — readme.md reorganized into a navigable sectioned guide with table of contents; no behavior change.
- **Apr 2026 (Batch A — Operator Gate Trio)** — sticky operator chip row in the cart panel with amber banner when no operator is selected; selected operator persists across sales and reloads via `localStorage`; `addToCart` and `Send Later` quick-add are gated on operator presence; stock validation runs at add-time and surfaces a non-blocking in-cart toast (also a polite `aria-live` announce); the `Save & New Sale` button switches to a red `Confirm payment first` blocked state while card/transfer payments are unconfirmed.
- **Apr 2026 (Batch C — Cart & Status Guards)** — carts that stay inactive for 10 minutes prompt staff to keep or clear them, with clear refreshing product/cart inventory immediately; Send Later is paid at the event and no longer supports pay-later status.
- **Apr 2026 (Batch B — Checkout Polish)** — Send Later customer details now group delivery/pickup fields under `Ship to`; receipt lines have inline `Edit` buttons that return to cart review without losing entered checkout details; customer email validation is shown inline and blocks save until fixed.
- **Apr 2026 (Batch D — Sample Qty Per-Day Migration)** — Sample stock moved from a single global field to a per-event-day field; one-time migration copies the legacy global value into Day 1, with Days 2-4 starting at 0.
- **Apr 2026 (Batch E — Render Memo + Correction Stock Impact)** — Cart-reserved quantities are computed once per `renderProducts` pass instead of once per visible SKU; the Bill Correction review now previews the per-SKU stock movement and the projected starting stock for each later event day.
- **Apr 2026 (Batch H — Void Bill from Correction Center)** — Bill Correction now has a separate reason-required `Void Bill` path for wrongly saved bills; voiding removes the sale, saves an audit snapshot, and realigns inventory carry-forward.

## Planned (Workflow Alignment & Inventory Consistency Round)

Remaining items, designed and approved but not yet shipped. See `C:\Users\USER\.claude\plans\read-all-code-in-polymorphic-kahn.md` for the full plan and [TASKS.md](TASKS.md) for live status.

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
