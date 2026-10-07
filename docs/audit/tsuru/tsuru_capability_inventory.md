# Tsuru Ecosystem — Capability Inventory (Phase 4)

Master checklist for gap analysis. Systems referenced:

- **markets-api** — BeautyMarket `/server` (Express/Lambda, api.tsuru.jcampos.dev): platform control plane
- **dashboard** — BeautyMarket `/dashboard` (admin SPA, admin.tsuru.jcampos.dev)
- **storefronts** — BeautyMarket `/templates/{tsuru-demo, tech-gadgets, ...}` (9+ themed store SPAs)
- **POS** — `templates/pos-system` / `chepelcr/tsuru-pos-system` (Tsuru POS SPA, pos.tsuru.jcampos.dev)
- **cross-app-be** — `E:/dev/cross-app-be` (FastAPI Lambda, orders-api.tsuru.jcampos.dev): cross-docking + POS backend
- **jbiller** — `biller-apps/auth` (multi-Lambda Python, sales-api.tsuru.jcampos.dev): Hacienda e-invoicing core + lambda-authorizer + infra provisioner
- **data-api** — `biller-apps/data-services` (34 FastAPI Lambdas, data-api.tsuru.jcampos.dev): fiscal reference catalogs
- **landing** — `landing-client` / `chepelcr/tsuru-landing` (static marketing SPA, tsuru.jcampos.dev)

**Status legend:** Live = implemented and in production use · Partial = works with material gaps · Scaffolded = code/schema exists, not functional/wired · Deprecated = superseded or dead · Missing-but-promised = claimed in docs/marketing/UI but absent in code.

---

## 1. Commerce (storefront e-commerce)

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Themed storefront SPAs (9 templates: demo, tech, fashion, crafts, foods, fitness, pet, beauty, pollo-porteno) | storefronts | Live | `templates/*` folders; deployed via `deploys/setup-template-bucket.js` to `{slug}.tsuru.jcampos.dev`; `server/src/seeds/template-seed.ts` (9 templates) |
| Template demo-mode content serving (theme/contact/pages/categories/products from `template_*` sample tables) | markets-api, storefronts | Live | `server/src/controllers/TemplateController.ts` (`/api/templates/{id}/theme|contact|pages|categories|products`); `templates/tsuru-demo/src/lib/api.ts:7-22` |
| Org-mode storefront content (theme/contact/pages by live org) | markets-api, storefronts | Live | `server/src/controllers/PublicOrgController.ts:10-14` (`/:orgId`, `/theme`, `/contact`, `/pages`, `/pages/:slug`); consumed via `fetchOrgContent` in `templates/tsuru-demo/src/lib/api.ts:27-41` |
| Org-mode storefront product & category browsing | markets-api, storefronts | Missing-but-promised | Storefronts call `/api/public/organizations/{id}/products` and `/categories` (`templates/tsuru-demo/src/lib/api.ts:62-81`, `useContent.ts useProducts/useCategories`), but `PublicOrgController.ts` has NO products/categories routes — live-org product browsing 404s; real products live in cross-app-be, which has no public unauthenticated endpoint |
| Shopping cart (client-side, localStorage-persisted) | storefronts | Live (client-only) | `templates/tsuru-demo/src/store/cart.ts` (zustand persist); `components/cart/cart-sidebar.tsx` |
| Checkout / order placement | storefronts | Partial | `templates/tsuru-demo/src/components/cart/checkout-modal.tsx` collects CR address (client-side `@/data/locations`) and emits a **WhatsApp message** (`generateWhatsAppMessage` from `@/lib/whatsapp`); no API call, no order persisted anywhere |
| E-commerce order management (storefront orders backend) | — | Missing-but-promised | Root `CLAUDE.md` claims `/orders` org routes and Order entities; no Order controller in `server/src/controllers/`; cross-app-be `/orders` is B2B cross-docking POs (`app/models/order.py`, table `crossdocking_orders`), not consumer orders |
| Product & category admin CRUD (fiscal-enriched) | cross-app-be, POS, dashboard | Live | `cross-app-be/app/controllers/products_controller.py`, `app/services/product_service.py`; POS `src/pages/dashboard/ProductsPage.tsx`, `src/hooks/useProducts.ts`; dashboard `buildOrdersApiUrl` (`dashboard/src/lib/apiUtils.ts`) |
| Product Excel bulk import | cross-app-be, POS | Live | `cross-app-be/app/services/product_excel_service.py` (`/products/parse`) |
| Product price-bounds / range filters | cross-app-be, POS | Live | `/products/price-bounds` (POS `src/lib/api.ts` ordersOrgPath); POS `components/common/RangeSlider.tsx` |
| Inventory management | POS, markets-api | Partial | POS local inventory store `src/store/inventory.ts` (Dexie InventoryRecord) + markets-api `/inventory/opening` endpoint (POS `orgPath`); no full stock-control backend domain |
| Dual product write path (same `products` table) | markets-api (template seeds), cross-app-be | Live (debt) | cross-app-be `app/models/product.py` + alembic `b1c2d3e4f5a6_add_cabys_and_product_fiscal_fields.py` extends the shared BeautyMarket table; both this service and the Node backend historically expose product writes over the same tables |
| Template gallery showcase (public Examples page) | landing, markets-api | Live | `landing-client/src/pages/Examples.tsx:106-117` → `GET /api/templates?activeOnly=true`; preview URLs convention-derived client-side (`{name}-example.tsuru.jcampos.dev`) |

