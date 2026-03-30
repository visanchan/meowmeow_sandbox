# MeowMeow Event POS

This project is a single-file browser POS for the Meowseum event booth. The main app lives in [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html). The goal is to keep the system fast for booth staff, visually clean on iPad, and simple to continue editing in future sessions.

## Current Objective

When continuing this project, align work to these priorities:

- Make selling fast for staff at an event booth.
- Keep the layout compact enough to work comfortably on iPad in landscape.
- Prefer clean, aligned, low-friction UI over decorative details.
- Keep the app self-contained in one HTML file unless there is a strong reason to split it.
- Protect sensitive inventory controls behind Developer Tools, while keeping the public selling flow simple.

## Current Product Direction

- The header uses a text-only wordmark: `THE / Meow Meow App POS / SEUM`.
- The logo/image-based approach was intentionally removed.
- Product cards are compact blocks designed to fit `5` cards per row on main/iPad layouts.
- Product cards should remain easy to scan by product name and SKU.
- SKU is shown without the word `SKU`.
- Stock-left and price sit on the right side of the card.
- Product names can wrap, but vertical alignment should stay consistent across cards.
- `Cat the Curator` variants use emoji to save space:
  - `Cat the Curator 🔵`
  - `Cat the Curator 🟡`

## Inventory Rules

- Staff should not manually enter starting stock from the normal selling flow.
- Inventory editing belongs in the passcode-protected Developer Tools area.
- Day 1 starting stock and low-stock alerts are merged into one compact developer editor.
- Developer inventory controls are immediate after unlock; there is no extra sub-panel toggle.
- Public inventory view is read-only.
- Day 1 starting stock is editable only before Day 1 has sales and before Day 1 is closed.
- Low-stock alerts remain editable in developer mode.
- Keep the current inventory data model unless there is a strong reason to change it:
  - `state.inventory.days.day1.startingStock[sku]`
  - `state.inventory.thresholds[sku]`

## Layout Rules

- Optimize for iPad landscape first, then desktop, then mobile.
- Avoid large empty spaces.
- Avoid decorative photos and product images.
- Keep tabs and cards compact.
- Favor strong alignment:
  - names align
  - SKU row aligns
  - stock and price area aligns
- Prefer simple, readable typography with consistent sizing and color relationships.
- When updating the header wordmark, preserve the intended cross-word structure:
  - line 1: `THE`
  - line 2: `Meow Meow App POS`
  - line 3: `SEUM`

## Functional Summary

- Staff tap products to add them to cart.
- Staff choose payment method and confirm the order.
- Sales can be saved with operator and payment confirmation flow.
- Sales are stored in `localStorage`.
- CSV export is generated automatically.
- Dashboard and Developer Tools are both protected behind their existing access flow.
- Inventory tracking is built into the same app.

## File Structure

- [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html): full app, including HTML, CSS, JS, product data, sales logic, inventory logic, dashboard, and developer tools.
- [readme.md](c:\Users\USER\Desktop\meowmeow_sandbox\readme.md): project continuation guide and design alignment notes.

## How To Continue Next Time

If continuing work in a future session:

- Read this `README.md` first.
- Then inspect [meowmeow_pos_event.html](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html) before making assumptions.
- Preserve the compact iPad-first layout unless the user asks for a redesign.
- Keep changes consistent with the current visual direction: text-led, compact, aligned, and practical for booth staff.
- Prefer improving clarity and space usage over adding more visual complexity.
- If changing inventory or developer controls, keep the staff-facing flow as simple as possible.

## Notes For Future Edits

- This file has evolved iteratively, so check for older logic before adding new features.
- Avoid reintroducing logo or product images unless the user explicitly asks for them.
- Before changing product card layout, confirm it still supports future catalog growth.
- Before changing header styling, preserve the wordmark concept the user has been refining.

## Suggested Workflow For Codex

When helping on this project in future sessions:

- first confirm the current request,
- inspect the existing HTML/CSS/JS structure,
- align the solution with the compact event POS objective,
- keep edits minimal and intentional,
- and avoid undoing prior design simplifications unless asked.
