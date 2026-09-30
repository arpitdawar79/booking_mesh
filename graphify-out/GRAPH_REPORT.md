# Graph Report - booking_mesh  (2026-09-30)

## Corpus Check
- 202 files · ~284,149 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1121 nodes · 2115 edges · 115 communities (41 shown, 74 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eca915ca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- whatsapp.ts
- logger.ts
- components/index.ts
- auth.ts
- additional-sales/page.tsx
- dependencies
- cn
- scripts
- app/page.tsx
- Ekantah — Feature Roadmap & Business Enhancement Plan
- calendar/index.ts
- cron-jobs.ts
- validation.ts
- Ekantah Feature Roadmap
- app/layout.tsx
- EmailTheme
- send_booking_confirmation.py
- prisma.ts
- compilerOptions
- bookings/page.tsx
- extraction-job.ts
- pwa-shell.tsx
- pwa-hooks.ts
- quick-add-drawer.tsx
- booking-wizard.tsx
- temporal-memory.py
- salary/route.ts
- email.ts
- additional-sales/route.ts
- expenses/route.ts
- booking/[id]/page.tsx
- guests/route.ts
- marketing/page.tsx
- animated-grid.tsx
- campaigns/[id]/route.ts
- templates/[id]/route.ts
- skeleton.tsx
- config/route.ts
- gstr/route.ts
- env.ts
- payments/route.ts
- templates/route.ts
- analytics/page.tsx
- revenue/page.tsx
- sw.ts
- check-db.mjs
- seed.ts
- Html2PdfInstance
- occupancy/page.tsx
- workflow-showcase.tsx
- postcss.config.mjs
- PWA Screenshots README
- contacts/route.ts
- whatsapp/page.tsx
- screenshots/README.md
- availability/route.ts
- VirtualKeyboard
- rules/graphify.md
- next.config.ts
- next-env.d.ts
- workflows/graphify.md
- web-push.d.ts
- login/page.tsx
- [path]/route.ts
- utils.ts
- class-variance-authority
- clsx
- date-fns
- The Stream by Ekantah Email Templates
- campaigns/route.ts
- ecosystem.config.js
- eslint
- eslint-config-next
- file-saver
- framer-motion
- geist
- html2pdf.js
- jimp
- jose
- lucide-react
- next
- next-view-transitions
- node-cron
- nodemailer
- @number-flow/react
- pino
- prisma
- puppeteer
- qrcode
- react
- react-datepicker
- recharts
- serwist
- @serwist/window
- sharp
- @simplewebauthn/server
- tailwind-merge
- tailwindcss
- @tailwindcss/postcss
- @types/node
- @types/nodemailer
- @types/react
- typescript
- usehooks-ts
- vaul
- web-push
- @whiskeysockets/baileys
- zod

## God Nodes (most connected - your core abstractions)
1. `cn()` - 70 edges
2. `prisma` - 41 edges
3. `useHaptic()` - 32 edges
4. `formatDate()` - 26 edges
5. `EmailTheme` - 24 edges
6. `Ekantah Feature Roadmap` - 21 edges
7. `getUserFromToken()` - 20 edges
8. `getState()` - 20 edges
9. `scripts` - 19 edges
10. `waitForConnection()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GuestDetailPage()` --calls--> `formatDate()`  [EXTRACTED]
  app/dashboard/guests/[id]/page.tsx → lib/utils.ts
- `MarketingPage()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/marketing/page.tsx → lib/utils.ts
- `CampaignStatusBadge()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/marketing/page.tsx → lib/utils.ts
- `CampaignForm()` --calls--> `cn()`  [EXTRACTED]
  app/dashboard/marketing/page.tsx → lib/utils.ts
- `AnimatedShinyText()` --calls--> `cn()`  [EXTRACTED]
  components/magicui/animated-gradient-text.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (115 total, 74 thin omitted)

### Community 0 - "whatsapp.ts"
Cohesion: 0.07
Nodes (58): POST(), POST(), POST(), PUT(), GET(), POST(), POST(), POST() (+50 more)

### Community 1 - "logger.ts"
Cohesion: 0.40
Nodes (5): formatLog(), log(), LogEntry, logger, LogLevel

### Community 2 - "components/index.ts"
Cohesion: 0.19
Nodes (22): AdminDailyDigestEmail(), BookingItem, Props, Props, Props, Props, AmountRow(), ContactBlock() (+14 more)

### Community 3 - "auth.ts"
Cohesion: 0.07
Nodes (50): DELETE(), GET(), PATCH(), prisma, GET(), POST(), prisma, GET() (+42 more)

### Community 4 - "additional-sales/page.tsx"
Cohesion: 0.05
Nodes (43): AdditionalSale, AdditionalSalesPage(), fmtCurrency(), fmtDate(), fmtLabel(), GUEST_TYPE_OPTIONS, PAYMENT_OPTIONS, SALE_TYPE_OPTIONS (+35 more)

### Community 5 - "dependencies"
Cohesion: 0.18
Nodes (11): bcryptjs, motion-plus, dependencies, bcryptjs, motion-plus, @prisma/client, react-dom, @types/react-dom (+3 more)

### Community 6 - "cn"
Cohesion: 0.13
Nodes (28): GuestStep(), Props, PaymentStep(), Props, MEAL_OPTIONS, Props, ROOM_TYPES, RoomAllocation (+20 more)

### Community 7 - "scripts"
Cohesion: 0.04
Nodes (47): concurrently, dependency-cruiser, dotenv-cli, esbuild, madge, author, description, devDependencies (+39 more)

### Community 8 - "app/page.tsx"
Cohesion: 0.16
Nodes (10): Home(), Meteors(), MeteorsProps, Particle, Particles(), ParticlesProps, SparklesText(), SparklesTextProps (+2 more)

### Community 9 - "Ekantah — Feature Roadmap & Business Enhancement Plan"
Cohesion: 0.06
Nodes (33): 1.1 Room & Inventory Model, 1.2 Booking Lifecycle, 1.3 Guest Master Record, 1.4 Payment Ledger, 1.5 GST & Tax Compliance (India), 2.1 Housekeeping & Maintenance, 2.2 Staff & Access Control, 2.3 Digital Check-In / Check-Out (+25 more)

### Community 10 - "calendar/index.ts"
Cohesion: 0.11
Nodes (26): CalendarResponse, MONTH_NAMES, CalendarGrid(), CalendarGridProps, CalendarLegend(), WEEKDAYS, BookingInfo, BookingMiniCard() (+18 more)

### Community 11 - "cron-jobs.ts"
Cohesion: 0.17
Nodes (22): CRON_JOBS, getJobFn(), POST(), adminDigestJob, checkoutReminderJob, contactEnrichmentJob, preArrivalReminderJob, defaultLog() (+14 more)

### Community 12 - "validation.ts"
Cohesion: 0.08
Nodes (25): AdditionalSaleCreateInput, AdditionalSaleUpdateInput, authForgotPasswordSchema, authLoginSchema, authResetPasswordSchema, authSchema, authSignupSchema, BookingCreateInput (+17 more)

### Community 13 - "Ekantah Feature Roadmap"
Cohesion: 0.09
Nodes (26): Booking Lifecycle Management, Advanced Business Intelligence, Date Type Migration (String to DateTime), Digital Check-In / Check-Out, Dynamic Pricing / Yield Management, Ekantah Feature Roadmap, Environment Variable Validation, GST & Tax Compliance (India) (+18 more)

### Community 14 - "app/layout.tsx"
Cohesion: 0.10
Nodes (24): metadata, outfit, plusJakartaSans, RootLayout(), spaceMono, viewport, AnimatedThemeToggler(), AnimatedThemeTogglerProps (+16 more)

### Community 15 - "EmailTheme"
Cohesion: 0.15
Nodes (15): AmountRowProps, ContactBlockProps, CTAButtonProps, DataRowProps, EmailFooterProps, EmailHeaderProps, EmailHeroProps, EmailSectionProps (+7 more)

### Community 16 - "send_booking_confirmation.py"
Cohesion: 0.22
Nodes (19): date, Decimal, EmailMessage, Path, build_message(), calculate_nights(), collect_booking_details(), collect_smtp_details() (+11 more)

### Community 17 - "prisma.ts"
Cohesion: 0.11
Nodes (13): generateBookingId(), PATCH(), POST(), POST(), EmailType, getTransporter(), renderAdminDigestHtml(), sendEmail() (+5 more)

### Community 18 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 19 - "bookings/page.tsx"
Cohesion: 0.14
Nodes (16): Booking, BookingCard(), Stats, AnalyticsData, BookingStats, KpiCard(), ModuleCard(), StatCard() (+8 more)

### Community 20 - "extraction-job.ts"
Cohesion: 0.13
Nodes (18): DELETE(), GET(), GET(), POST(), register(), activeJobs, cancelJob(), getJobFromDB() (+10 more)

### Community 21 - "pwa-shell.tsx"
Cohesion: 0.20
Nodes (18): OfflineSyncBadge(), PushNotificationPrompt(), PWAStatus(), useOfflineMutation(), useOfflineQueue(), clearFailedMutations(), enqueueMutation(), getAllMutations() (+10 more)

### Community 22 - "pwa-hooks.ts"
Cohesion: 0.10
Nodes (18): DeviceType, InstallPage(), DashboardLayout(), navItems, InstallPrompt(), PullToRefresh(), PullToRefreshProps, quickActions (+10 more)

### Community 23 - "quick-add-drawer.tsx"
Cohesion: 0.15
Nodes (17): CronJobDef, CronRunItem, CronsPage(), formatDuration(), HistoryResponse, statusBadge(), BookingStep, bookingStepMeta (+9 more)

### Community 24 - "booking-wizard.tsx"
Cohesion: 0.12
Nodes (16): BookingWizard(), formatDate(), RoomAllocation, Step, stepMeta, Props, ReviewStep(), RoomAllocation (+8 more)

### Community 25 - "temporal-memory.py"
Cohesion: 0.33
Nodes (9): add_episode(), clear_graph(), init_graphiti(), main(), query_memory(), Initializes the FalkorDB embedded driver and Graphiti client., Adds a fact/context episode to the temporal graph., Queries the temporal memory graph for context. (+1 more)

### Community 26 - "salary/route.ts"
Cohesion: 0.22
Nodes (4): employeeCreateSchema, employeeUpdateSchema, salarySlipCreateSchema, salarySlipUpdateSchema

### Community 27 - "email.ts"
Cohesion: 0.19
Nodes (15): DEMO_BOOKING, POST(), BookingConfirmationEmail(), CancellationEmail(), CheckoutEmail(), NotificationEmail(), PreArrivalEmail(), RefundCreditedEmail() (+7 more)

### Community 30 - "booking/[id]/page.tsx"
Cohesion: 0.12
Nodes (12): Booking, BookingDetailPage(), EmailSent, toISODateString(), WhatsAppMessage, BookingsPage(), Toast, ToastContext (+4 more)

### Community 32 - "marketing/page.tsx"
Cohesion: 0.18
Nodes (9): Campaign, CampaignForm(), CampaignStatusBadge(), ExtractionJobStatus, Lead, LeadStats, MarketingPage(), Tab (+1 more)

### Community 47 - "Html2PdfInstance"
Cohesion: 0.17
Nodes (3): html2pdf.js, Html2PdfInstance, Html2PdfOptions

### Community 65 - "login/page.tsx"
Cohesion: 0.24
Nodes (9): LoginPage(), FlipText(), FlipTextProps, ShineBorder(), ShineBorderProps, base64UrlToBuffer(), bufferToBase64Url(), credentialToJSON() (+1 more)

### Community 68 - "utils.ts"
Cohesion: 0.13
Nodes (10): DashboardPage(), BookingActions(), BookingActionsProps, OrbitingCircles(), OrbitingCirclesProps, RainbowButton(), RainbowButtonProps, formatBookingSummary() (+2 more)

### Community 73 - "The Stream by Ekantah Email Templates"
Cohesion: 0.33
Nodes (5): Booking confirmation, Notes, Required placeholders, Send an email, The Stream by Ekantah Email Templates

## Knowledge Gaps
- **333 isolated node(s):** `prisma`, `prisma`, `prisma`, `CRON_JOBS`, `DEMO_BOOKING` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `prisma` connect `prisma.ts` to `whatsapp.ts`, `campaigns/[id]/route.ts`, `templates/[id]/route.ts`, `auth.ts`, `config/route.ts`, `gstr/route.ts`, `payments/route.ts`, `templates/route.ts`, `campaigns/route.ts`, `cron-jobs.ts`, `extraction-job.ts`, `contacts/route.ts`, `availability/route.ts`, `salary/route.ts`, `email.ts`, `additional-sales/route.ts`, `expenses/route.ts`, `guests/route.ts`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `formatDate()` connect `utils.ts` to `whatsapp.ts`, `additional-sales/page.tsx`, `cron-jobs.ts`, `prisma.ts`, `bookings/page.tsx`, `pwa-hooks.ts`, `quick-add-drawer.tsx`, `email.ts`, `booking/[id]/page.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `marketing/page.tsx`, `login/page.tsx`, `animated-grid.tsx`, `utils.ts`, `skeleton.tsx`, `app/page.tsx`, `app/layout.tsx`, `bookings/page.tsx`, `pwa-hooks.ts`, `quick-add-drawer.tsx`, `booking-wizard.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `prisma` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `whatsapp.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07120500782472614 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06963645673323093 - nodes in this community are weakly interconnected._
- **Should `additional-sales/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.050816696914700546 - nodes in this community are weakly interconnected._