# Tsuru production billing and database migration plan

**Tracker:** TSR-359 · **Date:** 2026-10-11 · **Status:** Draft technical plan; implementation not started.

This plan prepares the publicly available application for real Hacienda invoicing, with particular attention to sales-be, production configuration, organization credentials, document labeling, and migration from Supabase. It records the planning-session audit and the owner's decisions. Proposed implementation details still require review.

**Scope of this stage:** analysis and documentation only. This document does not authorize provisioning, deployment, credential changes, database migration, or production invoice emission. No such actions were performed during planning.

## 1. Confirmed decisions and outstanding choices

| Topic | Confirmed owner decision |
|---|---|
| Hacienda mode | Select sandbox or production **per organization**. Different organizations can use different modes in the same application. |
| Existing data | Migrate business data; exclude test invoices from the production dataset. |
| Database | Owner intends to provision **Lightsail managed PostgreSQL** and will report when ready. |
| Timing | Plan now; implement later. |

The following are recommendations, rather than additional owner decisions:

- Use a production application deployment and database for real businesses. That deployment can support both Hacienda modes. Keep development deployments unable to issue production documents.
- Keep production and sandbox credentials separate for each organization.
- Persist the environment on every fiscal document and background job when it is created. An organization changing its default must never redirect an existing document.
- Treat database connectivity, authorization, and durable invoice submission as gates before enabling production emission.

Still to resolve: a supported network path to the intended database; whether to preserve the current customer Cognito pool as the production identity source; final production domains; numbering continuity for each organization; and the precise migration inclusion rules for real orders and imported fiscal documents.

## 2. Audit scope and evidence limits

The audit covered the local backend and frontend working copies, shared billing library, deployment generators, configuration templates, database models and migration systems, offline POS flow, PDF pipeline, and read-only AWS configuration metadata.

The local services are separate repositories under this workspace. Some sales/PDF files contain pre-existing uncommitted changes. Source findings describe the inspected working copies, not proof that every change is deployed. Implementation must pin and record the source revisions and deployed image digests before making changes.

AWS findings below are a snapshot from **2026-10-11**, in the inspected account's **us-east-1** region. Secret values, fiscal credentials, and database business records were not retrieved. No Lambda invocation, invoice submission, infrastructure update, or database write was performed as part of the audit.

### Observed deployment configuration

| Area | Observation | Consequence |
|---|---|---|
| Runtime fleet | Application functions use development deployments, including `tsuru-dev-*` and the development management backend. | Public availability does not make the deployment a production fiscal environment. |
| SSM inventory | No `/tsuru/prod/` or `/tsuru/stag/` parameters were found. | Production configuration must be created explicitly. |
| Database secret inventory | Only the existing `tsuru/dev/database` Tsuru database secret was found. | Create a separate production secret after the new database is reachable and validated. |
| Fiscal encryption | The inspected fiscal key alias is `alias/tsuru-dev-fiscal-credentials`. | Provision and authorize a production key; changing an alias does not migrate existing ciphertext. |
| Hacienda endpoints | Development reception, validation, and history parameters point to the sandbox API. Sales authentication uses the staging OAuth realm and public staging client identifier. | Production endpoint templates exist in places, but runtime resolution is incomplete. |
| XML setting | The inspected sales `xml/generationMode` value is `live`. | This refers to the configured pipeline; it is **not evidence of production Hacienda mode**. |
| Logging | The inspected development sales API stage enables request data tracing. | Disable sensitive payload tracing before production credentials or real invoices use that gateway. |
| Capacity | The inspected account has a Lambda concurrency limit of 10, shared with other workloads. | Validate peak traffic and asynchronous worker capacity; request more capacity if required. |
| Email | SES production access and sending are enabled. | The older September SES sandbox blocker is no longer current; still validate sender identities and delivery. |

## 3. Whole-application dependency map

The migration affects more than sales-be because several backends share tables, identity, events, and configuration.

