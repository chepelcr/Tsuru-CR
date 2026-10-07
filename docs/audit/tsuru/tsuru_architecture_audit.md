# Tsuru Ecosystem — Technical Audit: Multi-Tenancy (Phase 6) & Architecture (Phase 7)

**Auditor role:** Technical Auditor | **Date:** 2026-06-11
**Scope:** BeautyMarket monorepo (`server/`, `landing-client/`, `templates/pos-system/`), `cross-app-be`, `biller-apps/auth`, `biller-apps/data-services`.
**Method:** Discovery data cross-verified by direct source reads. Every load-bearing claim below was confirmed against the cited file; corrections to discovery data are flagged **[CORRECTED]**.

---

## PHASE 6 — MULTI-TENANCY AUDIT

### 6.1 Tenant model

One tenant concept across the whole ecosystem: the **organization** row in the shared PostgreSQL `organizations` table, owned by the BeautyMarket Node backend (`server/src/entities/Organization.ts`). Every other system references it:

| System | Tenant key | Carried in | Auth source |
|---|---|---|---|
| markets-api (BeautyMarket `server/`) | `orgId` path param | `/api/users/:userId/organization/:orgId/...` (`server/src/routes.ts:64`) | API GW Cognito authorizer only |
| cross-app-be (orders-api) | `organization_id` path param; `company_id` on cross-docking tables | `/api/organizations/{organization_id}/...` | API GW Cognito authorizer + `claims.sub`→`x-user-id` mapping |
| biller-apps/auth sales-api | `organization_id` path param | `/api/organizations/{org}/sales...` | API GW Cognito authorizer; `x-user-id` client-supplied |
| biller-apps/auth lambda-authorizer | org UUID extracted from path regex | `/(?:orgs|organizations)/{uuid}` | Cognito JWT / API key / public modes |
| data-services (data-api) | **none** — global reference data; scoped by `country_code` + `document_version_id` | n/a | API GW Cognito authorizer only |
| POS SPA (templates/pos-system) | `orgId` from `OrgContext`, embedded in every URL via path builders | `src/lib/api.ts` (`orgPath`, `crossAppOrgPath`, `salesOrgPath`, `authOrgPath`) | Cognito ID token Bearer on all 4 API clients |
| landing-client | single-tenant, no runtime auth | n/a | n/a (static site; dev-only CMS gated by `src/lib/admin-enabled.ts`) |

### 6.2 Isolation mechanism per system (verified)

#### markets-api (BeautyMarket `server/`) — isolation by WHERE clause only; documented edge controls DO NOT EXIST

- **No in-app auth at all.** `server/src/routes.ts` mounts every controller bare — zero middleware between Express and controllers. Comments at `routes.ts:27,68,77` claim "API Gateway validates JWT + userId matches path" — **verified false**: `E:/dev/BeautyMarket/api-gateway/template.yml` contains only `CognitoAuthorizer` security entries (lines 63-68, 97, 157, 333…) with **no claim-to-path mapping and no `x-user-id` integration header** (grep for `claims`/`x-user-id`: zero hits). Any holder of a valid Cognito token can substitute any `:userId` and any `:orgId` → **cross-user and cross-tenant IDOR** on all org-scoped routes (deployments, settings, CMS pages/content, invitations, RBAC, S3 presign).
- RBAC middleware exists and is correct in isolation (`server/src/middleware/permissions.ts` — `requirePermission`/`requireAnyPermission`/`requireAllPermissions`/`requireAuth`, lines 18-165) but is **never mounted**: grep shows `permissionMiddleware`/`requireAuth` referenced only in `server/src/dependency_injection.ts:214-221` (exported, unused) and `middleware/__tests__/permissions.test.ts`. Even if mounted, `req.userId` is never populated by anything, so checks would always 401. **RBAC is data plus dead enforcement code.**
- Postgres RLS exists but is permissive `using true` for role `authenticated` (`server/src/entities/Organization.ts` pgPolicy) — provides zero isolation.
- Local dev: fully unauthenticated.

