# Guest management implementation

Authorized scope: CAPABILITY-MAP-guests.md and SPEC-guest-*.md.

- [x] Identity and history: additive schema/migration, canonical phone/email aliases, conflict detection, selected booking/contact linking preview/apply, booking integration and audited merge.
- [x] Rewards: configurable settings/tiers, audited points and expiry, settlement reconciliation, referrals, capped offers/redemption, cancellation and manual benefit reversals.
- [x] Experience: hashed scoped public links, private feedback, independent Google review invitation, staff resolution and communication preference opt-out.
- [x] Retention: lifecycle segments, explained next actions, personalized campaign previews/drafts, immediate send eligibility checks, quiet hours/cooldown/daily cap and scheduled reconciliation.
- [x] Workspace: responsive directory/profile/program pages, consent/preferences/notes, accurate stay/payment metrics, service recovery suggestions and settings.
- [x] Verification: pure tests, migration over legacy guest data and database race/reversal checks, browser journey, typecheck, production compilation and cron bundle.
- [x] Documentation: docs/guest-management.md records activation, settings, migration, environment, scheduled processing and implementation boundaries.

## Evidence (9 October 2026)

- `pnpm typecheck`: passed.
- `pnpm test:guests`: 13 passed.
- `pnpm test:guests:ui`: isolated real PostgreSQL migration/integration suite and browser checks for 320/768/1024/1440px, drafts, feedback, independent reviews, staff resolution, public opt-out and API access controls. Synthetic test databases are dropped after the run; no delivery providers are called.
- `pnpm test:sheet-sync`: 33 passed.
- `pnpm test:contacts`: 22 passed, preserving the concurrent import work.
- `pnpm exec prisma validate`: passed.
- `pnpm build:cron`: passed.
- `next build --webpack`: passed in an isolated source copy, including TypeScript, all route generation and service worker compilation. Webpack was used because Turbopack rejects the temporary copy's symlinked dependency directory. Existing middleware/Edge-runtime/Serwist dependency warnings remain.
- `git diff --check`: passed.

The production build exposed exported formatting helpers on the existing salary page; moved them to `app/dashboard/salary/format.ts` without changing formatting behavior. Guest public forms no longer display staff install/push prompts that obscure controls. The browser harness explicitly focuses each page before interacting because background Chromium targets suspended DOM operations.

Local guest migration applied. No production deployment, commit, push, or outbound campaign delivery performed. Loyalty is disabled by default; existing historical eligible stays can earn when staff enable the program. Automatic lifecycle message sending, live Google review synchronization and causal campaign revenue attribution remain separate integrations.

Preserved existing Sheet Referee task documents and unrelated contact-import changes.

## Follow-up: discovery and conversion

- Automatic booking guest creation/reuse with phone or email; both-contact conflict recognition in the booking form and prospect wording.
- Lead selection/conversion in Marketing and Guests, searchable/paginated preview, preserve source/opt-out, idempotent retry and direct profile links.
- Search across aliases, city, notes, preferences and linked sources/groups; new discovery segments and priority/value/recency/points/name sorting.
- Added discovery tests and extended isolated browser/API verification for both conversion entrances and automatic phone-only/email-only booking profiles.

Follow-up browser checks run the production build in the isolated copy to avoid development hot reload interrupting DOM interactions.

Follow-up verification passed: 13 unit tests, typecheck, isolated PostgreSQL integration and production browser checks. Verified phone-only/email-only creation, repeated-contact reuse, conflicting-contact rejection, conversion from both Guests and Marketing, preserved opt-out, discovery search/sorting and 320/768/1024/1440px layouts. No outbound messages sent.
