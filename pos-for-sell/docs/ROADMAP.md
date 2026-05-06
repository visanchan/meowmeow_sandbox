# MochiPOS Roadmap & Technical Baseline

> Source: founder strategic direction document (2026-05-07).
> This is the canonical direction for MochiPOS. When in doubt, this doc wins over older planning docs (`PROJECT_VISION.md`, `BATCH_PLAN.md`).
> See also: [PROJECT_VISION.md](PROJECT_VISION.md) for the umbrella strategy across both Project 1 (Meowmeow Event POS) and Project 2 (MochiPOS).

## Purpose

MochiPOS is not only a POS app. It is a long-term SaaS product that starts from a real event booth POS and may later become a broader commerce/data platform for small businesses.

---

## 1. Project background

### 1.1 Original proof: Meowmeow Event POS

The first project is **Meowmeow Event POS**, a single-file event POS created for a real booth operation. It was built for a cat-themed/pet-product event booth and tested in real event conditions.

Important characteristics:
- Single-file browser-based POS
- Built for event booth selling
- Used in a real multi-day event
- Focused on fast checkout
- Handled product cards, cart, checkout, transfer payment, receipt, Send Later, stock monitoring, dashboard
- Designed around real seller workflow, not theory

This project proved that event booth sellers have special needs that generic POS systems do not fully support.

---

## 2. New product direction: MochiPOS

### 2.1 What MochiPOS is

**MochiPOS** is the SaaS version of the Meowmeow Event POS idea.

It should start as an **event-first POS for selected pet expo / cat product sellers**, then expand later into a more general POS for other small businesses.

> MochiPOS helps booth sellers sell fast at events, manage stock accurately, handle Send Later orders, and build customer relationships after the sale.

### 2.2 Beachhead market

- Pet Expo sellers
- Cat product sellers
- Pet merchandise booths
- Small event sellers with stock and Send Later problems

### 2.3 Long-term goal

The product is designed as **General commerce core + optional vertical modules**:

- MochiPOS Pet
- MochiPOS Booth
- MochiPOS Retail
- MochiPOS Beauty
- MochiPOS Joss Paper (potentially)

---

## 3. Core product principle

> **Fast checkout first. Customer relationship later.**

Customer and pet registration must NOT be mandatory during checkout. See § 4 for the architectural rule.

---

## 4. Customer + pet profile strategy

### 4.1 Two connected systems

**A. Seller-facing POS app** (cashier / booth staff)
- fast checkout, product selection, cart, payment, stock deduction, Send Later, receipt
- optional quick phone/nickname capture only

**B. Customer-facing portal** (customers, post-purchase)
- register customer profile + pet profile via QR/link on receipt
- connect order history
- loyalty program, shipping updates, etc. (later)

### 4.2 Recommended customer registration flow

```text
Customer buys product
↓
Cashier completes checkout quickly
↓
System creates order ID / receipt
↓
Receipt shows QR registration link
↓
Customer registers later through mobile web page
↓
Customer profile and pet profile are linked to the order
```

Implementation status: Wave 40a (data layer) + 40b (UI demo) + 40c (cashier returning-customer lookup) all merged. Real Supabase wiring deferred to Wave 40d.

### 4.3 Customer recognition later

Lookup channels: phone, email, Line ID, QR token, customer account, order history. Pet profile becomes valuable after the first purchase, not before checkout.

---

## 5. Strategic positioning

> **Generic POS is transaction-first. MochiPOS is event-first and relationship-ready.**

| Generic POS | MochiPOS |
|---|---|
| transaction-first | event-first |
| normal retail / restaurant | multi-day booth workflow |
| basic inventory | sample / Send Later / event archive |
| basic sales report | post-event archive + QR registration + repeat-customer intelligence |

---

## 6. MVP scope

The MVP must prove:
1. Can MochiPOS help a real seller run one event smoothly?
2. Can MochiPOS collect customer/pet data after purchase without slowing checkout?

### 6.1 Seller-side MVP
Login · Business account · Product setup · SKU setup · Product image upload · Product price/cost · Event setup · Event stock allocation · POS checkout · Payment recording · Send Later · Sample stock · Daily dashboard · Sales history · CSV export · Basic admin approval

### 6.2 Customer portal MVP
QR registration link · Mobile-friendly form · Customer profile · Pet profile · Link customer to order · Consent checkbox · Bilingual EN/TH · Seller dashboard for registered customers

### 6.3 Do not build too early
AI recommendation engine · complex loyalty · full accounting · multi-branch · full tax · complex role matrix · advanced forecasting · subscription billing · heavy marketing automation

> First goal: build a working SaaS MVP that 5 selected sellers can use at one real event.

---

## 7. Tech stack