#### cross-app-be (orders-api) — strongest userId hygiene, weakest org-membership check

- **[CORRECTED vs POS-side suspicion]** `x-user-id` is **not spoofable through the gateway**: `E:/dev/cross-app-be/api-gateway/template.yml` maps `integration.request.header.x-user-id: context.authorizer.claims.sub` on every authorized method (verified lines 128, 164, 225, 266, 301, 368…), overwriting whatever the client sends. The POS app's browser-side JWT decode (`templates/pos-system/src/lib/api.ts:39-48`) is therefore redundant-but-harmless for gateway traffic. The FastAPI app itself trusts the header blindly, so any non-gateway ingress (direct Lambda invoke, future ALB) would be spoofable.
- Org scoping is enforced **only by repository WHERE clauses**, consistently applied: e.g. `app/repositories/sale_repository.py:42-49` (`find_by_id_and_organization` filters `Sale.organization_id == organization_id`); same pattern across the 20 repositories in `app/repositories/`.
- **No organization-membership check anywhere.** The Cognito authorizer validates token validity only; nothing verifies that `claims.sub` belongs to `{organization_id}`. Any authenticated user can read/write **any organization's** sales, clients, products, sessions, closings.
- Role gate placeholder: `app/controllers/closings_controller.py:179-185` — `is_manager = True  # Placeholder - should be determined by auth layer`; `app/services/closing_service.py:140-168` rejects approve/reject only when `is_manager=False`, which never happens in practice. **Manager-only closing approval is unenforced.**
- `app/middleware/user_id_middleware.py:11` hard-requires `x-user-id` only for `_PROTECTED_PREFIX = "/api/users/"` — routes have since moved to `/api/organizations/`, so the middleware's 401 branch is effectively dead; enforcement now depends on each controller declaring `x_user_id` as a `Header` param.
- CORS `allow_origins=["*"]` (`app/configuration/fast_api_config.py`).

#### biller-apps/auth — the multi-mode authorizer exists but its membership check is a stub; sales-api doesn't even use it

- **[CORRECTED — discovery data overstated this]** `app/lambda-authorizer/src/validators/organization_auth_checker.py` does **not** verify membership. Verified content: it extracts the org UUID from the path (line 30 regex), checks the org row exists (line 69), then lines 73-78: `# TODO: Implement actual user-organization membership check` — the only comparison is against an optional `user_org_id` JWT claim (which standard Cognito ID tokens do not carry), and it returns hardcoded `"role": "member", "permissions": []` (lines 83-84, both marked TODO). The orchestration is real (`app/lambda-authorizer/src/services/authorizer_service.py:87-90` routes COGNITO_JWT mode through this checker); the check itself is a placeholder.
- The **sales-api gateway does not use the lambda-authorizer**: `api-gateway/template.yml` uses a plain Cognito user-pool authorizer, and `app/sales-api/src/controllers/sale_controller.py:249-251, 329-331, 363-365` reads `x_user_id: Optional[str] = Header(None, alias="x-user-id")` with `user_id = x_user_id or "anonymous"` — **client-supplied, optional, used for fiscal-document audit attribution**. Isolation again rests solely on `organization_id` WHERE clauses (`shared/jbiller_common/models/sale.py` composite indexes).
- API-key mode is the most complete auth path: SHA-256-hashed keys with scopes + per-minute rate limits + usage metrics (`app/lambda-authorizer/src/models/api_key.py`, `services/statistics_tracker.py`).
- Crown-jewel data behind this weak layer: `organization_hacienda` stores ATV passwords, P12 certificate bytes, and certificate PINs in plain Postgres columns (`app/organization-configurations/src/models/organization_configuration.py`) and returns them via `GET /organizations/{org}/configurations`. Any authenticated Cognito user who knows another org's UUID can fetch another taxpayer's signing certificate. **This is the single worst tenancy gap in the ecosystem.**

