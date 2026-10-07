# Tsuru Ecosystem — Product Strategy (Phases 10 + 12: Positioning & Product Architecture)

**Date:** 2026-06-11
**Inputs:** `tsuru_landing_audit.md`, `tsuru_system_discovery.md`, `tsuru_domain_model.md`, `tsuru_capability_inventory.md`, `tsuru_user_journeys.md`, `tsuru_architecture_audit.md`, `tsuru_gap_analysis.md`, `tsuru_reconciliation_report.md`, `tsuru_social_economy_alignment.md`, and the strategic research `docs/Rebranding Web_ Economía Indígena Solidaria.txt`.
**Role of this document:** reconcile the three layers — marketed vision (SSE community platform), implemented reality (CR fiscal POS), strategic research (Bribri solidarity-economy rebrand) — into one product thesis, pillar architecture, and consolidation plan.

---

## 1. What Tsuru IS today (honest description)

Tsuru is a **production-grade Costa Rica point-of-sale and Hacienda v4.4 electronic-invoicing system wearing the marketing of a Social Solidarity Economy marketplace that does not exist**. The only complete, production-credible user journey in the entire nine-system ecosystem is the CR merchant loop: register → verify → 3-step org onboarding → guided fiscal setup → offline-first POS sale capture → XAdES signing and ATV submission → document management (`tsuru_user_journeys.md`; pipeline in `biller-apps/auth/app/sales-api/src/services/sales_pipeline.py`, POS in `templates/pos-system`, ops backend in `cross-app-be`). Around that core sits a half-built storefront SaaS — template gallery, per-org subdomain provisioning, and CMS work (`server/src/services/{TemplateCloneService,DeploymentService}.ts`, jbiller `infrastructure_provisioning_service.py`), but the commerce loop is broken at the last mile: storefronts call public product/category endpoints that don't exist (`server/src/controllers/PublicOrgController.ts` vs `templates/tsuru-demo/src/lib/api.ts:62-81`), checkout is a WhatsApp deep link persisting nothing, and no consumer-order domain exists anywhere. The landing (`landing-client`, public brand "Tsuru") sells fairs, barter, and mutual-aid networks — 14 of 27 audited promises are Not built, several actively contradicted by code (`tsuru_reconciliation_report.md` §1). Underneath, authorization is absent ecosystem-wide (IDOR on every backend, plaintext fiscal credentials in Postgres — `tsuru_architecture_audit.md` G1/G2), and a second, unrelated B2B cross-docking business ("Modas Laura") is fused inside the POS backend.

**One-line:** today the product is a free CR e-invoicing POS with an attached brochure-site generator, marketed as a solidarity-economy community platform.

## 2. What Tsuru is BECOMING (trajectory visible in code)

The codebase shows a clear, partially executed pivot. Five concurrent movements:

1. **POS + e-invoicing is the center of gravity.** Active development concentrates in `templates/pos-system` (git history: actively developed; recent commits are fiscal wizard, org settings, stepper UX) and `biller-apps/auth` (Mar–Jun 2026 history). The POS app absorbed the legacy dashboard's entire admin domain (org settings, CMS, templates, deployments, members, gallery — `pos-system/src/pages/dashboard/*`, memory `project_pos_dashboard_migration.md`), leaving `dashboard/` deprecating-in-place and `client/` formally deprecated (`client/DEPRECATED.md`).
2. **Monorepo split toward standalone products.** `templates/pos-system` → `chepelcr/tsuru-pos-system`, `landing-client` → `chepelcr/tsuru-landing` (root `CLAUDE.md` split rules), each with own CI — currently in dual-tracked limbo with two live deploy paths for the landing (tsuru.jcampos.dev vs tsuru.jcampos.dev).
3. **Tsuru rebrand adopted internally, not publicly.** Repo names, `tsuru-landing` package name, "Tsuru Admin" chrome, `tsuru:content-saved` event — exactly the primary naming recommendation of the strategy research (Tsuru = cacao, sacred currency in Bribri cosmology) — while all public copy still says "Tsuru".
4. **Strangler-fig migration off the Node control plane.** markets-api already lost products/orders to Python services, publishes `OrganizationRegistered` SNS events consumed by jbiller's infra provisioner, and read-only-mirrors `organization_settings` that the Python side writes (`server/src/entities/OrganizationSettings.ts` "Do NOT add insert/upsert"). The infra/templates domain is duplicated mid-migration (monorepo `deploys/setup-template-bucket.js` vs jbiller `infrastructure-service-provider`).
5. **Latent monetization.** Stripe is schema-only (`organizations.stripeCustomerId`, `plan` default `"free"`, `stripeEnabled` — no SDK in any repo), colliding with the landing's 4× "gratis / sin cargos ocultos" promise.

