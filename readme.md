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

## Current App Shape

- [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html) contains:
  - product catalog
  - cart and checkout flow
  - payment QR flow
  - free gift logic
  - operator/tagging flow
  - sales storage and CSV export
  - dashboard
  - developer inventory tools
  - bill correction log for exceptional saved-bill fixes
- [meowmeow_receipt_admin.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_receipt_admin.html) is a local admin helper that imports exported day CSV files, rebuilds the branded visual receipt, and supports manual post-sale email workflow.

## Key Behavior

- Staff tap product cards to build the cart.
- Payment methods include cash, bank transfer, and card.
- Transfer payments can show PromptPay QR after order confirmation.
- The `Review & Finish Sale` overlay is split into two desktop columns:
  - left: customer-facing receipt and receipt-share area
  - right: salesperson controls such as QR, payment confirmation, operator tap-in, tags, and finish
- Both columns scroll independently on desktop and collapse back to a normal single-column flow on smaller screens.

## Free Gift Rules

- The promo scarf is a real tracked SKU: `GIFT-SCARF`.
- Free scarf inventory follows the same stock flow as normal SKUs.
- User-facing displays should label the promo scarf as `(Free item)` so staff and customers are not confused, while the same SKU still stays in inventory flow and CSV records.
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
- `Close Day & Export CSV` is passcode-protected and the dialog now uses only the passcode keypad flow without an extra cancel button.
- After a saved bill is corrected, inventory carry-forward must be realigned across later event days so Day 2, Day 3, and Day 4 starting stock stay consistent with the corrected earlier day.
- Sold-count calculations are now cached in-memory during runtime to reduce repeated inventory recomputation on every render.

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
- This is still a local browser app, so passcodes and local-storage data protect normal booth workflow only.
- They are not a true security boundary against someone with direct device access and browser developer tools.
- Current receipt-related CSV fields include:
  - `receiptEmailRequested`
  - `customerEmail`
- Free-gift CSV detail also includes gift metadata such as auto/manual gift quantities.
- The admin receipt tool now protects browser performance by limiting oversized CSV imports and generating receipt PNGs on demand instead of pre-rendering every imported bill at once.
- Admin can only mark a receipt bill as sent when the edited customer email still matches a valid email format.

## Layout Rules

- Optimize for iPad landscape first, then desktop, then mobile.
- Avoid decorative clutter.
- Keep product cards compact and scan-friendly.
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