#### data-services (data-api) — correctly non-tenant, but all-or-nothing

- No `organization_id` anywhere (`shared/tsuru_common/models/hacienda_base_model.py`); global reference data, so the absence of tenancy is correct.
- AuthN edge-only: hardcoded Cognito pool ARN in `api-gateway/template.yml`; FastAPI apps have zero auth middleware (`shared/tsuru_common/configuration/fast_api_config.py`). Acceptable for read-only catalogs; the gateway exposes GET+OPTIONS only (79 each), so the fully implemented POST/PUT/PATCH/DELETE controllers are unreachable in production (seed-only).

#### Frontends

- **POS SPA:** never filters tenant data client-side; relies on path-embedded `orgId` + server isolation (which, per above, is WHERE-clause-only). Offline replay: `SaleRecord` in `src/lib/db.ts` carries an unused `token` field; `public/sw.js` background sync replays queued sales — token freshness/attribution at replay time is unaudited.
- **landing-client:** no tenancy. The unauthenticated admin CMS is excluded from prod builds via compile-time gate (`src/lib/admin-enabled.ts`) + CI grep for `__local` (`.github/workflows/deploy.yml`); dev write endpoints are localhost-only with path-traversal guards (`plugins/local-cms.ts:165-167`). Sound for its threat model, but entirely gate-dependent.

### 6.3 Roles & permission models — three incompatible systems, none enforced server-side

| Model | Where defined | Where enforced |
|---|---|---|
| Hierarchical RBAC: Role → Module/Submodule/Action, org-scoped roles + `platform_admin` | markets-api entities + `server/src/seeds/rbac-seed.ts`; manageable via `/rbac` endpoints | **Nowhere.** Middleware exists (`server/src/middleware/permissions.ts`) but unmounted; `createRequirePlatformAdmin` hardcodes `isPlatformAdmin=false` placeholder (~line 195) |
| POS app roles: `cajero|gerente|supervisor|customer` + assignment-level `cashier|supervisor` | `templates/pos-system/src/contexts/AuthContext.tsx:24-26`, `src/types/assignment.ts`; RBAC roles fetched from markets-api in `MembersPage.tsx` | **Client-side UI gating only** — backend (cross-app-be) has no role model except the dead `is_manager` parameter |
| lambda-authorizer role/permission context | `organization_auth_checker.py:83-84` | Hardcoded `"member"` / `[]` — placeholder |

**Net effect:** in the entire ecosystem there is **no server-side role or permission enforcement on any business operation**. The only real authorization primitives in production are (a) Cognito token validity at every gateway, (b) `claims.sub`→`x-user-id` mapping at the cross-app-be gateway, (c) org-scoped WHERE clauses.

### 6.4 Gap register (ranked)

| # | Gap | Severity | Evidence |
|---|---|---|---|
| G1 | Hacienda signing certs/PINs/ATV passwords readable cross-tenant by any authenticated user (no membership check + plaintext storage) | **Critical** | `biller-apps/auth/app/organization-configurations/src/models/organization_configuration.py`; plain Cognito authorizer in `auth/api-gateway/template.yml`; stub `organization_auth_checker.py:73-78` |
| G2 | markets-api cross-user/cross-org IDOR: docs claim userId↔JWT-sub matching that does not exist; no in-app auth | **Critical** | `server/src/routes.ts:27` comment vs `BeautyMarket/api-gateway/template.yml` (no claim mapping); bare controller mounts |
| G3 | cross-app-be: no org-membership check — any authenticated user can operate on any org's POS/cross-docking data | **High** | absence verified across `app/controllers/`; only `find_by_id_and_organization`-style scoping (`app/repositories/sale_repository.py:42-49`) |
| G4 | lambda-authorizer membership/role/permission logic is TODO placeholders while being positioned as the platform auth layer | **High** | `organization_auth_checker.py:62-84` |
| G5 | RBAC fully modeled, seeded, manageable — enforced nowhere (false sense of security in docs/UI) | **High** | `server/src/middleware/permissions.ts` unmounted; DI-only references (`dependency_injection.ts:214-221`) |
| G6 | sales-api `x-user-id` client-supplied, defaults `"anonymous"` — audit-trail integrity for fiscal documents | **Medium** | `sale_controller.py:251` |
| G7 | Closing approve/reject `is_manager=True` placeholder — cashiers can approve their own cash reconciliations | **Medium** | `closings_controller.py:179-185`; `closing_service.py:140-168` |
| G8 | cross-app-be trusts `x-user-id` in-app; safe only while the API GW mapping is the sole ingress | **Medium** | `user_id_middleware.py` (stale prefix); gateway mapping `cross-app-be/api-gateway/template.yml:128` |
| G9 | Permissive RLS (`using true`) gives illusion of DB-level isolation | **Low** | `server/src/entities/Organization.ts` pgPolicy |
| G10 | Inconsistent tenant key naming (`company_id` vs `organization_id`, both = `organizations.id`) invites scoping mistakes | **Low** | `cross-app-be/app/models/order.py` vs `app/models/branch.py` |

