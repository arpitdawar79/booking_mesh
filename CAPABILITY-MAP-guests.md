# Unified guest management — capability map

Status: implementation authorized by the user on 9 October 2026. See SPEC-guest-*.md and tasks/guest-management.md.

## Outcome

Give the property team one guest workspace to recognize returning guests,
remember preferences, deliver benefits, recover poor experiences, and bring
guests back. Reuse the existing booking, marketing, email, WhatsApp, and cron
systems rather than create another disconnected contact list.

## Current foundation and gaps

- `Guest` stores contact details, identity information, address, and preferences;
  `Booking.guestId` links stays to it.
- Booking creation matches guests using an OR of raw phone/email. Conflicting
  phone and email matches need explicit resolution rather than picking the first.
- Guest detail statistics sum every booking, including cancelled bookings.
  Completed stays, future reservations, booked value, net payments, and refunds
  need separate definitions.
- Marketing uses a separate `UserLead` contact model with campaign history,
  tags, source, and opt-out state. It currently has no guest relation.
- Contact-import work already exists in the working tree, including phone
  normalization. Preserve and integrate it after review.
- Email already accepts `GOOGLE_REVIEW_URL`; existing post-stay messaging needs
  coordination with new feedback and review workflows to prevent duplicate sends.

## Module boundaries

| Module id | Responsibility | Depends on |
| --- | --- | --- |
| guest-identity | Canonical guest, normalized contact aliases, booking/lead linking, duplicate review and audited merge, preferences, tags, birthdays, communication preferences, timeline, accurate stay/payment summaries | — |
| guest-rewards | Configurable tiers and benefits, points/credit ledger, discounts and offer eligibility, referral attribution and rewards, booking redemption and refund reversals | guest-identity |
| guest-experience | Private post-stay feedback, staff follow-up and resolution, Google review invitations and independently tracked invitation state | guest-identity |
| guest-retention | Dynamic segments, explainable next actions, campaign audiences, personalized message drafts, birthday/stay-anniversary/win-back journeys, contact cooldowns, opt-out checks and delivery history | guest-identity, guest-rewards, guest-experience |
| guest-insights | Repeat-stay rate, returning guest revenue, reward liability, referral conversion, journey attribution, feedback trends, staff action queue and program settings workspace | guest-identity, guest-rewards, guest-experience, guest-retention |

Build order: guest-identity → guest-rewards → guest-experience → guest-retention → guest-insights.

## Proposed user experience

- Guest directory: search and filter by lifecycle, tier, tags, last stay,
  lifetime value, referral activity, and outstanding follow-up.
- Guest profile: contact details and aliases; preferences and staff notes;
  reservations and completed stays; payment summary; loyalty wallet and benefits;
  referral activity; feedback; messages; suggested next action with its reason.
- Comeback queue: high-value guests becoming inactive, first-time guests ready
  for a second stay, upcoming birthdays, unused rewards approaching expiry,
  and unresolved feedback requiring service recovery.
- Campaign composer: preview exact eligible recipients, personalize using
  profile data, explain exclusions, and inspect sent/failed messages.
- Program settings: staff configure tiers, earning rules, redemption limits,
  offer dates, referral rewards, and journey schedules.

## Proposed behavior to carry into module specs

- Use deterministic, explainable recommendations initially: stay recency,
  frequency, net spend, preferred season/room, reward eligibility, and feedback.
  Display the reason and source data. Do not present rule scores as AI predictions.
- Keep prospects distinguishable from actual guests while linking both to
  the same identity when verified. Imported contacts are not marketing consent.
- Normalize phone and email consistently across booking forms, edits, imports,
  sheet ingestion, guest APIs, and campaigns. Never merge on name alone.
  Conflicting identifiers enter a review queue. Preserve booking snapshots.
- Preview historical linking before applying it; leave ambiguous records
  unresolved and preserve a merge audit trail.
- Earn rewards only on qualifying completed, settled stays. Use an append-only
  ledger, unique earning/redemption keys, transactional balance checks, explicit
  expiry, and reversal entries for refunds/cancellations. Staff adjustments need
  a reason and actor.
- Make loyalty rates, tier thresholds, discounts, and referral bonuses
  configurable. Proposed membership labels: Member, Silver, Gold, Platinum.
  Do not activate financial rules until the property chooses the amounts.
- Attribute a referral before the referred guest's first qualifying stay;
  reject self-referrals and repeated claims; release rewards after settlement.
- Calculate discounts server-side with eligibility, caps, expiry, stacking rules,
  and a booking snapshot of the rule applied.
- Re-check communication eligibility immediately before each marketing send.
  Respect channel preferences, opt-outs, quiet hours, cooldowns, and daily caps.
  Marketing suppression must not accidentally disable essential booking messages.
- Keep outbound campaigns and new journeys in draft/preview mode until staff
  intentionally activate them. Reuse existing delivery providers and cron logs.
- Offer private feedback and a Google review invitation independently; do not
  condition public review invitations on a positive rating or reward a review.
  A link click is not evidence of a published Google review. Live Google review
  syncing is a separate integration requiring verified API access and documentation.
- Use expiring, scoped guest-facing tokens for feedback and preferences;
  authenticate staff routes and restrict merges, financial adjustments, and
  program settings by role. Do not expose identity-document data in campaigns.
- Measure attributed bookings using explicit campaign/referral/offer identifiers;
  do not claim that every subsequent booking was caused by marketing.

## Verification targets for subsequent specs

Identity conflicts and concurrent creation; mixed-format contact linking;
cancelled/upcoming/refunded stay statistics; duplicate historical-link runs;
concurrent reward redemption and repeated checkout/refund events; self-referral
and double attribution; expired and stacked offers; opt-out between audience
preview and delivery; repeated cron runs; feedback token expiry and unauthorized
access; responsive, keyboard-accessible guest and campaign workflows.

## Implementation

Implemented modules and activation instructions are documented in `docs/guest-management.md`.
Verification evidence is tracked in `tasks/guest-management.md`. The proposed map above records
the original scope; live Google review synchronization and causal campaign revenue attribution
remain separate integrations.
