# Spec: guest-retention

Scope authorized by the user's “implement this” instruction on the approved capability map.

## Objective
Turn profile history into explainable comeback actions and campaign drafts.

## Success criteria
Lifecycle segments, service recovery priority, birthday/anniversary/win-back suggestions, draft audience snapshot, consent and cooldown checks immediately before sending.

## Commands
- `pnpm typecheck`
- `node --import tsx --test lib/guests/__tests__/*.test.ts`
- `pnpm test:sheet-sync`
- `pnpm build`
- `pnpm exec prisma validate`

## Structure and style
lib/guests/insights.ts, app/api/guest-retention, existing marketing campaigns. TypeScript, Prisma/PostgreSQL, Next route handlers, Zod boundary validation, semantic Tailwind tokens.
Example: `const points = qualifyingPoints(booking, program);`

## Verification
Unit tests for decisions and abuse cases; local database integration checks for transaction/idempotency behavior; browser checks for loading, error, empty and responsive states. No new dependencies.

## Boundaries
Always: authenticate staff APIs, validate input, retain audit entries and original booking snapshots, ship schema with additive migration.
Authorized: additive schema and guest fields, local migrations, integration with existing providers.
Never: send campaigns as part of implementation, deploy production, overwrite unrelated working changes, merge conflicting identifiers automatically, reward Google reviews.