| Repository / area | Responsibility and production work |
|---|---|
| `be/management-be` | Organizations, users, membership/RBAC, shared platform configuration, Drizzle schema/migrations; preserve identifiers and align identity trust. |
| `be/store-be` | Customers, products, categories, orders, branches, terminals, and consecutives; coordinate numbering and migration ownership with billing. |
| `be/sales-be` | Shared fiscal library, credentials, sales submission, PDF, validation, notifications, history/import, and messaging; main implementation workstream. |
| `be/data-be` | Taxpayer and geographic/catalog data used by other services; bootstrap required shared data and production service configuration. |
| `be/support-be` | Support, request audit, and backend error reporting; production schema, access, and sanitized observability. |
| `be/public-be`, `be/blog-be` | Public/editorial content on the shared database; include their schemas/data or explicitly retain a separate database with matching configuration. |
| `be/cognito-templates` | Verification, password-reset, and invitation emails; production identity integration and email validation. |
| `fe/pos-system` | Organization settings, checkout, document lists, offline queues, and generated API configuration; show and enforce the fiscal context. |
| `fe/dashboard` | Separate administrator identity, gateway, hosting, and configuration; production administration and support access. |
| `fe/landing`, `fe/blog-site`, storefront templates/SDK | Public API consumers; update production endpoints and identity configuration wherever their backend dependencies move. |
| Root `Infrastructure` and deployment entry points | Shared identity, IAM, public API federation, and cross-repository deployment dependencies. |

Sales currently reads management-owned organization tables, store-owned branches/terminals/consecutives, and data-service geographic/catalog tables directly. **Moving only the sales connection to an empty database will break those dependencies.** Prepare the complete required schema/data set, or deliberately replace those dependencies with service contracts before separating databases.

The inspected live-sale pipeline generates the PDF before validation, then notifies the user; validation has a fallback path if PDF generation fails. PDF availability must therefore remain separate from Hacienda acceptance. Imported documents use a distinct path and must not be signed or submitted again automatically.

## 4. Findings that shape the implementation

Paths below are relative to the workspace. They are navigation references into standalone repositories, not files to copy back into this monorepo.

| Finding | Evidence | Required change |
|---|---|---|
| Infrastructure stage currently selects shared Hacienda URLs; per-service authentication settings can fall back to staging. | `be/sales-be/shared/jbiller_common/configuration/app_config.py`; `shared/jbiller_common/daos/hacienda_authentication_dao.py`; organization-configurations authentication DAO/service. | One explicit fiscal-environment resolver used by every synchronous and asynchronous operation; production configuration must fail closed. |
| Credential storage supports one Hacienda configuration per organization. | `be/sales-be/app/organization-configurations/src/models/organization_configuration.py`. | Separate profiles by organization and fiscal environment; retain only an active default on the organization. |
| Authentication resolution is duplicated and caches can use only the organization identifier. | `be/sales-be/app/{sales-api,document-validator,hacienda-history}/src/services/organization_token_resolver.py`. | Consolidate behavior; scope token/cache keys by environment and credential version. |
| Sales and history do not carry an explicit fiscal environment. Existing `foreign_environment` is not that field. | `be/sales-be/shared/jbiller_common/models/{sale,hacienda_historical_document}.py`; `hacienda/dtos/events/document_event.py`. | Add immutable document provenance and propagate it through events, queries, retries, and notifications. |
| Numbering uniqueness currently uses terminal and document type without fiscal environment. Branch synchronization also lacks that scope. | `be/sales-be/shared/jbiller_common/models/consecutive.py`; `hacienda/repositories/consecutive_repository.py`; `be/store-be/app/services/branch_sync_service.py`. | Coordinate allocator, schema, and synchronization changes; validate first-row creation races and existing production numbering. |
| An external submission can succeed before the database transaction commits. Queue publication also needs coordination with commit. | `be/sales-be/shared/jbiller_common/services/sale_service.py`; `app/sales-api/src/services/sales_pipeline.py`. | Persist submission intent, numbering, and signed XML before transmission; publish work through a transactional outbox and reconcile uncertain results. |
| POS offline sales can be replayed through the current API configuration without their original fiscal context. | `fe/pos-system/src/hooks/useCartFlow.ts`; `src/services/pendingSalesSync.ts`; `src/lib/db.ts`. | Persist and validate deployment, organization, fiscal environment, and configuration version; quarantine ambiguous legacy queues. |
| PDF context does not include fiscal mode; cached PDFs may be reused. | `be/sales-be/app/document-pdf-generator/src/services/{pdf_pipeline,html_service}.py`; shared PDF templates. | Label from document provenance, on every page; invalidate or regenerate unlabeled sandbox artifacts. |
| Existing `useFiscalMode` controls orders-only versus electronic billing. | `fe/pos-system/src/hooks/useFiscalMode.ts`. | Keep this separate from sandbox versus production selection. |
| Production credentials and certificate access require verified organization authorization, not just authentication or supplied user headers. | `be/sales-be/app/lambda-authorizer/src/validators/organization_auth_checker.py`; sales/configuration controllers and generated gateways. | Audit the actual deployed authorizer path; derive identity from verified claims and enforce membership plus action permissions. Existing custom-authorizer code alone is not proof of enforcement. |
| Deployment paths assume development in several places, share role configuration, and do not bootstrap missing production functions. | Sales/management/POS deployment workflows; sales pipeline update script and API template generator; root IAM templates. | Explicit stage selection, environment-scoped permissions, first-deployment sequencing, and immutable images. |
| API generators contain fixed custom-domain or identity configuration. | `be/sales-be/scripts/gen_api_template.py`; data-service generator; shared Cognito exports. | Parameterize production identity/domain bindings; avoid taking over a domain already owned by the development stack. |
| Database clients lack a consistent explicit TLS and connection-budget policy. | Sales shared database connection, store connection utility, management database configuration. | Validate TLS/CA behavior for the selected database and control aggregate connections from warm Lambda instances; encode credentials safely in connection URLs. |
| An empty database cannot safely be created by blindly running every existing migration tool. | Management Drizzle journal/manual SQL; service-specific Alembic histories. | Produce a table-ownership manifest and rehearse a supported bootstrap at pinned revisions. |

