# Sheet Referee — Task List

## Phase 1: Sync foundation

### Task 1: Schema + deps
**Description:** Add `SheetRow` and `SheetFixToken` Prisma models, run migration, install `googleapis` + `xlsx` (pinned, ≥7 days old).
**Acceptance criteria:**
- [x] `SheetRow` model: sheet, rowId, rowNum, rawJson, rowHash, parsedDate, status, missingRequired, missingSoft, lastNaggedAt, nagCount, resolvedVia, linkedRecordId, timestamps; unique (sheet,rowId)
- [x] `SheetFixToken` model: token, sheetRowId(s), kind (fix|gaps), expiresAt, usedAt
- [x] `pnpm db:migrate` succeeds; `prisma generate` clean
**Verification:** `pnpm typecheck` passes; `prisma studio`/check-db shows tables
**Files:** `prisma/schema.prisma`, `package.json`, migration dir
**Scope:** S

### Task 2: `lib/sheet-sync/` ingest + judge
**Description:** Drive client (service account), mimeType dispatch → Sheets API or xlsx download+parse; per-tab column maps; payouts sub-table stream; free-text date parser; completeness rules w/ required|soft; upsert w/ cutoff + watermark + hash-change detection.
**Acceptance criteria:**
- [x] Fetches both tabs; expenditure yields expenses + payouts streams
- [x] Parses "10th Sep", "27th Sept", "28th-30th October" style dates; unparsable → flag
- [x] Rows before `syncFromDate` → `legacy`; unparseable-date boundary rows flagged
- [x] Idempotent: unchanged rows (same hash) not re-judged
**Verification:** script run against real sheet prints correct parsed rows + missing fields
**Files:** `lib/sheet-sync/*.ts`, `lib/sheet-sync/rules.ts`, `.env` keys
**Scope:** L

### Task 3: Sync endpoint + dry-run
**Description:** `POST /api/sync/sheet` shared by webhook/cron/manual; dry-run mode posts summary to admin group instead of nagging.
**Acceptance criteria:**
- [x] Endpoint triggers sync; logs via `runJob`
- [x] Dry-run posts "scanned N, tracking M, K incomplete, J soft-gaps" to group
- [x] Auth: sync secret header or admin session
**Files:** `app/api/sync/sheet/route.ts`
**Scope:** M

## Checkpoint: Foundation
- [x] Dry-run vs real sheet OK; SheetRows correct; typecheck clean

## Phase 2: Nag loop

### Task 4: Digest composer + cron
**Description:** Twice-daily (9am, 8pm IST) digest to admin group: required gaps per-row w/ fix links, soft-gap footer w/ sweep link; registered in `CRON_JOBS`.
**Acceptance criteria:**
- [x] Digest groups by property; ≤10 rows then "see all" link
- [x] Only `incomplete`/`nagged` rows listed; backoff respected
- [x] Cron entries registered + appear on `/dashboard/crons`
**Files:** `lib/sheet-sync/digest.ts`, `lib/cron-jobs.ts`, `app/api/crons/route.ts`
**Scope:** M

### Task 5: WhatsApp reply handler
**Description:** `messages.upsert` listener on admin group: `186 field=value`, `skip 186`, `later 186 3d`, `sync` → patch SheetRow, ✅ confirm.
**Acceptance criteria:**
- [x] Parses field=value pairs; unknown fields rejected w/ hint
- [x] skip/later set status+snoozedUntil; logged
- [x] Applies backoff (daily→2d→weekly) + escalation DM after 5d
**Files:** `lib/whatsapp.ts`, `lib/sheet-sync/commands.ts`
**Scope:** M

## Checkpoint: Core loop
- [x] Digest → reply skip → state flips; re-nag dedupe OK

## Phase 3: Fix UX

### Task 6: `/fix/[token]` page
**Description:** Token-gated, no-login, mobile-first prefilled form; only missing fields editable; PATCH writes patch + creates/links ledger record.
**Acceptance criteria:**
- [x] Missing fields editable, existing values shown read-only
- [x] Success state "Done — #N complete"; expired token → graceful error
- [x] 320px usable; WCAG AA; matches app design system
**Files:** `app/fix/[token]/page.tsx`, `app/api/sheet-fix/route.ts`
**Scope:** M

### Task 7: `/sheet-gaps/[token]` sweep page
**Description:** Bulk soft-field grid: cards on mobile, inline table desktop, save-all.
**Acceptance criteria:**
- [x] Lists all rows w/ soft gaps; inline edit; batch save
- [x] Empty state when all complete
**Files:** `app/sheet-gaps/[token]/page.tsx`, `app/api/sheet-gaps/route.ts`
**Scope:** M

### Task 8: `/dashboard/sheet-sync` admin page
**Description:** Sync health (last run, % complete trend), row browser w/ status filters, sync-now, `syncFromDate` + group JID settings.
**Acceptance criteria:**
- [x] Status badges icon+text; filters work; sync-now triggers job
- [x] Settings persist to AppConfig
**Files:** `app/dashboard/sheet-sync/page.tsx`, API routes
**Scope:** M

## Phase 4: Real-time + hardening

### Task 9: Drive webhook
**Description:** `files.watch` registration, webhook handler at sync endpoint, channel-renewal cron (~6d), hourly fallback poll.
**Acceptance criteria:**
- [x] File edit → notification → sync within seconds
- [x] Channel auto-renews; expiry handled
**Files:** `app/api/sync/sheet/route.ts`, `lib/sheet-sync/watch.ts`, `lib/cron-jobs.ts`
**Scope:** M

### Task 10: Hardening
**Description:** Deletion detection, schema-drift DM alarm, sync-failure DM alerts, dedupe vs production Expense/AdditionalSale/Booking.
**Acceptance criteria:**
- [x] Vanished row → `deleted`, surfaced once in digest
- [x] Column-map mismatch → admin DM, sync aborts safely
- [x] Boundary duplicates → `possibleDuplicate`, not double-created
**Files:** `lib/sheet-sync/*.ts`
**Scope:** M

## Checkpoint: Complete
- [x] All code implemented; verified vs local xlsx + DB + live commands
- [x] Deploy-time remaining:
  - [ ] Fill env vars (GOOGLE_SERVICE_ACCOUNT_JSON, ADMIN_GROUP_JID/ADMIN_WHATSAPP_GROUP_ID, ADMIN_DM_JID, SHEET_SYNC_FROM_DATE)
  - [ ] Dry-run `POST /api/sync/sheet {"dryRun":true}` → preview to group
  - [ ] Restart app so new env + Prisma client + cron-runner jobs load
