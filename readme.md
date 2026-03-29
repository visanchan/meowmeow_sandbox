This project is very small and self-contained: the folder only has [`meowmeow_pos_event.html`](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html) and [`logo_meow.png`](c:\Users\USER\Desktop\meowmeow_sandbox\logo_meow.png). The whole app lives in that one HTML file: layout, CSS, product data, business logic, receipt flow, dashboard, local storage, CSV export, and QR generation are all embedded directly in it.

What the project does:
- It’s a browser-based POS for an event booth called “MeowMeow App POS”.
- Staff tap products, build a cart, choose payment (`cash`, `bank transfer`, or `card`), confirm the order, assign an operator, optionally add customer tags and a payment reference, then save the sale.
- Saved sales are stored in `localStorage` under `meowseum_event_sales_v1`, so this is a client-side/offline-first app tied to the current browser/device.
- Every saved sale is exported as a CSV download automatically.
- There is an internal dashboard behind a 3-digit PIN `456` that shows total sales, today’s sales, receipts, items sold, average bill, and progress toward a THB 500,000 event goal.

How the app is structured in code:
- [`meowmeow_pos_event.html#L1`](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html#L1) to about line 458 is UI markup and styling.
- The script starts at [`meowmeow_pos_event.html#L459`](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html#L459).
- Product catalog is hardcoded in [`meowmeow_pos_event.html#L460`](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html#L460): 14 items across categories like `Signature`, `Classic`, `Entry`, `Premium`, `Lifestyle`, and `Plush`.
- There are 2 tabs/brands in the catalog: `Meowseum :)` and `ModernFriend >.<`.
- Operators are fixed as `OP-01` through `OP-06`.
- Tags are also hardcoded, like cat owner / premium buyer / price sensitive / bulk interest / returning interest.

What happens during a sale:
- Product cards render from the `PRODUCTS` array and clicking one adds it to the cart.
- The cart supports quantity changes and per-line discounts; the final cart version uses preset discount amounts plus a custom number field.
- Pressing “Confirm Order” creates a `pendingSale` object with bill ID, timestamp, subtotal, discount, total, payment method, and serialized line items.
- The success/confirmation overlay then shows a receipt preview, payment confirmation controls, operator selection, tags, and the final “Save & New Sale” action.
- Transfer/card payments require manual confirmation before save; cash can be saved immediately.
- Saving a sale writes it to local storage, updates the dashboard, exports a CSV, plays a short success sound, clears the cart, and resets the UI.

Payment and QR behavior:
- Bank transfer is set up around PromptPay / Thai bank details in [`meowmeow_pos_event.html#L489`](c:\Users\USER\Desktop\meowmeow_sandbox\meowmeow_pos_event.html#L489).
- The file includes code to build PromptPay payloads and even a full in-file QR code generator, so it can create offline QR codes without external libraries.
- After order confirmation, transfer payments show a QR section in the success overlay.
- The code prefers a hosted QR from `promptpay.io` when online, and falls back to a built-in QR when needed.

Dashboard behavior:
- The internal dashboard is in the same file and opens from the chart button.
- It is PIN-protected with `456`.
- Metrics are computed from the locally saved sales only, so the dashboard is device-specific rather than synced across machines.

Notable code observations:
- The project looks like it evolved quickly in one file. There are duplicate function definitions for some cart logic such as `renderCart`, and the later ones override the earlier ones.
- There are also leftover references to transfer-preview elements like `transferBox` and an empty `refreshTransferQr()` function, which suggests an earlier cart-side transfer QR feature was partially removed or refactored.
- So the app is functional in concept, but the codebase has some legacy/dead paths mixed in.

One thing I could not confirm: I wasn’t able to read the git history because the repo is marked as an unsafe directory for the sandbox user, so this summary is based on the actual files currently in the folder rather than past commits.

If you want, I can do a second pass and give you:
1. a “feature list” summary for non-technical people,
2. a “developer walkthrough” of each major function,
3. or a “problems / cleanup opportunities” review of this file.