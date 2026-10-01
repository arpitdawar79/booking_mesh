# Sheet Referee — dashboard-first UX

## Problem Statement
How might we let Ops/admins see and fix every sheet row's state from the dashboard itself — in seconds, without WhatsApp commands or token links?

## Recommended Direction
Rebuild `/dashboard/sheet-sync` around a **Needs-attention queue + per-stream tables + row detail drawer**.

- **Default view = attention queue**: incomplete / nagged / conflict / deleted / importError rows — the only rows that need a human.
- **Per-stream tabs** (Expenses / Payouts / Revenue) render fields in the same column order and labels as the sheet — a row is instantly recognizable ("this is Excel row 42, C = Property").
- **Click any row → SlideOver drawer**: every field editable in place (admin session, no tokens), status actions (skip / snooze / accept / keep / unlink), linked-record badge, and a per-row timeline (seen/nagged/patched/resolved).
- **App wins**: drawer edits go through `applyRowPatches(source: "dashboard")` — same path as the fix form and WhatsApp commands. No write-back to Google.

## Key Assumptions to Validate
- [ ] Ops are comfortable editing in the dashboard instead of replying in WhatsApp (watch adoption for a week).
- [ ] Drawer-first editing is faster than an in-place grid for the real workload (a few rows/day, not bulk entry).
- [ ] Search by rowTag ("e182") is the dominant lookup pattern.

## MVP Scope
- PATCH `/api/sheet-sync` for field patches + row actions (skip/snooze/accept/keep/unlink), admin-only.
- Page rebuild: tabs, search, row list, SlideOver detail with editable fields + timeline.
- Field inputs typed (date pickers for date fields, number inputs for amounts/rooms/pax, stay-dates text with hint).

## Not Doing (and Why)
- **Write-back to Google Sheet** — app wins by decision; avoids the xlsx round-trip corruption we've already fought.
- **Inline grid editing** — the workload is correction, not data entry; a focused drawer beats a faux-Excel grid.
- **Bulk edit UI** — the gaps-sweep link already covers bulk; revisit only if it proves heavy.
- **Sheet-row deep links** — Drive xlsx doesn't support range anchors reliably; link to the file only.

## Open Questions
- Should Ops get logins, or do they stay on token links + WhatsApp? (Answered: both — dashboard usable by Ops means it must stay simple and mobile-friendly.)
