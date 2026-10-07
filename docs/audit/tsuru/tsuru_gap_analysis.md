# Tsuru Ecosystem — Gap Analysis (Phase 11)

**Date:** 2026-06-11
**Inputs:** `tsuru_landing_audit.md` (product vision), `tsuru_system_discovery.md`, `tsuru_domain_model.md`, `tsuru_capability_inventory.md`, `tsuru_user_journeys.md`, `tsuru_architecture_audit.md` (real implementation), and the strategic research doc `docs/Rebranding Web_ Economía Indígena Solidaria.txt` (vision inspiration).
**Scales:** Severity = Critical / High / Medium / Low (impact on promised product or vision). Effort = S (≤days) / M (≤2 weeks) / L (≤2 months) / XL (multi-quarter or org-level decision).

Frame of reference: the landing site (public brand **Tsuru**, internal codename **Tsuru**) sells a **Social Solidarity Economy platform** — free no-code stores, WhatsApp commerce, fairs, barter, mutual-aid networks. The implementation that actually works end-to-end is a **Costa Rica POS + Hacienda e-invoicing product**. The gap analysis below reconciles the three layers: what is promised, what exists, and what the strategy research says the product should become.

---

## 1. CRITICAL GAPS — block the *currently promised* product

### C1. Ecosystem-wide authorization gap (IDOR on every backend) — **Severity: Critical · Effort: M**
Authentication exists everywhere (Cognito JWT at all 4 API Gateways); **authorization exists nowhere in production**:
- markets-api: no userId↔JWT-`sub` path matching despite CLAUDE.md claiming it (`E:/dev/BeautyMarket/api-gateway/template.yml:63-71` has only a plain `cognito_user_pools` authorizer); no Express auth middleware mounted (`server/src/routes.ts`); RBAC fully modeled+seeded but middleware wired into **zero** routes (`server/src/middleware/permissions.ts`, grep evidence in `tsuru_architecture_audit.md` §6.2). Any valid token can address any `/api/users/{anyUser}/organization/{anyOrg}/...`.
- jbiller (sales-api): the org-membership check in the lambda-authorizer is a placeholder (`auth/app/lambda-authorizer/src/validators/organization_auth_checker.py:62-85`, "TODO: Implement actual user-organization membership check", role hardcoded `"member"`), and that authorizer is not even deployed on the main gateway. Cross-tenant exposure covers **fiscal documents and ATV credentials**.
- cross-app-be: WHERE-clause isolation only; the single role gate (closing approval) defaults `is_manager=True` (`app/services/closing_service.py`).
- data-api: any Cognito user reads everything; Postgres RLS is permissive `using sql\`true\`` on 23 tables (`server/src/entities/Organization.ts:35-40`) — security theater.
**Why critical:** every "multi-tenant" promise on the landing rests on clients sending honest path params; one leaked token from any user exposes all tenants' commercial and tax-authority data.

### C2. Storefront commerce loop is broken end-to-end — **Severity: Critical · Effort: L**
The flagship promise ("create your store, sell online") does not function for live orgs:
- Storefronts call `/api/public/organizations/{id}/products|categories` (`templates/tsuru-demo/src/lib/api.ts:62-81`) but `server/src/controllers/PublicOrgController.ts` serves only org/theme/contact/pages — **the product endpoints do not exist**; live-org product browsing 404s. Real products live in cross-app-be with no public endpoint.
- Checkout persists nothing anywhere — it generates a WhatsApp deep link (`templates/tsuru-demo/src/components/cart/checkout-modal.tsx:144-145`). The promised "order tracking, customers informed at every step" (`features.json featureCards[4]`) has **no consumer-order domain in any of the 9 systems** (cross-app-be `/orders` = B2B cross-docking POs, `app/models/order.py`).
- The CMS "publish" pipeline is simulated: `server/src/services/DeploymentService.ts:58-88` uploads `config.json` and instantly records success — no build step.
**Why critical:** the public product is, today, a brochure-site generator; the working commerce stack (POS/fiscal) is a different product.

