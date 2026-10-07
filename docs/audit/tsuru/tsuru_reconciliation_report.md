# Tsuru Ecosystem — Reconciliation Report (Phase 8: Landing vs Implementation)

**Scope:** Reconcile every promise in the landing audit (`tsuru_landing_audit.md`, 27 promises) against verified reality from the capability inventory (`tsuru_capability_inventory.md`), system discovery (`tsuru_system_discovery.md`), domain model, user journeys, and architecture audit.
**Date:** 2026-06-11

**Verdict legend:**
- **Delivered** — promise is implemented substantially as marketed.
- **Partial** — implemented with material gaps that change the user-visible outcome.
- **Not built** — no implementation exists (including claims actively contradicted by code).
- **Built differently** — a capability exists but in a different shape/system than promised.
- **Built but not promised** — used only in §2 (under-sold reality).

---

## 1. Promise-by-promise verdict table

| # | Promise | Source | Reality | Verdict | Evidence |
|---|---|---|---|---|---|
| 1 | Create your store in minutes with a template fitting your style | `landing.json` howItWorks.steps[0] | Org creation + 3-step onboarding (draft → contact → template clone) is Live, and per-org S3/CloudFront/Route53 infra is auto-provisioned via SNS. But the resulting "store" cannot display live products: storefronts call `/api/public/organizations/{id}/products\|categories`, which do not exist in `PublicOrgController.ts` — only theme/contact/pages are served. The output is a brochure site, not a working store. | **Partial** | `server/src/services/OrganizationService.ts`, `TemplateCloneService.ts`, `routes.ts:70-91`; jbiller `infrastructure_provisioning_service.py`; gap: `server/src/controllers/PublicOrgController.ts:10-14` vs `templates/tsuru-demo/src/lib/api.ts:62-81` |
| 2 | Professional store templates, no coding ("Sin programación") | `features.json` featureCards[0] | 9 themed storefront SPAs exist and deploy; template gallery served from DB (`/api/templates`); clone-to-org at onboarding step 3 works; no coding required. | **Delivered** | `templates/*`; `server/src/seeds/template-seed.ts`; `TemplateController.ts`; `TemplateCloneService.ts` |
| 3 | Sell via WhatsApp: share catalog link, receive orders through WhatsApp | `features.json` featureCards[1], `landing.json` steps[2] | WhatsApp checkout is literally the only checkout: `checkout-modal.tsx` builds a `wa.me` deep link from cart contents; no API call, no order persisted. Works in template demo mode; for a live org the buyer can't fill a cart because public product browsing 404s (see #1). | **Partial** | `templates/tsuru-demo/src/components/cart/checkout-modal.tsx` (`generateWhatsAppMessage`); missing public products endpoint (`PublicOrgController.ts`) |
| 4 | Product/catalog management — photos, descriptions, prices, from anywhere | `features.json` featureCards[2], `landing.json` steps[1] | Rich product/category CRUD is Live — but in cross-app-be + the POS SPA, fiscal-enriched (CABYS/tax columns), with Excel bulk import and price-bounds filters. These products never reach the public storefront (no public endpoint), so "management" exists while the managed catalog is invisible to buyers. | **Built differently** | `cross-app-be/app/controllers/products_controller.py`, `app/services/product_excel_service.py`; POS `src/pages/dashboard/ProductsPage.tsx`, `src/hooks/useProducts.ts`; gap per #1 |
| 5 | Shareable digital catalog with QR code + link | `features.json` featureCards[3] | Per-org subdomain link sharing is Live. QR generation exists only inside the POS admin app (per dashboard→POS migration record), not as a public catalog feature; the linked catalog cannot list live products (#1). | **Partial** | `entities/Organization.ts` (slug/subdomain), `routes.ts:104-130`; QR per `project_pos_dashboard_migration.md` (memory, unverified in inventory); broken catalog per `PublicOrgController.ts` |
| 6 | Order tracking — customers informed at every step | `features.json` featureCards[4] | No consumer-order domain exists in any of the 8 systems. `server/` has no Order controller/entity; cross-app-be `/orders` is B2B cross-docking POs ingested from retailer Excel (`crossdocking_orders`). WhatsApp messages are not tracked anywhere. | **Not built** | capability inventory §1 ("E-commerce order management — Missing-but-promised"); `cross-app-be/app/models/order.py`; no Order in `server/src/controllers/` |
| 7 | Own unique online address from day one (per-store subdomain) | `features.json` featureCards[5] | Subdomain routing, slug/subdomain availability checks, and automated per-org CloudFront/Route53 provisioning are Live; custom-domain attach also exists (never marketed). | **Delivered** | `routes.ts:104-130` (`by-subdomain`, `check-subdomain`); jbiller `custom_domain_service.py`, `infrastructure_provisioning_service.py` |
| 8 | Free to start (repeated 4+ times, no paid tier mentioned) | `landing.json` finalCta etc. | True today by absence of any billing: Stripe is schema-only (`stripeCustomerId`, `plan` fields, no SDK). The scaffolding signals a future paid tier that would collide with this promise. | **Delivered** (de facto) | `entities/Organization.ts` stripe/plan fields; capability inventory §8 "Stripe platform billing — Scaffolded" |
| 9 | No hidden fees ("Sin cargos ocultos") | `landing.json` values[3] | No fee/commission mechanism exists anywhere in code. Trivially true; same future tension as #8. | **Delivered** (de facto) | Same as #8 |
| 10 | Fair-trade GUARANTEE ("Garantizamos condiciones justas y precios transparentes") | `landing.json` values.items[0] | No mechanism enforces anything: no pricing rules, no moderation, no dispute tooling, no marketplace at all. ToS itself retracts it (platform is "facilitador", service "as is"). Strongest verb on the site backed by zero code. | **Not built** | `terms.json` §4/§6 contradiction; capability inventory §7 (no community/marketplace entities) |
| 11 | Barter system (trueque) — exchange without money, 3-step flow, present tense | `community.json` barter, `blog.json` article4 | Zero implementation: no barter/exchange entity, endpoint, or UI in markets-api, cross-app-be, jbiller, data-api, POS, or storefronts. The flagship differentiator is pure marketing copy. | **Not built** | capability inventory §7; domain model (no such entity in any schema) |
| 12 | Fairs as organized events (virtual / physical / barter fairs) | `fairs.json` types | No fair/event entity, endpoint, or UI exists in any of the 7 systems. `Ferias.tsx` even shows an "Active fairs" badge over static JSON. | **Not built** | capability inventory §7 "Fairs — Missing-but-promised"; `landing-client/src/content/fairs.json`, `src/pages/Ferias.tsx` |
| 13 | Fair registration flow ("Inscríbete en una feria... solicita participar") | `fairs.json` howJoin | No registration/application feature anywhere; CTAs route to the generic register URL of the **legacy** dashboard (`admin.tsuru.jcampos.dev/register`) even though auth migrated to the POS app. | **Not built** | `branding.json` adminRegisterUrl; user journeys: `navbar.tsx:130-137` hardcodes legacy dashboard |
| 14 | Mutual support networks — collaborators, mentors, customers | `community.json` mutual | No social graph, buyer accounts, follows, reviews, messaging, or community entities in any schema. Cognito users are org operators only. | **Not built** | capability inventory §7 "Community membership / buyer accounts — Missing-but-promised" |
| 15 | Preserve & document community fair culture | `about.json` queEs.points[3], story.paras[2] | The landing's own static blog does document fair culture (articles by "TCU Comer Orgánico"); no platform feature (archives, fair documentation tooling) exists. Mission honored only as marketing-site content. | **Partial** | `src/content/blog.json`, `blog.repository.ts` (Live, static); no backing platform feature |
| 16 | Traction: "miles de emprendedores que ya venden con propósito" | `features.json` cta.subtitle | Unverifiable and implausible against system evidence: no buyer accounts, demo orgs are template seeds, the only complete production journey is the CR merchant e-invoicing loop. | **Not built** (unsubstantiated) | `server/src/seeds/template-seed.ts`; user journeys doc (one complete journey) |
| 17 | Testimonials ("200 clientes fieles", barter deal, cooperative) | `community.json` stories | Placeholder personas (Buenos Aires/Medellín/Oaxaca); the cited features (barter, community) don't exist, so the testimonials describe unbuilt functionality. | **Not built** (unsubstantiated) | `community.json`; #11/#14 verdicts |
| 18 | 24h contact response | `contact.json` responseTimeDesc | Actively contradicted: contact form resolves a 1s `setTimeout` then shows success; `settings.json` `contact.delivery: "none"`. Messages are silently discarded. | **Not built** (contradicted) | `landing-client/src/pages/Contact.tsx:24-38`; `src/content/settings.json` |
| 19 | Contact channels: hola@tsuru.com, phone, San José CR | `contact.json` contactInfo | Phone is the literal placeholder "+506 XXXX-XXXX" shipped in production content; email unverified; no delivery path exists (#18). | **Not built** (placeholder) | `src/content/contact.json` |
| 20 | Newsletter subscription with privacy/unsubscribe promise | `blog-chrome.json` newsletter | UI only on a 100% static site; no subscription backend, list, or unsubscribe mechanism anywhere. | **Not built** (UI shell) | `src/content/blog-chrome.json`; landing is static (no runtime backend by design) |
| 21 | Data stored on secure servers with encryption + safeguards | `privacy.json` §3 | Contradicted by the ecosystem's worst findings: Hacienda P12 certificates, PINs, and ATV passwords plaintext in Postgres and returned by GET; ecosystem-wide IDOR (no org-membership checks, no userId↔JWT-sub matching); RLS permissive `using true`; POS stores plaintext passwords in sessionStorage; full API payloads console-logged in production. | **Not built** (contradicted) | `auth/app/organization-configurations/src/models/organization_configuration.py`; `BeautyMarket/api-gateway/template.yml` (no claim-to-path mapping); `entities/Organization.ts` pgPolicy; POS `Register.tsx:139-145`, `src/lib/api.ts` |
| 22 | GDPR compliance + data-subject rights via privacy@tsuru.com | `privacy.json` §6, §7 | No consent infrastructure, no data-subject-request tooling, no deletion/export pipeline in any system; combined with #21, the claim is unsupportable. | **Not built** | No such capability in any inventory section; #21 evidence |
| 23 | Cookie consent banner (accept/reject/customize) | `cookies.json` manageSections[1] | No consent banner component exists in the landing codebase; the policy lists Google Analytics/marketing cookies with no such scripts present; "account settings" reference points to a different app. | **Not built** | `landing-client/src/components/`, `src/App.tsx` (absent); `src/content/cookies.json` |
| 24 | Users retain content ownership; platform gets display license | `terms.json` §5 | Legal stance only; nothing in code contradicts it. No technical implementation required. | **Delivered** (legal-copy only) | `src/content/terms.json` |
| 25 | Platform is facilitator only — no transaction/barter intermediation | `terms.json` §4, §6 | Accurate: checkout is WhatsApp hand-off, no payment gateway, no order intermediation. The most honest claim on the site — it accurately describes the gap that breaks promises #6/#10. | **Delivered** | `checkout-modal.tsx`; capability inventory §8 (no gateway checkout) |
| 26 | Community commitment pledge (respect, honesty, solidarity) in ToS | `terms.json` acceptanceNotice | Copy-only pledge; no moderation, reporting, or enforcement tooling exists. Harmless as a values statement. | **Delivered** (legal-copy only) | `src/content/terms.json`; no moderation capability in inventory |
| 27 | Browsable live example stores | `landing.json` hero.secondary, `Examples.tsx` | Fully working: Examples page fetches `GET /api/templates?activeOnly=true` live and links `{name}-example.tsuru.jcampos.dev`; template demo-mode content serving (incl. sample products from `template_*` tables) is Live. | **Delivered** | `landing-client/src/pages/Examples.tsx:106-117`; `server/src/controllers/TemplateController.ts` |

**Tally:** Delivered 8 (3 of them de-facto/legal-copy-only) · Partial 4 · Built differently 1 · Not built 14.
**Pattern:** the store-builder promises (#1–#7, #27) are real-but-broken-at-the-last-mile (missing public products endpoint, no order domain); every SSE differentiator (#10–#14) and every trust/compliance claim (#18–#23) is Not built, several actively contradicted by code.

---

## 2. Under-sold reality — capabilities that exist but the landing never mentions

The landing markets the weakest part of the ecosystem and hides the strongest. **Built but not promised:**

| Capability | Status | Evidence | Marketing relevance |
|---|---|---|---|
| Full Costa Rica Hacienda v4.4 e-invoicing: create → clave/consecutive → XML build → XAdES sign → ATV submit → validation poll → PDF → email/webhook delivery | Live (the ecosystem's only end-to-end mature pillar) | `auth/app/sales-api/.../sales_pipeline.py`; `jbiller_common/hacienda/services/*`; SQS FIFO mesh (`hacienda-messaging.yml`) | A legally-compliant e-invoicing platform for CR merchants is a sellable product in itself; zero landing copy mentions facturación electrónica |
| Complete POS: offline-first sale capture (IndexedDB + Background Sync), sessions, cashier/supervisor assignments, branches/terminals, payment buckets (cash/card/SINPE) | Live | POS `useCartFlow.ts`, `src/lib/db.ts`, `public/sw.js`; `cross-app-be/app/models/{session,assignment,branch,terminal}.py` | Offline-first selling is a strong claim for low-connectivity LatAm sellers — exactly the landing's audience — and is never mentioned |
| Cash closings & reconciliation (expected-vs-declared, DB-computed differences) | Live (UI unmounted — `ClosingFlow.tsx` dead code) | `cross-app-be/app/models/closing.py:79-96`, `closing_service.py` | |
| Fiscal catalogs platform: 28+ Hacienda catalogs, taxpayer lookup, CABYS search, exchange rates, exemption validation | Live (read-only) | `data-services/app/*` (34 services); `consumer-*` proxies | |
| Team members, email invitations (token accept), RBAC management UI | Live (enforcement absent) | `server/src/services/{MembershipService,InvitationService}.ts`; POS `MembersPage.tsx` | Landing never mentions teams/collaborators despite targeting cooperatives — the one audience that needs multi-user orgs |
| Custom domain attach (ACM/CloudFront/Route53 automation) | Live | jbiller `custom_domain_service.py` | Landing only promises a subdomain; custom domains are a premium-tier feature given away silently |
| Org storefront CMS (pages → sections → content), component catalog, media library | Live (publish pipeline simulated) | `server/src/entities/{Page,PageSection,SectionContent}.ts`; POS `ContentPage.tsx`; `DeploymentService.ts:58-88` (fake success) | |
| Excel bulk product import; product price-bounds filtering | Live | `cross-app-be/app/services/product_excel_service.py` | |
| Bilingual ES/EN i18n across landing, POS (~4,100-line LanguageContext), dashboard | Live | POS `src/contexts/LanguageContext.tsx` | |
| B2B cross-docking business (retailer Excel PO ingest, distribution PDF/Excel reports, delivery confirmations) | Live — but an unrelated fused business ("Modas Laura") | `cross-app-be/app/services/{excel_parser,order_service,pdf_service}.py` | Should never be marketed under this brand; evidence of domain fusion, not an offer |

---

## 3. Tone / positioning mismatches

1. **The brand sells an SSE movement; the machine is a fiscal-compliance engine.** The only complete production journey is a formal Costa Rican taxpayer signing legal e-invoices and submitting to Hacienda (user journeys doc). The landing's hero persona — informal, moneyless, trueque-practicing community member — has literally no working surface: no barter, no fairs, no buyer accounts, no marketplace. The implemented user and the marketed user are nearly opposites (registered taxpayer vs informal seller).
2. **"Transparencia" is the #1 stated value; the implementation simulates outcomes.** Fake contact submit (`Contact.tsx`), CMS publish that records success without building (`DeploymentService.ts:58-88`), placeholder testimonials and traction numbers, "Active fairs" badge over static JSON. The brand's core value is the gap's exact name.
3. **"Free, people-first, anti-corporate" vs scaffolded monetization.** `stripeCustomerId`/`plan` fields and `stripeEnabled` flags sit in the schema awaiting a paid tier the site swears doesn't exist ("Sin cargos ocultos").
4. **Security/compliance language vs the audit's worst findings.** privacy.json promises encryption and GDPR while signing certificates/PINs/ATV passwords sit plaintext in Postgres behind membership-free authorizers, and every backend is IDOR-exposed (architecture audit G1/G2). The legal pages claim a posture the platform inverts.
5. **Brand identity split + domain drift.** Public brand "Tsuru" vs internal "Tsuru" (repos, admin chrome) vs the strategic research doc recommending a full Tsuru/Bribri rebrand; `seo.json` canonicals point at `tsuru.jcampos.dev` while the standalone repo deploys to `tsuru.jcampos.dev`; landing CTAs route signups to the deprecated dashboard (`admin.tsuru...`) instead of the POS app where auth actually lives (`navbar.tsx:130-137`).
6. **Pan-LatAm story vs CR-only system.** Testimonials span Buenos Aires/Medellín/Oaxaca, but the working stack is Costa Rica-specific (Hacienda v4.4; data-api multi-country schema with only CR=188 seeded — Scaffolded).
7. **Strategic research alignment note:** the research doc's demand that "mechanics, not cosmetics" embody solidarity (mutual aid, anti-monopoly bundling, reciprocity copy) is currently inverted — the landing has solidarity *cosmetics* (vocabulary, palette, values pills) over conventional-commerce *mechanics* that are themselves incomplete.

---

## 4. Honesty score per landing section

Score = fraction of section claims backed by working implementation, weighted by claim strength. 10 = fully honest.

| Section (content entity) | Score | Rationale |
|---|---|---|
| Examples (`Examples.tsx` + live API) | 9/10 | Fully real: live template fetch, working demo stores. Only caveat: demos show seed data, not real merchants. |
| Terms (`terms.json`) | 8/10 | "Facilitator only / as is" accurately describes reality; community pledge and IP stance are copy-only but uncontradicted. Restates barter/fairs as existing (−2). |
| About (`about.json`) | 7/10 | Origin story (UCR TCU, Guápiles, pandemic) is consistent and specific; mission is openly aspirational. "Preserva y documenta" backed only by static blog. |
| Landing home (`landing.json`) | 5/10 | Store-builder steps mostly real but last-mile-broken (#1, #3); "Garantizamos" fair-trade value unbacked; free/no-fees true today. |
| Features (`features.json`) | 5/10 | Templates/no-code/subdomain delivered; catalog management built differently; order tracking false; "miles de emprendedores" unsubstantiated. |
| Blog (`blog.json`, `blog-chrome.json`) | 4/10 | Articles are real static content (+), but article4 teaches users to barter "on the platform" (feature doesn't exist) and the newsletter is a dead UI. |
| Community (`community.json`) | 2/10 | Barter system, mutual support networks, and all three testimonials describe unbuilt functionality; only the values copy is "real" (as copy). |
| Privacy (`privacy.json`) | 2/10 | Encryption/GDPR/data-rights claims contradicted by plaintext fiscal secrets, IDOR posture, and absent tooling. |
| Cookies (`cookies.json`) | 2/10 | Describes a consent banner and analytics/marketing cookies that don't exist in the codebase. |
| Fairs (`fairs.json`) | 1/10 | Entire section (fair types, joining flow, "Active fairs") has zero implementation in any of the 7 systems. |
| Contact (`contact.json`) | 1/10 | 24h-response promise over a form that fakes submission and discards messages; placeholder phone number shipped as fact. |

**Site-wide honesty verdict:** the landing is honest about *what kind of tool the store-builder is* (no-code, templates, WhatsApp, subdomain, free) and systematically dishonest-by-aspiration about *what kind of economy it operates* (fairs, barter, community, guarantees) and *how it handles trust* (contact, privacy, cookies, security). The highest-scoring sections are the ones with the least marketing ambition.

---

## 5. Reconciliation summary for downstream synthesis

- **Deliver-the-last-mile fixes** would convert 4 Partial/Built-differently verdicts to Delivered cheaply: add public org products/categories endpoints to `PublicOrgController.ts` (unbreaks #1/#3/#5), and a minimal consumer-order record would ground #6.
- **Retract-or-build decisions** needed for the 14 Not-built claims, splitting into: (a) SSE differentiators (#10–#14) — strategic build (the research doc supplies the design language) or copy retraction; (b) trust/compliance (#18–#23) — must be fixed or removed immediately; they are live misrepresentations (fake contact form, GDPR/cookie claims, security claims contradicted by plaintext fiscal credentials).
- **Re-aim the story**: the ecosystem's genuinely excellent, unmarketed capability — offline-first POS + legal CR e-invoicing — serves the landing's exact audience (LatAm micro-sellers formalizing their business) and is absent from all 22 content entities.
