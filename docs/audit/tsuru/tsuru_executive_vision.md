# Tsuru Ecosystem — Executive Vision (Final Synthesis)

**Date:** 2026-06-11
**Author:** Multidisciplinary audit team lead (Principal Architect, Product Strategist, Systems Analyst, UX Architect, Technical Auditor, Business Analyst)
**Synthesizes:** all 11 audit deliverables in `docs/audit/tsuru/` — `tsuru_landing_audit.md`, `tsuru_system_discovery.md`, `tsuru_domain_model.md`, `tsuru_capability_inventory.md`, `tsuru_user_journeys.md`, `tsuru_architecture_audit.md`, `tsuru_reconciliation_report.md`, `tsuru_social_economy_alignment.md`, `tsuru_gap_analysis.md`, `tsuru_product_strategy.md`, `tsuru_research_reconciliation.md`.

---

## 1. Executive Summary

Tsuru (publicly branded "Tsuru") is marketed as a Social Solidarity Economy community platform — free no-code stores, WhatsApp commerce, community fairs, barter, mutual-aid networks. What actually works, end to end and in production, is something different and arguably more valuable: a **Costa Rica point-of-sale and Hacienda v4.4 electronic-invoicing system** — offline-first sale capture, XAdES XML signing, ATV submission, validation polling, PDF generation, and document delivery (`biller-apps/auth/app/sales-api/src/services/sales_pipeline.py`; `templates/pos-system`). That merchant loop is the **only complete production-credible user journey** in the nine-system ecosystem (`tsuru_user_journeys.md`).

The reconciliation verdict is stark: of 27 audited landing promises, **14 are Not built** — including every flagship SSE differentiator (fairs, barter, mutual networks, fair-trade guarantee) and every trust/compliance claim (contact response, GDPR, cookie banner, data security) — while the strongest implemented capability, free legal e-invoicing for micro-sellers, appears in **zero** of the landing's 22 content entities (`tsuru_reconciliation_report.md`).

Two issues are existential and must precede any feature work:

1. **Authorization is absent ecosystem-wide.** All four API gateways validate JWTs, but no deployed layer verifies that the caller belongs to the organization in the URL. The documented userId↔JWT-sub check does not exist (`BeautyMarket/api-gateway/template.yml`), RBAC is modeled and seeded but never mounted (`server/src/middleware/permissions.ts`), and the lambda-authorizer membership check is a TODO stub (`auth/app/lambda-authorizer/src/validators/organization_auth_checker.py:73-84`). Net: cross-tenant IDOR everywhere (`tsuru_architecture_audit.md` G1–G5).
2. **Fiscal credentials are unprotected.** Hacienda P12 signing certificates, certificate PINs, and ATV passwords are stored plaintext in Postgres and returned by GET (`auth/app/organization-configurations/src/models/organization_configuration.py`), reachable cross-tenant given (1). The Hacienda OAuth realm is hardcoded to staging (`rut-stag`).

The good news is asymmetric: most fixes are **wiring, not building** — the enforcement code, the closing UI (`ClosingFlow.tsx`, unmounted), the cashier route, the SES delivery path all exist unwired. The recommended strategy (`tsuru_product_strategy.md`): declare the CR fiscal POS the core product, repair the digital-catalog ring around it, complete the Tsuru rebrand the codebase already adopted internally, and convert the SSE vision from false present tense into an honest, staged public roadmap built on the fiscal core.

---

## 2. System Understanding (what Tsuru actually is, in plain language)