## 2. POS (point of sale)

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| POS checkout & sale capture (cart → payment → document) | POS, cross-app-be, jbiller | Live | POS `src/hooks/useCartFlow.ts`, `src/store/cart.ts`; sale POST to sales-api (`src/lib/api.ts salesOrgPath`) and cross-app-be (`app/services/sale_service.py`) |
| Offline-first sale queue + background sync | POS | Live | `src/lib/db.ts` (Dexie `pos-system-db`), `public/sw.js syncPendingSales()`; unused `token` field on SaleRecord — replay auth unaudited |
| Sales sessions (types `match`/`shift`) lifecycle | cross-app-be, POS | Live | `cross-app-be/app/models/session.py`; POS `src/pages/dashboard/SessionsPage.tsx`, `src/types/session.ts` (stadium-sales origin: contexts `gradas`/`mesa`/`caja`) |
| Cashier/supervisor assignments (one active per user) | cross-app-be, POS | Live | `app/models/assignment.py` (unique partial index); POS `src/types/assignment.ts`; legacy duplicate route `/api/users/{u}/organizations/{o}/assignments` retained (`app/controllers/assignments_controller.py`) |
| Branches & terminals ("puestos") with device registration | cross-app-be, POS | Live | `app/models/branch.py`, `app/models/terminal.py` (unique org+code, unique device_id); POS `PuestosPage.tsx` |
| Cash closings & reconciliation (cash/SINPE/card, expected vs declared) | cross-app-be, POS | Live | `app/models/closing.py` (generated difference columns), `app/services/closing_service.py`; POS `components/pos/ClosingFlow.tsx` |
| Closing approval authorization (manager-only) | cross-app-be | Scaffolded | `is_manager` parameter defaults to `True` "for backward compatibility" — `docs/CLOSING_AUTHORIZATION.md`, `app/services/closing_service.py`; effectively unenforced |
| Per-terminal document consecutives | cross-app-be AND jbiller | Live (duplicated) | `cross-app-be/app/models/consecutive.py` + `consecutives_controller.py`; `auth/shared/jbiller_common/models/consecutive.py` allocated atomically in `app/sales-api/src/services/sales_pipeline.py` — two implementations of invoice numbering |
| Live sales dashboard KPIs (stands, revenue, avg ticket, ranking) | cross-app-be, POS | Live | `app/services/dashboard_service.py` (`/dashboard`); POS `components/analytics/AnalyticsTable.tsx` |
| B2B clients → stores → departments hierarchy | cross-app-be, POS | Live | `app/models/client.py` (GLN, unique company+gln+nationality), `store.py`, `department.py`; POS `useClients/useStores/useDepartments.ts` (bug fixes JCA-44..50 per project memory) |
| Cross-docking PO ingest from retailer Excel | cross-app-be | Live | `app/services/excel_parser.py` (NUM_DOC/NOMBRE_CLIENTE/UXC headers), `order_service.py`, `/orders/parse`, `/orders/{doc}/crossdocking/parse`, `/reprocess` |
| Distribution reports (PDF + Excel) to S3/CloudFront | cross-app-be | Live | `app/services/pdf_service.py` (pdfkit/openpyxl, CloudFront invalidation per upload) |
| Delivery confirmations + SES email | cross-app-be, POS | Partial | `app/services/confirmation_service.py` works, but emails go to one static `EMAIL_RECIPIENT` with hardcoded "Modas Laura" branding (`app/services/email_service.py`) — not per-client; POS confirmation routes marked `TODO(verify-endpoint)` (`src/lib/api.ts crossAppConfirmationPath`) |
| POS org/admin shell (members, settings, CMS, deployments — migrated from dashboard) | POS | Live (duplicated) | POS `pages/dashboard/Org*Page.tsx`, `MembersPage.tsx`, `ContentPage.tsx`, `DeploymentsPage.tsx`, `GalleryPage.tsx`; duplicates the dashboard app (memory: project_pos_dashboard_migration.md) |
| POS analytics via markets-api | POS, markets-api | Partial | POS `orgPath('/analytics')` referenced; backend endpoints "still to verify" per project memory |