```text
GitHub        = code storage
Next.js       = app framework
Vercel        = app hosting and deployment
Supabase      = database, authentication, storage, API
Resend        = email sending
Google Auth   = easy login identity
TypeScript    = type safety
Tailwind      = styling
```

---

## 8–13. Stack responsibilities (summary)

- **Vercel** — Hosting, GitHub-driven deploys, preview links per PR, env vars, custom domain.
- **Supabase** — Database + Auth + Storage + API + RLS. Stores businesses, users, products, SKUs, events, stock, orders, payments, Send Later, customers, pet profiles, analytics.
- **Next.js** — Pages, routes, layouts, server actions, API routes, protected pages.
- **TypeScript** — Strict types for Product, Order, OrderItem, Business, Event, StockMovement, Customer, Pet.
- **Tailwind** — POS layout, product cards, buttons, dashboards, mobile portal, admin tables.
- **Resend** — Approval email, invite code email, registration link, receipt email, etc.

### 10.1 Suggested Next.js route structure

```text
/                                 Landing
/request-access                   Seller request form
/admin/applications               Admin approval dashboard
/login                            Seller login
/onboarding                       Business onboarding
/dashboard                        Seller dashboard
/products                         Product setup
/events                           Event setup
/events/[eventId]/pos             Main POS screen
/events/[eventId]/stock           Event stock setup + monitoring
/events/[eventId]/dashboard       Event dashboard
/customer/register/[token]        Customer registration page
/customer/order/[token]           Customer receipt / order link
```

> Current code uses `/app/...` and `/register/[token]` (already shipped). Routes will be reconciled with this convention as Phase 4–5 implementations land.

---

## 14. Google Authentication

### 14.1 Use Google Auth for seller login
- Many sellers already use Gmail
- Reduces password friction
- Trustworthy
- Works well with Supabase Auth

### 14.2 Google Auth answers only "who is this user?"
MochiPOS still answers:
- Which business do they belong to?
- What role do they have?
- Are they approved to use MochiPOS?

> Google Auth is identity, not business permission.

### 14.3 Recommended seller account flow

```text
Seller requests access
↓
Admin reviews seller
↓
Admin approves seller
↓
System creates business account + invite code
↓
Seller receives approval email
↓
Seller clicks "Continue with Google"
↓
Supabase Auth verifies Google account
↓
MochiPOS checks email + invite code
↓
If valid, activate seller account
↓
Seller enters onboarding
```

### 14.4 Pilot stage: invite-only, no open public signup
Public Google-signup is risky during pilot. Use **Google Auth + invite code + manual approval**.

---

## 15. Seller account system

### 15.1 Purpose
Allow selected sellers to securely access MochiPOS using Google authentication while keeping the platform invite-only during pilot.

### 15.2 Database tables

**`businesses`** — id, name, brand_name, category, status, created_at, updated_at
- status: `pending`, `approved`, `suspended`

**`business_members`** — id, business_id, user_id, email, role, status, created_at, updated_at
- role: `owner`, `admin`, `cashier`, `staff`
- status: `invited`, `active`, `disabled`

**`access_requests`** — id, business_name, owner_name, email, phone, line_id, category, number_of_skus, events_per_year, current_pos_method, status
- status: `new`, `approved`, `rejected`, `waitlist`

**`invites`** — id, email, business_id, role, invite_code, status, expires_at
- status: `pending`, `accepted`, `expired`, `cancelled`

> Current schema (`database/schema.sql`) uses `workspaces` / `workspace_members` / `applications` / `invite_codes`. Naming reconciliation pending — same concepts, different field names.

---

## 16. SaaS tenant concept

Every key table includes `business_id` (or `workspace_id` in current code). Supabase RLS enforces:

> Every important data record belongs to one business.

---

## 17–18. Data collection + ownership

### 17.1 What MochiPOS can collect
business name · brand name · product category · SKU · product name · price · cost · sale quantity · timestamp · event name · order amount · payment method · inventory movement · Send Later · customer registration (with consent) · pet profile (with consent)

### 17.2 Mindset
> Seller data is private by default. MochiPOS stores and processes it to operate the service, provide analytics, improve the platform, and create anonymized industry insights.

### 18.1–18.3 Ownership
> The seller owns their business relationship and raw business records. MochiPOS controls the platform database and can use data according to the Terms, Privacy Policy, and agreed purposes.

Admin access is allowed for debugging, support, recovery, fraud, product improvement, analytics, anonymized benchmarking — but limited and **logged**.

---

## 19. Three levels of data use

### Level 1 — Seller's private operational data
products · orders · sales · stock · customers · pet profiles · payment records · event performance
> Only that seller and authorized MochiPOS admin should access.

### Level 2 — MochiPOS product improvement data
feature usage · checkout speed · stock correction frequency · Send Later usage · customer registration conversion · login frequency · error patterns
> Use to improve MochiPOS, disclose in terms.

