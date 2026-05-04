# User Flow

## Public visitor (someone who just heard about us)

```
1. Lands on /                     → marketing page, "Apply to join the pilot"
2. Clicks "Apply"                  → /apply
3. Fills owner name, phone, email,
   brand name, IG/FB, # SKUs,      → server action: insert into applications
   # events/year, why us
4. Sees /apply/success             → "We'll email you within 3 working days"
5. (Optional) /apply/status        → enter email, see status (pending/approved/rejected)
```

System side: admin gets an email "New application from <brand>".

## Admin (the founder, manually approving each pilot client)

```
1. Logs in at /login                → Supabase Auth
2. Lands on /admin                  → admin home
3. /admin/applications              → list all applications, filter by status
4. Clicks an application            → review details
5. Clicks "Approve"                 → server action:
                                       - applications.status = approved
                                       - generate invite_codes row
                                       - send invite email via Resend
6. (or) Clicks "Reject"             → applications.status = rejected (no email)
7. /admin/invite-codes              → see issued codes, status, can resend or cancel
8. /admin/workspaces                → see all workspaces and last activity
```

## New client (after approval)

```
1. Receives invite email with code   → "Your code is CATBOOTH-7KQ9-X2LA"
2. Visits /register                  → enter code
3. Code validated server-side        → fetches application's email + brand_name
4. Enters password, confirms brand   → Supabase Auth signup
5. Workspace auto-created            → workspace_id assigned, first member = owner
6. invite_codes row marked used
7. Redirected to /app/setup/products → onboarding step 1: product setup
```

## Client first-time setup

```
1. /app/setup/products              → empty state: "add your first product"
2. Click "+ Add product"
3. Fill SKU, name, category, price,
   stock, send-later allowed,        → server action: insert into products
   upload image                      → image to Supabase Storage bucket
4. Repeat for each SKU
5. Click "I'm done setting up"      → workspaces.setup_complete = true
6. Redirected to /app
```

## Client booth day

```
1. /app                              → home: "Open Event Day" or "Continue Day N"
2. /app/events/new                   → create event (name, venue, dates)
3. /app/events/<id>/start            → enter starting count per SKU (event_inventory)
4. /app/pos                          → product grid, cart, checkout
5. (Each sale)                       → server action: create_order RPC
                                          - inserts orders row
                                          - inserts order_items rows
                                          - inserts payment_records row
                                          - decrements event_inventory
                                          - inserts audit_logs row
6. /app/send-later                   → if any items were marked send_later,
                                       fulfill from this list
7. /app/dashboard                    → live metrics for today
8. /app/events/<id>/close            → end-of-day close action
                                          - marks event status = closed_day_N
                                          - exports day CSV
```

## Client end of event

```
1. /app/events/<id>/close-event     → final close
2. CSV bundle downloaded             → all orders, all send-later, dashboard
3. Send-later list still active      → can still mark as packed/shipped/completed
4. Event archived                    → still readable, no new sales accepted
```

## Critical correctness rules

- **A sale is atomic.** Either all of (orders, order_items, payment_records, event_inventory decrement) happen, or none. This is the `create_order` Postgres function.
- **A void is atomic.** Inverse of create_order. Event_inventory is restored, audit row written.
- **A correction is atomic.** Edits an existing order; audit row records before/after.
- **Inventory cannot go negative** unless explicitly allowed (not allowed in pilot).
- **Two staff cannot sell the last unit.** Postgres SELECT FOR UPDATE on event_inventory row inside the function.