Strip away the names — none can be trusted (`tsuru_system_discovery.md` §6: "BeautyMarket" isn't beauty, `auth` isn't auth, `cross-app-be` is two fused products, `pos-system` isn't a template). What remains is **two product lines fused into one ecosystem** by a shared Cognito pool, a shared PostgreSQL database written by four repos, and shared `organizations`/`products` tables:

1. **Tsuru POS / CR e-invoicing (the working product).**
   - `templates/pos-system` (repo `chepelcr/tsuru-pos-system`): an offline-first POS SPA (Dexie IndexedDB + service-worker background sync, `src/lib/db.ts`, `public/sw.js`) that also absorbed the entire legacy admin dashboard.
   - `cross-app-be` (orders-api): POS operations backend — sessions, assignments, branches/terminals, cash closings, fiscal-enriched products — fused with an unrelated B2B cross-docking business for one hardcoded customer ("Modas Laura", `app/services/email_service.py`).
   - `biller-apps/auth` ("jbiller", sales-api): the e-invoicing core — clave/consecutive generation, XML build, XAdES signing, ATV submission, an idempotent SNS/SQS FIFO pipeline for validation→PDF→notification, plus the per-org AWS infrastructure provisioner.
   - `biller-apps/data-services` (data-api): 34 read-only Lambdas serving Hacienda fiscal reference catalogs (taxes, CABYS, geography, taxpayer lookup, exchange rates).

2. **Tsuru storefront SaaS (the half-built product).**
   - `BeautyMarket/server` (markets-api): tenant control plane only — organizations, onboarding, memberships, RBAC metadata, storefront CMS, template gallery/cloning. **Zero commerce endpoints** despite docs claiming them (`server/src/routes.ts`).
   - 8 demo storefront SPAs whose live-org product browsing 404s (endpoints missing from `PublicOrgController.ts`) and whose checkout is a WhatsApp deep link persisting nothing (`templates/tsuru-demo/src/components/cart/checkout-modal.tsx`).
   - `landing-client` (repo `chepelcr/tsuru-landing`): a well-engineered 100%-static marketing SPA with a git-backed dev-only CMS, selling the SSE story.

**Plain-language verdict:** Tsuru is a free, Spanish-first, offline-tolerant tool that legally formalizes Costa Rica's smallest sellers — wrapped in the marketing of a community marketplace that does not exist, and resting on an authorization layer that was modeled but never turned on.

---

## 3. Product Truth (vision vs reality)

1. **The only complete product is the one the marketing never mentions.** The CR merchant e-invoicing loop (register → org wizard → fiscal setup → offline POS sale → Hacienda submission → document management) is live and mature; "facturación electrónica" appears in none of the landing's 22 content entities (`tsuru_reconciliation_report.md` §2; `tsuru_user_journeys.md`).

2. **Every SSE differentiator is present-tense copy over zero code.** Fairs, barter, mutual-aid networks, the fair-trade "Garantizamos," community governance: no entity, endpoint, or UI in any of the nine systems — grep-verified (`tsuru_social_economy_alignment.md` §1; `tsuru_capability_inventory.md` §7). There is not even a buyer/community-member identity to build them for.

3. **The brand's two top values — Transparencia and Comercio justo — are actively contradicted by the implementation.** Fake contact form (`landing-client/src/pages/Contact.tsx:24-38`), simulated CMS publish success (`server/src/services/DeploymentService.ts:58-88`), placeholder testimonials/traction; ecosystem-wide IDOR, unmounted RBAC, and plaintext fiscal credentials (`tsuru_research_reconciliation.md` §5 rows 10–11).

4. **"Multi-tenant security" is a WHERE clause.** Tenant isolation everywhere rests on token *validity* plus `organization_id` filters; no membership check exists in production, RLS is permissive `using true`, and sales-api attributes legal invoices to a client-supplied `x-user-id` defaulting to `"anonymous"` (`tsuru_architecture_audit.md` §6).

5. **Fiscal truth is duplicated where it must be singular.** Two sale entities (`sales` vs `billing_sales`), two consecutive allocators, and three tax engines (POS TypeScript, cross-app-be Python, jbiller pipeline) compute the same legally binding Hacienda math, synchronized only by convention (`tsuru_gap_analysis.md` C5; `tsuru_domain_model.md` §6).

---

## 4. Strategic Direction

**Thesis (from `tsuru_product_strategy.md`): make the implemented strength the product, and make the vision its roadmap — in that order.** Free legal e-invoicing + offline-first POS for Costa Rica's smallest sellers is itself an authentic solidarity-economy story — formalization *is* structural protection of the weak, the research's "Sibö" principle operationalized (`tsuru_research_reconciliation.md` §3). It is the one sentence true in all three layers (landing vision, system reality, Bribri-grounded research) — and none of the three currently says it out loud.

Grounded in the research principles:

- **Sibö (fairness by system rules) starts with mounting the authorization that already exists** — finish the lambda-authorizer membership TODO, replicate cross-app-be's correct `claims.sub → x-user-id` gateway mapping (`cross-app-be/api-gateway/template.yml:128`) to all gateways, encrypt fiscal secrets. A solidarity brand cannot run on cross-tenant credential exposure.
- **Transparencia becomes a mechanic, not a pill:** real contact delivery, real publish status, honest traction numbers, roadmap-framed (not present-tense) community features.
- **Language-as-economy is the cheapest lever:** mature i18n infrastructure (POS ~4,100-line `LanguageContext.tsx`, landing per-entity `{es,en}` JSON) makes solidarity micro-copy a translation-file change.
- **Complete the Tsuru rebrand publicly.** The codebase already chose the name (repos, admin chrome); the landing DXP has empty logo slots and a single theme file purpose-built for the research's natural-pigment identity (`tsuru_gap_analysis.md` O9). Gate Bribri-lexicon depth on real consultation with Bribri organizations (RIBCA) — using sacred cosmology without partnership would invert the research's own dignity principle.
- **Build community surfaces in dependency order** (public catalog fix → buyer identity → discovery directory → fairs → barter/bundles/crowdfunding/governance), each only after its actors and prerequisites exist (`tsuru_social_economy_alignment.md` §4).
- **What Tsuru should NOT become:** a pan-LatAm generic store builder (only CR=188 is seeded; the storefront layer is the weakest and most commoditized), or a payments intermediary (the ToS facilitator stance is the site's most honest claim and a real scope shield).
- **Resolve monetization before activating the Stripe scaffold:** publish a solidarity pricing model (permanent free micro-seller tier; transparent paid tiers for custom domains/multi-branch already built and given away) or the 4× "gratis, sin cargos ocultos" promise detonates.

---

## 5. Future Roadmap

### NOW (0–3 months) — stop contradicting; wire what exists

| Item | Addresses | Drill-down |
|---|---|---|
| Close the authorization gap: finish lambda-authorizer membership check, deploy on all 4 gateways, add userId↔sub mapping, mount markets-api RBAC, kill `x-user-id` trust | Gap C1/C7, audit G1–G5 (Critical) | `tsuru_gap_analysis.md` #1, `tsuru_architecture_audit.md` §6 |
| Fiscal secrets hardening: KMS/Secrets Manager for P12/PIN/ATV, strip from GET responses, env-drive Hacienda realm | Gap C4 (Critical, legal) | `tsuru_gap_analysis.md` #2, O6 |
| Unblock the cashier loop: register `/pos`, mount `ClosingFlow.tsx`, server-side shift on session start | Gap C3 (journey blockers #1–#2) | `tsuru_user_journeys.md`, `tsuru_gap_analysis.md` O2 |
| Fix the funnel + trust breaches: landing CTAs → POS app, real contact delivery via SES, remove placeholder phone/testimonials/traction, drop sessionStorage passwords and POS prod payload logging | Gap C6/C7 | `tsuru_gap_analysis.md` O4/O6, `tsuru_reconciliation_report.md` §4 |
| Wire checkout to the org's registered economic activities (replace hardcoded `'722000'`) | Gap C8 (fiscal correctness) | `tsuru_gap_analysis.md` O3 |

### NEXT (3–9 months) — one product, one truth, one brand

| Item | Addresses | Drill-down |
|---|---|---|
| Unify fiscal truth: one consecutive allocator, explicit `sales`↔`billing_sales` relation, one canonical tax engine + cross-language contract tests | Gap C5 (Critical) | `tsuru_gap_analysis.md` #3, `tsuru_product_strategy.md` §5.5 |
| Public product/category endpoints + minimal consumer-order record → "create your store" true as catalog+WhatsApp product | Gap C2, promises #1/#3/#5/#6 | `tsuru_gap_analysis.md` O5, `tsuru_reconciliation_report.md` §5 |
| Finish the repo split; retire `dashboard/`+`client/`; one infra provisioner (jbiller), one templates store; extract Modas Laura cross-docking from cross-app-be | Gaps T1/T2/T4, consolidation | `tsuru_product_strategy.md` §5.1–5.4 |
| Landing honesty reset + public Tsuru rebrand: re-aim hero on free legal e-invoicing + offline-first selling; roadmap-frame barter/fairs; apply research identity to the DXP | Gaps S5/S6, reconciliation §3 | `tsuru_product_strategy.md` §3/§6, `tsuru_research_reconciliation.md` Phase 1 |
| Shared-DB contract hardening: per-service DB roles or real RLS, schema-contract tests across 4 writers, single master for `organizations` | Gap T3, C5-org | `tsuru_gap_analysis.md` #9 |
| Collapse 8 storefront apps to 1–2 themed codebases; tame data-services sprawl | Gaps T4/T6 | `tsuru_product_strategy.md` §5.7–5.8 |

### LATER (9–24 months) — build the solidarity layer for real (gated on the explicit product-thesis decision)

| Item | Addresses | Drill-down |
|---|---|---|
| Marketplace discovery directory (cross-org read-model over existing `organizations` + CR geo) | Gap S4, research Kökö | `tsuru_gap_analysis.md` O8 |
| Buyer/community-member identity (the missing actor) | Gap S3 | `tsuru_social_economy_alignment.md` §4 |
| Provenance/story CMS component types; org attributes `womenLed`/`cooperative`/`indigenousLed` + badges | Gaps S8, research rows 12/16 | `tsuru_research_reconciliation.md` §4 |
| Fairs domain (`fairs`, `fair_participations`, time-boxed aggregated catalogs) → converts the landing's 1/10-honesty section into truth | Gap S1 | `tsuru_social_economy_alignment.md` §4 |
| Barter domain (`exchange_offers`/`exchange_agreements`, facilitator-only per ToS) | Gap S2 | same |
| Canastas comunitarias (cross-org bundles), Jala-de-Piedra crowdfunding, cooperative org type + governance on enforced RBAC | Gap S7, research signature mechanics | `tsuru_research_reconciliation.md` Phase 2 items 15–16 |
| Solidarity pricing model published before Stripe activation; second-country fiscal stack only after CR is consolidated | Gap S5, monetization | `tsuru_product_strategy.md` §6 |

---

## 6. Top Strengths / Top Risks / Top Opportunities

### Top Strengths
1. **A mature, end-to-end legal e-invoicing engine** — clave/consecutive → XML → XAdES sign → ATV submit → validation poll → PDF → email/webhook, on an idempotent SNS/SQS FIFO mesh (`sales_pipeline.py`, `hacienda-messaging.yml`). The ecosystem's moat, and a real regulatory barrier to entry.
2. **Offline-first POS engineered for its actual audience** — IndexedDB-first capture with Background Sync replay, disciplined design system and full ES/EN i18n (`templates/pos-system/src/lib/db.ts`, `public/sw.js`).
3. **Deep Costa Rica fiscal/channel localization** — 28+ Hacienda catalogs, CABYS/taxpayer/FX proxies, SINPE, WhatsApp-first flows (`biller-apps/data-services`) — the thing a CR micro-seller cannot get from Shopify or Square.
4. **Automated per-org infrastructure with self-healing** — SNS-driven S3/CloudFront/Route53/ACM provisioning and custom-domain attach (`auth/app/infrastructure-service-provider`), plus a genuinely well-built static landing DXP.
5. **An authentic, verifiable origin story plus substrates already in place** — UCR TCU provenance, memberships/invitations/RBAC schema, CMS component catalog, event mesh: the raw material for the solidarity vision exists.

### Top Risks
1. **Ecosystem-wide authorization absence (IDOR)** — one leaked token exposes all tenants' commercial and tax-authority data; docs describe controls that do not exist (G1–G5, `tsuru_architecture_audit.md`).
2. **Plaintext fiscal credentials + staging Hacienda realm** — taxpayer signing certificates readable cross-tenant; legally significant invoices configured against a staging OAuth realm (C4).
3. **Marketing-as-misrepresentation** — 14 of 27 promises unbuilt, trust pages scoring 1–2/10, fake contact form, simulated publish, GDPR/cookie claims with no implementation: legal and reputational exposure for a brand whose #1 value is Transparencia (`tsuru_reconciliation_report.md`).
4. **Duplicated fiscal truth** — two consecutive allocators, two sale entities, three tax engines, synchronized by docstring; drift produces legally wrong invoices (C5).
5. **Structural drift with no declared end-state** — shared Postgres as the integration bus across 4 writer repos, repo-split limbo with dual deploy paths, three admin surfaces, two provisioners, an unrelated B2B business fused into the POS backend (T1–T4).

### Top Opportunities
1. **Reposition on the hidden asset:** "free legal e-invoicing + offline-first POS for Costa Rica's smallest sellers" is true, differentiated, unmarketed, and is itself the solidarity story (`tsuru_reconciliation_report.md` §2).
2. **Security/trust fixes are mostly wiring of already-written code** — authorizer, RBAC middleware, ClosingFlow, redirect handling, SES delivery all exist unmounted; highest leverage per unit effort (`tsuru_gap_analysis.md` O1/O2/O4).
3. **Small last-mile fixes unbreak the storefront promise** — public product/category endpoints plus a minimal order record convert four Partial verdicts to Delivered (O5).
4. **The Tsuru rebrand is pre-staged** — internal naming already switched; the landing DXP (single theme file, empty logo slots, JSON content) was built for exactly this swap, with the research supplying the full identity system (O9, S6).
5. **A staged, honest community roadmap converts liability into differentiation** — discovery directory → buyer identity → fairs → barter, each on existing plumbing (SNS/SQS mesh, CMS components, RBAC substrate), turning the landing's fiction into a public commitment no commodity store-builder can copy.

---

## 7. Concluding Statement

**Tsuru is a production-grade Costa Rica offline-first POS and Hacienda e-invoicing platform that enables the country's smallest sellers to formalize and sell legally for free through automated fiscal document signing and submission, WhatsApp-first digital catalogs, and per-organization cloud infrastructure — pending the authorization, secrets, and honesty repairs that would let its solidarity-economy vision be built rather than merely claimed.**