### Level 3 — Aggregated industry intelligence
average order value by event type · best-selling categories · peak sales hours · stockout frequency · Send Later % · sample-to-sale conversion · event performance benchmark
> Aggregated and anonymized only.

---

## 20. Safe vs risky data use

**Safe**
- "Across 20 pet booth sellers, average order value increased on weekend event days."
- "Your booth's sales were 18% higher than your previous event."
- "Your stockout rate is higher than the average of similar anonymous sellers."

**Risky**
- "Shop A sold 240,000 THB at Pet Expo."
- "Business B is performing worse than Business C."
- "Here is another seller's best-selling SKU and sales volume."

---

## 21. Data policy statement (for terms / privacy policy)

> Your business data remains yours. MochiPOS stores and processes it to operate the service, provide analytics, improve the platform, and produce anonymized industry benchmarks. MochiPOS will not disclose your identifiable business performance to other sellers without permission.

---

## 22. Data fields to collect

### 22.1 Business profile
business_id · business_name · brand_name · owner_name · email · phone · Line ID · business category · sales channel · events per year · main product type

### 22.2 Product / SKU
product_id · business_id · sku · product_name · category · subcategory · price · cost · image_url · active_status

### 22.3 Event
event_id · business_id · event_name · location · start_date · end_date · event_type · booth_size · expected_foot_traffic · status

### 22.4 Sales / order
order_id · business_id · event_id · timestamp · total_amount · discount · payment_method · order_source · take_now_or_send_later · cashier_id

### 22.5 Order item
order_item_id · order_id · product_id · sku · quantity · unit_price · unit_cost · discount · gross_margin

### 22.6 Inventory movement
movement_id · business_id · event_id · product_id · movement_type · quantity · from_bucket · to_bucket · timestamp · staff_id · reason

Movement types: `stock_in`, `sale`, `send_later_reserved`, `sample_created`, `sample_sold`, `gift_given`, `void`, `correction`, `damaged`, `lost`

### 22.7 Customer + pet (post-purchase, with consent)
customer_id · business_id · phone · email · Line ID · consent_status
pet_id · customer_id · pet_name · pet_type · breed · allergy · preference · birthday

---

## 23. Privacy and trust

### 23.1 Personal data
owner name · owner email · phone · Line ID · staff account · customer name · customer phone · customer email · pet-owner profile · delivery info

### 23.2 Onboarding consent

**Required**
```
☑ I agree to the MochiPOS Terms of Service.
☑ I acknowledge the Privacy Notice.
```

**Optional**
```
☐ I agree to receive product updates and marketing messages.
☐ I agree that anonymized and aggregated business data may be used for industry benchmark reports.
```

---

## 24. Admin access control

### 24.1 Admin access should be limited
Even if the founder is solo now, design professionally: admin role · support role · read-only access · audit log · reason for access.

### 24.2 `admin_access_logs` table
id · admin_user_id · business_id · action · reason · created_at

Example actions: `viewed_sales_dashboard`, `exported_order_data`, `viewed_customer_profile`, `changed_business_setting`, `debugged_order_issue`.

> Current schema has `audit_logs` with similar shape. Will be extended to cover platform-admin access.

---

## 25. Analytics system

### 25.1 Seller analytics (visible to each seller)
total sales · sales by event · best-selling SKU · slow-moving products · average order value · gross margin · peak sales hour · Send Later pending · stockout risk · repeat customer rate

### 25.2 Platform analytics (admin only)
seller growth · feature usage · active businesses · order volume · churn risk · Send Later adoption · stock correction rate · customer registration conversion · category trend

### 25.3 Anonymized benchmark table
`industry_benchmarks` — id · category · event_type · period · avg_order_value · avg_daily_sales · avg_stockout_rate · avg_send_later_percentage · customer_registration_rate · sample_size

> Never include identifiable business names in benchmark outputs.

---

## 26. Future data advantage

### 26.1 For sellers
Best-sellers, slow movers, peak event days, peak sales hours, early stockouts, high-margin products, returning customers, active pet profiles, Send Later impact.

### 26.2 For MochiPOS as platform
Fastest-growing categories, best-performing event types, most successful sellers, retention drivers, churn risk, attractive expansion verticals, recurring pain points.

### 26.3 Cross-vertical foundation
Pet-seller data model (event · product · SKU · stock · order · customer · Send Later · sample) shares a foundation with joss paper / other commerce verticals (business · product · SKU · customer · order · stock · payment · timestamp · dashboard). MochiPOS should be built as a general commerce data foundation.

---

## 27. Architecture

### 27.1 High-level

```text
Seller / Customer
↓
MochiPOS Web App (Next.js on Vercel)
↓
Supabase (DB + Auth + Storage + API)
↓
Resend (Email)
```

### 27.2 Dev workflow

```text
Developer / AI agent edits code
↓
Push to GitHub
↓
Vercel preview deployment
↓
Founder tests preview
↓
Merge to main
↓
Production app updates
```

