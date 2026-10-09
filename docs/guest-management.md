# Guest management

The guest directory and profile are the shared workspace for bookings, loyalty, referrals, feedback and marketing contacts. Open `/dashboard/guests`; managers configure the program at `/dashboard/guests/program`.

## What the team can use

- Search profiles and filter prospects, upcoming stays, first-time/returning guests, inactive guests, birthdays, available rewards and service recovery. Metrics count completed stays separately from reservations and cancelled stays; net collections subtract refunds and INR is separated from other currencies.
- Save room preferences, staff notes, birthday, city, tags and channel consent. Previous contact details remain aliases. Conflicting phone/email identities require review; managers can merge duplicates with history and an audit entry.
- Preview and select historical bookings and imported contacts for linking. Contacts without stays remain prospects. Importing or linking a contact does not grant marketing consent.
- Configure Member, Silver, Gold and Platinum tiers, benefits, points earning, referral bonuses, expiry, redemption value and discount caps. Managers can adjust points with a reason, apply one eligible benefit to an upcoming booking and reverse it before completion.
- Attribute referrals before the new guest's first reservation/completed stay. Award the referrer after the first qualifying completed, settled stay; refunds/cancellations reverse the award.
- Prepare expiring private feedback links and communication preference links. Feedback requesting help or rated 1–3 appears in the service recovery queue, with staff resolution notes. Google review invitations remain independent of private ratings and carry no reward.
- Review explained suggestions for a second stay, win-back, birthdays, stay anniversaries and expiring rewards. Preview personalized campaign audiences and save drafts into the existing Marketing workspace. Variables: `{{name}}`, `{{first_name}}`, `{{tier}}`, `{{points}}`, `{{preferred_room}}`, `{{referral_code}}`.

## Activation and deployment

The additive migration is `prisma/migrations/20261009150000_unified_guest_program/migration.sql`. It preserves old guest records and defaults marketing consent to false. It has been applied to the local development database. Production deployment is separate; apply pending migrations with Prisma's normal migration deployment workflow and regenerate the client before starting the new application and cron bundle.

The loyalty program starts disabled. Review the proposed rates in Program settings and enable it deliberately. Enabling also allows the daily reconciliation job to award eligible historical linked stays at the configured initial rate. An already awarded stay retains its earning rate when settings change.

Set `APP_BASE_URL` to the public application origin for guest-facing links. Configure `GOOGLE_REVIEW_URL` to an HTTPS review destination. Links expire after 30 days, are scoped to feedback or preferences, are stored as hashes and can be submitted once. Staff can prepare another preferences link when needed.

The `guest-program` job runs at 06:15 Asia/Kolkata in the existing cron runner. It reconciles booking rewards, expires unspent points and matches existing guest/lead contacts. It sends no new journey messages. Campaign drafts are sent manually through the existing Marketing workflow and delivery providers; this implementation has sent no messages.

## Financial and contact rules

Only completed, checked-out, settled INR stays earn points. Redemptions lock the guest wallet and booking, apply one points/tier/offer benefit, respect caps and remaining balance, update the invoice and preserve the rule snapshot. Repeated reconciliation is safe. Refunds/cancellations append reversal entries; redeemed earnings can create debt against future points. Cancelled redemptions restore invoice value and return points once. Price changes with an active benefit require reversing that benefit first. The checkout cron no longer creates fictional cash payments or marks an unpaid invoice as paid merely because checkout occurred.

Guest-linked marketing requires WhatsApp consent, an available phone, active linked contact status, no do-not-contact flag and an elapsed contact cooldown. Eligibility is checked again before delivery. Guest campaigns respect 09:00–20:00 India time and a shared daily cap of 50 guest delivery attempts. Public opt-out also suppresses linked marketing contacts. Essential booking communications retain their existing flow.

Recommendations use explicit rules; no predictive AI score is claimed. This version does not import live Google reviews, automatically send new lifecycle campaigns, or attribute every later booking to marketing. Google review link preparation is recorded, but a click is not a verified published review. Campaign delivery history remains in Marketing; financial/referral history is attached to the guest.

## Verification

- `pnpm typecheck`
- `pnpm test:guests` — pure eligibility, statistics, expiry, identity conflicts, caps, suppression and India-calendar rules.
- `pnpm test:guests:db` — creates and drops its own local test database, applies the real migration over a legacy guest, and checks identity races, concurrent redemptions, reversal/expiry behavior, referrals, offers, scoped tokens and audited merges.
- `pnpm test:guests:ui` — builds and runs an isolated production copy with a local test database and synthetic sessions on port 4041; exercises responsive guest pages, campaign drafts, feedback, independent reviews, staff follow-up, opt-out and API role restrictions. Requires installed Puppeteer and local PostgreSQL CLI tools. It sends no messages.
- `pnpm build:cron` and production Next compilation.

The directory computes derived guest metrics across matching profiles; large installations should move those metrics into indexed aggregate projections before significantly scaling guest volume.

## Booking recognition, lead conversion and discovery

Saving a booking automatically creates or reuses its guest profile from either phone or email. Phone formats and email case are normalized; entering both identifiers checks both and rejects conflicting identities. The booking form explains automatic profile creation and recognizes existing prospects separately from returning guests. Matching marketing leads can be linked by email as well as phone.

Managers can select leads in **Marketing → Leads**, preview conversion and convert the selection into guest profiles. Already converted leads link to their guest profile. **Guests → Convert leads** provides search, pagination, select-all for the current page and a preview of new prospects versus existing matches. Conversion keeps the lead, import history, city, tags and opt-outs. Repeated conversion does not create another profile. Conflicts remain visible for review.

Guest discovery accepts combined keywords, for example `Delhi vegetarian family`, and searches cities, preferences, internal notes, tags, prior phone/email aliases and linked lead sources/groups. Phone-only searches accept country codes, local mobile numbers and formatted numbers. Staff can filter **Expiring rewards**, **Profile gaps** (missing city, preferences or both contact channels), and **Ready to contact** (consent, suppression and cooldown rules). Sorting by action priority places service recovery ahead of marketing actions; value, recent stay, points and alphabetical ordering support other workflows. Actual sending still performs its own quiet-hour and daily-cap checks.
