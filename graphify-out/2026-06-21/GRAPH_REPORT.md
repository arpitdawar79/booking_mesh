# Graph Report - Ekantah Email templates  (2026-06-21)

## Corpus Check
- 202 files · ~283,759 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1037 nodes · 1985 edges · 77 communities (41 shown, 36 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9d29dc3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_WhatsApp Integration and PDF|WhatsApp Integration and PDF]]
- [[_COMMUNITY_Bookings and Cron|Bookings and Cron]]
- [[_COMMUNITY_Email Template Components|Email Template Components]]
- [[_COMMUNITY_Authentication and Push APIs|Authentication and Push APIs]]
- [[_COMMUNITY_Dashboard UI and Stats|Dashboard UI and Stats]]
- [[_COMMUNITY_NPM Packages and Dependencies|NPM Packages and Dependencies]]
- [[_COMMUNITY_Additional Sales UI|Additional Sales UI]]
- [[_COMMUNITY_Configuration and Dev Tooling|Configuration and Dev Tooling]]
- [[_COMMUNITY_Design System and Utilities|Design System and Utilities]]
- [[_COMMUNITY_Product Roadmap and GST|Product Roadmap and GST]]
- [[_COMMUNITY_Auth Pages and Passkeys|Auth Pages and Passkeys]]
- [[_COMMUNITY_Calendar and Booking Analytics|Calendar and Booking Analytics]]
- [[_COMMUNITY_Campaigns and Validation|Campaigns and Validation]]
- [[_COMMUNITY_Development Features Roadmap|Development Features Roadmap]]
- [[_COMMUNITY_Layout and Theme Config|Layout and Theme Config]]
- [[_COMMUNITY_Drawer Crons Booking|Drawer Crons Booking]]
- [[_COMMUNITY_Send Booking Confirmation|Send Booking Confirmation]]
- [[_COMMUNITY_Get Stats Login|Get Stats Login]]
- [[_COMMUNITY_Tsconfig Compileroptions Paths|Tsconfig Compileroptions Paths]]
- [[_COMMUNITY_Toast Bookings Smart|Toast Bookings Smart]]
- [[_COMMUNITY_Dashboard Layout Mobile|Dashboard Layout Mobile]]
- [[_COMMUNITY_Offline Queue Hooks|Offline Queue Hooks]]
- [[_COMMUNITY_Steps Stay Step|Steps Stay Step]]
- [[_COMMUNITY_Pwa Hooks Install|Pwa Hooks Install]]
- [[_COMMUNITY_Bookings Booking Wizard|Bookings Booking Wizard]]
- [[_COMMUNITY_Memory Scripts Temporal|Memory Scripts Temporal]]
- [[_COMMUNITY_Salary Validation Employeecreateschema|Salary Validation Employeecreateschema]]
- [[_COMMUNITY_Quick Add Drawer|Quick Add Drawer]]
- [[_COMMUNITY_Additional Sales Validation|Additional Sales Validation]]
- [[_COMMUNITY_Expenses Validation Delete|Expenses Validation Delete]]
- [[_COMMUNITY_Analytics Analyticsdata Analyticspage|Analytics Analyticsdata Analyticspage]]
- [[_COMMUNITY_Guests Validation Get|Guests Validation Get]]
- [[_COMMUNITY_Push Client Pwa|Push Client Pwa]]
- [[_COMMUNITY_Revenue Analyticsdata Chartcard|Revenue Analyticsdata Chartcard]]
- [[_COMMUNITY_Marketing Campaigns Delete|Marketing Campaigns Delete]]
- [[_COMMUNITY_Marketing Templates Delete|Marketing Templates Delete]]
- [[_COMMUNITY_Occupancy Analyticsdata Chartcard|Occupancy Analyticsdata Chartcard]]
- [[_COMMUNITY_Config Get Post|Config Get Post]]
- [[_COMMUNITY_Contacts Get Patch|Contacts Get Patch]]
- [[_COMMUNITY_Env Envschema Validateenv|Env Envschema Validateenv]]
- [[_COMMUNITY_Payments Validation Paymentcreateschema|Payments Validation Paymentcreateschema]]
- [[_COMMUNITY_Templates Validation Templatecreateschema|Templates Validation Templatecreateschema]]
- [[_COMMUNITY_Whatsapp Whatsappgroup Whatsappsetuppage|Whatsapp Whatsappgroup Whatsappsetuppage]]
- [[_COMMUNITY_Send Whatsapp Post|Send Whatsapp Post]]
- [[_COMMUNITY_Serwist Workerglobalscope|Serwist Workerglobalscope]]
- [[_COMMUNITY_Check Prisma Test|Check Prisma Test]]
- [[_COMMUNITY_Prisma Seed Main|Prisma Seed Main]]
- [[_COMMUNITY_Types Html2pdf Html2pdfinstance|Types Html2pdf Html2pdfinstance]]
- [[_COMMUNITY_Path Dynamic Dynamicparams|Path Dynamic Dynamicparams]]
- [[_COMMUNITY_Config Postcss|Config Postcss]]
- [[_COMMUNITY_Icons Pwa Public|Icons Pwa Public]]
- [[_COMMUNITY_Graphify Rules|Graphify Rules]]
- [[_COMMUNITY_Screenshots Readme Pwa|Screenshots Readme Pwa]]
- [[_COMMUNITY_Types Virtual Keyboard|Types Virtual Keyboard]]
- [[_COMMUNITY_Graphify Workflows Workflow|Graphify Workflows Workflow]]
- [[_COMMUNITY_Next Config|Next Config]]
- [[_COMMUNITY_Public Apple Touch|Public Apple Touch]]
- [[_COMMUNITY_Public Favicon|Public Favicon]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 65 edges
2. `useHaptic()` - 32 edges
3. `EmailTheme` - 24 edges
4. `Ekantah Feature Roadmap` - 21 edges
5. `getUserFromToken()` - 20 edges
6. `getState()` - 20 edges
7. `scripts` - 19 edges
8. `compilerOptions` - 16 edges
9. `useToast()` - 15 edges
10. `waitForConnection()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `sendBroadcastMessage()`  [INFERRED]
  app/api/marketing/campaigns/[id]/send/route.ts → lib/whatsapp.ts
- `PUT()` --calls--> `enrichContactProfile()`  [INFERRED]
  app/api/whatsapp/contacts/[id]/route.ts → lib/whatsapp.ts
- `POST()` --calls--> `sendBookingWhatsApp()`  [INFERRED]
  app/api/whatsapp/send/route.ts → lib/whatsapp.ts
- `POST()` --calls--> `getUserFromToken()`  [INFERRED]
  app/api/push/send/route.ts → lib/auth.ts
- `SaleForm()` --calls--> `useToast()`  [EXTRACTED]
  app/dashboard/additional-sales/page.tsx → components/ui/toast.tsx

## Import Cycles
- 1-file cycle: `send_booking_confirmation.py -> send_booking_confirmation.py`

## Communities (77 total, 36 thin omitted)

### Community 0 - "WhatsApp Integration and PDF"
Cohesion: 0.06
Nodes (72): CRON_JOBS, getJobFn(), POST(), SalarySlipEmail(), POST(), GET(), adminDigestJob, checkoutReminderJob (+64 more)

### Community 1 - "Bookings and Cron"
Cohesion: 0.11
Nodes (22): PATCH(), POST(), EmailType, getTransporter(), renderAdminDigestHtml(), renderEmailHtml(), sendEmail(), sendRawEmail() (+14 more)

### Community 2 - "Email Template Components"
Cohesion: 0.09
Nodes (48): AmountRow(), AmountRowProps, ContactBlock(), ContactBlockProps, CTAButton(), CTAButtonProps, DataRow(), DataRowProps (+40 more)

### Community 3 - "Authentication and Push APIs"
Cohesion: 0.07
Nodes (49): DELETE(), GET(), PATCH(), POST(), clearAuthCookies(), POST(), prisma, setAuthCookies() (+41 more)

### Community 4 - "Dashboard UI and Stats"
Cohesion: 0.19
Nodes (10): CronJobDef, CronRunItem, CronsPage(), formatDuration(), HistoryResponse, statusBadge(), GuestDetail, STATUS_STYLES (+2 more)

### Community 5 - "NPM Packages and Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, bcryptjs, class-variance-authority, clsx, date-fns, eslint, eslint-config-next, file-saver (+38 more)

### Community 6 - "Additional Sales UI"
Cohesion: 0.16
Nodes (15): EmployeeForm(), Employee, fmtCurrency(), fmtDate(), METHOD_LABELS, MONTH_NAMES, SalaryPage(), SalarySlip (+7 more)

### Community 7 - "Configuration and Dev Tooling"
Cohesion: 0.11
Nodes (19): scripts, build, db:generate, db:migrate, db:migrate:prod, db:migrate:reset, db:push, db:seed (+11 more)

### Community 8 - "Design System and Utilities"
Cohesion: 0.09
Nodes (25): cn(), AnimatedGradientText(), AnimatedGradientTextProps, AnimatedShinyText(), DotPattern(), DotPatternProps, Meteors(), MeteorsProps (+17 more)

### Community 9 - "Product Roadmap and GST"
Cohesion: 0.06
Nodes (33): 1.1 Room & Inventory Model, 1.2 Booking Lifecycle, 1.3 Guest Master Record, 1.4 Payment Ledger, 1.5 GST & Tax Compliance (India), 2.1 Housekeeping & Maintenance, 2.2 Staff & Access Control, 2.3 Digital Check-In / Check-Out (+25 more)

### Community 10 - "Auth Pages and Passkeys"
Cohesion: 0.16
Nodes (14): Ripple(), RippleItem, RippleProps, GuestStep(), Props, PaymentStep(), Props, Props (+6 more)

### Community 11 - "Calendar and Booking Analytics"
Cohesion: 0.11
Nodes (26): CalendarGrid(), CalendarGridProps, CalendarLegend(), WEEKDAYS, BookingInfo, BookingMiniCard(), DayCell(), DayCellProps (+18 more)

### Community 12 - "Campaigns and Validation"
Cohesion: 0.09
Nodes (19): AdditionalSaleCreateInput, AdditionalSaleUpdateInput, authSchema, availabilityQuerySchema, BookingCreateInput, BookingUpdateInput, CampaignCreateInput, CampaignUpdateInput (+11 more)

### Community 13 - "Development Features Roadmap"
Cohesion: 0.09
Nodes (26): Booking Lifecycle Management, Advanced Business Intelligence, Date Type Migration (String to DateTime), Digital Check-In / Check-Out, Dynamic Pricing / Yield Management, Ekantah Feature Roadmap, Environment Variable Validation, GST & Tax Compliance (India) (+18 more)

### Community 14 - "Layout and Theme Config"
Cohesion: 0.10
Nodes (24): metadata, outfit, plusJakartaSans, RootLayout(), spaceMono, viewport, getThemeCssVariablesString(), ThemeColors (+16 more)

### Community 15 - "Drawer Crons Booking"
Cohesion: 0.10
Nodes (16): navItems, Booking, EmailSent, WhatsAppMessage, PullToRefresh(), PullToRefreshProps, Drawer(), DrawerContent() (+8 more)

### Community 16 - "Send Booking Confirmation"
Cohesion: 0.17
Nodes (22): generateBookingId(), date, Decimal, path, EmailMessage, formatAmount(), Path, build_message() (+14 more)

### Community 18 - "Tsconfig Compileroptions Paths"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 19 - "Toast Bookings Smart"
Cohesion: 0.24
Nodes (8): Booking, BookingCard(), Stats, useLongPress(), NumberTicker(), NumberTickerProps, SmartLink(), SmartLinkProps

### Community 20 - "Dashboard Layout Mobile"
Cohesion: 0.14
Nodes (22): GET(), POST(), register(), DELETE(), GET(), activeJobs, cancelJob(), getJobFromDB() (+14 more)

### Community 21 - "Offline Queue Hooks"
Cohesion: 0.13
Nodes (20): DeviceType, InstallPage(), useOfflineMutation(), useOfflineQueue(), clearFailedMutations(), enqueueMutation(), getAllMutations(), getPendingMutations() (+12 more)

### Community 22 - "Steps Stay Step"
Cohesion: 0.14
Nodes (18): DashboardLayout(), BeforeInstallPromptEvent, HapticPattern, useHaptic(), useScrollDirection(), MEAL_OPTIONS, Props, ROOM_TYPES (+10 more)

### Community 23 - "Pwa Hooks Install"
Cohesion: 0.14
Nodes (10): AdditionalSale, AdditionalSalesPage(), fmtCurrency(), GUEST_TYPE_OPTIONS, PAYMENT_OPTIONS, SALE_TYPE_OPTIONS, SaleForm(), Guest (+2 more)

### Community 24 - "Bookings Booking Wizard"
Cohesion: 0.19
Nodes (8): BookingWizard(), RoomAllocation, Step, stepMeta, useTouchFeedback(), BorderBeam(), BorderBeamProps, ReviewStep()

### Community 25 - "Memory Scripts Temporal"
Cohesion: 0.33
Nodes (9): add_episode(), clear_graph(), init_graphiti(), main(), query_memory(), Initializes the FalkorDB embedded driver and Graphiti client., Adds a fact/context episode to the temporal graph., Queries the temporal memory graph for context. (+1 more)

### Community 26 - "Salary Validation Employeecreateschema"
Cohesion: 0.22
Nodes (4): employeeCreateSchema, employeeUpdateSchema, salarySlipCreateSchema, salarySlipUpdateSchema

### Community 27 - "Quick Add Drawer"
Cohesion: 0.15
Nodes (13): BookingsPage(), BookingDetailPage(), quickActions, QuickAddFAB(), BookingStep, bookingStepMeta, CATEGORIES, QuickAddDrawer() (+5 more)

### Community 32 - "Push Client Pwa"
Cohesion: 0.31
Nodes (8): KpiCard(), ModuleCard(), AnalyticsData, BookingStats, DashboardPage(), StatCard(), StatCard(), MagicCard()

### Community 43 - "Send Whatsapp Post"
Cohesion: 0.16
Nodes (10): CATEGORY_LABELS, CATEGORY_OPTIONS, Expense, ExpenseForm(), ExpensesPage(), fmtCurrency(), PAYMENT_OPTIONS, sizes (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.12
Nodes (9): bufferToBase64Url(), credentialToJSON(), usePasskeys(), LoginPage(), FlipText(), FlipTextProps, ShineBorder(), ShineBorderProps (+1 more)

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (7): Campaign, CampaignStatusBadge(), ExtractionJobStatus, Lead, LeadStats, Tab, Template

### Community 67 - "Community 67"
Cohesion: 0.18
Nodes (11): devDependencies, concurrently, dependency-cruiser, dotenv-cli, esbuild, madge, @serwist/turbopack, tsx (+3 more)

### Community 70 - "Community 70"
Cohesion: 0.25
Nodes (7): author, description, keywords, license, main, name, version

### Community 73 - "Community 73"
Cohesion: 0.40
Nodes (4): Notes, Required placeholders, Send an email, The Stream by Ekantah Email Templates

## Knowledge Gaps
- **332 isolated node(s):** `prisma`, `prisma`, `prisma`, `CRON_JOBS`, `DEMO_BOOKING` (+327 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Design System and Utilities` to `Push Client Pwa`, `Community 65`, `Community 66`, `Community 69`, `Auth Pages and Passkeys`, `Layout and Theme Config`, `Drawer Crons Booking`, `Steps Stay Step`, `Bookings Booking Wizard`, `Quick Add Drawer`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `formatDate()` connect `Community 68` to `Push Client Pwa`, `WhatsApp Integration and PDF`, `Email Template Components`, `Bookings and Cron`, `Dashboard UI and Stats`, `Design System and Utilities`, `Drawer Crons Booking`, `Toast Bookings Smart`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `Pagination()` connect `Pwa Hooks Install` to `Send Whatsapp Post`, `Toast Bookings Smart`, `Additional Sales UI`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `prisma` to the rest of the system?**
  _341 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WhatsApp Integration and PDF` be split into smaller, more focused modules?**
  _Cohesion score 0.05854049719326383 - nodes in this community are weakly interconnected._
- **Should `Bookings and Cron` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._
- **Should `Email Template Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09350547730829421 - nodes in this community are weakly interconnected._