---

## 28. Database core

### 28.1 Account + access
businesses · business_members · access_requests · invites · admin_access_logs

### 28.2 Product + stock
products · product_categories · product_images · warehouse_stock · events · event_stock · sample_stock · inventory_movements

### 28.3 Sales
orders · order_items · payments · send_later_orders · voids · corrections

### 28.4 Customer relationship
customers · customer_contacts · customer_order_links · pets · customer_consents · customer_tags · customer_notes

### 28.5 Analytics
seller_analytics_snapshots · platform_analytics_snapshots · industry_benchmarks · feature_usage_events

---

## 29–30. Founder learning path

The founder is acting as **product owner + business founder + AI-assisted developer**. The goal is not to become a full-time engineer but to understand enough to guide, review, and build MochiPOS correctly with AI agents.

Levels: web basics → Next.js → Supabase → Vercel deployment → SaaS architecture.

**First learning project:** Product Setup module. It teaches Supabase tables, CRUD, image storage, auth, tenant concept, UI, Vercel deploy — all the foundations.

---

## 31. Pilot plan

### 31.1 Pilot target
5 selected sellers who: sell at events regularly · have enough SKUs to feel stock pain · use Send Later/shipping/pre-order · care about customer relationship · willing to give feedback · not too large.

### 31.2 Pilot objective
> Can MochiPOS help a real pet booth seller run one event better than their current method?

### 31.3 Success metrics
Product setup works · event stock setup works · checkout fast at peak · no major lost orders · Send Later queue clear · daily dashboard useful · stock mismatch reduced/explainable · QR registration works · pet profiles registered · seller wants to use MochiPOS again · seller willing to pay.

---

## 32. Pricing hypothesis

### 32.1 Pilot phase
Free or low-cost for one event in exchange for feedback, usage data, anonymized case study, product improvement discussion.

### 32.2 Early paid pricing (event-based likely easier than monthly)
- Starter Event: 490–990 THB / event
- Pro Event: 1,500–2,500 THB / event
- Frequent Seller: 990–1,990 THB / month

---

## 33. Six-month roadmap

| Month | Focus | Key deliverables |
|---|---|---|
| 1 | Foundation | landing · request-access · admin approval · Google Auth · invite code · business account · basic dashboard |
| 2 | Product + event setup | product CRUD · SKU · image upload · event creation · event stock allocation · warehouse foundation |
| 3 | POS + sales | POS screen · cart · checkout · payment · order creation · order items · inventory movement on sale · receipt |
| 4 | Event-specific workflows | Send Later · sample stock · free gift deduction · daily dashboard · stock correction · event archive · CSV export |
| 5 | Customer portal | QR registration · customer profile · pet profile · consent · customer-order linking · seller customer dashboard |
| 6 | Pilot hardening | bug fixes · onboarding guide · admin monitoring · backup/export · RLS review · pilot setup · real event test · feedback collection |

---

## 34. Important product rules for AI agents

| # | Rule |
|---|---|
| 1 | **Do not slow down checkout.** POS must stay fast. Customer/pet registration must be optional and separate. |
| 2 | **Every record must belong to a business.** Every key table uses `business_id` (or `workspace_id`). |
| 3 | **Google Auth is identity, not business permission.** MochiPOS still controls business access, role, approval, invite code, onboarding state. |
| 4 | **Seller data is private by default.** Do not expose raw seller data to other sellers. Aggregated/anonymized only. |
| 5 | **Admin access should be logged.** Admin views/changes of seller data must eventually be recorded. |
| 6 | **Build pilot first, not full enterprise SaaS.** Focus on 5 selected sellers, one real event, fast checkout, stock accuracy, Send Later, customer QR registration. |

---

## 35. AI agent task prompt

See § 35 of the source roadmap document. When briefing a fresh AI agent on MochiPOS, include the principles above plus the priority module list:

1. Access request and admin approval
2. Google Auth + invite code
3. Business account and member roles
4. Product/SKU setup
5. Event setup
6. Event stock allocation
7. Fast POS checkout
8. Send Later order flow
9. Sample stock
10. Daily event dashboard
11. QR customer registration portal
12. Customer and pet profile after purchase
13. Seller analytics
14. Platform analytics foundation

Do not build advanced loyalty, forecasting, billing, or AI recommendations yet.

---

## 36. Final strategic direction

```text
Real booth-tested workflow
↓
Controlled pilot with selected sellers
↓
Event-first SaaS POS
↓
Customer portal and pet profile system
↓
Seller analytics and anonymized benchmarks
↓
Expansion into other verticals
```

> MochiPOS should not only record transactions. It should help sellers understand events, stock, customers, and future growth.

> Collect operational data to help sellers first. Use aggregated and anonymized data to learn the industry second.