## 3. E-invoicing / fiscal (Costa Rica Hacienda v4.4)

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Electronic document creation (FE/TE/NC/ND/FC/FExp) | jbiller (sales-api), POS | Live | `app/sales-api/src/controllers/sale_controller.py`; `shared/jbiller_common/models/sale.py` (`billing_sales` + 9 child tables, alembic `c3d4e5f6g7h8`); POS `src/types/invoice.ts` |
| 50-digit clave + 20-digit consecutive generation | jbiller | Live | `shared/jbiller_common/hacienda/services/clave_service.py`; atomic consecutive in `sales_pipeline.py` step 3 |
| Hacienda XML build + XAdES-EPES signing | jbiller | Live | `shared/jbiller_common/hacienda/services/xml_build_service.py`, `xml_sign_service.py` (lxml) |
| ATV submission + OAuth token brokerage | jbiller | Live (prod-cutover risk) | `hacienda_submission_service.py`; `GET /organizations/{o}/hacienda-token`; OAuth realm hardcoded to **staging** `rut-stag` in shared code |
| Validation polling & status reconciliation (SQS chain) | jbiller (document-validator) | Live | `app/document-validator/src/services/validator_pipeline.py` (SAVE_DOCUMENT/REVALIDATE with attempt escalation); `cloudformation/hacienda-messaging.yml` FIFO mesh |
| Receiver invoice validation (accept/partial/reject) | jbiller, POS | Live | sales-api `.../invoice-validation` routes; POS `useInvoiceValidation.ts` |
| Document PDF rendering (incl. rejection PDFs) | jbiller (document-pdf-generator) | Live | `app/document-pdf-generator/src/services/pdf_pipeline.py`; artifacts at sales-artifacts.tsuru.jcampos.dev |
| Document delivery — email with XML/PDF + customer webhooks | jbiller (document-notification) | Live | `notification_pipeline.py`; `notification_email_service.py` (SES raw MIME); `notification_callback_service.py` (per-org callback_url) |
| Notification resend | jbiller | Scaffolded | `POST .../notifications/resend` is an acknowledged stub (`sale_controller.py`) |
| XML regenerate | jbiller | Scaffolded | `POST .../xml/regenerate` — "v1: stub" (`sale_controller.py`) |
| Historical document backfill | jbiller (hacienda-history) | Partial | SQS-only handler, older code generation (marshmallow, manual routing, `exceptions/ivois_exception.py`); overlaps validator's VALIDATE_HISTORY_DOCUMENT flow |
| Org Hacienda credentials & P12 certificate config | jbiller (organization-configurations), POS | Live (security debt) | `app/organization-configurations/src/models/organization_configuration.py` — certificate bytes + `certificate_pin` + ATV password stored **plaintext in Postgres** and returned by GET per `api-gateway/endpoints.json`; POS `useOrgConfigurations.ts` |
| Hacienda taxpayer profile (regime, situation, economic activities) | jbiller (registered-organizations), POS | Live | `registered_organizations_controller.py`, `shared/jbiller_common/models/registered_organization.py`; POS `useRegisteredOrganization.ts` |
| Fiscal catalog platform (28+ catalogs: taxes, rates, conditions, exemptions, units, identifications, regimes, CABYS, document types/versions, etc.) | data-api, POS | Live (read-only) | 34 services in `data-services/app/*`; `api-gateway/template.yml` exposes 79 GET + 79 OPTIONS only; POS `src/services/data-api/client.ts` (~40 getAll* methods), `useDataApi.ts`, DocumentVersionContext auto-injects v4.4 |
| Catalog write/admin surface | data-api | Scaffolded | POST/PUT/PATCH/DELETE fully implemented in every controller but never exposed through API Gateway; used only by localhost `scripts/seed_catalogs.py` + `catalogs_seed_data.json` |
| Live Hacienda proxies: taxpayer lookup, CABYS search, exchange rates, exemption validation | data-api | Live | `consumer-identifications`, `consumer-cabys`, `consumer-exchange-rate`, `consumer-exemptions`; `shared/tsuru_common/daos/hacienda_api_client.py` (upsert-on-read caching) |
| CR geographic hierarchy (province→canton→district→neighborhood) + currencies | data-api, storefronts | Live (duplicated) | `app/locations/src/models/*` seeded from `Codificacionubicacion_V4.4.xlsx`; storefront checkout duplicates it client-side (`templates/tsuru-demo/src/data/locations`) |
| Tax & discount calculation engine (sequential cascade, IVA/ISC/ISEBEC) | POS AND cross-app-be | Live (dual-maintained) | POS `src/services/taxCalculationService.ts`, `discountCalculationService.ts` + `CALCULATION_AUDIT.md` intentionally mirror cross-app-be Python services (POS CLAUDE.md §8) — duplicated business-critical math |
| Hacienda metadata on cross-app-be POS sales | cross-app-be | Partial | `app/models/sale.py` stores document_type/activity_code/receiver/payments; `app/enums/hacienda_codes.py`; no signing/submission in this repo — issuance lives in jbiller; relation between cross-app-be `sales` and jbiller `billing_sales` is implicit |
| Multi-country fiscal support | data-api | Scaffolded | `country_code` on every model (`hacienda_base_model.py`), examples cite '840' US, but only CR (188) seeded; `consumer-identifications` hard-validates a CountryCodes enum |
| Hacienda submit/poll audit trail | jbiller | Live | `shared/jbiller_common/models/hacienda_document_log.py`, `notification.py` (keyed by clave, mirrored to Sale atv_validation_* fields) |