Existing tracker dependencies include TSR-002/003 (credentials and OAuth), TSR-004 (fiscal sources/numbering), TSR-007 (trusted user attribution), TSR-030/031 (backend authorization), and TSR-102 (migration baseline). TSR-359 coordinates production readiness without claiming those items are already resolved.

## 5. Target environment contract

Use three separate concepts throughout the system:

| Concept | Proposed values | Authority |
|---|---|---|
| Application deployment | `dev`, `stag`, `prod` | Infrastructure and build configuration. Normalize existing inconsistent stage spellings. |
| Organization's default fiscal environment | `sandbox`, `production` | Backend-managed setting, changed by an authorized organization administrator. |
| Document's fiscal environment | `sandbox`, `production`, or explicitly unresolved for legacy/imported records | Persisted when created/classified; immutable once fiscal issuance begins. |

Recommended policy: only the production application may submit to Hacienda production. It can still issue sandbox documents for onboarding/testing. A browser cannot choose arbitrary Hacienda URLs, override an organization permission, or promote an old queued document to production.

### Proposed model changes

These are logical contracts; finalize names and DDL against the repository schemas before implementation.

- **Organization fiscal profile:** unique `(organization_id, fiscal_environment)`; environment-specific username, encrypted password, signing certificate/PIN, certificate metadata, credential version, validation status, and history-sync state. Ordinary reads return metadata only.
- **Organization default:** selected fiscal environment plus a settings version used to detect stale checkout/settings state.
- **Fiscal document:** fiscal environment, credential-profile reference/version, immutable issuer snapshot, and submission provenance. Keep POS/import origin and `foreign_environment` semantics separate.
- **Numbering:** include fiscal environment in allocator scope and constraints. Production counters must be initialized from verified production continuity, never blindly reset or copied from test counters.
- **History and references:** environment-aware uniqueness and lookup. Credit/debit notes and related document actions must validate the referenced document's environment.
- **Background events/outbox:** document ID, organization ID, fiscal environment, profile/configuration version, and stable retry/deduplication identifiers. Workers resolve from this context, never from the organization's latest default.

Do not derive the fiscal environment from the clave, XML content, a missing API result, or the current organization setting alone. Legacy/imported records need reliable provenance or explicit review.

### Credentials and switching behavior

1. Default migrated organizations to sandbox or a blocked/unconfigured state; do not auto-enable production.
2. Enroll and validate production credentials independently. An omitted password means “keep this profile's password,” never “reuse the sandbox password.”
3. Require an authorized administrator, a complete production profile, and readiness checks before changing the default to production. Record actor, time, previous mode, new mode, and profile version without logging secrets.
4. Invalidate scoped token caches on credential rotation. Keep credentials needed for outstanding documents accessible under an explicit retention/rotation policy.
5. Preserve existing documents and queued jobs in their original environment when the default changes. A stale checkout or queued request must be rejected or reviewed, not silently retargeted.