### C3. Cashier persona dead ends (POS daily loop cannot complete) — **Severity: Critical (for POS product) · Effort: S–M**
- `cajero` users are navigated to `/pos`, which is **not registered** in `templates/pos-system/src/Routes.tsx` → blank screen (`SelectOrganization.tsx:32,50`, `CreateOrganization.tsx:224`, `ReportePage.tsx:113`). `src/pages/pos/{PaymentScreen,SuccessScreen,InventoryOpening}.tsx` are imported by nothing (dead code).
- Cash closing is impossible from the UI: `components/pos/ClosingFlow.tsx` (450 lines, `POST /closings`) is unmounted dead code despite full backend support (`cross-app-be/app/services/closing_service.py`).
- Shift start is local-only (zustand) while payment confirm requires a server assignment → late `sessionIncomplete` failures (`POSIntegratedPage.tsx:163-167`).

### C4. Plaintext fiscal credentials + staging Hacienda realm — **Severity: Critical (legal/compliance) · Effort: M**
P12 signing certificates, certificate PINs, and ATV passwords are stored as plaintext bytes in Postgres and returned by `GET /organizations/{id}/configurations` (`auth/app/organization-configurations/src/models/organization_configuration.py`; response schema in `auth/api-gateway/endpoints.json`; identification check commented out in commit `bfe4821`). Combined with C1, any authenticated user could read another org's tax-authority credentials. The Hacienda OAuth realm is hardcoded to **staging** (`rut-stag`) in shared code — production cutover risk for legally significant invoices.

### C5. Duplicated sources of truth on fiscal-critical data — **Severity: Critical · Effort: L**
- **Two Sale entities** in one shared DB: cross-app-be `sales`/`sale_lines` vs jbiller `billing_sales` + 13 child tables (the fiscal document of record), with an implicit, unenforced relation (`tsuru_domain_model.md`).
- **Two invoice-numbering implementations** over `consecutives`: cross-app-be CRUD (`app/models/consecutive.py`, `consecutives_controller.py`) vs jbiller atomic allocation (`jbiller_common/.../consecutive_repository.py`) — gapless 20-digit Hacienda consecutives depend on two ORMs agreeing on locking.
- **Tax/discount math triplicated**: POS TS (`src/services/taxCalculationService.ts`) mirrors cross-app-be Python; jbiller has its own pipeline math. Drift produces **legally wrong invoices**.
- **`organizations` table dual-mastered**: markets-api owns it; cross-app-be auto-creates rows with `owner_id='system'` from parsed Excel (`app/services/order_service.py _sync_organization`) and mutates the schema via its own Alembic migration.

### C6. Top-of-funnel and trust-promise breaks on the landing — **Severity: High · Effort: S**
- Landing Login/Register CTAs hardcode the **legacy** dashboard `https://admin.tsuru.jcampos.dev` (`landing-client/src/components/layout/navbar.tsx:130-137,226-233`) although auth migrated to the POS app — two divergent signup experiences.
- Contact form fakes submission: 1s `setTimeout` → success toast, `settings.json contact.delivery='none'` (`src/pages/Contact.tsx:24-38`) — against a published "24h response" promise; prospect messages are silently discarded.
- Promised GDPR cookie-consent banner does not exist in the codebase (`cookies.json` describes it); phone number is a literal placeholder `+506 XXXX-XXXX`; "miles de emprendedores" traction claim and testimonials are unverifiable placeholders (`tsuru_landing_audit.md`).

### C7. Identity/audit integrity holes — **Severity: High · Effort: S–M**
- sales-api trusts a client-supplied `x-user-id` header defaulting to `"anonymous"` (`auth/app/sales-api/src/controllers/sale_controller.py:249-365`) — audit attribution on legal e-invoices is spoofable.
- POS Register/Login stash the user's **plaintext password in sessionStorage** for post-OTP auto-login (`Register.tsx:139-145`, `Login.tsx:48-52`) — XSS-readable credential.
- Login/Register ignore `?redirect=` and the write-only `sessionStorage['redirectAfterLogin']` (`Routes.tsx:72`, `Login.tsx:42-46`) — invitation joins silently drop context; invitation "Decline" is a no-op.

