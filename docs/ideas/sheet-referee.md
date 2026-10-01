# Sheet Referee

## Problem Statement
HMW turn the Ops expense/revenue sheet (Ekantah Master Sheet) into a self-healing ledger — incomplete rows get chased automatically in the admin WhatsApp group, fixes land in the app DB — so the sheet can eventually be retired?

## Recommended Direction
**Pull-sync referee with push triggers.** The sheet remains a dumb inbox; the app becomes the ledger and the enforcer.

**Trigger layer:** Drive `files.watch` webhook → `POST /api/sync/sheet` + hourly safety poll + manual trigger (admin button + `sync` command in group). Webhook channels renew via the existing cron infra every ~6 days.

**Ingest:** Drive API detects `mimeType` — native GSheet → Sheets API `values.get`; xlsx → download + `xlsx` parse. Per-sheet column maps; the expenditure tab yields **two** record streams (expenses cols A–F, payouts cols H–J).

**First-run boundary:** `SHEET_SYNC_FROM_DATE` (AppConfig, set at deploy) + per-sheet rowId watermark. Rows before cutoff → `legacy`: stored, never nagged. Boundary rows with unparsable dates → flagged in dry-run report. Dedupe guard on `(amount, date, property)` vs existing Expense/AdditionalSale/Booking records → `possibleDuplicate`.

**Judge:** per-field severity `required | soft`. Row state machine: `new → incomplete → nagged → resolved | skipped | snoozed`.

**Nag:** digest twice daily (~9am + ~8pm IST) via `sendWhatsAppGroupMessage`. Required-field gaps listed per-row with fix links; soft-field gaps aggregate to a single footer line + bulk-sweep link. Backoff daily → 2d → weekly; admin-DM escalation after ~5 days.

**Fix:** `/fix/[token]` prefilled mobile form AND WhatsApp replies (`186 phone=98...` via `messages.upsert` handler → ✅ confirm). App DB wins per-field via `source` tracking.

## Field Severity (initial config, tunable)

| Sheet | Required | Soft |
|---|---|---|
| Expenditure | Date, Property, Particular, Amount, Paid by | — |
| Payouts sub-table | Date, Amount, Beneficiary | — |
| Revenue | Property, Revenue ₹, Recd. by, Status | Guest Name, Type, Date of Sale, Stay Dates, #Rooms, Pax, Source, Comments |

## Robustness Features
- Dry-run first sync → summary to group before nags begin
- `skip` / `later 186 3d` / `sync` WhatsApp commands, logged
- Deletion detection (S.No gaps already occur in the sheet)
- Schema-drift alarm → admin DM
- Drive failure alerting → admin DM
- "% complete" health footer in digest

## Key Assumptions to Validate
- [ ] Service account can access the Drive file
- [ ] Free-text dates parse reliably enough; watermark covers failures
- [ ] Baileys socket stays connected to receive replies
- [ ] Ops clicks fix links — needs prefilled, zero-auth, mobile-first UX

## MVP Scope
`googleapis` + `xlsx` deps → `SheetRow` + `SheetFixToken` Prisma models → sync service (one function, three triggers) → column-map config → completeness rules → twice-daily digest → `/fix/[token]` + `/sheet-gaps/[token]` pages → `messages.upsert` reply parser → `/dashboard/sheet-sync` admin page.

## Not Doing (and Why)
- Sheet write-back — goal is retirement, not polish
- Per-row instant nags — group would get muted
- WhatsApp buttons — flaky in Baileys groups
- LLM free-text parsing — `field=value` grammar first, upgrade later

## Open Questions
- `SHEET_SYNC_FROM_DATE` value at deploy time
- Final required/soft field list — confirm with Ops
- Should digest @mention a person per property?
- Existing Google service account or create one?