---

## PHASE 7 — ARCHITECTURE AUDIT

### 7.1 Frontend architecture

**POS app (`templates/pos-system` / `chepelcr/tsuru-pos-system`)** — the most mature frontend.
- Vite + React 18.3 + TS 5.6, wouter routing centralized in `src/Routes.tsx` + `src/routePaths.ts`.
- Layered state: React Query v5 for server state (query-key convention `[resource, orgId, ...filters]`); zustand v4 for cart/inventory/sessionContext/documentStore; Contexts for Auth/Org/Language/DarkMode/DocumentVersion (POS `CLAUDE.md §6`).
- Disciplined design system: zero hardcoded styles, CSS-variable tokens in `src/index.css`; full EN/ES i18n through one ~4,100-line `LanguageContext.tsx` (works, but a monolithic translation file is a scaling liability).
- Offline-first: Dexie IndexedDB queue + service-worker Background Sync (`src/lib/db.ts`, `public/sw.js`).
- **Structural concern #1 — thick client over 4 gateways:** `src/lib/api.ts` fans out to markets-api, cross-app-be, sales-api, data-api with path-shape traps documented in-code (plural `memberships/organization` vs singular `organization` on markets-api; `authOrgPath` root-mounted without `/api` on the sales gateway, `api.ts:269`). `ordersApi` === `crossAppApi` (same base, `api.ts` ~122-138) — three names for one backend.
- **Structural concern #2 — duplicated fiscal math:** `src/services/taxCalculationService.ts` + `discountCalculationService.ts` deliberately mirror cross-app-be's Python services (POS CLAUDE.md §8) — business-critical dual maintenance.
- **Structural concern #3 — production console logging of full request/response payloads** including URLs and bodies (verified `src/lib/api.ts:8-18, 31, 51, 59` plus `[API] Response data` logs).

**landing-client (`chepelcr/tsuru-landing`)** — unusually engineered static site: bundled bilingual JSON content (`src/content/*.json`, 22 files), Zustand admin store with manifest-driven editor (`src/admin/manifest.ts`), git-as-CMS publish (`plugins/local-cms.ts`), build-time prerender (`scripts/prerender.mjs`). Debt: ~300+ lines of dead Cognito/org code dragging aws-amplify into the bundle (`src/hooks/useAuth.ts`, `useOrganization.ts`, `auth-navbar.tsx`, unused `apiUtils.ts` builders); hardcoded dashboard URLs in `src/components/layout/navbar.tsx:130-139` despite an unused `VITE_APP_URL` secret; stale `seo.json` siteUrl (`tsuru` vs deployed `tsuru.jcampos.dev`); zero tests; manual prerender-route/Router sync; fake Contact form (`src/pages/Contact.tsx:24-38` — setTimeout success, no delivery).