The existing KMS encryption design can be extended. Use a production key with organization-bound encryption context and controlled runtime access. Prefer enrolling new production credentials. If encrypted records must move between keys, implement an audited decrypt/re-encrypt operation; copying ciphertext and changing the configured key is insufficient.

## 6. Configuration and infrastructure design

### SSM and Secrets Manager

Keep application deployment names in the SSM namespace. Within a production deployment, define explicit fiscal profiles. Suggested layout:

```text
/tsuru/prod/platform/...
/tsuru/prod/commondata/aws/...
/tsuru/prod/<service>/...
/tsuru/prod/hacienda/environments/sandbox/...
/tsuru/prod/hacienda/environments/production/...

Secrets Manager: tsuru/prod/database
KMS alias: alias/tsuru-prod-fiscal-credentials
```

Each shared fiscal profile supplies reception/validation/history base URLs and OAuth token URL/client identifier. Decide one canonical parameter contract and update templates and all consumers together. Existing per-app production mappings alone do not fix downstream shared-library defaults. Verify settings-file packaging and the `commondata` fallback path for every worker.

Organization passwords, signing certificates, and PINs remain encrypted organization-profile data; do not create a shared production credential or put them in frontend configuration. Store database connection details only in the production database secret and grant each runtime only the access it needs.

Official Hacienda v4.4 documentation describes production reception at `https://api.comprobanteselectronicos.go.cr/recepcion/v1/`, the `rut` OAuth realm, and public client identifier `api-prod`. It documents a sandbox reception path that differs from the hostname currently configured in AWS. Recheck supported endpoints during implementation and verify the existing sandbox route before changing it. See the [official v4.4 annexes](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf).

### Production deployment checklist

- Create stage-scoped SSM, database secret, fiscal KMS key, private document storage/delivery configuration, messaging queues/DLQs, notifications, logs, and alarms.
- Scope deployment/runtime IAM to production resources. Development functions must not read production credentials or submit with production profiles.
- Separate infrastructure creation from later image updates: current update scripts can skip missing functions.
- Standardize on immutable image digests and record a release manifest across services. A mutable `latest` tag is insufficient for a reproducible cutover.
- Parameterize API domains, Cognito references, CORS origins, and public/admin gateway bindings. Keep the administrator control plane separate.
- Make frontend build configuration stage-explicit. Missing production API or identity parameters must fail the build/startup rather than fall back to development.
- Disable sensitive API body tracing and redact passwords, PINs, certificates, tokens, and unnecessary invoice/customer data from logs.
- Check Lambda concurrency, database connections, queue throughput, visibility timeouts, retries, and email capacity together.

## 7. Lightsail managed PostgreSQL: connectivity gate

**The database choice is recorded as requested, but a private connection from the existing Lambda backends is not yet established.**

AWS documents that a Lightsail managed database in private mode is accessible to Lightsail resources and cannot use the usual VPC-peering route to connect an EC2 instance. Lightsail instance peering is a different capability and does not establish a supported private Lambda-to-managed-database path. Public mode exposes the database endpoint to internet connectivity, and AWS recommends limiting its use. See [managed database FAQs](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-faq-databases.html), [database public mode](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-configuring-database-public-mode.html), and [Lightsail instance VPC peering](https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-set-up-vpc-peering-with-aws-resources.html).

Before migrating or connecting production Lambdas, verify a supported, acceptable access design against current AWS capabilities. Do not assume that attaching Lambda to a VPC or enabling Lightsail peering solves managed-database access. If private access is required and Lightsail managed PostgreSQL cannot provide it, review RDS PostgreSQL as an alternative with the owner. No database substitution or provisioning is approved by this plan.

When the owner reports the database ready, collect metadata through a secure configuration process:

- Region, PostgreSQL engine/version, endpoint/port, database name, and documented connectivity mode.
- TLS requirements, trusted CA, and verified certificate/hostname behavior for every application driver.
- Runtime roles and a separate migration role with the required extensions/schema permissions.
- Availability option, backup retention, restore procedure, storage, connection limit, and an agreed recovery target.
- A successful connectivity check from the actual deployment path, followed by a connection-budget/load check.

Do not paste database passwords into this document or chat. Populate the secret through the agreed secure process once connectivity is settled.

## 8. Database bootstrap and migration

### Schema ownership and identity

Create a table-ownership manifest before running migrations. Known migration histories include:

