# Implementation Plan: Sheet Referee

## Overview
Sync the Ekantah Master Sheet (expenditure + revenue tabs, plus payouts sub-table) into a `SheetRow` mirror table, judge each row against required/soft completeness rules, nag the admin WhatsApp group twice daily with fix links, and let Ops fill gaps via token-gated mobile pages or WhatsApp replies — writing fixes to the app DB. Long-term goal: retire the sheet.

Idea doc: `docs/ideas/sheet-referee.md`. Task list: `tasks/todo.md`.

## Architecture Decisions
- **Ingest**: `googleapis` — Drive `mimeType` check → Sheets API `values.get` (native) or xlsx download + `xlsx` parse. Per-tab column maps in config; expenditure tab emits expenses + payouts as two streams.
- **State**: `SheetRow` (mirror + judge state) and `SheetFixToken` Prisma models; `AppConfig` for `sheet.syncFromDate`, per-sheet watermarks, watch channel ID.
- **Triggers**: `POST /api/sync/sheet` shared by Drive webhook, hourly poll cron, and manual button/command. One sync function.
- **Severity**: rules config marks each field `required | soft` → two-tier digest (per-row required gaps + aggregate soft footer).
- **Fix UX**: token-gated no-login pages (`/fix/[token]`, `/sheet-gaps/[token]`) — Ops aren't app users. Authed `/dashboard/sheet-sync` for admins.
- **Ledger bridge**: fixes patch `SheetRow` and create/link `Expense`/`AdditionalSale`/`Booking` with dedupe on `(amount, date, property)`; per-field `source` (sheet|app), app wins.
- **New deps**: `googleapis`, `xlsx` — pinned versions ≥7 days old.
- **Env**: `SHEET_FILE_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEET_SYNC_FROM_DATE`, `ADMIN_GROUP_JID`, `APP_BASE_URL`, `FIX_TOKEN_SECRET`.

## Task List

### Phase 1: Sync foundation
- [ ] Task 1: Prisma models (`SheetRow`, `SheetFixToken`) + migration; install `googleapis`, `xlsx`
- [ ] Task 2: `lib/sheet-sync/` — Drive auth, fetch both mime paths, column maps, date parser, completeness rules, upsert + cutoff + watermark
- [ ] Task 3: `POST /api/sync/sheet` + dry-run mode → summary to group

### Checkpoint: Foundation
- [ ] Dry-run against real sheet; SheetRows in DB with correct missing-field flags; `db:generate`/typecheck clean

### Phase 2: Nag loop
- [ ] Task 4: Digest composer + cron 9am/8pm IST via `sendWhatsAppGroupMessage`
- [ ] Task 5: `messages.upsert` handler — `186 field=value`, `skip`, `later`, `sync` commands + ✅ confirm; backoff/escalation

### Checkpoint: Core loop
- [ ] Digest sends; `skip` reply changes state; no spam (re-nag dedupe works)

### Phase 3: Fix UX
- [ ] Task 6: `/fix/[token]` prefilled mobile fix page
- [ ] Task 7: `/sheet-gaps/[token]` bulk soft-field sweep page
- [ ] Task 8: `/dashboard/sheet-sync` admin page (health, rows, sync-now, settings)

### Phase 4: Real-time + hardening
- [ ] Task 9: Drive `files.watch` + webhook + renewal cron + hourly fallback poll
- [ ] Task 10: Deletion detection, schema-drift alarm, failure DM alerts, production dedupe

### Checkpoint: Complete
- [ ] End-to-end: sheet edit → webhook → digest → fix via link and via reply → resolved in DB

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Free-text dates unparseable | Med | rowId watermark + dry-run boundary flags |
| Baileys socket drops → replies lost | Med | WA status check in sync job; DM alert |
| Watch channel silently expires | Med | hourly fallback poll + renewal cron |
| Sheet/app double-write conflict | Low | per-field `source`; app wins for fixed fields |
| Day-one nag flood | Med | dry-run summary before nags enabled |

## Open Questions
- `SHEET_SYNC_FROM_DATE` value at deploy
- Final required/soft field list (proposal in idea doc)
- Digest @mentions per property?
- Service account: existing or new?
