# Ekantah — Feature Roadmap & Business Enhancement Plan

> A living document of identified gaps, recommended features, and strategic business improvements for The Stream by Ekantah property management system.

---

## Phase 0: Critical Fixes (Do First)

These are non-negotiable before scaling or putting real guest data into production.

| # | Feature | Why | Files Affected |
|---|---------|-----|--------------|
| 0.1 | **Input Validation (Zod)** | All API routes accept raw JSON without schema checks. Malformed payloads crash routes or write bad data. | `app/api/**/*.route.ts` |
| 0.2 | **Prisma Enums** | `status`, `paymentStatus`, and `roomType` are plain strings with no DB constraint. Typos silently corrupt data. | `prisma/schema.prisma` |
| 0.3 | **Rate Limiting** | Auth, email, and WhatsApp endpoints are open to brute-force and spam. | `middleware.ts`, API routes |
| 0.4 | **Gitignore WhatsApp Session Keys** | `whatsapp_auth/` contains active session credentials and is currently tracked in git. | `.gitignore` |
| 0.5 | **Environment Validation** | Missing `DATABASE_URL` or `AUTH_SECRET` causes cryptic runtime crashes. Validate at boot. | `lib/env.ts` (new) |
| 0.6 | **Date Type Migration** | `checkInDate` and `checkOutDate` are stored as `String`. This breaks date math, sorting, and indexing. | `prisma/schema.prisma`, migration |
| 0.7 | **Structured Error Logging** | Replace scattered `console.log` with a logger. Add a `/api/health` endpoint for uptime monitoring. | Global |
| 0.8 | **Pagination + Search** | Booking list loads *all* rows into memory. Will fail at scale. | `app/dashboard/page.tsx` |

---

## Phase 1: Core PMS Foundation (Weeks 1–3)

Transform the email-template app into a real Property Management System.

### 1.1 Room & Inventory Model
- **Room Master** — `Room` table with `roomNumber`, `type`, `floor`, `maxOccupancy`, `status` (active / maintenance).
- **Inventory Count** — A `PropertyConfig` table storing total rooms per type so the system knows physical limits.
- **Real Availability Engine** — Query overlapping bookings for a date range and block creation if `roomsRequested > roomsAvailable`.

### 1.2 Booking Lifecycle
- **Edit Booking** — PATCH should support updating dates, rooms, amounts, and guest details (with re-calculation of balance).
- **Overbooking Guard** — Hard stop at booking creation if inventory is exhausted.
- **Duplicate Detection** — Warn if same name + phone + check-in date already exists within 24 hours.
- **Soft Delete / Archive** — Don't `DELETE` bookings; mark them `archived` for audit trails.

### 1.3 Guest Master Record
- **Guest Profile** — `Guest` table with name, phone, email, ID details, and preferences. Link `Booking` → `Guest` via `guestId`.
- **Guest History View** — Show all past stays, total revenue, average stay length, and preferred room type on the guest detail page.
- **Repeat Guest Detection** — Auto-link bookings by phone/email and surface a "Returning Guest" badge.

### 1.4 Payment Ledger
- **Payment Table** — `Payment` model: `bookingId`, `amount`, `method` (UPI / card / cash / bank-transfer), `date`, `referenceNumber`, `recordedBy`.
- **Partial Payments** — Support multiple payments per booking. Auto-compute `balanceDue` = `totalAmount - SUM(payments)`.
- **Refund Tracking** — Store refund amount, reason, and date on the payment ledger.
- **Formal Receipt** — Generate a tax-compliant PDF receipt (not just the confirmation email) with GST breakdown.

### 1.5 GST & Tax Compliance (India)
- **GST Calculation** — Auto-compute CGST/SGST or IGST based on intra-state vs inter-state. Store `gstRate`, `cgstAmount`, `sgstAmount` on booking.
- **HSN Code** — Accommodation services HSN (996311) embedded in receipts.
- **Monthly GSTR Report Export** — CSV export of taxable value and GST per month for filing.

---

## Phase 2: Operations & Staff Tools (Weeks 3–6)

### 2.1 Housekeeping & Maintenance
- **Room Status Board** — Kanban view: `clean`, `dirty`, `inspected`, `maintenance`. Staff updates status via mobile-friendly page.
- **Turnover Scheduling** — Auto-assign checkout rooms to housekeeping staff based on check-out time.
- **Maintenance Tickets** — Raise repair tickets per room with photo upload, priority, and resolution tracking.
- **Amenity Inventory** — Track consumables (toiletries, linen, minibar). Alert when stock is low.

