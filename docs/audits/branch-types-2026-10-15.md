# Branches and branch type management — 2026-10-15

Implemented in the standalone POS, store-be and management-be working copies.

- Renamed user-facing station/puesto terminology to Branches/Sucursales in English and Spanish. Branch routes use `/dashboard/branches`; legacy list/terminal links redirect while preserving their query strings.
- Added Internal Administration → Branch types with organization-specific list/search, add/edit and permission-controlled deletion. Type codes are immutable. Save/load/conflict errors are visible; pending saves prevent dismissal; changing organizations closes drafts and confirmations.
- Corrected the branch form's Session type label to Branch type. Removed the hardcoded stand/restaurant fallback, used catalog types for new branches and removed session-kind filtering of custom branch types.
- Added store-be action guards for branch type endpoints and catalog-only branch validation. Automatic branch registration persists an editable General type only when a catalog is absent.
- Applied management migration `0027_branch_types_admin.sql` to dev, then reapplied it to verify idempotency. All five existing organizations have the surface available. Owner/admin/platform-admin retain their existing action limits; unrelated and custom role grants are preserved.
- Applied store-be migration `20261015_branch_type_catalog` to dev, restoring three catalog entries referenced by existing branches. Verified zero unresolved branch type references. Existing catalog presentation fields were preserved.

Validation: POS full suite **737 passed**, style policy, TypeScript and production build; management-be **226 tests passed** and TypeScript; store-be **38 focused tests passed** (CRUD DTO/service validation, action denial, catalog creation/reuse, organization isolation and registration). The PostgreSQL concurrency fixture could not run through the shared database's transaction pool (session search paths/prepared statements); stopped it and verified no test schemas remain. Registration/catalog persistence was instead verified against a disposable local SQLite database. No PostgreSQL concurrency pass is claimed.

## First Hacienda credentials and online rollout

The first valid credential save commits the encrypted credentials before publishing `SAVE_DOCUMENT_HISTORY`, preventing the worker from racing the database transaction. Invalid credentials are rejected; a failed save never queues history. Only an acknowledged SQS request sets `historical_requested`. A failed enqueue keeps credentials saved, leaves the flag false and returns 503 so saving again retries.

A confirmed empty first history page, including HTTP 204, sends `SAVE_BRANCHES` with branch 1, terminal 1 and no document counters. Empty continuations do not fabricate another default; first-page upstream failures remain retryable. SNS publication must be acknowledged, so a failed default-branch delivery retries through SQS.

Sales-be's seven isolated unit suites pass: **356 tests passed**, 2 optional database tests skipped. New checks cover credential commit ordering, invalid credentials, enqueue failures/retry, empty-history wire payload and unacknowledged branch delivery.

All four code repositories were pushed and deployed successfully:

| Repository | Commit | Successful workflow |
|---|---|---|
| POS | `dbae43e` | [38850197799](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38850197799) |
| Store | `1278e34` | [38850196399](https://github.com/chepelcr/tsuru-store-be/actions/runs/38850196399) |
| Management | `54cabd3` | [38850171374](https://github.com/chepelcr/tsuru-management-be/actions/runs/38850171374) |
| Sales/Hacienda | `99161bc` | [38850245311](https://github.com/chepelcr/tsuru-sales-be/actions/runs/38850245311) |

Live checks: history and credential Lambdas plus store-be are Active / Successful, use the newly built image digests and return the expected warmup response. The SSM-owned history queue triggers the worker; the branches topic subscribes the store queue; the store queue triggers branch services. IAM simulation confirms credential-service SQS send and history-worker SNS publish permissions. All five organizations retain branch-type module availability; zero unresolved branch catalog references and zero leftover test schemas.

Authenticated browser verification confirmed Sucursales and Tipos de sucursal under Administración Interna, the organization-specific catalog, the working type editor with immutable code, and the branch form's Tipo de sucursal selector/management link. No live credentials were changed or fiscal documents submitted during verification.

