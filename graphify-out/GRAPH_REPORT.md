# Graph Report - .  (2026-06-10)

## Corpus Check
- 151 files · ~76,528 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 718 nodes · 1240 edges · 49 communities (27 shown, 22 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Email Template Components|Email Template Components]]
- [[_COMMUNITY_Email and PDF Generation|Email and PDF Generation]]
- [[_COMMUNITY_Additional Sales and Guest Extras|Additional Sales and Guest Extras]]
- [[_COMMUNITY_Authentication and User Management|Authentication and User Management]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Scheduled Jobs and Cron System|Scheduled Jobs and Cron System]]
- [[_COMMUNITY_Booking Wizard and Creation|Booking Wizard and Creation]]
- [[_COMMUNITY_Build and Config Tools|Build and Config Tools]]
- [[_COMMUNITY_Feature Roadmap and Planning|Feature Roadmap and Planning]]
- [[_COMMUNITY_Legacy Email Sender|Legacy Email Sender]]
- [[_COMMUNITY_API Validation and GSTR Reports|API Validation and GSTR Reports]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_App Layout and PWA|App Layout and PWA]]
- [[_COMMUNITY_Dashboard Overview|Dashboard Overview]]
- [[_COMMUNITY_Salary and Payroll|Salary and Payroll]]
- [[_COMMUNITY_Booking Detail Page|Booking Detail Page]]
- [[_COMMUNITY_Cron Job Monitor UI|Cron Job Monitor UI]]
- [[_COMMUNITY_Analytics and Availability APIs|Analytics and Availability APIs]]
- [[_COMMUNITY_Public Pages and Auth UI|Public Pages and Auth UI]]
- [[_COMMUNITY_Bookings API|Bookings API]]
- [[_COMMUNITY_Dashboard Navigation|Dashboard Navigation]]
- [[_COMMUNITY_Booking Actions and UI Utilities|Booking Actions and UI Utilities]]
- [[_COMMUNITY_Salary Validation Schemas|Salary Validation Schemas]]
- [[_COMMUNITY_Additional Sales API|Additional Sales API]]
- [[_COMMUNITY_Calendar Analytics|Calendar Analytics]]
- [[_COMMUNITY_Expenses API|Expenses API]]
- [[_COMMUNITY_Analytics Reports UI|Analytics Reports UI]]
- [[_COMMUNITY_Guests API|Guests API]]
- [[_COMMUNITY_Revenue Analytics|Revenue Analytics]]
- [[_COMMUNITY_Occupancy Analytics|Occupancy Analytics]]
- [[_COMMUNITY_WhatsApp Config API|WhatsApp Config API]]
- [[_COMMUNITY_Environment Config|Environment Config]]
- [[_COMMUNITY_Payments API|Payments API]]
- [[_COMMUNITY_WhatsApp Setup UI|WhatsApp Setup UI]]
- [[_COMMUNITY_PWA Service Worker|PWA Service Worker]]
- [[_COMMUNITY_Database Health Check|Database Health Check]]
- [[_COMMUNITY_Database Seeding|Database Seeding]]
- [[_COMMUNITY_PDF Export Types|PDF Export Types]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_Preview Email Route|Preview Email Route]]
- [[_COMMUNITY_CSS Build Config|CSS Build Config]]
- [[_COMMUNITY_PWA Assets|PWA Assets]]
- [[_COMMUNITY_Apple Touch Icon|Apple Touch Icon]]
- [[_COMMUNITY_Favicon|Favicon]]