| Owner | Current migration mechanism / version table |
|---|---|
| Management | Drizzle journal plus historical manual SQL; repair/verify the reproducible baseline. |
| Store | Alembic, `alembic_version`; shared-table exclusions need review. |
| Sales | Alembic, `alembic_version_auth`; depends on store/data tables it does not own. |
| Data services | Alembic, `alembic_version_data_services`. |
| Support | Alembic, `support_alembic_version`. |
| Content | Alembic, `alembic_version_content_api`. |
| Blog | Alembic, `alembic_version_blog_api`. |

Validate the pinned baseline on an empty rehearsal database. Do not blindly run schema push tools or stamp migration versions without checking the actual schema. Coordinate shared organizations, catalog, and numbering tables so one service cannot alter or recreate another's ownership unexpectedly.

Preserve organization, user, branch, terminal, customer, product, and membership identifiers where possible. Cognito identities/passwords are not migrated by copying PostgreSQL rows. Recommended option to review: retain the existing real-user pool as production identity and create isolated development identity. If replacing the customer pool, define a separate account migration/sign-in plan and subject mapping. Recheck gateway, AppSync, invite, email, and public identity trust accordingly.

### Data inclusion policy

| Data | Proposed treatment |
|---|---|
| Businesses, users, memberships, permissions | Migrate, preserving relationships and verifying Cognito subject mapping. |
| Customers, products, prices, categories, branches, terminals, business settings | Migrate after validating real versus fixture records and catalog dependencies. |
| Geographic/taxpayer/reference catalogs | Bootstrap the required datasets and verify shared foreign keys. |
| Real orders, stock movements, payments, balances | Migrate under an explicit business-data rule; reconcile effects and links to excluded test invoices. Do not blindly cascade-delete or replay billing. |
| Test/sandbox invoices and associated fiscal artifacts/state | Exclude from the production dataset; retain the source/archive as appropriate. Exclude their queue/retry/deduplication and reporting effects too. |
| Existing genuine fiscal documents/imports | Classify from reliable provenance and include only verified production records under an agreed rule. Do not automatically resubmit imports. |
| Credentials and tokens | Enroll production credentials separately. Do not promote sandbox secrets, OAuth tokens, or cached authentication state. Any retained sandbox profile requires an explicit encryption-key migration. |
| Production consecutives | Establish continuity per issuer/branch/terminal/document type from authoritative existing records. A clean database does not imply numbering starts at one. |
| Public content, blog, support/audit data | Decide inclusion/retention explicitly and keep each service connected to its intended schema/database. |
| Files and media | Inventory document XML/PDFs, organization assets, and content media; preserve allowed references and production access controls. |

Rehearse export, filtering, import, and reconciliation before cutover. Verify counts by entity/organization, foreign keys, identities, representative business totals, numbering, and file references. Produce a rejected/ambiguous-record report for review.

For cutover, agree a write-freeze or an explicitly designed final-delta process; capture a recovery snapshot; rerun the approved import; reconcile; then switch the coordinated backends and frontend. Never allow two independent database copies to allocate production numbering for the same issuer.

## 9. Backend and document reliability

### Durable submission before enabling production

The existing submission/commit failure window is material for real fiscal documents. Implement a bounded issuance state machine:

1. Authenticate and authorize the caller; validate organization/profile/environment and idempotency scope.
2. Reserve the consecutive and persist the document intent, environment, issuer/profile snapshot, and durable signed XML reference before any external submission. Define recovery for failures during signing/storage.
3. Commit an outbox entry with the durable document state. A publisher dispatches it after commit with safe retries.
4. A worker transmits the same document identity/XML to the pinned Hacienda environment and records the reception result.
5. On timeout or an uncertain external result, reconcile the same clave against the same environment before any resend; never allocate a fresh consecutive merely to retry.
6. Validation records the final result; notification and reporting consume the durable state with idempotent handling.

Finalize the API response contract alongside this change: submission may return a processing state while the document proceeds asynchronously. Preserve compatibility intentionally and update POS handling/tests together.

Hacienda HTTP 202 means reception for processing, not final acceptance. Keep submitted, processing, accepted, and rejected states distinct in both API and UI. See the [official reception API documentation](https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html).

### Background processing and reporting

Update submission, polling, history sync, imports, PDF generation, email, resend/status actions, and user notifications to use immutable document context. Include environment in relevant cache, deduplication, history, and query scopes. Define behavior for legacy in-flight events before deploying new consumers.

