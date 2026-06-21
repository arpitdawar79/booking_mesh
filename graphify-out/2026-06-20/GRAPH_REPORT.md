# Graph Report - .  (2026-06-19)

## Corpus Check
- 146 files · ~281,314 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 956 nodes · 1733 edges · 65 communities (35 shown, 30 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

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
- [[_COMMUNITY_Public Apple Touch|Public Apple Touch]]
- [[_COMMUNITY_Public Favicon|Public Favicon]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 51 edges
2. `useHaptic()` - 28 edges
3. `EmailTheme` - 23 edges
4. `Ekantah Feature Roadmap` - 21 edges
5. `getUserFromToken()` - 20 edges
6. `scripts` - 19 edges
7. `getState()` - 18 edges
8. `compilerOptions` - 16 edges
9. `formatDate()` - 14 edges
10. `sendBookingWhatsApp()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `sendBroadcastMessage()`  [INFERRED]
  app/api/marketing/campaigns/[id]/send/route.ts → lib/whatsapp.ts
- `POST()` --calls--> `sendBookingWhatsApp()`  [INFERRED]
  app/api/whatsapp/send/route.ts → lib/whatsapp.ts
- `POST()` --calls--> `getUserFromToken()`  [INFERRED]
  app/api/push/send/route.ts → lib/auth.ts
- `PUT()` --calls--> `enrichContactProfile()`  [INFERRED]
  app/api/whatsapp/contacts/[id]/route.ts → lib/whatsapp.ts
- `BookingDetailPage()` --calls--> `useHaptic()`  [INFERRED]
  app/dashboard/booking/[id]/page.tsx → lib/pwa-hooks.ts

## Import Cycles
- 1-file cycle: `send_booking_confirmation.py -> send_booking_confirmation.py`

## Communities (65 total, 30 thin omitted)

### Community 0 - "WhatsApp Integration and PDF"
Cohesion: 0.07
Nodes (54): POST(), POST(), GET(), PUT(), renderBookingPdfHtml(), renderSalarySlipPdfHtml(), SalarySlipPdfData, extractContactsSchema (+46 more)

### Community 1 - "Bookings and Cron"
Cohesion: 0.05
Nodes (44): BookingActionsProps, generateBookingId(), PATCH(), POST(), CRON_JOBS, getJobFn(), POST(), adminDigestJob (+36 more)

### Community 2 - "Email Template Components"
Cohesion: 0.09
Nodes (39): AmountRow(), AmountRowProps, ContactBlockProps, CTAButton(), CTAButtonProps, DataRow(), DataRowProps, EmailFooter() (+31 more)

### Community 3 - "Authentication and Push APIs"
Cohesion: 0.07
Nodes (49): DELETE(), GET(), PATCH(), POST(), clearAuthCookies(), POST(), prisma, setAuthCookies() (+41 more)

### Community 4 - "Dashboard UI and Stats"
Cohesion: 0.05
Nodes (24): KpiCard(), AnalyticsData, BookingStats, DashboardPage(), StatCard(), Guest, GuestDetail, StatCard() (+16 more)

### Community 5 - "NPM Packages and Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, bcryptjs, class-variance-authority, clsx, date-fns, eslint, eslint-config-next, file-saver (+38 more)

### Community 6 - "Additional Sales UI"
Cohesion: 0.06
Nodes (28): AdditionalSale, AdditionalSalesPage(), fmtCurrency(), GUEST_TYPE_OPTIONS, PAYMENT_OPTIONS, SALE_TYPE_OPTIONS, CATEGORY_LABELS, CATEGORY_OPTIONS (+20 more)

### Community 7 - "Configuration and Dev Tooling"
Cohesion: 0.05
Nodes (37): author, description, devDependencies, concurrently, dependency-cruiser, dotenv-cli, esbuild, madge (+29 more)

### Community 8 - "Design System and Utilities"
Cohesion: 0.12
Nodes (23): cn(), AnimatedGradientTextProps, AnimatedShinyText(), BorderBeam(), BorderBeamProps, DotPattern(), DotPatternProps, OrbitingCirclesProps (+15 more)

### Community 9 - "Product Roadmap and GST"
Cohesion: 0.06
Nodes (33): 1.1 Room & Inventory Model, 1.2 Booking Lifecycle, 1.3 Guest Master Record, 1.4 Payment Ledger, 1.5 GST & Tax Compliance (India), 2.1 Housekeeping & Maintenance, 2.2 Staff & Access Control, 2.3 Digital Check-In / Check-Out (+25 more)

### Community 10 - "Auth Pages and Passkeys"
Cohesion: 0.08
Nodes (12): bufferToBase64Url(), credentialToJSON(), usePasskeys(), LoginPage(), FlipText(), FlipTextProps, Meteors(), MeteorsProps (+4 more)

### Community 11 - "Calendar and Booking Analytics"
Cohesion: 0.12
Nodes (18): CalendarLegend(), WEEKDAYS, BookingInfo, BookingMiniCard(), DayCell(), DayCellProps, DayData, formatCurrency() (+10 more)

### Community 12 - "Campaigns and Validation"
Cohesion: 0.08
Nodes (21): POST(), AdditionalSaleCreateInput, AdditionalSaleUpdateInput, authSchema, availabilityQuerySchema, BookingCreateInput, BookingUpdateInput, CampaignCreateInput (+13 more)

### Community 13 - "Development Features Roadmap"
Cohesion: 0.09
Nodes (26): Booking Lifecycle Management, Advanced Business Intelligence, Date Type Migration (String to DateTime), Digital Check-In / Check-Out, Dynamic Pricing / Yield Management, Ekantah Feature Roadmap, Environment Variable Validation, GST & Tax Compliance (India) (+18 more)

### Community 14 - "Layout and Theme Config"
Cohesion: 0.12
Nodes (18): metadata, outfit, plusJakartaSans, RootLayout(), spaceMono, viewport, getThemeCssVariablesString(), ThemeColors (+10 more)

### Community 15 - "Drawer Crons Booking"
Cohesion: 0.15
Nodes (12): CronJobDef, CronRunItem, CronsPage(), formatDuration(), HistoryResponse, Booking, EmailSent, WhatsAppMessage (+4 more)

### Community 16 - "Send Booking Confirmation"
Cohesion: 0.20
Nodes (19): date, Decimal, path, EmailMessage, formatAmount(), Path, build_message(), calculate_nights() (+11 more)

### Community 18 - "Tsconfig Compileroptions Paths"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 19 - "Toast Bookings Smart"
Cohesion: 0.12
Nodes (15): SaleForm(), Booking, BookingCard(), BookingsPage(), Stats, ExpenseForm(), BookingDetailPage(), useLongPress() (+7 more)

### Community 20 - "Dashboard Layout Mobile"
Cohesion: 0.15
Nodes (10): DashboardLayout(), navItems, useScrollDirection(), PullToRefreshProps, quickActions, QuickAddFAB(), DrawerTrigger(), MobileBottomNavProps (+2 more)

### Community 21 - "Offline Queue Hooks"
Cohesion: 0.30
Nodes (12): useOfflineMutation(), useOfflineQueue(), clearFailedMutations(), enqueueMutation(), getAllMutations(), getPendingMutations(), openDB(), processQueue() (+4 more)

### Community 22 - "Steps Stay Step"
Cohesion: 0.21
Nodes (13): useHaptic(), MEAL_OPTIONS, Props, ROOM_TYPES, RoomAllocation, StayStep(), TIME_OPTIONS, CalendarPopover() (+5 more)

### Community 23 - "Pwa Hooks Install"
Cohesion: 0.23
Nodes (8): DeviceType, InstallPage(), BeforeInstallPromptEvent, HapticPattern, useInstallPrompt(), useNetworkState(), useTouchFeedback(), PWAStatus()

### Community 24 - "Bookings Booking Wizard"
Cohesion: 0.22
Nodes (5): RoomAllocation, Step, stepMeta, TextReveal(), TextRevealProps

### Community 25 - "Memory Scripts Temporal"
Cohesion: 0.33
Nodes (9): add_episode(), clear_graph(), init_graphiti(), main(), query_memory(), Initializes the FalkorDB embedded driver and Graphiti client., Adds a fact/context episode to the temporal graph., Queries the temporal memory graph for context. (+1 more)

### Community 26 - "Salary Validation Employeecreateschema"
Cohesion: 0.22
Nodes (4): employeeCreateSchema, employeeUpdateSchema, salarySlipCreateSchema, salarySlipUpdateSchema

### Community 27 - "Quick Add Drawer"
Cohesion: 0.25
Nodes (7): BookingStep, bookingStepMeta, CATEGORIES, QuickAddDrawerProps, RoomAllocation, Dialog(), DialogProps

## Knowledge Gaps
- **324 isolated node(s):** `prisma`, `prisma`, `prisma`, `CRON_JOBS`, `DEMO_BOOKING` (+319 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatDate()` connect `Bookings and Cron` to `WhatsApp Integration and PDF`, `Email Template Components`, `Dashboard UI and Stats`, `Design System and Utilities`, `Drawer Crons Booking`, `Toast Bookings Smart`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `cn()` connect `Design System and Utilities` to `Dashboard UI and Stats`, `Auth Pages and Passkeys`, `Layout and Theme Config`, `Drawer Crons Booking`, `Dashboard Layout Mobile`, `Steps Stay Step`, `Bookings Booking Wizard`, `Quick Add Drawer`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `useHaptic()` connect `Steps Stay Step` to `Design System and Utilities`, `Drawer Crons Booking`, `Toast Bookings Smart`, `Dashboard Layout Mobile`, `Pwa Hooks Install`, `Bookings Booking Wizard`, `Quick Add Drawer`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `prisma` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WhatsApp Integration and PDF` be split into smaller, more focused modules?**
  _Cohesion score 0.07199297629499561 - nodes in this community are weakly interconnected._
- **Should `Bookings and Cron` be split into smaller, more focused modules?**
  _Cohesion score 0.05144230769230769 - nodes in this community are weakly interconnected._
- **Should `Email Template Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09370199692780339 - nodes in this community are weakly interconnected._