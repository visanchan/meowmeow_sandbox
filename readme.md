# MeowMeow Event POS

This project is a browser-based event POS for the Meowseum booth. The main selling app lives in [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html), and the post-sale visual receipt helper lives in [meowmeow_receipt_admin.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_receipt_admin.html).

The product direction is:

- make booth selling fast for staff
- keep the UI compact and readable on iPad landscape
- keep the selling flow self-contained in the main HTML file
- protect inventory and internal controls from the normal selling flow
- keep receipt follow-up practical for post-sale admin work

## Working Rule

- Before making any code change, read this `readme.md` first.
- After finishing any change, update this `readme.md` so it stays aligned with the current product direction and implementation.
- Treat this file as the shared continuity guide for future developers and future sessions.
- If behavior, workflow, UI direction, passcodes, CSV shape, or correction logic changes, document that change here before closing the task.
- Before starting substantial work, review this `readme.md` again and use it as the first checklist for scope, constraints, and continuity.
- For larger or multi-part tasks, prefer splitting the work into focused sub-tasks so parallel agents can handle independent parts with smaller context.
- Use multi-agent delegation only when the task can be split cleanly without creating overlap or merge risk.
- Keep each sub-task narrow and self-contained to reduce context-window pressure and improve review quality.
- After sub-tasks finish, consolidate the result into one final implementation and update this README if the behavior or workflow changed.

## Current App Shape

- [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html) contains:
  - product catalog
  - cart and checkout flow
  - payment QR flow
  - free gift logic
  - fulfillment-later queue for unavailable pre-orders and in-stock send-later reservations
  - operator/tagging flow
  - sales storage and CSV export
  - dashboard
  - developer inventory tools
  - bill correction log for exceptional saved-bill fixes
- [meowmeow_receipt_admin.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_receipt_admin.html) is a local admin helper that imports exported day CSV files, rebuilds the branded visual receipt, and supports manual post-sale email workflow.

## Key Behavior

- Staff tap product cards to build the cart.
- Product-card remaining stock should update immediately when staff add, remove, or change quantities in the current cart.
- Payment methods include cash, bank transfer, and card.
- If the cart contains only unavailable pre-order items, the payment picker switches to a 2-button mode:
  - `Pay Now`
  - `Pay Later`
- In-stock products can also be sold through a `Send Later` path:
  - stock is reserved immediately
  - the order still captures shipping details for later fulfillment
- Transfer payments can show PromptPay QR after order confirmation.
- The `Review & Finish Sale` overlay is split into two desktop columns:
  - left: customer-facing receipt and receipt-share area
  - right: salesperson controls such as QR, payment confirmation, operator tap-in, tags, and finish
- Both columns scroll independently on desktop and collapse back to a normal single-column flow on smaller screens.

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

## Receipt Share Rules

- The customer email field is always available.
- That email can be collected even if the customer does not request a receipt email, for example for future marketing/contact use.
- The `Send me an email receipt` checkbox is specifically for post-sale receipt sending.
- If that checkbox is checked, customer email becomes required before the sale can be saved.
- When the checkbox is checked, the app shows an in-app reminder that the receipt will arrive in `3-4 days`.
- The sale record keeps both:
  - `receiptEmail`
  - `receiptEmailRequested`
- CSV exports include both the customer email and the explicit receipt-request flag so admin can filter only customers who asked for the emailed receipt.

## Receipt Branding

- The visual receipt now uses a stacked wordmark:
  - `THE`
  - `Meow`
  - `SEUM`
- The receipt also includes:
  - `PHIPHETTHAPHAN`
  - `Meowseum | Modern Friends`
- Footer copy is:
  - `Thank you for supporting Phiphetthaphan.`
  - `Thank you for letting us be part of your pet’s daily joy.`
  - `For inquiries, please contact phiphetthaphan@gmail.com`
- The POS receipt preview and admin receipt page should stay visually aligned.

## Inventory Rules

- Staff should not edit inventory from the normal selling flow.
- Inventory editing belongs in passcode-protected Developer Tools.
- Public inventory flow is read-only.
- Day 1 starting stock is editable only before Day 1 has sales and before Day 1 is closed.
- Low-stock alerts remain editable in developer mode.
- End-of-day export and stock carry-forward should keep working without requiring staff to understand the internal data model.
- Adding an item to cart must re-check stock against both saved sales and the quantities already reserved in the current unsaved cart.
- Product cards and cart `+` actions should stop adding units once the cart has already reserved the last remaining stock for that SKU.
- `Close Day & Export CSV` is passcode-protected and the dialog now uses only the passcode keypad flow without an extra cancel button.
- After a saved bill is corrected, inventory carry-forward must be realigned across later event days so Day 2, Day 3, and Day 4 starting stock stay consistent with the corrected earlier day.
- Sold-count calculations are now cached in-memory during runtime to reduce repeated inventory recomputation on every render.

## Pre-Order Rules

- A separate pre-order queue is available from the new memo emoji button placed beside the Inventory Flow emoji in the top bar.
- Use the queue for both:
  - unavailable-item `Pre-Order`
  - in-stock `Send Later` reservations
- Sold-out product cards should offer a direct `Pre-Order` action inside the normal card footprint so the card height does not grow.
- In-stock product cards should offer a compact `Send Later` action inside the same product-card footprint.
- Those quick fulfillment actions should now appear as compact emoji overlays pinned on the product photo so they do not push the text layout:
  - `📝` for unavailable-item `Pre-Order`
  - `📦` for in-stock `Send Later`