Unmanaged, this trajectory lands on: a strong Tsuru POS product, an orphaned storefront SaaS nobody finishes, a landing selling a third product nobody is building, and a B2B cross-docking client stuck inside the POS backend.

## 3. What Tsuru SHOULD become (recommendation)

**Thesis: make the implemented strength the product, and make the vision its roadmap — in that order.** The ecosystem's genuinely differentiated, working asset — free legal e-invoicing + offline-first POS for Costa Rica's smallest sellers — is itself an authentic solidarity-economy story (`tsuru_social_economy_alignment.md` §2: formalization is exactly what a CR micro-seller cannot get from Shopify/Square) and is mentioned in zero of the landing's 22 content entities. The marketed SSE layer (fairs, barter, mutual aid) should be re-framed as an explicit, staged roadmap built on top of the fiscal core, not sold in present tense.

Recommended end-state (12–24 months):

- **Core product: Tsuru — the solidarity POS.** Free offline-first POS + legal Hacienda e-invoicing + shareable digital catalog (subdomain + QR + WhatsApp orders) for CR micro-merchants and cooperatives. This honors the landing's real audience (low-tech, WhatsApp-first sellers) with the capability that actually exists.
- **Second ring: digital presence.** Repair the storefront last mile (public product/category reads — gap analysis O5 — and a minimal consumer-order record) so "create your store" is true as a *catalog + WhatsApp order* product; explicitly do NOT build gateway checkout until demanded.
- **Third ring: community surfaces in dependency order** (`tsuru_social_economy_alignment.md` §4 sequencing): cross-org marketplace/discovery directory (cheap read-model over existing `organizations`) → buyer/community-member identity → fairs as time-boxed aggregated catalogs (`fairs`, `fair_participations`) → barter agreements (`exchange_offers`/`exchange_agreements`, facilitator-only per `terms.json` §4) → cross-org bundles and Jala-de-Piedra crowdfunding. This converts the research's principles into mechanics where they are buildable, and the landing's fiction into a roadmap.
- **Non-negotiable preconditions** (from gap analysis Top-10 #1–#3): mount authorization everywhere (finish lambda-authorizer membership TODO, replicate cross-app-be's `claims.sub → x-user-id` gateway mapping), encrypt fiscal credentials and env-drive the Hacienda realm, unify the fiscal sources of truth (one consecutive allocator, one tax engine of record + contract tests). A solidarity brand cannot run on cross-tenant credential exposure; "Sibö as protective architect" begins here.
- **Brand: complete the Tsuru rebrand publicly.** The codebase already chose Tsuru; the research supplies the identity system (name, natural-pigment palette, Ú-sure/cacao mark, solidarity micro-copy); the landing is a JSON-driven DXP with empty logo slots designed for exactly this change (gap analysis O9). Retire "Tsuru" and the tsuru domain drift. Apply the research's *language-as-economy* lever cheaply via the existing i18n layers (POS `LanguageContext.tsx`, landing per-entity JSON).
- **Honesty reset on the landing:** retract or roadmap-frame the 14 Not-built claims, fix the fake contact form and legacy CTAs, remove placeholder traction/testimonials — the brand's #1 value is Transparencia and the reconciliation report scores its trust pages 1–2/10.

What Tsuru should NOT become: a pan-LatAm generic store builder (CR-only data is seeded; the storefront SaaS is the weakest layer and the most commoditized market), nor a payments intermediary (ToS facilitator stance is the site's most honest claim and a real scope shield).

## 4. Product pillars (proposed)

Five pillars; each maps to existing systems with a designated owner and a consolidation direction.

| # | Pillar | What it covers | Owning systems (today → target) | Status today |
|---|---|---|---|---|
| P1 | **Fiscal Compliance Engine** | E-invoice lifecycle (clave/consecutive → XML → XAdES sign → ATV submit → validation poll → PDF → notify), taxpayer/Hacienda credentials, fiscal reference catalogs | `biller-apps/auth` (jbiller: `sales_pipeline.py`, SQS FIFO mesh) + `biller-apps/data-services` (34 catalog lambdas) → jbiller as sole engine; data-services consolidated as its read-only catalog tier | **Live & mature** — the ecosystem's only end-to-end pillar; debt: plaintext P12/PIN/ATV secrets, staging-hardcoded realm, stub regenerate/resend endpoints |
| P2 | **Point of Sale & Daily Operations** | Offline-first sale capture, sessions/shifts, cashier assignments, branches/terminals, cash closings, product/category management incl. Excel import | `templates/pos-system` (SPA) + `cross-app-be` POS half (`app/models/{session,assignment,closing,consecutive}.py`) → tsuru-pos-system repo + a purified POS backend (cross-docking extracted) | **Live with broken edges** — cajero `/pos` route unregistered, `ClosingFlow.tsx` unmounted, shift start local-only, tax math duplicated against P1 |
| P3 | **Tenant, Identity & Access Control Plane** | Cognito sync, organizations + onboarding, memberships/invitations, RBAC, per-org infra provisioning (S3/CF/R53/ACM, custom domains) | `BeautyMarket/server` (markets-api) + jbiller `lambda-authorizer` + jbiller `infrastructure-service-provider` → one control plane: keep markets-api short-term but mount its RBAC and the authorizer on **all four** gateways; single infra provisioner (Python, SNS-driven) | **Partial** — RBAC fully modeled, zero enforcement; authorizer membership check is a TODO; provisioning duplicated (`setup-template-bucket.js` vs Python) |
| P4 | **Digital Presence & Catalog** | Storefront templates, org CMS (pages→sections→content), publish/deploy, subdomain/QR/WhatsApp catalog sharing, public discovery directory (seed of fairs) | markets-api CMS + `templates/*` storefronts + POS dashboard pages as the editing UI → one admin surface (POS app), real publish pipeline, public product/category endpoints added | **Partial/simulated** — publish fakes success (`DeploymentService.ts:58-88`), product endpoints missing, 3 admin surfaces, 8 demo template apps |
| P5 | **Community & Solidarity Economy** | Buyer/community identity, marketplace discovery, fairs, barter agreements, cross-org bundles, crowdfunding, governance, cultural storytelling | **Nobody today** (zero entities/endpoints in any system) → new domain services following the cross-app-be/jbiller FastAPI+SNS patterns; landing carries the narrative until surfaces exist | **Missing-but-promised** — the entire marketed differentiator layer; build only after P3 enforcement exists (communities cannot run on IDOR-open infra) |

Cross-pillar rule: P1 is the moat, P2 is the daily-use product, P3 is the precondition for everything multi-tenant, P4 is repair-then-maintain, P5 is staged greenfield that justifies the brand.

## 5. Consolidation plan

Ordered by dependency, each item names merge/deprecate/extract targets with evidence.

### 5.1 Finish the repo split (unblocks everything else)
- **Extract for real:** untrack `templates/pos-system` and `landing-client` from the monorepo once CI buildspecs migrate; kill the duplicate landing deploy (keep GitHub Pages → tsuru domain, retire `deploys/setup-template-bucket.js` landing path). Evidence: dual-tracked nested `.git`, two live deploys (`tsuru_system_discovery.md` §1 note). The `monorepo-folder-split` playbook defines remaining steps.

### 5.2 One admin surface (merge/deprecate)
- **Deprecate `dashboard/` and delete `client/`:** the POS app already re-implemented org settings, CMS, templates, deployments, members, gallery against the same markets-api. Redirect `admin.tsuru.jcampos.dev` to the POS app; fix landing navbar CTAs that still hardcode the legacy dashboard (`landing-client/src/components/layout/navbar.tsx:130-137`).
- **Keep the landing's git-DXP** as-is for marketing content (different domain: marketing copy, not tenant data).

### 5.3 One infra provisioner, one templates store (merge)
- **Winner: jbiller `infrastructure-service-provider`** (active SNS-driven path with self-healing re-emit). Retire `deploys/setup-template-bucket.js` provisioning and markets-api's overlap of the `templates` metadata with jbiller's `template/organization_template` git-deploy model — pick one templates store (recommend jbiller's, since it owns deployment) and have markets-api/landing read it.

### 5.4 Purify cross-app-be (extract)
- **Extract the Modas Laura cross-docking business** (Excel PO ingest, distribution reports, SES confirmations — `app/services/{excel_parser,order_service,pdf_service,email_service}.py`, `crossdocking_*` tables) into its own service/repo. It is an unrelated wholesale-apparel client fused into the POS backend with hardcoded branding and a static `EMAIL_RECIPIENT`; it pollutes the `organizations` table with `owner_id='system'` rows (`_sync_organization`), making tenant identity dual-mastered.

### 5.5 Unify fiscal truth (merge — legally critical)
- **One consecutive allocator:** retire cross-app-be's `consecutives` CRUD in favor of jbiller's atomic allocation (or vice versa — but exactly one).
- **One tax engine of record:** designate cross-app-be's Python engine (or jbiller's pipeline math) as canonical; pin the POS TypeScript mirror (`taxCalculationService.ts`) and any second copy with cross-language contract tests so drift cannot produce legally wrong invoices.
- **Explicit `sales` ↔ `billing_sales` relation:** the operational sale (cross-app-be) and the fiscal document (jbiller) must reference each other in schema, not by convention.
- **Merge the duplicated shared libs:** `jbiller_common` vs `tsuru_common` carry identical `HaciendaApiClient` copies — one shared package.

### 5.6 Decide markets-api's fate (strangler completion)
- Short term: keep as P3 control plane but **mount the already-written RBAC middleware**, add gateway claim-to-path mapping (copy cross-app-be's `integration.request.header.x-user-id: context.authorizer.claims.sub` pattern), and delete dead scaffolding (`HomePageContent`, `lambda.cts` SQS stubs, Stripe/PayPal keys without SDKs, stale CLAUDE.md claims of ProductController/OrderController).
- Medium term: either commit to it as the permanent tenant service or complete the migration to the Python platform — the half-state (SNS events + read-only mirrors + duplicated domains) is the riskiest position.

### 5.7 Rationalize the 8 demo storefront templates (shrink)
- Eight independent Vite apps exist to demonstrate themes; they differ mostly in palette/typography while sharing structure, and all have zero tests. **Collapse to 1–2 maintained storefront codebases with theme configurations** (the CMS already stores theme settings per org); keep the 8 *theme presets* in the gallery. This cuts the build/deploy matrix (`build:templates`, per-template buckets/distributions) roughly 8× and removes duplicated client-side CR geo data (`@/data/locations` vs data-api).

### 5.8 Tame data-services sprawl (shrink)
- 34 Lambdas/ECR repos/SAM stacks for tiny read-only catalogs behind a hand-merged 5,373-line OpenAPI file, with an all-TODO cache layer and a write surface reachable only from localhost. **Consolidate to a small number of catalog services (or one)**, delete dead cache/write scaffolding, and give jbiller/cross-app-be a sanctioned read path so they stop reading data-services' tables directly via shared SQL.

### 5.9 Shared-DB contract hardening (governance)
- Per-service DB roles or real RLS (current policy is `using true`), schema-contract tests across the 4 writer repos, single master for `organizations` (write access removed from cross-app-be after 5.4). Today cross-repo contracts are docstrings only (`tsuru_domain_model.md`).

### 5.10 Landing truth alignment (content)
- Retract/roadmap-frame fairs, barter, mutual-network, GDPR/cookie, and traction claims; wire the contact form to SES (already used by 3 backends); execute the Tsuru rebrand (name, palette, logo, solidarity micro-copy) on the JSON-driven DXP. All content edits, no architecture.

## 6. Recommended positioning statement & audience focus

### Positioning statement

> **Tsuru is the free, offline-first point of sale that gives Costa Rica's smallest sellers legal electronic invoicing and a shareable digital catalog — so the people who sell at ferias, from home, and over WhatsApp can formalize without paying for it.** Born from a Universidad de Costa Rica community project in Guápiles, Tsuru is growing, in the open, into the digital home of local fairs and the solidarity economy: shared marketplaces, community fairs, and moneyless exchange — built on infrastructure that protects its smallest users first.

Spanish hero-form: *"Tsuru: vende legal, vende fácil, vende en comunidad. Punto de venta gratuito con facturación electrónica para los emprendedores más pequeños de Costa Rica."*

Rationale: leads with the only Delivered-and-mature capability (P1+P2), keeps the authentic origin story (the landing's highest-honesty content, About scored 7/10), converts the SSE differentiators from false present tense to a committed public roadmap, and operationalizes the research's "Sibö protective architect" principle as the security/fairness work already prioritized in the gap analysis.

### Audience focus (in priority order)

1. **Primary — Costa Rican micro-merchants formalizing their business:** sodas, pulperías, feria vendors, home food sellers, artisans who must issue facturas electrónicas but cannot afford or operate enterprise billing software. Served today by P1+P2; reachable via the WhatsApp-first/low-connectivity framing (offline-first POS is built for exactly them and never marketed).
2. **Secondary — cooperatives and organized community groups (incl. women-led, per the research):** multi-user orgs, memberships/invitations already exist; co-op org type, governance, and visibility badges are the P5 entry point. Foreground RIBCA/Stribrawpa-style cooperatives in brand imagery as the research prescribes.
3. **Tertiary (roadmap) — buyers/neighbors as community members:** no identity exists for them today (S3 in gap analysis); they become an audience only when the discovery directory and fairs ship.
4. **Explicitly deferred — pan-LatAm sellers:** drop the Buenos Aires/Medellín/Oaxaca placeholder personas until a second country's fiscal stack is real (data-api schema is multi-country, only CR=188 seeded). One country, done honestly, is the brand.

### Monetization posture
Publish a solidarity pricing model *before* activating the Stripe scaffold: permanent free tier for micro-sellers, transparent paid tiers for custom domains / multi-branch / volume (capabilities that already exist and are given away silently — custom-domain attach, branches/terminals), optional solidarity contribution. Anything else detonates the 4× "gratis, sin cargos ocultos" promise.

---

## 7. Strategy synthesis (one paragraph for downstream agents)

Tsuru should stop being three products pretending to be one. Declare the CR fiscal POS the core product (it already is), repair the digital-catalog ring around it, and stage the solidarity-economy layer as an honest public roadmap whose first deliverables — authorization enforcement, secrets encryption, a cross-org discovery directory, and the Tsuru rebrand — are each either already half-built or pure content work. Consolidation removes one fused business (cross-docking), two dead admin surfaces, one duplicate provisioner, one duplicate templates store, ~7 redundant storefront apps, and the dual-mastered fiscal truth; the surviving architecture is jbiller (fiscal engine) + purified POS backend (operations) + one control plane (tenancy/access) + one storefront codebase (presence) + greenfield community services — five pillars, one brand, one honest story.
