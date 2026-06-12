# Graph Report - Ekantah Email templates  (2026-06-12)

## Corpus Check
- 186 files · ~274,319 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 937 nodes · 1756 edges · 63 communities (38 shown, 25 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89840ec4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 63 edges
2. `useHaptic()` - 32 edges
3. `EmailTheme` - 24 edges
4. `Ekantah Feature Roadmap` - 21 edges
5. `getUserFromToken()` - 20 edges
6. `getState()` - 16 edges
7. `scripts` - 16 edges
8. `compilerOptions` - 16 edges
9. `useToast()` - 15 edges
10. `formatDate()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `getUserFromToken()`  [INFERRED]
  app/api/push/send/route.ts → lib/auth.ts
- `POST()` --calls--> `sendBookingWhatsApp()`  [INFERRED]
  app/api/whatsapp/send/route.ts → lib/whatsapp.ts
- `BookingDetailPage()` --calls--> `useToast()`  [INFERRED]
  app/dashboard/booking/[id]/page.tsx → components/ui/toast.tsx
- `ExpenseForm()` --calls--> `useToast()`  [EXTRACTED]
  app/dashboard/expenses/page.tsx → components/ui/toast.tsx
- `DashboardPage()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/page.tsx → lib/utils.ts

## Import Cycles
- 1-file cycle: `send_booking_confirmation.py -> send_booking_confirmation.py`

## Hyperedges (group relationships)
- **PMS Core Foundation (Rooms, Bookings, Guests, Payments)** — feature_roadmap_room_inventory_model, feature_roadmap_booking_lifecycle, feature_roadmap_guest_master_record, feature_roadmap_payment_ledger [EXTRACTED 1.00]
- **Guest Experience Pipeline (Journey, Upsells, Loyalty, Digital Check-In)** — feature_roadmap_guest_journey_automation, feature_roadmap_upsells, feature_roadmap_loyalty_program, feature_roadmap_digital_checkin [INFERRED 0.85]
- **PWA Icon Set (App Icons + Touch Icon + Favicon)** — public_icons_pwa_app_icons, public_apple_touch_icon, public_favicon [EXTRACTED 1.00]

## Communities (63 total, 25 thin omitted)

### Community 0 - "Email Template Components"
Cohesion: 0.08
Nodes (48): AmountRow(), AmountRowProps, ContactBlock(), ContactBlockProps, CTAButton(), CTAButtonProps, DataRow(), DataRowProps (+40 more)

### Community 1 - "Email and PDF Generation"
Cohesion: 0.06
Nodes (51): POST(), SalarySlipEmail(), POST(), GET(), renderEmailHtml(), renderBookingPdfHtml(), renderSalarySlipPdfHtml(), SalarySlipPdfData (+43 more)

### Community 2 - "Additional Sales and Guest Extras"
Cohesion: 0.06
Nodes (33): AdditionalSale, AdditionalSalesPage(), fmtCurrency(), GUEST_TYPE_OPTIONS, PAYMENT_OPTIONS, SALE_TYPE_OPTIONS, CATEGORY_LABELS, CATEGORY_OPTIONS (+25 more)

### Community 3 - "Authentication and User Management"
Cohesion: 0.07
Nodes (48): POST(), clearAuthCookies(), POST(), prisma, setAuthCookies(), DELETE(), GET(), PATCH() (+40 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, bcryptjs, class-variance-authority, clsx, date-fns, eslint, eslint-config-next, file-saver (+38 more)

### Community 5 - "Scheduled Jobs and Cron System"
Cohesion: 0.07
Nodes (30): BookingActionsProps, CRON_JOBS, getJobFn(), POST(), adminDigestJob, checkoutReminderJob, preArrivalReminderJob, getAdminWhatsAppGroupId() (+22 more)

### Community 6 - "Booking Wizard and Creation"
Cohesion: 0.17
Nodes (13): Props, RoomAllocation, MEAL_OPTIONS, Props, ROOM_TYPES, RoomAllocation, StayStep(), TIME_OPTIONS (+5 more)

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
Nodes (16): AdditionalSaleCreateInput, AdditionalSaleUpdateInput, authAdminUserSchema, authSchema, BookingCreateInput, BookingUpdateInput, EmployeeCreateInput, EmployeeUpdateInput (+8 more)

### Community 11 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "App Layout and PWA"
Cohesion: 0.11
Nodes (19): Booking, BookingDetailPage(), EmailSent, WhatsAppMessage, DeviceType, InstallPage(), BeforeInstallPromptEvent, HapticPattern (+11 more)

### Community 13 - "Dashboard Overview"
Cohesion: 0.32
Nodes (7): KpiCard(), ModuleCard(), AnalyticsData, BookingStats, DashboardPage(), StatCard(), MagicCard()

### Community 14 - "Salary and Payroll"
Cohesion: 0.06
Nodes (33): 1.1 Room & Inventory Model, 1.2 Booking Lifecycle, 1.3 Guest Master Record, 1.4 Payment Ledger, 1.5 GST & Tax Compliance (India), 2.1 Housekeeping & Maintenance, 2.2 Staff & Access Control, 2.3 Digital Check-In / Check-Out (+25 more)

### Community 15 - "Booking Detail Page"
Cohesion: 0.10
Nodes (24): metadata, outfit, plusJakartaSans, RootLayout(), spaceMono, viewport, getThemeCssVariablesString(), ThemeColors (+16 more)

### Community 16 - "Cron Job Monitor UI"
Cohesion: 0.38
Nodes (6): CronJobDef, CronRunItem, CronsPage(), formatDuration(), HistoryResponse, statusBadge()

### Community 18 - "Public Pages and Auth UI"
Cohesion: 0.12
Nodes (9): bufferToBase64Url(), credentialToJSON(), usePasskeys(), LoginPage(), FlipText(), FlipTextProps, ShineBorder(), ShineBorderProps (+1 more)

### Community 19 - "Bookings API"
Cohesion: 0.18
Nodes (11): generateBookingId(), PATCH(), POST(), formatLog(), log(), LogEntry, logger, LogLevel (+3 more)

### Community 20 - "Dashboard Navigation"
Cohesion: 0.18
Nodes (12): DashboardLayout(), navItems, useScrollDirection(), PullToRefresh(), PullToRefreshProps, quickActions, QuickAddFAB(), Drawer() (+4 more)

### Community 21 - "Booking Actions and UI Utilities"
Cohesion: 0.09
Nodes (25): cn(), AnimatedGradientText(), AnimatedGradientTextProps, AnimatedShinyText(), DotPattern(), DotPatternProps, Meteors(), MeteorsProps (+17 more)

### Community 22 - "Salary Validation Schemas"
Cohesion: 0.22
Nodes (4): employeeCreateSchema, employeeUpdateSchema, salarySlipCreateSchema, salarySlipUpdateSchema

### Community 24 - "Calendar Analytics"
Cohesion: 0.11
Nodes (25): CalendarGrid(), CalendarGridProps, CalendarLegend(), WEEKDAYS, BookingInfo, BookingMiniCard(), DayCell(), DayCellProps (+17 more)

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (16): useOfflineMutation(), useOfflineQueue(), clearFailedMutations(), enqueueMutation(), getAllMutations(), getPendingMutations(), openDB(), processQueue() (+8 more)

### Community 50 - "Community 50"
Cohesion: 0.15
Nodes (11): SaleForm(), BookingWizard(), RoomAllocation, Step, stepMeta, BookingsPage(), BorderBeam(), BorderBeamProps (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.19
Nodes (10): BookingStep, bookingStepMeta, CATEGORIES, QuickAddDrawerProps, RoomAllocation, PaymentStep(), Props, Dialog() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (5): Guest, GuestDetail, STATUS_STYLES, StatusBadge(), StatusBadgeProps

### Community 53 - "Community 53"
Cohesion: 0.24
Nodes (8): Booking, BookingCard(), Stats, useLongPress(), NumberTicker(), NumberTickerProps, SmartLink(), SmartLinkProps

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (5): Ripple(), RippleItem, RippleProps, GuestStep(), Props

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (5): Toast, ToastContext, ToastContextValue, ToastProvider(), ToastType

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): Booking confirmation, Notes, Required placeholders, Send an email, The Stream by Ekantah Email Templates

## Knowledge Gaps
- **313 isolated node(s):** `prisma`, `prisma`, `prisma`, `CRON_JOBS`, `DEMO_BOOKING` (+308 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDate()` connect `Scheduled Jobs and Cron System` to `Email Template Components`, `Email and PDF Generation`, `App Layout and PWA`, `Dashboard Overview`, `Cron Job Monitor UI`, `Community 52`, `Community 53`, `Booking Actions and UI Utilities`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `cn()` connect `Booking Actions and UI Utilities` to `Booking Wizard and Creation`, `App Layout and PWA`, `Dashboard Overview`, `Booking Detail Page`, `Community 50`, `Public Pages and Auth UI`, `Community 51`, `Dashboard Navigation`, `Community 54`, `Community 55`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Path` connect `Legacy Email Sender` to `Email and PDF Generation`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `prisma` to the rest of the system?**
  _318 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Email Template Components` be split into smaller, more focused modules?**
  _Cohesion score 0.081377151799687 - nodes in this community are weakly interconnected._
- **Should `Email and PDF Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.06126126126126126 - nodes in this community are weakly interconnected._
- **Should `Additional Sales and Guest Extras` be split into smaller, more focused modules?**
  _Cohesion score 0.05990338164251208 - nodes in this community are weakly interconnected._