# Contact import provenance

## Decision
Use a `ContactImport` record per logical upload, with a single JSONB `metadata` column and a many-to-many relation to `UserLead`. The relation includes both new and previously stored contacts. Preserve the existing `UserLead.source` classification. A new import creates another snapshot rather than overwriting its predecessors.

| Option | Tradeoff |
| --- | --- |
| JSON on each lead | Simple but repeats device details thousands of times; a single object loses repeat-import history. An ever-growing array makes concurrency and queries harder. |
| Device table with a lead foreign key | Useful for managing actual devices, but browsers provide only resettable installation identifiers, and a device's IP/browser changes over time. One FK also loses multiple sources. |
| Shared import record with JSON + lead relation | Chosen: one snapshot per upload, preserves repeated sources, avoids duplicating context. Relational keys/indexes support history lookup without indexing every JSON field. |

## Contract and acceptance criteria
`POST /api/leads/import` retains its contacts contract and accepts optional `importContext: { id: UUID, method: 'phone_picker' | 'contact_file', files?: [{ name, format: 'vcf' | 'csv', bytes }], device?: { installationId?: UUID, persistence: 'local_storage' | 'import_only', language?, timezone?, displayMode: 'browser' | 'standalone' } }`.

The browser sends the same context id for all chunks and retries. The server captures the actor, time, User-Agent, low-entropy Client Hints and IP header itself, ignoring client attempts to supply authoritative fields. Validation bounds all strings, files and metadata. Legacy requests without context receive a new record with method `unspecified`. A context ID already used by a different actor, method, files or client device context returns 409. Metadata is the immutable first accepted request snapshot; later chunks connect to it.

Each request's contact mutations and provenance links commit in one database transaction. Retrying a contact link is idempotent. Existing leads retain their original source and status, while receiving the new provenance link. Existing records cannot be retrospectively assigned a device accurately and are left without history.

## Captured data and limitations
The installation ID is a random UUID in first-party localStorage. It changes after storage is cleared, differs between browser profiles, and is replaced with an import-only UUID if storage is blocked. It is not a hardware ID, IMEI, MAC address or authentication identity. The captured context describes the importing browser, never the imported contact's device. No precise geolocation or fingerprinting is requested.

IP is obtained only from request headers, not from the client JSON. Without configuration it is labelled `unverified_header` and must not be used for access control or identifying a person. Configure `CONTACT_IMPORT_IP_HEADER` to `x-real-ip`, `x-forwarded-for`, or `cf-connecting-ip` ONLY behind a trusted proxy that overwrites that header and prevents direct origin access; the metadata then labels it `configured_proxy_header`. X-Forwarded-For uses its first entry. Requests without valid IP headers save null. Shared networks, VPNs and changing connections make an IP unsuitable as a device key.

File names, IPs and identifiers are personal operational data: the import dialog discloses collection. History reads require an authenticated session. Deleting a lead cascades its join links; deleting an import cascades its links; deleting the user clears the relational actor reference. Delete expired ContactImport snapshots through the normal retention process (removing them does not delete leads). No additional metadata is written to logs or third-party services. No retention duration is imposed without a product policy.

## Implementation and verification
1. Add browser context capture and validated server metadata helpers, with unit tests.
2. Add models/migration, then transactional import event linkage and authenticated paginated history read, with stubbed database tests.
3. Attach one context to the UI upload queue; validate it across chunks/retries in the isolated browser harness.

Run `pnpm test:contacts`, `pnpm test:contacts:ui`, and `pnpm typecheck`. Generate the client with `pnpm exec prisma generate`. Apply migrations only through normal deployment; tests never connect to a live database.

References: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent ; https://www.prisma.io/docs/orm/v6/prisma-schema/data-model/relations ; https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql

Marketing lead cards expose lazy, paginated source history including uploader name, file names, browser ID and labelled IP. Uploader names reflect the current User relation, while timestamps and metadata remain snapshots.