**dashboard/ (monorepo)** — functionally superseded: org settings, CMS editor, templates, deployments, media, members/RBAC pages were re-implemented inside the POS app (memory `project_pos_dashboard_migration.md`; POS `pages/dashboard/Org*Page|ContentPage|TemplatesPage|DeploymentsPage|GalleryPage`). Two parallel admin frontends now exist against the same markets-api.

### 7.2 Backend architecture — four distinct patterns

| Service | Pattern | Assessment |
|---|---|---|
| markets-api | Express 4 monolith in one Lambda; controllers→services→repositories, manual-singleton DI (`server/src/dependency_injection.ts`) | Clean layering, hollow security model (§6.2); CMS publish pipeline largely simulated (`DeploymentService.ts:58-88` uploads `config.json`, immediately marks success); Lambda SQS/SNS branches are empty stubs (`server/lambda.cts:18-37`); second exported `cognitoHandler` mixes auth-infra email templating into the API codebase |
| cross-app-be | Single FastAPI+Mangum container Lambda, class-per-controller, SQLAlchemy 2.0 + 35 Alembic migrations, real pytest suite | Best engineering hygiene of the backends — but **two unrelated products fused** (cross-docking order distribution + stadium-origin POS, contexts `gradas/mesa/caja` in `app/models/session.py`); hardcoded customer branding "Modas Laura" in `app/services/email_service.py`; string-typed dates on cross-docking tables; gateway swagger (`api-gateway/endpoints.json`, 1574 lines) manually synced with FastAPI routes |
| biller-apps/auth ("jbiller") | Multi-Lambda: FastAPI HTTP lambdas + SQS FIFO pipeline lambdas, shared `jbiller_common` layer, SNS→SQS chain sales→validator→pdf→notification | Best async design (idempotent, ownership rules documented in `validator_pipeline.py`); but POST /sales runs XML-build + XAdES-sign + ATV-submit synchronously inside one DB transaction (latency coupling to a government API); Hacienda OAuth realm hardcoded to staging (`rut-stag`); stub endpoints shipped in prod (`sale_controller.py` xml/regenerate, notifications/resend); legacy `hacienda-history` lambda in an older code style (marshmallow, IVOIS exceptions) |
| data-services | 34 near-identical FastAPI micro-lambdas + shared `tsuru_common`, centralized Alembic | Disciplined but heavy copy-paste; caching fully scaffolded-dead (`shared/tsuru_common/utils/cache_utils.py` all TODO no-ops while Redis is provisioned in SSM); write controllers implemented but unexposed (GET-only gateway); near-zero tests |

**Cross-cutting backend smell — shared-database integration.** At least four codebases (markets-api Node, cross-app-be, jbiller, data-services) read/write the same Postgres. Ownership is enforced by docstring convention only: `server/src/entities/OrganizationSettings.ts` ("OWNED and WRITTEN by the infrastructure microservice… Do NOT add insert/upsert"), `cross-app-be/app/models/user.py` ("Never write to this table"), `jbiller_common/models/organization.py` (read-only). cross-app-be even auto-creates organization rows with `owner_id='system'` from parsed Excel (`app/services/order_service.py::_sync_organization`) and altered shared tables via its own Alembic migrations — schema ownership of `organizations`/`products` is split across ≥3 repos with no contract enforcement. The shared library is itself duplicated: `tsuru_common` vs `jbiller_common` carry parallel copies of the same configuration/DAO code, including two identical `HaciendaApiClient` implementations.

### 7.3 Infrastructure