- Quick fulfillment-later actions now add a labeled line into the live cart instead of forcing staff to open the queue panel first.
- Product-card stock should use the shortest readable badge:
  - exact count only for normal and low-stock states
  - `Sold out` and `Closed` for no-stock or closed-day states
- Cart fulfillment-later lines should:
  - stay the same size as normal cart lines
  - keep the same discount editing controls as normal cart lines
  - show a compact business label: `Pre-Order` or `Send Later`
  - avoid extra explanatory helper sentences inside the cart row
- Unavailable-item pre-orders:
  - never reserve or deduct live inventory
  - default to `Paid with current sale`
  - can still be switched between `Paid with current sale` and `Pay later`
- In-stock `Send Later` lines:
  - reserve stock immediately once the sale is saved
  - default to and stay `Paid with current sale`
- Mixed carts can contain live stock items, `Pre-Order` items, and `Send Later` items in the same checkout.
- If the cart contains only pre-order items:
  - `Pay Now` keeps the checkout flow and lets staff choose the real payment method in `Review & Finish Sale`
  - `Pay Later` saves the pre-order demand without creating an immediate paid sale record
- Each pre-order entry should capture:
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
- Customer name, phone, and receive location are required before saving any pre-order.
- In `Review & Finish Sale`, those same customer/shipping fields should appear only when the checkout contains one or more fulfillment-later lines.
- Customer name, phone, email, line ID, and receive location entered in `Review & Finish Sale` should auto-fill all linked `Pre-Order` and `Send Later` records from that checkout.
- The queue should show sold-out and low-stock signals to help staff decide when pre-order capture is appropriate.
- Pre-order records are stored locally on the device and can be exported as CSV for follow-up work after the event.
- Pre-order status options are:
  - `Open`
  - `Contacted`
  - `Confirmed`
  - `Cancelled`

## Bill Correction Log Rules

- The saved-bill correction tool is an exception workflow, not a normal selling workflow.
- Access stays behind passcode `888`.
- Staff first unlock the tool, then review a warning before editing.
- The tool now follows a controlled flow:
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

## Data and Export Notes

- Sales are stored in `localStorage`.
- Old sales should continue loading safely even when newer fields are added.
- CSV export is part of the operating workflow and should stay stable.
- CSV text fields now harden against spreadsheet formula injection:
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
- They are not a true security boundary against someone with direct device access and browser developer tools.
- Passcodes are now grouped in a single config block in the POS source so future changes do not scatter internal access rules.
- Current receipt-related CSV fields include:
  - `receiptEmailRequested`
  - `customerEmail`
- Sales CSV and end-of-day CSV now also include:
  - `isPreorder`
  - `preorderPaymentStatus`
  - `orderValue`
  - `customerName`
  - `customerPhone`
  - `customerLineId`
  - `customerReceiveLocation`
- Pre-order CSV now includes split customer/shipping fields plus `linkedBillId` and pre-order payment status.
- CSV exports from both the POS app and the admin tool should emit SKU values in spreadsheet-safe text form so leading zeros stay intact during sorting, syncing, and post-processing.
- Free-gift CSV detail also includes gift metadata such as auto/manual gift quantities.
- The admin receipt tool now protects browser performance by limiting oversized CSV imports and generating receipt PNGs on demand instead of pre-rendering every imported bill at once.
- Admin can only mark a receipt bill as sent when the edited customer email still matches a valid email format.
- The admin receipt tool should persist queue state without storing large generated receipt image payloads in `localStorage`.
- Developer Tools now include a manual `Clear Saved Customer Emails` action for privacy cleanup on shared devices.
- The admin screen should keep reminding staff to reset the saved queue after follow-up work is finished on a shared device.

## Layout Rules

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
- Product photos must stay embedded inside [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html) as inline data so the file can be moved to iPad and opened offline in Edge without a separate asset folder.
- The current embedded image coverage is:
  - `002A`
  - `002B`
  - `003`
  - `004`
  - `005`
  - `006`
  - `007`
  - `010`
  - `011`
  - `012`
  - `013`
  - `014`
- When new product photos become available for the remaining SKUs, add them by following the same pattern as the current embedded set:
  - confirm the local image file matches the intended SKU before embedding
  - keep the image stored in the `PRODUCT_IMAGE_DATA` map keyed by SKU
  - preserve the same compact product-card layout, image aspect ratio, and price-row emoji actions
  - keep missing-image SKUs on the existing placeholder fallback until their match is confirmed
  - update this README image-coverage list after each newly embedded SKU so future sessions know what is already complete
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

## Files

- [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html): full POS app
- [meowmeow_receipt_admin.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_receipt_admin.html): admin receipt and follow-up workflow from exported day CSV files
- [readme.md](c:\Users\USER\Desktop\meowmeow_sandbox\readme.md): continuation notes for future sessions

## How To Continue Next Time

- Read this README first.
- Then inspect the current HTML before making assumptions.
- After you finish a change, update this README before you stop.
- Preserve the compact event-sales flow unless the user explicitly asks for a redesign.
- Keep the POS receipt and admin receipt visually in sync.
- Treat `receiptEmailRequested` as the source-of-truth for who actually asked for an emailed receipt.
- Avoid undoing existing modal/confirmation patterns unless requested.
- If changing gift logic, inventory logic, or CSV shape, check the whole end-to-end flow before finalizing.