### C8. Fiscal setup and checkout don't meet — **Severity: High · Effort: S**
Checkout hardcodes `DEFAULT_DOC_DATA.activity_code='722000'` (`templates/pos-system/src/components/pos/checkout/CheckoutDrawer.tsx:48`) instead of the org's registered economic activities collected in the fiscal-info wizard — wrong-activity legal invoices are one tap away.

---

## 2. STRATEGIC GAPS — block the *vision* (SSE platform + indigenous-economy strategy)

### S1. Fairs (ferias) — flagship differentiator, zero implementation — **Severity: Critical (vision) · Effort: XL**
`fairs.json`/`Ferias.tsx` market virtual, physical, and barter fairs with a registration flow ("Inscríbete en una feria...") in present tense. **No fair/event entity, endpoint, or UI exists in any of the 9 systems** (`tsuru_capability_inventory.md` §7). Fair CTAs route to the generic admin register URL. The platform's origin story (Feria del Trueque Verde Manantial) has no product surface.

### S2. Barter system (trueque) — moneyless exchange, zero implementation — **Severity: Critical (vision) · Effort: XL**
`community.json` describes a working 3-step barter flow ("Nuestro sistema de trueque permite..."). Nothing in any schema or API supports non-monetary exchange; all value capture is colón-denominated sale records. This is the single claim no mainstream competitor makes — and it is pure marketing today.

### S3. No buyer/community-member identity — **Severity: High · Effort: L–XL**
Cognito users are org operators only; storefront checkout is anonymous WhatsApp; no reviews, follows, mutual-support, or community entities exist in any schema (`tsuru_capability_inventory.md` §7). The landing's audiences include "buyers/neighbors as community members" and "barter participants who need not sell" — there is no account type for them. The promised "mutual support networks" (mentors, collaborators) have no feature.

### S4. No multi-seller marketplace / cross-store discovery — **Severity: High · Effort: L**
The platform is strictly one-org-per-subdomain storefronts; no aggregation endpoint or cross-org buyer surface exists anywhere. Both the landing (fairs = "discover many local producers at once") and the research (Kökö anti-monopoly circulation, cross-organization "canastas comunitarias" bundles) require exactly this missing surface.

### S5. Audience mismatch: who it's for vs who it serves — **Severity: High · Effort: strategy decision**
The landing targets low-tech, WhatsApp-first LatAm micro-sellers, artisans, and cooperatives ("Sin programación", testimonials from Buenos Aires/Medellín/Oaxaca). The only production-credible journey is the **Costa Rica merchant e-invoicing loop** (register → org wizard → fiscal setup → offline-first POS sale → Hacienda submission — `tsuru_user_journeys.md`), which demands P12 certificates, ATV credentials, and CABYS codes — the opposite of low-tech, and CR-only (data-services is multi-country in schema but only CR=188 is seeded). Free-forever promise ("sin cargos ocultos", no paid tier on site) coexists with scaffolded Stripe SaaS billing fields (`organizations.stripeCustomerId`, `plan` — no SDK) — an unresolved monetization narrative.

### S6. Brand identity unresolved: Tsuru vs Tsuru — **Severity: Medium · Effort: M**
Public copy is 100% "Tsuru"; "Tsuru" exists only in internal tooling (`tsuru-landing` package name, "Tsuru Admin" chrome, `tsuru:content-saved` event). The strategy doc's primary recommendation **is** Tsuru (cacao, sacred currency in Bribri cosmology) — the codebase already adopted the codename but the public brand never followed. Drift is visible in infra: `seo.json siteUrl=tsuru.jcampos.dev` while the standalone repo deploys to `tsuru.jcampos.dev`; landing has two live deploy paths for the same code (T1). No logo assets exist (`branding.json logoUrl/faviconUrl` empty) — the research's Ú-sure/cacao logo and natural-pigment palette (6 hex codes specified) have an empty slot waiting.