- **IaC:** SAM/CloudFormation everywhere; per-service stacks (`app/*/cloudformation/lambda.yml` in the Python repos; `cloudformation/lambda.yml` + `api-gateway/template.yml` in BeautyMarket; `cloudformation/frontend-site.yml` in POS). Config via SSM Parameter Store (`/tsuru/{env}/...`) + shared Secrets Manager DB secret `tsuru/{env}/database` — consistent and good.
- **CI/CD in mid-migration:** CodePipeline two-phase (build-image/update-function buildspecs) still live for cross-app-be and data-services; biller-apps/auth and the two extracted frontends (POS, landing) moved to GitHub Actions with OIDC roles (`tsuru-{repo}-gha-deploy`; shared OIDC provider in `biller-apps/Infrastructure/policies/tsuru-iam-roles.yaml`). BeautyMarket monorepo retains legacy CodePipeline + `deploys/setup-template-bucket.js` — so the **landing site has two simultaneous deploy paths** (monorepo S3/CloudFront → `tsuru.jcampos.dev` vs standalone GitHub Pages → `tsuru.jcampos.dev`).
- **Duplicate provisioning planes:** per-org storefront infra (S3/CloudFront/Route53/ACM) is provisioned both by `deploys/setup-template-bucket.js` (monorepo tooling) and by `biller-apps/auth/app/infrastructure-service-provider` (runtime, SNS-event-driven, git-clones template repos with a Secrets Manager PAT). Two implementations of the same responsibility, in two languages, in two repos.
- **Committed identifiers contradicting org policy:** Cognito pool ARN/IDs hardcoded in `data-services/api-gateway/template.yml` and `biller-apps/auth/api-gateway/template.yml` despite the workspace CLAUDE.md rule against committing pool IDs; Route53 zone defaults likewise.
- **IAM breadth:** data-services Lambdas carry the `SecretsManagerReadWrite` managed policy (`app/taxes/cloudformation/lambda.yml`).

### 7.4 Technical debt register (ranked)

| # | Debt item | Severity | Status | Evidence |
|---|---|---|---|---|
| D1 | Plaintext Hacienda P12 certs/PINs/ATV passwords in Postgres, returned by GET | Critical | Implemented (badly) | `organization_configuration.py`; `auth/api-gateway/endpoints.json` |
| D2 | Authorization gaps G1–G5 — docs describe controls that don't exist; auth layer is placeholders | Critical | Half-implemented / placeholder | §6.4 citations |
| D3 | Duplicated tax/discount engines (TS in POS ↔ Python in cross-app-be) for fiscal-compliance math | High | Implemented twice, locked by convention | `taxCalculationService.ts` ↔ `cross-app-be/app/services/tax_calculation_service.py`; POS CLAUDE.md §8 |
| D4 | Shared-DB multi-repo schema ownership; cross-app-be mutates platform tables and fabricates orgs (`owner_id='system'`) | High | Implemented | `order_service.py::_sync_organization`; alembic `b1c2d3e4f5a6` |
| D5 | Dashboard domain re-implemented in POS app; markets-api CMS/templates duplicated by jbiller's `template` table + infra provisioner; product CRUD in both markets-api template-seeds and cross-app-be | High | Implemented (duplication) | POS `pages/dashboard/*` vs `dashboard/`; `auth/app/infrastructure-service-provider/src/models/template.py`; `cross-app-be/app/controllers/products_controller.py` |
| D6 | Two storefront-infra provisioning systems + two landing deploy paths during the split | High | Both live | `deploys/setup-template-bucket.js` vs `auth/app/infrastructure-service-provider`; monorepo CI vs `landing-client/.github/workflows/deploy.yml` |
| D7 | Repo-split limbo: POS + landing tracked in monorepo AND standalone repos (nested `.git`); drift risk while CI references old paths | High | In progress by design | BeautyMarket CLAUDE.md split rules; `landing-client/.git` remote `chepelcr/tsuru-landing` |
| D8 | Production logging of full API payloads in POS (data leak + noise) | Medium | Implemented | `templates/pos-system/src/lib/api.ts:8-18,31,51,59` |
| D9 | Synchronous XAdES-sign + ATV submit inside POST /sales DB transaction | Medium | Implemented | `auth/app/sales-api/src/services/sales_pipeline.py` |
| D10 | Dead/scaffolded code: markets-api empty SQS handlers + unused `HomePageContentRepository` + superseded AWS DAOs; cross-app-be `BaseDAO` (no subclass) + unused `API_ORGANIZATIONS_URL`; data-services no-op cache layer + unexposed write endpoints; landing dead Cognito stack; Stripe schema-only | Medium | Dead/scaffolded | `server/lambda.cts:18-37`; `cross-app-be/app/daos/base_dao.py`; `tsuru_common/utils/cache_utils.py`; `landing-client/src/hooks/useAuth.ts` |
| D11 | Doc drift: BeautyMarket CLAUDE.md describes controllers/stacks/middleware that don't exist; POS CLAUDE.md §2 misdescribes the data-api base; jbiller still named "TSURU-Auth-App"; Hacienda realm pinned to staging | Medium | Stale docs / config | per-system greps; `hacienda_submission_service.py` |
| D12 | Test coverage asymmetry: cross-app-be good; markets-api thin (tests target unmounted middleware); POS/landing/data-services ≈ zero | Medium | Gap | `server/src/middleware/__tests__/`; `data-services` (2 `test_local.py`) |
| D13 | Repo-root clutter: 28+ planning MDs (POS), ~40 summary MDs (monorepo), migration scripts + `__pycache__` committed (data-services), debug scripts at cross-app-be root | Low | Hygiene | repo roots |
| D14 | Stadium-POS fossils (`match/shift`, `gradas/mesa/caja`, "Pollos", `ReportePage`) in a system now positioned as retail POS | Low | Naming debt | `templates/pos-system/src/types/session.ts`; `cross-app-be/app/models/session.py` |