## God Nodes (most connected - your core abstractions)
1. `EmailTheme` - 24 edges
2. `Ekantah Feature Roadmap` - 21 edges
3. `cn()` - 16 edges
4. `getState()` - 16 edges
5. `scripts` - 16 edges
6. `compilerOptions` - 16 edges
7. `formatDate()` - 14 edges
8. `sendBookingWhatsApp()` - 14 edges
9. `sendEmail()` - 13 edges
10. `useHaptic()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `sendBookingWhatsApp()`  [EXTRACTED]
  app/api/whatsapp/send/route.ts → lib/whatsapp.ts
- `DashboardLayout()` --calls--> `useHaptic()`  [EXTRACTED]
  app/dashboard/layout.tsx → lib/pwa-hooks.ts
- `SkeletonPulse()` --calls--> `cn()`  [EXTRACTED]
  components/pwa/skeleton.tsx → lib/utils.ts
- `The Stream — 5-Room Boutique River Stay` --conceptually_related_to--> `Ekantah Feature Roadmap`  [INFERRED]
  thestream.md → FEATURE_ROADMAP.md
- `GET()` --calls--> `getUserFromToken()`  [EXTRACTED]
  app/api/auth/me/route.ts → lib/auth.ts

## Import Cycles
- 1-file cycle: `send_booking_confirmation.py -> send_booking_confirmation.py`

## Hyperedges (group relationships)
- **PMS Core Foundation (Rooms, Bookings, Guests, Payments)** — feature_roadmap_room_inventory_model, feature_roadmap_booking_lifecycle, feature_roadmap_guest_master_record, feature_roadmap_payment_ledger [EXTRACTED 1.00]
- **Guest Experience Pipeline (Journey, Upsells, Loyalty, Digital Check-In)** — feature_roadmap_guest_journey_automation, feature_roadmap_upsells, feature_roadmap_loyalty_program, feature_roadmap_digital_checkin [INFERRED 0.85]
- **PWA Icon Set (App Icons + Touch Icon + Favicon)** — public_icons_pwa_app_icons, public_apple_touch_icon, public_favicon [EXTRACTED 1.00]

## Communities (49 total, 22 thin omitted)

### Community 0 - "Email Template Components"
Cohesion: 0.08
Nodes (48): AmountRow(), AmountRowProps, ContactBlock(), ContactBlockProps, CTAButton(), CTAButtonProps, DataRow(), DataRowProps (+40 more)

### Community 1 - "Email and PDF Generation"
Cohesion: 0.09
Nodes (50): SalarySlipEmail(), GET(), EmailType, renderEmailHtml(), renderBookingPdfHtml(), renderSalarySlipPdfHtml(), SalarySlipPdfData, disconnectWhatsApp() (+42 more)

### Community 2 - "Additional Sales and Guest Extras"
Cohesion: 0.05
Nodes (32): AdditionalSale, AdditionalSalesPage(), fmtCurrency(), GUEST_TYPE_OPTIONS, PAYMENT_OPTIONS, SALE_TYPE_OPTIONS, SaleForm(), Booking (+24 more)

### Community 3 - "Authentication and User Management"
Cohesion: 0.08
Nodes (38): clearAuthCookies(), POST(), prisma, setAuthCookies(), DELETE(), GET(), PATCH(), prisma (+30 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.05
Nodes (41): dependencies, bcryptjs, class-variance-authority, clsx, date-fns, eslint, eslint-config-next, file-saver (+33 more)

### Community 5 - "Scheduled Jobs and Cron System"
Cohesion: 0.11
Nodes (27): CRON_JOBS, getJobFn(), POST(), adminDigestJob, checkoutReminderJob, preArrivalReminderJob, getAdminWhatsAppGroupId(), getTodayRange() (+19 more)

### Community 6 - "Booking Wizard and Creation"
Cohesion: 0.10
Nodes (25): BookingWizard(), RoomAllocation, Step, stepMeta, GuestStep(), Props, PaymentStep(), Props (+17 more)

### Community 7 - "Build and Config Tools"
Cohesion: 0.06
Nodes (32): author, description, devDependencies, concurrently, dotenv-cli, esbuild, @serwist/turbopack, tsx (+24 more)

### Community 8 - "Feature Roadmap and Planning"
Cohesion: 0.09
Nodes (26): Booking Lifecycle Management, Advanced Business Intelligence, Date Type Migration (String to DateTime), Digital Check-In / Check-Out, Dynamic Pricing / Yield Management, Ekantah Feature Roadmap, Environment Variable Validation, GST & Tax Compliance (India) (+18 more)

### Community 9 - "Legacy Email Sender"
Cohesion: 0.19
Nodes (20): date, Decimal, path, EmailMessage, Path, build_message(), calculate_nights(), collect_booking_details() (+12 more)

### Community 10 - "API Validation and GSTR Reports"
Cohesion: 0.11
Nodes (16): AdditionalSaleCreateInput, AdditionalSaleUpdateInput, authSchema, BookingCreateInput, BookingUpdateInput, EmployeeCreateInput, EmployeeUpdateInput, ExpenseCreateInput (+8 more)

### Community 11 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "App Layout and PWA"
Cohesion: 0.18
Nodes (12): inter, metadata, viewport, BeforeInstallPromptEvent, HapticPattern, useHaptic(), useInstallPrompt(), useNetworkState() (+4 more)

### Community 13 - "Dashboard Overview"
Cohesion: 0.13
Nodes (7): KpiCard(), ModuleCard(), AnalyticsData, BookingStats, StatCard(), DashboardSkeleton(), SkeletonPulse()

### Community 14 - "Salary and Payroll"
Cohesion: 0.16
Nodes (15): EmployeeForm(), Employee, fmtCurrency(), fmtDate(), METHOD_LABELS, MONTH_NAMES, SalaryPage(), SalarySlip (+7 more)

### Community 15 - "Booking Detail Page"
Cohesion: 0.11
Nodes (3): Booking, EmailSent, WhatsAppMessage

### Community 16 - "Cron Job Monitor UI"
Cohesion: 0.19
Nodes (14): CronJobDef, CronRunItem, CronsPage(), formatDuration(), HistoryResponse, statusBadge(), CATEGORIES, MEAL_PLANS (+6 more)

### Community 19 - "Bookings API"
Cohesion: 0.18
Nodes (11): generateBookingId(), PATCH(), POST(), formatLog(), log(), LogEntry, logger, LogLevel (+3 more)

### Community 20 - "Dashboard Navigation"
Cohesion: 0.18
Nodes (9): DashboardLayout(), dockItems, navItems, PullToRefresh(), PullToRefreshProps, quickActions, QuickAddFAB(), QuickAddDrawer() (+1 more)

### Community 21 - "Booking Actions and UI Utilities"
Cohesion: 0.24
Nodes (7): BookingActionsProps, cn(), MagicCard(), MobileBottomNav(), MobileBottomNavProps, NavButton(), NavItem

### Community 22 - "Salary Validation Schemas"
Cohesion: 0.22
Nodes (4): employeeCreateSchema, employeeUpdateSchema, salarySlipCreateSchema, salarySlipUpdateSchema

### Community 24 - "Calendar Analytics"
Cohesion: 0.29
Nodes (4): CalendarResponse, DayData, MONTH_NAMES, WEEKDAYS

## Knowledge Gaps
- **242 isolated node(s):** `prisma`, `prisma`, `prisma`, `CRON_JOBS`, `DEMO_BOOKING` (+237 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDate()` connect `Scheduled Jobs and Cron System` to `Email Template Components`, `Email and PDF Generation`, `Additional Sales and Guest Extras`, `Dashboard Overview`, `Booking Detail Page`, `Cron Job Monitor UI`, `Booking Actions and UI Utilities`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Additional Sales and Guest Extras` to `Cron Job Monitor UI`, `Dashboard Navigation`, `Booking Wizard and Creation`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Path` connect `Legacy Email Sender` to `Email and PDF Generation`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `prisma` to the rest of the system?**
  _247 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Email Template Components` be split into smaller, more focused modules?**
  _Cohesion score 0.081377151799687 - nodes in this community are weakly interconnected._
- **Should `Email and PDF Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.0853302162478083 - nodes in this community are weakly interconnected._
- **Should `Additional Sales and Guest Extras` be split into smaller, more focused modules?**
  _Cohesion score 0.053544494720965306 - nodes in this community are weakly interconnected._