### S7. Solidarity mechanics exist as copy, not as system rules — **Severity: High (vision) · Effort: XL**
The research demands "mechanics over cosmetics": Sibö-style structural protection of producers (fairness enforced by system rules, not goodwill), Jala-de-Piedra crowdfunding, exogamous cross-org bundling, reciprocity-framed micro-copy ("Aliados Solidarios" not "Clientes"), inline cultural education, women-led-cooperative foregrounding, democratic governance. Implementation reality is the inverse: the landing's strongest verb — "**Garantizamos** condiciones justas" (`landing.json values[0]`) — is contradicted by `terms.json` §4/§6 ("facilitador", "as is"), and the platform enforces no fairness rule of any kind (RBAC unenforced, no governance entities, no co-op constructs). The e-commerce copy in storefront templates is conventional cart/checkout language.

### S8. Cultural preservation promise has no medium — **Severity: Medium · Effort: M–L**
"Preserve & document community fair culture" (`about.json`) has only a static JSON blog behind it (`src/content/blog.json`, git-as-CMS). No documentation/archive surface, no fair-story entities, no Suwoh-style storytelling integration in any purchase flow as the research proposes.

---

## 3. TECHNICAL GAPS — debt that blocks evolution

### T1. Monorepo split limbo (dual sources of truth for code itself) — **Severity: High · Effort: M**
`templates/pos-system` and `landing-client` are tracked in the monorepo **and** in standalone repos (`chepelcr/tsuru-pos-system`, `chepelcr/tsuru-landing`) with nested `.git`; CI buildspecs still reference old paths; landing has **two live deploy paths** (monorepo `deploys/setup-template-bucket.js` → tsuru.jcampos.dev vs GitHub Actions → tsuru.jcampos.dev). Any edit to the monorepo copy diverges silently. Guardrail is a CLAUDE.md convention only.

### T2. Three duplicated admin surfaces — **Severity: High · Effort: L**
Deprecated `client/` (per `client/DEPRECATED.md`), live `dashboard/` (admin.tsuru), and POS dashboard pages that re-implemented org settings/CMS/templates/deployments/members against the same markets-api (`templates/pos-system/src/pages/dashboard/*`, memory `project_pos_dashboard_migration.md`). Plus a third content-editing surface in the landing's git-based DXP. Landing CTAs still point at the surface being retired (C6).

### T3. Shared PostgreSQL as the integration bus, contract-by-comment — **Severity: High · Effort: L–XL**
One Postgres written by 4 repos (Drizzle + 3 separate Alembic trees); ownership enforced only by Alembic `include_object` filters and docstrings (`auth/alembic/env.py`; `cross-app-be/app/services/cabys_service.py:3-6`; `server/src/entities/OrganizationSettings.ts` "Do NOT add insert/upsert"). No schema-contract tests, no per-service DB roles, no real RLS. A schema change in any repo can silently break the others; jbiller deliberately denormalizes Hacienda catalog codes as VARCHAR because it cannot call data-api (`jbiller_common/models/sale.py` docstring).

### T4. Systemic duplication register — **Severity: Medium-High · Effort: L**
Two storefront-infra provisioners (`deploys/setup-template-bucket.js` vs `auth/app/infrastructure-service-provider`); **three** Template definitions (markets-api `entities/Template.ts`, jbiller `models/template.py` with git-deploy, landing client-side URL convention); two parallel shared Python libs with identical `HaciendaApiClient` copies (`jbiller_common` vs `tsuru_common`); two fused unrelated businesses inside cross-app-be (Modas Laura cross-docking with hardcoded branding/static `EMAIL_RECIPIENT` + stadium-origin POS); duplicated CR geo data (data-api `locations` vs storefront client-side `@/data/locations`); plus C5's fiscal duplications.