Fiscal reporting and production document lists must exclude sandbox totals by default. Make sandbox filtering explicit. Keep imported-document provenance and external references intact. Review production document download authorization and storage delivery rather than assuming an existing public CDN URL is suitable for all fiscal artifacts.

## 10. POS and PDF behavior

### Application settings and checkout

- Add a clearly labeled organization setting for **Hacienda: Pruebas / Producción**, with separate credential setup/status for each profile.
- Show the active fiscal environment in checkout and document lists/details. Production activation requires backend readiness and explicit administrator action.
- Keep the existing orders-only/electronic mode separate. An organization with an electronic profile can still be using sandbox.
- Version settings and reject a stale checkout when its fiscal context changed. The backend remains authoritative.
- Scope browser caches, carts, and queued sales by application deployment and organization; pin fiscal context where issuance is intended. Define an upgrade/quarantine path for legacy pending sales.
- When changing application deployment/database, prevent old development/offline sales from being submitted automatically to production. Review pending work before any explicit recreation.

### PDFs and delivery

Use the document's persisted environment, including for regeneration, downloads, emails, and imports. Proposed sandbox wording:

> DOCUMENTO DE PRUEBA — SIN VALIDEZ FISCAL

Display it prominently on every page and in an appropriate footer. Verify multi-page layout and readability. Review the existing fiscal/legal footer against the current v4.4 requirements rather than leaving an unconditional fiscal-validity statement on sandbox documents.

Make sandbox labeling independent of Hacienda acceptance status. A production document that is processing or rejected must communicate its actual state; it must not receive a sandbox label merely because acceptance is pending.

Version PDF rendering/cache behavior and regenerate affected sandbox PDFs so an existing cached URL cannot bypass the label. Include sandbox context in email subject/body and document previews as appropriate.

## 11. Implementation sequence and ownership

All phases below are future work. Do not enable production emission until the relevant gates pass.

| Phase | Work | Exit condition |
|---|---|---|
| 0 — Decisions and release baseline | Resolve database connectivity and identity/domain choices; pin repositories/deployed artifacts; inventory in-flight/offline work and table ownership. | Reviewed implementation contracts and a viable database path. |
| 1 — Production safety prerequisites | Enforce verified identity/organization permissions, protect credential/certificate access, sanitize logging, and implement durable submission/outbox recovery. | Negative authorization and submission-failure tests pass; no known irreversible-send/rollback gap. |
| 2 — Shared fiscal model | Add profiles, immutable document/event environment, environment-scoped numbering/history/cache keys, migrations, and shared resolver. | Backend contracts work end to end in sandbox with mixed organization modes and safe legacy handling. |
| 3 — Consumers and product experience | Update every worker, store synchronization, POS settings/checkout/offline behavior, PDFs, email, history/import, and reporting. | No operation follows a changed organization default for an existing document; sandbox artifacts are clearly labeled. |
| 4 — Production infrastructure and rehearsal | Prepare reviewed infrastructure/configuration changes; bootstrap the target rehearsal schema; run filtered migration and recovery rehearsal. | Production configuration is complete, connectivity/TLS/capacity verified, data reconciliation approved. |
| 5 — Coordinated cutover | Freeze/reconcile final data, deploy pinned services/configuration and POS, verify identity and business workflows with production emission still blocked. | New database and complete application work correctly; no stale offline/queue replay. |
| 6 — Controlled activation | Enroll one organization's production credentials; verify numbering/readiness; enable and observe an explicitly authorized genuine transaction. | Reception, final verdict, PDF, delivery, reporting, and support visibility verified before further organizations are enabled. |

Infrastructure templates and migration tools should be prepared and reviewed before any later execution approval is sought. The owner can provision the database independently, but its creation does not satisfy the connectivity or fiscal-readiness gates by itself.

## 12. Acceptance and verification matrix

Use sandbox, fakes, and fault injection for automated testing. A later production pilot must use an explicitly authorized genuine business transaction; do not issue fictitious production invoices as a test batch.