### 2.2 Staff & Access Control
- **Role-Based Access** — Roles: `admin`, `manager`, `front_desk`, `housekeeping`, `accountant`.
- **Audit Log** — Every create, edit, payment, email, WhatsApp send is logged with `userId`, `timestamp`, `oldValue → newValue`.
- **Shift Handover Notes** — A shared notepad per shift visible to the next staff member.

### 2.3 Digital Check-In / Check-Out
- **Pre-Arrival Form** — Send a link 24h before check-in for guests to upload ID, expected arrival time, and special requests.
- **Digital Check-In** — Staff marks actual check-in time, captures digital signature or ID scan. Updates `actualCheckIn`.
- **Express Checkout** — Guest settles balance via UPI link. Staff marks `actualCheckOut`. Auto-triggers post-stay email.

### 2.4 Upsells & Ancillary Revenue
- **Upsell Catalog** — Early check-in, late checkout, room upgrade, extra bed, crib, airport pickup, guided tours, bonfire.
- **Upsell Booking** — Add to an existing booking as line items. Track ancillary revenue separately.
- **In-Stay Ordering** — Room service / F&B menu. Guest orders via WhatsApp or a simple web form linked to the room.

---

## Phase 3: Marketing, Guest Experience & Loyalty (Weeks 6–10)

### 3.1 Guest Journey Automation
Replace ad-hoc emails with a structured journey:

| Trigger | Timing | Channel | Content |
|---------|--------|---------|---------|
| Booking confirmed | Immediate | Email + WhatsApp | Confirmation + payment link |
| Payment received | Immediate | WhatsApp | Receipt + thank you |
| Pre-arrival | T-1 day | WhatsApp | Directions, weather, check-in time, pre-check-in link |
| Welcome | Check-in | WhatsApp | Wi-Fi password, house rules, upsell menu |
| During stay | Day 2 | WhatsApp | "How is your stay?" feedback pulse |
| Checkout reminder | T-12 hours | WhatsApp | Checkout time, settle dues |
| Post-stay | T+1 day | Email + WhatsApp | Google Review link + offer for next booking |
| Birthday / Anniversary | Annual | Email | Special discount code |

### 3.2 Bulk Communication & Campaigns
- **Guest Segments** — Filter by: returning guests, high spenders, last stay > 6 months, cancelled bookings.
- **Campaign Builder** — Compose a seasonal offer, select a segment, schedule send (email + WhatsApp).
- **Template Editor** — WYSIWYG or markdown editor for non-technical staff to edit email/WhatsApp templates without touching React code.

### 3.3 Review Management
- **Review Request Sequence** — Automated post-stay request. If no response in 3 days, send a gentle reminder.
- **Review Dashboard** — Aggregate Google Reviews (via API if possible) and internal feedback.
- **NPS Tracking** — Ask "How likely are you to recommend us?" during stay and post-stay. Track score over time.

### 3.4 Loyalty Program
- **Points System** — ₹100 spent = 1 point. Redeemable for discounts or upsells.
- **Tier Levels** — Silver / Gold / Platinum based on nights or revenue. Auto-apply perks (free late checkout, welcome drink).
- **Referral Program** — Unique referral code per guest. Both parties get a discount on next booking.

---

## Phase 4: Distribution & Revenue Management (Weeks 10–14)

### 4.1 OTA Channel Management
- **Channel Master** — Booking.com, Airbnb, MakeMyTrip, Agoda, Goibibo.
- **Channel Mapping** — Map OTA room types to internal room types.
- **Inventory Sync** — When a booking is created internally, reduce availability pushed to OTAs. (Requires iCal or API integration.)
- **Rate Parity Monitor** — Alert if OTA price differs from direct booking price.

### 4.2 Commission Tracking
- **Commission Ledger** — Per booking, record source channel and commission %/amount.
- **Net Revenue Report** — Revenue minus commissions, payment gateway fees, and refunds.
- **Channel Performance** — Which channel brings highest revenue, lowest cancellation rate, highest ADR.

### 4.3 Dynamic Pricing (Yield Management)
- **Base Price Rules** — Set base price per room type per season.
- **Occupancy-Based Multiplier** — Auto-increase price when occupancy > 80% for a given date range.
- **Lead-Time Discount** — Early bird (book 30+ days ahead) and last-minute (book within 48h) pricing rules.
- **Event / Holiday Surge** — Mark local events (e.g., Rishikesh festivals) and auto-apply surge multiplier.
- **Competitor Price Scraping** *(advanced)* — Track 3–5 competitor properties' prices nightly.

