# Spec: guest-identity

Scope authorized by the user's “implement this” instruction on the approved capability map.

## Objective
Unify guest, booking and lead identity without silently merging conflicts.

## Success criteria
Contact aliases, audited merge, historical linking preview, preferences, notes, channel consent; cancelled stays excluded from completed-stay statistics.

## Commands
- `pnpm typecheck`
- `node --import tsx --test lib/guests/__tests__/*.test.ts`
- `pnpm test:sheet-sync`
- `pnpm build`
- `pnpm exec prisma validate`

## Structure and style
app/api/guests, lib/guests/identity.ts, lib/guests/insights.ts. TypeScript, Prisma/PostgreSQL, Next route handlers, Zod boundary validation, semantic Tailwind tokens.
Example: `const points = qualifyingPoints(booking, program);`

## Verification
Unit tests for decisions and abuse cases; local database integration checks for transaction/idempotency behavior; browser checks for loading, error, empty and responsive states. No new dependencies.

## Boundaries
Always: authenticate staff APIs, validate input, retain audit entries and original booking snapshots, ship schema with additive migration.
Authorized: additive schema and guest fields, local migrations, integration with existing providers.
Never: send campaigns as part of implementation, deploy production, overwrite unrelated working changes, merge conflicting identifiers automatically, reward Google reviews.

## Authorized follow-up

- A phone-only or email-only booking creates a profile; repeated normalized contacts reuse it. Both identifiers are checked together in the form and conflicting profiles are rejected server-side.
- Marketing and Guests expose selected lead conversion with preview, pagination/search, direct guest links, retained provenance/opt-outs and no inferred marketing consent.
- Discovery combines keywords across contact aliases, city, preferences, notes and linked sources/groups; filters profile gaps, expiring balances and contact eligibility, and sorts by explained action priority/value/stay recency/points/name.