### T5. Legacy markets-api vs reality, and documentation drift — **Severity: Medium · Effort: M**
markets-api is a tenant/CMS control plane with **zero** commerce endpoints, yet root CLAUDE.md documents ProductController/OrderController, local `requireAuth`, and gateway userId validation — none exist (`server/src/routes.ts`). Dead scaffolding: `HomePageContent` entity/repo injected nowhere, `lambda.cts` SQS stubs, Stripe/PayPal config keys without SDKs, a vitest file for a deleted middleware. The strangler-fig migration toward the Python platform is started (SNS org-events + read-only `organization_settings`) but no deprecation plan exists.

### T6. data-services operational sprawl — **Severity: Medium · Effort: L**
34 Lambdas/ECR repos/SAM stacks for tiny CRUD catalogs behind one hand-merged 5,373-line OpenAPI gateway; production gateway exposes 79 GET + 79 OPTIONS only — the full write surface is reachable only via localhost seed scripts; the Redis cache layer is all-TODO no-ops while every service ships a CacheController; one-off codemod scripts (`fix_controllers.py`) left in tree.

### T7. Quality/ops posture — **Severity: Medium · Effort: M**
POS, landing, dashboard, and all storefronts have **zero tests** (cross-app-be and jbiller have real suites); POS logs full API response payloads to console in production (`templates/pos-system/src/lib/api.ts`); Cognito pool `us-east-1_A74zp2qOE` and a HostedZoneId committed plaintext in two gateway templates, violating the repo's own security rules; `DocumentActionModal.tsx` is hardcoded Spanish against the i18n rule; no observability beyond the jbiller authorizer's usage metrics; no real-time push anywhere.

### T8. Frontend dead-code inheritance — **Severity: Low · Effort: S**
Landing carries an unrouted ~290-line Cognito `useAuth.ts`, `auth-navbar.tsx`, and multi-tenant `apiUtils.ts`, dragging aws-amplify into a static site's bundle; single shared root `package.json` mixes backend + all frontend deps (~100 packages, unused `gh-pages`, `@google-cloud/storage`).

---

## 4. OPPORTUNITIES — cheap wins given what already exists

| # | Opportunity | Why it's cheap | Effort |
|---|---|---|---|
| O1 | **Finish + deploy the lambda-authorizer everywhere.** The tri-mode authorizer (public/API-key/Cognito) is built and live on one API; only the membership check TODO (`organization_auth_checker.py:73-85`) and gateway wiring remain. Closes most of C1 in one move; pass authorizer context to kill the `x-user-id` trust (C7). | Convergence point already exists | M |
| O2 | **Mount what's already written in the POS:** register a `/pos` route (or redirect `cajero` to `/dashboard/pos`), mount `ClosingFlow.tsx`, read `redirectAfterLogin`/`?redirect=` in Login/Register. Three blockers (C3, C7-redirect) are unwired existing code. | Code exists, zero new backend | S |
| O3 | **Wire checkout to the org's registered economic activities** (data already collected by the fiscal wizard, exposed via `useRegisteredOrganization.ts`) instead of `'722000'`. | One component change | S |
| O4 | **Fix the landing funnel:** point navbar CTAs at the POS app, deliver the contact form (SES exists in 3 backends; or a jbiller API-key-scoped endpoint — `landing_stats`-style scopes already exist), replace placeholder phone, remove unverifiable traction claims. All content is JSON-driven — copy edits are config edits. | Static-site + content edits | S |
| O5 | **Public read-only product/category endpoints** for live orgs: products already exist in cross-app-be with full CRUD; exposing GETs through `PublicOrgController` or a public path on cross-app-be unbreaks the storefront browse half of C2 without building an order domain yet. | Backend data + storefront consumers both exist | M |
| O6 | **Secrets hygiene sprint:** move P12/PIN/ATV password to KMS-encrypted columns or Secrets Manager, stop returning them in GET, make the Hacienda realm env-driven, drop the sessionStorage password stash, strip POS prod response logging. High-leverage risk reduction with no feature work. | Mechanical, localized changes | M |
| O7 | **Pick one provisioner and one templates store:** the Python `infrastructure-service-provider` is the active SNS-driven path with self-healing re-emit; retiring `setup-template-bucket.js` and markets-api's `templates` duplication completes the strangler step already started. | Migration is already half-done | M |
| O8 | **Marketplace directory as the first community surface:** a public "discover stores" page aggregating existing `organizations` (slug, theme, logo) is a thin query over data that already exists — the cheapest credible step toward fairs (S1/S4), and a natural home for a "feria" grouping attribute later. | Read-only over existing tables | M |
| O9 | **Tsuru rebrand execution on the landing:** the landing is a JSON-driven DXP with a single theme file (`themes.json`) and empty logo slots — applying the research's name, 6-color natural-pigment palette, and solidarity micro-copy is content/config work, no architecture. Resolves S6 and aligns SEO/site URL drift. | DXP designed for exactly this | S–M |
| O10 | **Finish the repo split:** migrate the two CI pipelines off monorepo paths, untrack `templates/pos-system` + `landing-client`, kill the duplicate landing deploy path. Removes a whole class of silent-divergence risk (T1). The `monorepo-folder-split` playbook used for extraction defines the remaining steps. | Process completion, not new build | M |