### 4.4 Corporate & B2B
- **Corporate Accounts** — Company profiles with negotiated rates, credit limit, and monthly invoicing.
- **Group Bookings** — Block multiple rooms under one group master booking with a group leader.
- **Agent Commission** — Track travel agent bookings and auto-calculate commission payable.

---

## Phase 5: Advanced Business Intelligence (Weeks 14–18)

### 5.1 Enhanced Reporting
- **Profit & Loss (P&L) View** — Revenue vs operational costs (staff, utilities, maintenance, commissions).
- **ADR & RevPAR** — Average Daily Rate and Revenue Per Available Room (requires total room inventory).
- **Cancellation Analysis** — Cancellation rate by channel, lead time, and room type.
- **Guest Demographics** — Origin city, repeat rate, booking lead time distribution.
- **Custom Report Builder** — Pick dimensions and metrics, download as Excel.

### 5.2 Forecasting
- **Demand Forecast** — ML-based or simple moving-average prediction of bookings for next 30/60/90 days.
- **Revenue Forecast** — Projected revenue based on current bookings + historical pickup rates.
- **Staffing Recommendations** — Suggest housekeeping and F&B staffing based on projected occupancy.

### 5.3 Accounting Integrations
- **QuickBooks / Tally / Zoho Books Sync** — Push invoices, payments, and expenses to accounting software.
- **Expense Tracking** — Record operational expenses (salaries, utilities, supplies) to compute net profit.

---

## Phase 6: Guest Self-Service & Tech Stack Modernization (Ongoing)

### 6.1 Guest Portal
- **My Booking Page** — Guest can view booking details, pay balance, request changes, and download receipt via a secure link.
- **Self Check-In** — Upload ID, sign terms, and get room info before arrival.
- **Feedback Form** — Post-stay internal survey (cleanliness, staff, food, value).

### 6.2 Smart Integrations
- **Smart Locks** — Generate digital keys that activate at check-in time and expire at check-out (e.g., August, Yale).
- **WhatsApp Business API** — Migrate from Baileys (personal) to official API for reliability, templates, and analytics.
- **Payment Gateway** — Integrate Razorpay / Stripe for instant payment links, UPI, and auto-reconciliation.
- **Google Calendar / iCal Sync** — Push bookings to owner/staff calendars.

### 6.3 Multi-Property Support
- **Property Switcher** — Dashboard dropdown to switch between "The Stream" and future properties.
- **Consolidated Reporting** — Group-level P&L, occupancy, and revenue across all properties.
- **Centralized Inventory** — Manage all properties from a single admin account.

---

## Quick Reference: Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add `Room`, `Guest`, `Payment`, `PropertyConfig`, `Upsell`, `AuditLog`, `StaffUser` models. Convert date strings to `DateTime`. |
| `lib/env.ts` | Create | Validate `process.env` at startup with Zod. Fail fast if required vars are missing. |
| `lib/validation.ts` | Create | Shared Zod schemas for all API payloads. |
| `app/api/availability/route.ts` | Create | Query free rooms for a date range. |
| `app/api/payments/route.ts` | Create | CRUD for payment ledger entries. |
| `app/api/guests/route.ts` | Create | Guest master record API. |
| `app/dashboard/guests/page.tsx` | Create | Guest directory with search and history. |
| `app/dashboard/housekeeping/page.tsx` | Create | Room status board for housekeeping staff. |
| `app/dashboard/reports/page.tsx` | Create | Advanced report builder and export. |
| `app/dashboard/settings/page.tsx` | Create | Property config, room types, tax rates, staff users. |
| `components/ui/toast.tsx` | Create | Replace all `alert()` calls with a proper toast notification system. |
| `jobs/cron-runner.ts` | Modify / Replace | Move to a reliable queue (e.g., QStash, Inngest, or BullMQ) with retry, idempotency, and failure alerting. |

---

## Success Metrics to Track

Implement a simple KPI dashboard to measure the impact of each phase:

1. **Operational Efficiency** — Average time to create a booking, time to check-in a guest, housekeeping turnaround time.
2. **Revenue** — ADR, RevPAR, ancillary revenue as % of total revenue, direct booking ratio vs OTA.
3. **Guest Satisfaction** — NPS score, review response rate, repeat guest rate.
4. **Financial Health** — Collection rate (% of revenue collected), cancellation rate, commission cost as % of revenue.

---

*Last updated: June 2026*