## 4. Identity & access

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Cognito authentication (sign-up/sign-in/verify/reset) | POS, dashboard (shared pool) | Live | POS `src/contexts/AuthContext.tsx`, `src/lib/amplify.ts`; dashboard `useAuth.ts`; pool `us-east-1_A74zp2qOE` shared by all gateways (committed plaintext in `auth/api-gateway/template.yml` and `data-services/api-gateway/template.yml` — violates the project's own security rule) |
| Email-verification gate + Cognito→DB auto-sync | markets-api | Live | `server/src/services/UserService.ts getUserProfile` (EMAIL_NOT_VERIFIED 403, auto-sync, welcome email); `CognitoService.ts` |
| JWT validation at API Gateway edge | all 4 APIs | Live | Cognito authorizers in `server/api-gateway/template.yml`, `cross-app-be/api-gateway/template.yml`, `auth/api-gateway/template.yml`, `data-services/api-gateway/template.yml` |
| userId-in-path ↔ JWT `sub` matching | markets-api | Missing-but-promised | Root `CLAUDE.md` claims "API Gateway validates userId in path matches JWT sub"; `api-gateway/template.yml` has no claim-to-path mapping; controllers read `req.params.userId` raw (`UserController.ts:44`) → cross-user/cross-org IDOR for any valid token holder |
| Org-membership authorization at request time | jbiller (lambda-authorizer) only | Partial | Implemented in `app/lambda-authorizer/src/validators/organization_auth_checker.py` (path-regex org extraction + DB membership + role context), but wired to the tsuru API only; **absent** in markets-api Express (no middleware mounted, `server/src/routes.ts`), cross-app-be (WHERE clauses only, `docs/organization_authorization_verification.md`), sales-api (plain Cognito authorizer), data-api (any authenticated user reads everything) |
| RBAC model + management API (Role→Module→Submodule→Action) | markets-api, POS UI | Partial | Fully modeled & seeded (`server/src/entities/Module.ts` etc., `seeds/rbac-seed.ts`), managed via `/rbac` routes and POS `MembersPage.tsx`; **enforcement middleware never mounted** — `middleware/permissions.ts` exists, `req.userId` never populated, `createRequirePlatformAdmin` hardcodes `isPlatformAdmin=false`. RBAC is data, not enforcement |
| API keys with scopes, rate limits, usage metrics | jbiller (lambda-authorizer) | Live | `app/lambda-authorizer/src/models/api_key.py` (SHA-256 hashed, scopes e.g. `landing_stats`, `public_templates`), `services/statistics_tracker.py`; `api-management/` admin tooling |
| Multi-mode authorizer (public / API-key / Cognito JWT) | jbiller | Live | `app/lambda-authorizer/src/validators/auth_mode_detector.py`; deployed as `tsuru-{env}-lambda-authorizer` |
| Team membership & email invitations (token-based accept) | markets-api, POS, dashboard | Live | `server/src/services/MembershipService.ts`, `InvitationService.ts` (SES); public `/api/invitations/token/:token`, `/accept/:token` (`routes.ts`) |
| Cognito custom email branding (CustomMessage trigger) | markets-api | Live | second handler `cognitoHandler` in `server/lambda.cts:44+` |
| x-user-id propagation | cross-app-be (gateway-injected), POS (client-derived), sales-api (client-trusted) | Partial (risk) | cross-app-be gateway maps `claims.sub` → x-user-id (`api-gateway/template.yml:127-128`, correct); POS also derives it client-side from the JWT (`src/lib/api.ts:39-48`); sales-api trusts the raw client header, defaulting to `"anonymous"` (`sale_controller.py`) — spoofable audit attribution; cross-app-be `UserIdMiddleware` guards the wrong prefix (`/api/users/*`) after routes moved |
| In-app auth for markets-api local dev | markets-api | Missing-but-promised | CLAUDE.md claims `requireAuth` middleware locally; no auth middleware applied to any route — local dev fully unauthenticated |
| Landing-site auth flows | landing | Deprecated (dead code) | `landing-client/src/hooks/useAuth.ts` (~290 lines), `auth-navbar.tsx`, `PasswordStrengthIndicator.tsx`, multi-tenant `apiUtils.ts` builders — no login UI routed; drags aws-amplify into the bundle |
| Postgres Row-Level Security | markets-api DB | Scaffolded | `entities/Organization.ts` pgPolicy is permissive `using true` for role "authenticated" — provides no isolation |

## 5. Multi-tenancy

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Organization lifecycle + 3-step onboarding (draft → contact → template) | markets-api, POS, dashboard | Live | `server/src/services/OrganizationService.ts`; onboarding step2/step3 routes (`routes.ts:70-91`); POS org-create migration (project memory) |
| Subdomain tenant routing + slug/subdomain availability checks | markets-api, storefronts | Live | `organizations.slug/subdomain/customDomain` (`entities/Organization.ts`); public `/api/organizations/by-subdomain/:subdomain`, `check-slug`, `check-subdomain` (`routes.ts:104-130`); storefront `SubdomainContext` |
| Custom domain attach + status (ACM/CloudFront/Route53) | jbiller (infrastructure-service-provider) | Live | `app/infrastructure-service-provider/src/services/custom_domain_service.py`; `POST /organizations/{org}/custom-domain`, `/attach-custom-domain`, `/domain-status` |
| Tenant data isolation (org_id WHERE-clause scoping) | all backends | Partial | Universal convention (`find_by_id_and_organization` in cross-app-be; composite org indexes in `jbiller_common/models/sale.py`; Drizzle WHERE in markets-api) — but with no membership enforcement (§4), any authenticated user can address any orgId; isolation is convention, not control |
| Inconsistent tenant key naming | cross-app-be | Live (debt) | cross-docking tables use `company_id`, POS tables `organization_id`, both = `organizations.id` (`app/models/order.py` vs `branch.py`) |
| Shared `organizations` table across repos | markets-api (owner), cross-app-be (writes + added columns), jbiller (read-only) | Live (coupling debt) | `cross-app-be/app/models/organization.py` + `_sync_organization` auto-creates orgs with `owner_id='system'` from parsed Excel; cross-app-be alembic adds gln/internal_code/logo_url; `auth/shared/jbiller_common/models/organization.py` read-only ("never write a phantom org") |
| Per-org settings (theme/contact/payment/shipping, normalized) | markets-api, POS, dashboard | Live | `server/src/entities/{Theme,Contact,Payment,Shipping}Settings.ts` + services; POS `useOrgSettings.ts`; legacy `Organization.settings` JSONB still present, marked "will be deprecated" |
| Per-org infrastructure state (S3/CloudFront/ACM/status) | jbiller writes, markets-api reads | Live | `server/src/entities/OrganizationSettings.ts` ("OWNED and WRITTEN by the infrastructure microservice... Do NOT add insert/upsert") — cross-language shared-DB contract gating `DeploymentService.publishPreDeployment` |
| Two coexisting theme systems (storefront template vs POS shell theme) | POS, markets-api | Live | POS `src/types/storefront.ts` explicitly distinguishes them; landing additionally runs its own dual theming (`brand-theme.ts` vs `ThemeContext.tsx`) |
| markets-api dual org path shapes (`/memberships/organization/{o}` vs `/organization/{o}`) | markets-api, POS | Live (trap) | documented in POS `src/lib/api.ts` comments (orgPath vs orgSettingsPath); mixing them 404s |

## 6. CMS / content

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Org storefront CMS (pages → sections → content) | markets-api, POS, dashboard | Live | `server/src/entities/{Page,PageSection,SectionContent}.ts`, `PageService`/`SectionContentService`; org routes `/pages/:pageId/sections/:sectionId/content` (`routes.ts:29-64`); POS `ContentPage.tsx`, `useCmsContent.ts` |
| CMS component catalog | markets-api | Live | `/api/components` (`routes.ts:98`), `entities/Component.ts`, `seeds/component-seed.ts` |
| Template gallery + clone-to-org at onboarding step 3 | markets-api | Live | `services/TemplateCloneService.ts` (`cloneTemplateToExistingOrg`), `entities/Template*.ts` (9 template_* content tables), `seeds/template-seed.ts` |
| CMS publish pipeline (pre-deployments → deployments) | markets-api, POS | Partial (simulated) | `PreDeploymentService` + `DeploymentService.ts:58-88` — "publish" only uploads `config.json` to the org bucket then immediately records success; no build step; also re-emits SNS OrganizationRegistered if infra pending/failed (`DeploymentService.ts:32-46`) |
| Media library (presigned upload, gallery) | jbiller (org-configurations), POS; markets-api S3 presign | Live | auth media endpoints via `authOrgPath` (root-mounted, no /api prefix — POS `src/lib/api.ts:269`); POS `useMediaLibrary.ts`, `GalleryPage.tsx`; `server/src/services/S3UploadService.ts` |
| Landing JSON-driven DXP (22 bilingual content files, git as database) | landing | Live | `src/content/*.json`, `src/lib/admin-store.ts` (22 slices), `src/admin/manifest.ts` (single source of truth for sidebar/router/versions) |
| Landing local admin CMS (dev-only, tree-shaken from prod) | landing | Live (dev-only by design) | `src/admin/*` (26 pages), `plugins/local-cms.ts` (localhost-only `/__local/content|asset|publish` → git commit+push), gate `src/lib/admin-enabled.ts`, CI grep for `__local` leakage (`deploy.yml`); no authentication — safe only while the gate holds |
| Landing prerender / SEO / sitemap | landing | Live (drift) | `scripts/prerender.mjs`, `src/lib/seo.ts`; `seo.json` still says siteUrl `tsuru.jcampos.dev` / "Tsuru" titles while deploy targets tsuru.jcampos.dev; prerender ROUTES manually synced with `Router.tsx` |
| Landing contact form delivery | landing | Scaffolded (fake) | `src/pages/Contact.tsx:24-38` — 1s `setTimeout` then success toast; `settings.json contact.delivery='none'` |
| Auto-translate | landing | Scaffolded | `settings.json autoTranslate {enabled:false}`, no implementation |
| Blog (static JSON articles, featured/order) | landing | Live | `src/repositories/blog.repository.ts`, `src/services/blog.service.ts`, `src/pages/Blog.tsx` |
| Bilingual i18n (EN/ES) | landing, POS, dashboard | Live | landing per-entity `field[lang]` + `LanguageContext.tsx`; POS ~4,100-line `src/contexts/LanguageContext.tsx`; 840+ keys in dashboard (FRONTEND_STANDARDS.md) |
| Legacy home-page CMS | markets-api | Deprecated (dead) | `entities/HomePageContent.ts`; `HomePageContentRepository` instantiated in `dependency_injection.ts`, injected nowhere; `entities/Category.ts`, `Session.ts` likewise dead |
| Dashboard admin app | dashboard | Live but being superseded | dashboard remains deployed while POS re-implements org settings/CMS/templates/deployments/members (POS `pages/dashboard/*`) — duplicated admin surface; old `client/` app Deprecated (`client/DEPRECATED.md`) |
| Landing self-introspection tooling (dependency graph, content explorer, git diagnostics) | landing | Live (dev-only) | `src/admin/pages/InventoryPage` + `scripts/build-inventory.mjs` → `src/content/inventory.json`; ContentExplorer; Diagnostics via `/__local/git-log` |

## 7. Community / social-economy

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Community values & positioning (fair trade, local production, conscious consumption, transparency) | landing | Live (marketing copy only) | `landing-client/src/content/community.json` ("More than a store — a community", 6 principles), `src/pages/Comunidad.tsx` |
| Fairs — virtual & in-person multi-seller events ("multiple sellers in one shared space; buyers discover many local producers at once") | landing (promise); no backend | Missing-but-promised | `landing-client/src/content/fairs.json` describes fair types and mechanics as a product feature (`src/pages/Ferias.tsx`, "Active fairs" badge); **no fair/event entity, endpoint, or UI exists in markets-api, cross-app-be, jbiller, data-api, POS, or storefronts** |
| Multi-seller shared marketplace / cross-store discovery | — | Missing-but-promised | Implied by community/fairs marketing; the platform is strictly one-org-per-subdomain storefronts with no cross-org buyer surface (no marketplace aggregation endpoint in any repo) |
| Community membership / buyer accounts / social features | — | Missing-but-promised | No buyer-side identity (Cognito users are org operators; markets-api default role on first sync is `customer` but no buyer UX exists); storefront checkout is anonymous WhatsApp; no reviews/follows/community entities in any schema |
| Blog as community channel | landing | Live (static) | `src/content/blog.json`; edited via admin `BlogPage.tsx` |

## 8. Payments & billing

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| POS payment capture (cash / card / SINPE buckets) | POS, cross-app-be, jbiller | Live | sale `payments` JSON array (`cross-app-be/app/models/sale.py`); `jbiller_common` sale_payments table; closings reconcile cash/SINPE/card (`app/models/closing.py`) |
| SINPE Móvil | POS | Partial (reference only) | `VITE_SINPE_NUMBER` env displayed for payment type '06' (`useCartFlow.ts`) — no SINPE API integration or payment confirmation |
| Fiscal payment-method catalog | data-api | Live | `app/payments` service (Hacienda payment-methods catalog) |
| Org payment settings (currency, methods, `stripeEnabled` flag) | markets-api, dashboard | Live (settings CRUD only) | `entities/PaymentSettings.ts` + service; cloned from templates at onboarding |
| Storefront online payment processing (gateway checkout) | storefronts | Missing-but-promised | PaymentSettings/`stripeEnabled` exist and templates clone payment config, but checkout is WhatsApp-only (`checkout-modal.tsx`) — no gateway, no charge, no order record |
| Stripe platform billing (SaaS subscriptions) | markets-api | Scaffolded | `organizations.stripeCustomerId` and `plan` schema fields only; no Stripe SDK in server dependencies |
| Exchange rates (USD/EUR, for invoicing) | data-api | Live | `consumer-exchange-rate` (Hacienda `/indicadores/tc`, stored to DB) |

## 9. Deployment / platform infrastructure

| Capability | System(s) | Status | Evidence |
|---|---|---|---|
| Per-org storefront infra provisioning (S3+CloudFront+Route53+ACM) | jbiller (infrastructure-service-provider) | Live | `app/infrastructure-service-provider/src/services/infrastructure_provisioning_service.py`, `services/aws/*`; consumes SNS ORGANIZATION_REGISTERED (`handlers/organization_registered_handler.py`); writes `organization_settings` |
| Org-events SNS publishing | markets-api | Live | `services/OrganizationEventPublisher.ts`; `cloudformation/organization-publish-topic.yml` (`tsuru-{env}-organization-events`) |
| Template git-deploy to org buckets (GitHub PAT clone) | jbiller | Live | `services/template_deployment_service.py` (PAT in Secrets Manager); `models/template.py` has repository_url — mirrors markets-api `templates` table (duplicated domain) |
| Bulk frontend deploy script (9 templates + dashboard + landing) | BeautyMarket monorepo | Live (duplicated) | `deploys/setup-template-bucket.js` — overlaps with jbiller infrastructure-service-provider: two provisioning systems for the same storefront infra |
| Async event mesh (SNS+SQS FIFO: validate → PDF → notify) | jbiller | Live | `cloudformation/hacienda-messaging.yml`; `app/*/src/services/event_publisher.py`; idempotent ownership rules documented in `validator_pipeline.py` |
| SQS/SNS handling in markets-api Lambda | markets-api | Scaffolded | `server/lambda.cts:18-37` — empty stubs ("Add SQS processing logic here") |
| CI/CD — CodePipeline two-phase container builds | cross-app-be, data-api, markets-api | Live | `buildspec-build.yml`/`buildspec-update.yml`/`buildspec-api.yml` + `cloudformation/codepipeline.yml` in each repo |
| CI/CD — GitHub Actions OIDC deploys | POS, landing, jbiller (migrating) | Live / Partial | POS `.github/workflows/deploy.yml` + `scripts/deploy.sh` (SSM config, OIDC role `tsuru-{repo}-gha-deploy`); landing `deploy.yml` → GitHub Pages with `__local` leak gate; jbiller GH Actions added while CodePipeline templates remain (commits e6404e8, 3412375) |
| Dual deploy paths during repo split (monorepo vs standalone) | landing, POS, BeautyMarket | Partial (split limbo) | landing: monorepo `setup-template-bucket.js` → tsuru.jcampos.dev vs standalone Pages → tsuru.jcampos.dev (nested `.git` in `landing-client/`); POS gitignored-yet-tracked per root CLAUDE.md split rules — drift risk between copies |
| Shared config plumbing (SSM Parameter Store + Secrets Manager secret `tsuru/{env}/database`) | all backends | Live (coupling) | `server/src/config/appConfig.ts`; `cross-app-be/app/configuration/app_config.py`; `jbiller_common/configuration/`; `tsuru_common/configuration/` — jbiller reads data-services' SSM namespace `/tsuru/{env}/commondata/*` (cross-repo DB coupling) |
| Redis/ElastiCache caching | jbiller (used), data-api (dead) | Partial | jbiller org-config caches + eviction endpoints (`shared/jbiller_common/configuration/redis_config.py`, PATCH cache routes); data-api ships CacheController in all 34 services but `tsuru_common/utils/cache_utils.py` is all TODO no-ops, Redis provisioned in SSM and unused |
| API Gateway swagger sync (endpoints catalog → gateway) | cross-app-be, jbiller, data-api | Live (manual) | `cross-app-be/api-gateway/endpoints.json` (1574 lines), `data-services/api-gateway/endpoints.md` (1355 lines), `auth/api-gateway/endpoints.json` — manually kept in sync with app routes |
| Local dev environments | all backends + frontends | Live | `cross-app-be` docker-compose; `data-services` Dockerfile.local (34 services, ports 8001-8034); `auth/run/start_all_services.py`; Vite dev servers + `reboot-server.sh` in monorepo |
| Automated testing | varies | Partial | cross-app-be: real pytest suites (`tests/test_*_handler.py`, integration, conftest); jbiller: ~31 test files; markets-api: small vitest set (incl. a test for a deleted middleware, `middleware/__tests__/organizationContext.test.ts`); data-api: near-zero (one `TEST_REPORT.md`, couple `test_local.py`); **POS, landing, dashboard, storefronts: zero test files** |
| Observability / API usage metrics | jbiller authorizer only | Partial | `services/statistics_tracker.py` usage metrics; elsewhere only console logging — POS logs every request URL, status and full response payload in production (`src/lib/api.ts` "[API] Response data:") — data-leak/noise debt |
| Mobile wrapper app (Capacitor/Ionic) | markets-api CORS only | Scaffolded | `config/ExpressAppConfig.ts:57` allows `capacitor://` and `ionic://` origins; no mobile app in any repo |
| Real-time push / live updates | — | Missing (not promised) | No AppSync/WebSocket/SSE anywhere; POS/dashboard KPIs are React Query refetch |
| Shared-library duplication (Hacienda client, DB connection, config) | jbiller vs data-api | Live (debt) | `jbiller_common` and `tsuru_common` are parallel copies, incl. two identical `HaciendaApiClient` implementations |

---

## Reading notes for gap analysis

1. **The single largest cross-cutting gap is authorization, not authentication.** Every backend validates JWTs at the gateway, but org-membership/role enforcement exists only in the jbiller lambda-authorizer — and it is not in front of sales-api, orders-api, data-api, or markets-api routes. markets-api additionally lacks the documented userId↔sub check (IDOR), and RBAC is fully modeled but never enforced. (§4)
2. **The storefront commerce loop is broken end-to-end**: org-mode product browsing calls endpoints that do not exist (`/api/public/organizations/{id}/products` — §1), checkout is WhatsApp-only with no persisted order, and there is no consumer-order domain anywhere. The "e-commerce platform" today is a CMS-driven brochure-site generator; the working commerce stack is the unrelated B2B/POS/fiscal side.
3. **E-invoicing/fiscal is the most mature area** — full create→sign→submit→validate→PDF→notify chain is live; debt concentrates in plaintext P12/PIN/password storage, the staging OAuth realm, two stub endpoints, and duplicated tax math (POS TS vs cross-app-be Python) plus duplicated consecutive numbering (cross-app-be vs jbiller).
4. **Community/fairs — the landing site's flagship differentiator — has zero implementation** behind it in any repo (§7).
5. **Prime consolidation targets**: three admin surfaces (deprecated `client/`, live `dashboard/`, POS dashboard pages), two storefront-infra provisioning systems (`setup-template-bucket.js` vs jbiller infrastructure-service-provider), two `templates` metadata stores, two shared Python libraries, and two fused domains inside cross-app-be (cross-docking + stadium POS).
