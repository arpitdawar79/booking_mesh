# Phone contact import

## Objective and acceptance criteria
Authenticated Marketing dashboard users can select phone contacts where the browser supports the Contact Picker API, or upload complete VCF/CSV exports on any device. Review and select unique phone numbers before saving leads. No contact upload occurs before the user presses Import. Imports do not mark leads as WhatsApp users or grant marketing permission.

## Implementation plan
1. Correct the native picker contract and handle unavailable APIs and dismissal.
2. Preserve grouped vCard fields, CSV alternate numbers, and full display names.
3. Allow multiple exports, preview selection, and resumable batches. Prevent dismissal during active operations.
4. Report real database failures, test parsers/preparation, typecheck, and verify the UI where possible.

## Structure and conventions
`components/leads/phone-contact-import.tsx` owns the dialog. `lib/contact-file-parsers.ts` parses exports; `lib/contact-import.ts` normalizes preview data. `app/api/leads/import/route.ts` authenticates, validates, and saves leads. Use existing React state, semantic Tailwind tokens, and TypeScript, e.g. `const selected = contacts.filter(contact => selectedPhones.has(contact.phone));`.

## Verification commands
- `node --import tsx --test lib/__tests__/*.test.ts lib/sheet-sync/__tests__/*.test.ts`
- `pnpm test:contacts:ui` (isolated Chromium with synthetic data and API)
- `pnpm typecheck`
- `pnpm dev` (port 4001)

Always validate inputs and deduplicate phone numbers; never read contacts silently or claim a web API can read the whole address book. No new package is needed. Database migration deployment is a separate production operation.

## Browser limitations and export guide
The Contact Picker API requires a secure top-level page and user interaction. It supports multiple selected contacts, not programmatic selection of the entire address book. Installing a PWA does not change that restriction.

For a complete address book, export all contacts from the Android Contacts app as VCF, export a list from the iPhone Contacts app as VCF, or export Google Contacts as Google CSV/vCard, then upload the export(s). The browser preview retains all usable phone numbers and saves the selected ones as leads. Bare Indian mobile numbers receive country code 91, matching the existing lead storage convention.

Reference: https://developer.chrome.com/docs/capabilities/web-apis/contact-picker

The pending `20261009000000_add_phone_book_lead_source` migration must be applied through the normal database deployment before imports are enabled in production. A physical Android device is required to verify the actual OS contact picker; the isolated browser test simulates its contract.