| Area | Required evidence before activation |
|---|---|
| Environment resolution | Two organizations can use different modes; no cross-environment URL, credential, token, or cache reuse. Missing production configuration blocks issuance. |
| Switching/rotation | Default changes and credential rotation leave existing documents/jobs pinned; stale checkout requests are detected. |
| Authorization | Another organization's user and users lacking fiscal-admin/issuance permissions cannot switch modes, change/read protected credentials, download certificates, or emit on its behalf. Spoofed user headers do not change identity. |
| Numbering | Concurrent requests, including first-row creation, cannot duplicate counters; production continuity is preserved; retries reuse the same document identity. |
| Durability | Failures before/after commit, queue publish, external timeout, reception, and worker restart recover without missing or duplicated fiscal documents. |
| Events/history/import | Old events have an explicit compatibility policy; imports are never automatically resubmitted; history/status/notes cannot cross environments. |
| Offline POS | Old deployments, legacy queues, organization changes, and mode changes cannot silently promote a queued test sale into production. |
| PDF/email | Every page of sandbox PDFs is labeled, including cached/regenerated/imported cases with known provenance; delivery shows the correct environment and actual fiscal status. |
| Reports | Sandbox documents do not inflate production fiscal totals; production imported records and references follow the agreed policy. |
| Database | Actual Lambda path connects with verified TLS; schema bootstrap and filtered migration pass relationship/count/identity/file checks; connection limits and recovery are tested. |
| Infrastructure | No domain/identity collisions; development cannot read production secrets; sensitive payloads are absent from logs; queues/DLQs/alarms and capacity support the expected workload. |
| Application regression | Sign-in, invitations, business/catalog reads, orders, admin/support, and dependent public-content services work after the coordinated cutover. |

## 13. Rollout controls and recovery

Begin with all organizations blocked from production issuance. Enable one verified organization, observe its full lifecycle, then expand deliberately. Track environment-specific submission/validation failures, pending age, duplicate attempts, outbox backlog, DLQs, token errors, database saturation, and PDF/email failures.

Provide a server-side control to stop new production emission without retargeting documents. Continue safe status reconciliation and recovery for already submitted documents in their original environment.

Once a production document has been submitted, reverting code is different from reverting fiscal state. Do not point traffic back to an old database snapshot with stale production counters or lose the durable submission record. Recovery must preserve issued claves, signed XML, submission outcomes, and numbering continuity. Reconcile external outcomes before resuming emission.

## 14. Pending decisions and execution checklist

### Decisions to settle before infrastructure execution

- [ ] Verify a supported, acceptable Lambda connectivity design for Lightsail managed PostgreSQL; review an alternative with the owner if necessary.
- [ ] Confirm database version, region, TLS, availability, backup/restore, and connection budget.
- [ ] Decide customer identity preservation/migration and production domain ownership.
- [ ] Approve final schema ownership/baseline and migration inclusion rules, particularly real orders, stock/payment effects, imported fiscal records, and assets.
- [ ] Confirm production numbering continuity and authorized administrators for the initial organization.
- [ ] Review the technical contracts, sandbox wording/legal footer, release gates, and cutover window.

### Future implementation milestones

- [ ] Production authorization, logging, and submission durability gates complete.
- [ ] Shared environment/profile/numbering/event contracts migrated and adopted by every consumer.
- [ ] Organization settings, offline handling, document views, PDF/email labeling, and reports complete.
- [ ] Production SSM, secret, KMS, messaging, storage, identity/API configuration, and capacity prepared and reviewed.
- [ ] Empty-database bootstrap, filtered migration, reconciliation, and recovery rehearsal passed.
- [ ] Coordinated cutover completed with production emission initially blocked.
- [ ] First organization's credentials and numbering verified; genuine transaction authorized and observed through final status.
- [ ] Further organizations enabled only after pilot acceptance and operational readiness.

## 15. Official references

- [Hacienda v4.4 annexes and structures](https://www.hacienda.go.cr/docs/ANEXOS_Y_ESTRUCTURAS_V4.4.pdf): environment/authentication details and fiscal structures. Recheck the current revision during implementation.
- [Hacienda reception API](https://www.hacienda.go.cr/docs/ComprobantesElectronicosAPI.html): reception and status behavior.
- [AWS Lightsail managed database FAQs](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-faq-databases.html): access and managed-database constraints.
- [AWS Lightsail database public mode](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-configuring-database-public-mode.html): public connectivity behavior.
- [AWS Lightsail instance VPC peering](https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-set-up-vpc-peering-with-aws-resources.html): distinguish instance networking from managed database access.

The [master roadmap](tsuru_roadmap.md) remains the living status tracker. Update this plan when decisions change; record implementation/deployment evidence in the tracker without marking proposed work as shipped.