### 7.5 Architecture risks

1. **Decomposition without a finished authorization plane.** Commerce was split out of markets-api into Python services, but the membership/role layer that should have moved with it was stubbed (`organization_auth_checker.py` TODOs). Every new service multiplied the WHERE-clause-only isolation surface. The fix point is singular and known: finish the membership check and wire it (or equivalent claim mapping, as cross-app-be already does for userId) into all four gateways.
2. **Legacy-vs-new duplication is compounding.** Legacy markets-api still owns identity/org/CMS while the POS re-implements its admin UI and jbiller re-implements its infra provisioning and template model. Without a declared end-state owner per domain, three systems will keep drifting against one shared DB.
3. **Split-in-progress monorepo is the fragile middle.** Same code deployable from two repos with different IaC (S3/CloudFront vs GitHub Pages; CodePipeline vs Actions OIDC); a hotfix landing in the wrong copy ships nowhere — or twice.
4. **Fiscal correctness depends on three synchronized implementations** (POS TS engine, cross-app-be Python engine, jbiller XML builder) with version-lock-by-convention and no cross-implementation contract tests.
5. **The shared Postgres is the real integration bus** (plus one SNS topic). Alembic histories live in three repos; any migration can silently break siblings — mitigated only by docstrings.
6. **Gateway templates are hand-synced API duplicates** (`endpoints.json` 1574 lines in cross-app-be; OpenAPI DefinitionBody in data-services) — route drift between gateway and app is a standing operational risk, and the gateway is also the only security layer (risk multiplies with G1–G3).

### 7.6 What is genuinely good (keep / replicate)

- cross-app-be gateway's `claims.sub` → `x-user-id` integration mapping (`api-gateway/template.yml:128` et al.) — the correct edge pattern; replicate to the markets-api and sales-api gateways.
- jbiller SNS/SQS FIFO document pipeline: idempotent, single-writer-per-event-type rules documented in code (`validator_pipeline.py`).
- POS frontend discipline (design system, i18n rules, centralized API clients, offline-first) and landing's tree-shaken-admin + CI bundle-verification gate.
- Consistent SSM/Secrets config convention across all repos; keyless OIDC deploys where migrated.
- Repository-level org scoping is *consistently present* everywhere it should be — the WHERE clauses are not the gap; the missing membership check is.