---

## 5. Prioritized Top-10

Ranking weighs: legal/security exposure first, then broken-promise blast radius, then vision leverage per unit effort.

| # | Gap/Action | Type | Severity | Effort |
|---|---|---|---|---|
| 1 | **Close the authorization gap**: finish lambda-authorizer membership check and deploy it on all 4 gateways; add userId↔sub matching; stop trusting `x-user-id` (C1, C7, O1) | Critical | Critical | M |
| 2 | **Fiscal credential + realm hardening**: encrypt P12/PIN/ATV secrets, remove them from GET responses, env-drive the Hacienda OAuth realm (C4, O6) | Critical | Critical | M |
| 3 | **Unify fiscal sources of truth**: single consecutive allocator, explicit cross-app-be `sales` ↔ jbiller `billing_sales` relation, one tax engine (or contract tests pinning the three) (C5) | Critical | Critical | L |
| 4 | **Unblock the cashier loop**: route `/pos`, mount `ClosingFlow`, create server-side shift on session start (C3, O2) | Critical | High | S–M |
| 5 | **Fix the funnel + trust breaches on the landing**: CTAs → POS app, real contact delivery, remove placeholder/unverifiable claims, soften "Garantizamos" or build what backs it (C6, part of S7, O4) | Critical/Strategic | High | S |
| 6 | **Decide the product thesis**: SSE community platform (build fairs/barter/buyer identity) vs CR fiscal POS (rewrite the landing to match reality). Every strategic gap (S1-S5, S7) hangs on this; until decided, the marketing sells software that doesn't exist (S1, S2, S3, S5) | Strategic | Critical (vision) | XL (decision: S) |
| 7 | **Repair or de-scope storefront commerce**: ship public product/category reads (O5) now; then either build a consumer-order domain + real publish pipeline or relabel storefronts as catalog+WhatsApp brochures (C2) | Critical | High | M→L |
| 8 | **Finish the repo split and retire duplicate surfaces**: one landing deploy path, untrack extracted folders, pick one provisioner/templates store, sunset `dashboard/` in favor of the POS admin (T1, T2, T4, O7, O10) | Technical | High | M–L |
| 9 | **Shared-DB contract hardening**: per-service DB roles or real RLS, schema-contract tests across the 4 writers, single master for `organizations` (C5-org, T3) | Technical | High | L |
| 10 | **Execute the Tsuru rebrand + first community surface**: apply the research's identity (name, palette, solidarity copy) on the JSON-driven landing and ship the cross-org marketplace directory as the seed of fairs (S6, S4, O8, O9) | Strategic | Medium-High | M |

**One-line synthesis:** the ecosystem has exactly one production-grade product (CR e-invoicing POS) wearing the marketing of another (SSE community marketplace), with security that trusts the client, fiscal truth split across duplicate engines, and its boldest differentiators — fairs, barter, mutual aid — existing only as JSON copy; the cheapest path forward is to lock down authorization and fiscal secrets immediately, wire up the finished-but-unmounted code, and make the strategic vision-vs-reality decision before investing in either narrative.
