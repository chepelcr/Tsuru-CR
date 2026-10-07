# Tsuru Ecosystem — Three-Way Reconciliation: Landing ↔ System ↔ Research (Phase 12.5)

**Date:** 2026-06-11
**Inputs:** `tsuru_landing_audit.md` (product vision), `tsuru_system_discovery.md` / `tsuru_domain_model.md` / `tsuru_capability_inventory.md` / `tsuru_user_journeys.md` / `tsuru_architecture_audit.md` (implementation reality), `docs/Rebranding Web_ Economía Indígena Solidaria.txt` (strategic research: Bribri-grounded Social Solidarity Economy rebrand), `tsuru_social_economy_alignment.md` (Phase 9), `tsuru_reconciliation_report.md` (Phase 8), `tsuru_gap_analysis.md` (Phase 11).
**Frame:** three layers that should be one product —
- **LANDING** = the marketed vision: public brand "Tsuru", an SSE community platform (free no-code stores, WhatsApp commerce, ferias, trueque, mutual aid), born from a UCR TCU project in Guápiles.
- **SYSTEM** = the verified reality: a mature Costa Rica POS + Hacienda v4.4 e-invoicing engine, a tenant/CMS control plane with a broken storefront commerce loop, and ecosystem-wide missing authorization.
- **RESEARCH** = the strategy: rebrand to **Tsuru** (Bribri cacao / sacred currency), encode solidarity as *mechanics* (reciprocity, Jala de Piedra crowdfunding, Kökö anti-monopoly bundling, Sibö fairness-by-rules, Iriria stewardship, matrilineal leadership, solidarity micro-copy), with a specified natural-pigment design system.

Status vocabulary follows prior phases: **implemented / partial / scaffolded / dead code / marketing-only / contradicted / absent**.

---

## 1. Sweet spot — where all three align

These are the only zones where vision, code, and strategy point the same way. Each is qualified.

| Theme | Landing | System | Research | Qualification |
|---|---|---|---|---|
| **Local rootedness / serving the smallest producers** ("Producción local"; "tecnología debe servir a las personas") | Core value (`landing.json`, `community.json`) | **Strongest genuine asset:** full Hacienda v4.4 e-invoicing chain (`auth/app/sales-api/.../sales_pipeline.py`), CR fiscal catalogs incl. CABYS (data-api, 34 services), SINPE payment bucket (`useCartFlow.ts` type '06'), WhatsApp-first checkout (`checkout-modal.tsx`), offline-first POS for low connectivity (`src/lib/db.ts` Dexie + `public/sw.js`) | "Arraigo territorial" (Iriria); Talamanca/Costa Rica grounding; protection of local producers | The alignment is *compliance + channel fit*, not local-economy features: no provenance, no local discovery, no origin signals (Phase 9 #9). |
| **Free access / no hidden fees / anti-extraction** | "Gratis" repeated 4+ times; "Sin cargos ocultos" (`landing.json` values[3]) | True **by omission**: zero billing/commission code anywhere; Stripe schema-only (`entities/Organization.ts` `plan`/`stripeCustomerId`, no SDK) | Anti-extractive ethos is foundational ("acumulación infinita y extracción transaccional" rejected) | Honored by absence, not design; scaffolded Stripe fields signal a future collision (Phase 8 #8/#9, Phase 11 S5). |
| **Collaboration inside an organization** ("Colaboración" value; cooperative audience) | `community.json` values; useCases[2] cooperatives | **Real mechanics:** memberships + email invitations with token accept (`server/src/services/{MembershipService,InvitationService}.ts`), cashier/supervisor assignments, manager-approved cash closings with DB-computed reconciliation (`cross-app-be/app/models/closing.py:79-96`) | Ayuda mutua / collective effort | Degraded journeys: cajero routes to nonexistent `/pos`, `ClosingFlow.tsx` unmounted, invitation redirects dropped, roles unenforced (`tsuru_user_journeys.md`). |
| **Costa Rican cultural identity as brand DNA** | Origin story: UCR TCU "Comer Orgánico", Feria del Trueque Verde Manantial, Guápiles, pandemic (`about.json`, `terms.json` §1) | Codebase **already adopted the research's primary name**: repos `tsuru-pos-system`, `tsuru-landing`, "Tsuru Admin" chrome, `tsuru:content-saved` event — internal only | Primary naming recommendation IS Tsuru (cacao, Sibö's wife, sacred currency) | Three-way agreement on identity *direction*, zero public execution: public copy is 100% "Tsuru", `branding.json` logoUrl/faviconUrl empty, SEO domain drift (tsuru vs tsuru.jcampos.dev). |
| **Platform as facilitator, not payment intermediary** | `terms.json` §4/§6 — most honest claim on the site (Phase 8 #25) | Accurate: WhatsApp hand-off checkout, no gateway, no intermediation | Compatible with non-extractive stance (no rent on transactions) | Honesty about a *gap*: the same fact breaks order tracking (#6) and the fair-trade guarantee (#10). |
| **Bilingual, low-tech, LatAm-first UX** | "Sin programación", ES-first with EN | Real: 9 no-code storefront templates + clone service (`TemplateCloneService.ts`), ES/EN i18n across landing/POS/dashboard (POS `LanguageContext.tsx` ~4,100 lines) | Linguistic integrity as first-class concern ("el lenguaje crea la economía") | i18n *infrastructure* aligns; the *vocabulary* it carries is conventional e-commerce, the opposite of the research's demand (see §2). |

**Sweet-spot synthesis:** the genuine triple-alignment is narrow but real — *a free, Spanish-first, offline-tolerant tool that legally formalizes Costa Rica's smallest sellers*. That sentence is true in all three layers, and **none of the three currently says it out loud**: the landing markets unbuilt barter/fairs, the research never mentions fiscal compliance, and the system documents itself as an e-commerce platform it isn't.

---

## 2. Rhetoric ahead of reality — landing follows research, system doesn't

The landing already speaks the research's language; the system has nothing (or the inverse) behind it. This is the liability zone: present-tense copy for absent mechanics.

| Research principle | Landing adoption (copy) | System reality | Severity |
|---|---|---|---|
| **Reciprocidad sagrada → barter/trueque** | `community.json` barter (3-step flow, present tense: "Nuestro sistema de trueque permite…"); `blog.json` article4 teaches barter "on the platform" | **Absent.** Zero barter/exchange entity, endpoint, or UI in any of the 7 systems (grep-verified Phase 9 #1); ToS disclaims it (§4/§6) | Critical — flagship differentiator is 100% unimplemented (Phase 11 S2) |
| **Interdependencia tejida → ferias** | `fairs.json` 3 fair types + registration flow ("Inscríbete en una feria…"); `Ferias.tsx` "Active fairs" badge over static JSON | **Absent.** No fair/event entity anywhere; CTAs route to the *legacy* dashboard's generic register URL (`branding.json` adminRegisterUrl; `navbar.tsx:130-137`) | Critical (Phase 11 S1) |
| **Ayuda mutua / Jala de Piedra → mutual support networks** | `community.json` mutual ("Encuentra colaboradores, mentores y clientes") | **Absent.** No social graph, directory, messaging, buyer accounts, or crowdfunding entity in any schema | High (Phase 11 S3/S4) |
| **Sibö fairness-by-system-rules → fair-trade guarantee** | "**Garantizamos** condiciones justas y precios transparentes" (`landing.json` values[0] — strongest verb on site) | **Contradicted.** Ecosystem-wide IDOR (no org-membership checks; documented userId↔JWT-sub gateway check absent from `api-gateway/template.yml`); RBAC modeled+seeded but never mounted (`server/src/middleware/permissions.ts`); plaintext P12/PIN/ATV credentials in Postgres (`organization_configuration.py`); RLS `using true` | Critical — system is architecturally the *opposite* of Sibö's protective architect (Phase 9 #6) |
| **Transparencia (trust pill #1)** | Repeated 3× (hero, final CTA, CTASecuritySection) | **Contradicted.** Contact form fakes delivery (`Contact.tsx:24-38`, `settings.json delivery:'none'`) against a 24h promise; CMS publish simulates success (`DeploymentService.ts:58-88`); placeholder phone/testimonials/traction; claimed cookie banner doesn't exist | Critical (Phase 8 §3.2) |
| **Iriria stewardship → consumo consciente** | Value pill in `landing.json`/`community.json`/`about.json` | **Absent.** No provenance, sustainability, certification, or producer-story field in any product model (`cross-app-be/app/models/product.py` is fiscal-only: CABYS/tax columns) | Medium |
| **Preservación cultural → "preserva y documenta la cultura de ferias"** | `about.json` queEs.points[3]; 6 static blog articles | **Marketing-only.** No archive/story feature; CMS component catalog (`seeds/component-seed.ts`) has no cultural/story section type | Medium |
| **Comunidad sobre individuo → cooperative collective sales** | `features.json` useCases[2] "ventas colectivas, trueque y proyectos económicos compartidos"; testimonial of a cooperative | **Absent.** Strictly single-owner orgs (`Organization.ts` ownerId); no co-op type, voting, or profit-sharing; cross-app-be even auto-creates orgs with `owner_id='system'` from Excel (`order_service.py::_sync_organization`) | High |
| **Economía como sanación / movement tone** | "No solo una tienda — un movimiento"; "una economía que pone a las personas primero" | Neutral-by-absence; counter-signals: plaintext passwords in sessionStorage (`Register.tsx:139-145`), full API payloads console-logged in prod (`src/lib/api.ts`) — careless with the users the brand vows to protect | Medium |

**Pattern:** the landing adopted the research's *vocabulary and positioning* wholesale (SSE category, trueque, ferias, solidarity values) before the system adopted any of its *mechanics* — exactly the "cosmetics over mechanics" inversion the research itself warns against. Worse, two principles (Sibö fairness, transparency) are not merely unbuilt but **actively contradicted** by the implementation.

---

## 3. Hidden assets — system strengths neither landing nor research leverages

The system's best work is invisible to both narrative layers (Phase 8 §2 "under-sold reality", re-read through the research lens).

| Asset | Status | Evidence | Why it's an unclaimed solidarity story |
|---|---|---|---|
| **Legal CR e-invoicing for the smallest sellers** (create → clave/consecutive → XML → XAdES sign → ATV → validation → PDF → email) | Live — the ecosystem's only mature end-to-end pillar | `sales_pipeline.py`; SQS FIFO mesh; `jbiller_common/hacienda/*` | Formalization *is* structural protection of the weak (Sibö's function): it converts informal sellers into legally recognized economic actors for free. Zero landing copy mentions "facturación electrónica"; the research never considers fiscal compliance as a solidarity mechanic. |
| **Offline-first POS** (IndexedDB-first capture, Background Sync replay) | Live | `useCartFlow.ts`, `src/lib/db.ts`, `public/sw.js` | Designed for low-connectivity rural contexts — the literal Talamanca/rural audience of the research and the WhatsApp-first audience of the landing. Unmentioned by both. |
| **Cash-closing reconciliation with DB-computed differences** | Live backend; UI unmounted dead code | `closing.py:79-96` (Postgres Computed columns); `ClosingFlow.tsx` (450 lines, unrouted) | This is *transparency as a mechanic* — auditable, tamper-resistant accountability for shared cash handling, exactly what a cooperative needs. Neither narrative claims it; the UI isn't even reachable. |
| **Fiscal catalogs platform** (28+ Hacienda catalogs, CABYS search, taxpayer lookup, exchange rates, exemptions) | Live (read-only in prod) | data-services 34 services; consumer proxies | Public-good knowledge infrastructure for CR commerce; could anchor "education woven into commerce" with real data. |
| **Teams, invitations, RBAC model** | Live mechanics; enforcement absent | `MembershipService.ts`, `InvitationService.ts`, seeded RBAC, POS `MembersPage.tsx` | The substrate for the research's governance/cooperative ambitions already exists as schema + UI. The landing never mentions teams despite targeting cooperatives — the one audience that needs multi-user orgs. |
| **Per-org infrastructure automation with self-healing** (S3/CloudFront/Route53 provisioning, custom-domain attach, SNS re-emit recovery) | Live | jbiller `infrastructure_provisioning_service.py`, `custom_domain_service.py`; `DeploymentService.ts` SNS re-emit | "Own address from day one" is delivered beyond what's promised (custom domains given away silently) — digital autonomy/dignity framing available for free. |
| **CMS component catalog** (Page → Section → Content + component registry) | Live (publish pipeline simulated) | `entities/{Page,PageSection,SectionContent,Component}.ts`, `component-seed.ts` | Ready-made extension point for the research's inline cultural-education sections (Tsuru/Iriria stories) — no new architecture needed, just new component types. |
| **Mature i18n infrastructure** | Live | POS `LanguageContext.tsx` (~4,100 lines); landing per-entity `{es,en}` JSON; dashboard 840+ keys | The exact lever the research's "language creates the economy" principle requires: renaming "Clientes"→"Aliados Solidarios" etc. is a translation-file change, not an architecture change (Phase 9 #15). |
| **Multi-country catalog schema** (only CR=188 seeded) | Scaffolded | data-api `country_code` + `document_version_id` dimensions | Latent capacity matching the landing's pan-LatAm testimonials (Buenos Aires/Medellín/Oaxaca) — currently pure fiction, but the schema slot exists. |
| **Idempotent event mesh** (SNS/SQS FIFO document pipeline) | Live | `hacienda-messaging.yml`; validator→pdf→notification chain | Reusable plumbing for every future community domain (fair lifecycle events, crowdfunding contributions) — the research's Jala de Piedra mechanic has its transport layer already built. |

(Excluded as non-leverageable: the fused Modas Laura B2B cross-docking business inside cross-app-be — real and live, but off-brand and off-thesis; Phase 8 flags it should never be marketed under this identity.)

---

## 4. White space — research directions neither landing nor system has adopted

Pure greenfield from the research doc: no copy on the landing, no code in any system.

| Research direction | Landing | System | Notes |
|---|---|---|---|
| **Public Tsuru rebrand + Bribri lexicon as IA** (Iriria = agri/environment sections, Ú-sure = community space, Kökö = cooperative groups, Awá = curation/guide roles) | Brand is "Tsuru"; no Bribri term appears in any public copy | "Tsuru" exists only as internal codename | The one white-space item that is *half-adopted internally*. ⚠️ Adopting sacred Bribri cosmology commercially requires actual partnership/consent with Bribri communities (RIBCA), not just design execution — the research treats heritage as living governance knowledge, and using it without the community would invert principle #10 (preservación digna). |
| **Natural-pigment design system** (Carmesí Achiote #D9381E, Borgoña Tsuru #6B2A22, Dosel Talamanca #2E5033, Arena de Mastate #F4EFE6, Piedra Sĩã' #3D4045, Oro de Maíz #E8B83A) + Ú-sure/cacao logo + Jaba/Kó/Penéch etnogeometric grids + monoline precolombian icons | Landing uses a generic forest-green theme (`themes.json` HSL 123 46% 34%); logo slots empty | POS has its own conventional design system | The landing is a JSON-driven DXP with a single theme file and empty logo slots — purpose-built for exactly this swap (Phase 11 O9). |
| **Jala de Piedra crowdfunding** (micro-contributions for cooperative capital; ceremonial-stone progress visualization) | Not promised anywhere | No campaigns/contributions domain | Needs buyer identity + a payments path; SINPE-reference pattern and the SNS/SQS mesh are reusable substrates. |
| **Kökö exogamous bundling** ("canastas comunitarias" spanning ≥2 organizations; seller profiles mapping collaborations) | Not promised | No cross-org surface of any kind; even single-org public product browsing is broken (`PublicOrgController.ts` lacks the endpoints storefronts call) | Anti-monopoly value circulation by design — depends on a marketplace read-model + consumer order domain that don't exist. |
| **Matrilineal / women-led foregrounding** (RIBCA, Stribrawpa; equitable compensation and protection of women's work) | Zero mention | No org attribute (`womenLed`/`cooperative`/`indigenousLed`), badge, filter, or imagery system | Cheapest entry: one Drizzle migration on `organizations` + badges (Phase 9 #12). |
| **Solidarity micro-copy in the product** ("Aliados Solidarios" not "Clientes"; support-framed CTAs not "Comprar Ahora") | Landing copy is solidarity-saturated, but this principle targets the *product* UI | POS/storefronts use standard commerce nouns (`useClients.ts`, cart/checkout language); `DocumentActionModal.tsx` hardcoded Spanish | Highest symbolism-per-effort ratio: pure i18n work on mature infrastructure. |
| **Inline cultural education in the purchase flow** (Tsuru/cacao story at cacao purchase; Iriria at agricultural goods) | Blog articles exist but are a separate section — research explicitly demands *integrated*, not separate | No story/provenance component type in the CMS catalog | Extension point exists (`Component.ts`, `component-seed.ts`). |
| **Democratic governance / cooperative org type** (multi-owner orgs, proposals, voting, equitable distribution) | Vague "proyectos económicos compartidos" only | Single-owner model; `OrganizationMember.roleId` is the only substrate; enforcement absent | Prerequisite: mount the existing RBAC (Sibö fix) first. |
| **Awá curation roles** (platform guides / quality curation) | Absent | Only unenforced platform_admin/owner/admin roles | Maps naturally onto the existing-but-unenforced role system. |

---

## 5. Three-column alignment matrix

Verdict key: ✅ aligned/real · 🟡 partial · 📢 copy-only · ❌ absent · ⛔ contradicted by code.

| # | Theme | LANDING (vision) | SYSTEM (reality) | RESEARCH (strategy) | Verdict |
|---|---|---|---|---|---|
| 1 | Serve smallest local producers (CR) | ✅ core promise | ✅ Hacienda e-invoicing, SINPE, offline POS, WhatsApp | ✅ Iriria / protection of producers | **Sweet spot** (unmarketed) |
| 2 | Free / no hidden fees / anti-extraction | ✅ 4+ CTAs | 🟡 true by omission; Stripe scaffolded | ✅ anti-extractive core | **Sweet spot** (fragile) |
| 3 | No-code stores, templates, subdomain | ✅ promised | ✅ delivered (clone service, infra automation) | ◽ not a research concern | Landing↔System aligned |
| 4 | WhatsApp-first selling | ✅ primary channel | 🟡 only checkout that exists; live-org browse 404s | ◽ implicit (channel fit) | Landing↔System partial |
| 5 | Intra-org collaboration / teams | 📢 cooperative audience, teams never mentioned | ✅ memberships/invitations/closings (journeys degraded) | ✅ ayuda mutua | **Hidden asset** |
| 6 | Tsuru identity / cultural grounding | ❌ public brand is Tsuru | 🟡 internal codename only | ✅ primary recommendation | Half-adopted **white space** |
| 7 | Barter / trueque (reciprocity) | 📢 present-tense flagship | ❌ zero code | ✅ reciprocidad sagrada | **Rhetoric ahead** |
| 8 | Fairs / ferias (interdependence) | 📢 3 types + registration flow | ❌ zero code; no cross-org surface | ✅ interdependencia tejida | **Rhetoric ahead** |
| 9 | Mutual support networks / crowdfunding | 📢 mentors/collaborators copy | ❌ no buyer identity, no social graph | ✅ Jala de Piedra | **Rhetoric ahead** |
| 10 | Fairness enforced by system rules | 📢 "Garantizamos…" | ⛔ IDOR everywhere, RBAC unmounted, plaintext fiscal certs | ✅ Sibö protective architect | **Contradicted** |
| 11 | Transparency | 📢 trust pill #1 | ⛔ fake contact form, simulated publish, placeholder claims | ✅ implied throughout | **Contradicted** |
| 12 | Conscious consumption / provenance | 📢 value pill | ❌ no provenance/story fields | ✅ Iriria + inline education | **Rhetoric ahead** |
| 13 | Cultural preservation / documentation | 📢 mission + static blog | ❌ no product surface | ✅ Suwoh, education woven into commerce | **Rhetoric ahead** |
| 14 | Governance / cooperative org type | 🟡 vague collective language | ❌ single-owner only | ✅ democratic decisions, Kökö | Mostly **white space** |
| 15 | Cross-org bundles / anti-monopoly circulation | ❌ | ❌ | ✅ canastas comunitarias | **White space** |
| 16 | Women-led / matrilineal foregrounding | ❌ | ❌ | ✅ RIBCA/Stribrawpa | **White space** |
| 17 | Solidarity micro-copy in product UI | n/a (landing already solidarity-toned) | ❌ standard commerce nouns | ✅ language-as-economy | **White space** (cheap) |
| 18 | Natural-pigment palette / etnogeometría / logo | ❌ generic green theme, empty logo slots | ❌ | ✅ full spec with hex codes | **White space** (DXP-ready) |
| 19 | Fiscal formalization as solidarity | ❌ never mentioned | ✅ the most mature capability | ❌ never considered | **Hidden asset** — the gap in *both* narratives |
| 20 | Pan-LatAm reach | 📢 testimonials (AR/CO/MX) | ❌ CR-only seeded (schema multi-country) | ◽ CR/Talamanca-focused | Landing overreach |

**Distribution:** 2 qualified sweet spots, 2 active contradictions, 6 rhetoric-ahead items, 6 white-space items, 2 hidden assets, and 1 theme (fiscal formalization) where the **system leads both narratives**.

---

## 6. Recommended sequencing

Ordering principle (inherited from Phases 9/11 and extended three-way): **(0) stop contradicting → (1) market what is true → (2) build the missing actors/surfaces in dependency order → (3) deepen cultural mechanics.** Adopting more research language onto a contradicting system increases legal/trust liability; conversely, the system's hidden assets let the landing become *more* solidaristic by becoming *more honest*.

### Phase 0 — Build into the SYSTEM first (prerequisites; do NOT touch landing positioning until these land)
1. **Sibö = mount the authorization that already exists** (research #5 "fairness by system rules"): finish the lambda-authorizer membership TODO (`organization_auth_checker.py:73-85`), replicate cross-app-be's correct `claims.sub → x-user-id` gateway mapping to markets-api and sales-api, mount `permissions.ts`. ~80% written; wiring, not building (Phase 11 #1, O1).
2. **Encrypt fiscal secrets + env-drive the Hacienda realm** (P12/PIN/ATV out of plaintext Postgres, out of GET responses). A solidarity brand cannot run on cross-tenant credential exposure (Phase 11 #2, O6).
3. **Transparency mechanics**: deliver the contact form via existing SES, make `DeploymentService` report real status, drop sessionStorage passwords and prod payload logging (Phase 11 O4/O6).
4. **Unbreak the last mile**: public product/category endpoints in `PublicOrgController.ts` (storefronts already call them); route `/pos` and mount `ClosingFlow.tsx` (Phase 11 O2/O5).

### Phase 1 — Adopt into the LANDING next (content/config-only; cheap; true on day one)
5. **Re-aim the story onto the hidden assets**: free legal CR e-invoicing + offline-first selling for micro-entrepreneurs *is* the solidarity story all three layers can honestly share (matrix row 1/19). New hero claims; "facturación electrónica gratuita" as a headline feature.
6. **Move barter/fairs/mutual-aid copy to explicit roadmap framing**; remove placeholder phone/testimonials/traction; retire the unbuilt-feature present tense (kills the rhetoric-ahead liability; Phase 8 §5).
7. **Execute the Tsuru visual/verbal rebrand on the landing DXP**: name, 6-color natural-pigment palette, Ú-sure/cacao logo into the empty `branding.json` slots, solidarity micro-copy — the DXP (single `themes.json`, JSON content entities) was built for exactly this (Phase 11 O9). **Gate the Bribri-lexicon depth (Iriria/Ú-sure/Kökö/Awá naming, cosmology storytelling) on real consultation/partnership with Bribri organizations (RIBCA)** — without it, the rebrand contradicts the research's own dignity principle.
8. **Solidarity micro-copy in the product** (research #10, language-as-economy): rename "Clientes"→community framing across POS `LanguageContext.tsx` and storefront copy; fix `DocumentActionModal.tsx` hardcoded Spanish in the same pass. Pure i18n; highest symbolism-per-effort.

### Phase 2 — Build into the SYSTEM, then market (dependency order)
9. **Marketplace directory** (first cross-org surface): public "discover local stores" over existing `organizations` + CR geo data — the seed of ferias and Kökö circulation (Phase 11 O8).
10. **Buyer/community-member identity** (the missing actor for every community principle): lightweight Cognito profile not tied to org operation.
11. **Provenance/story fields + CMS "story" component type** → inline cultural education at purchase (research's integrated-education demand; reuses `Component.ts` catalog).
12. **Org-profile attributes** `womenLed`/`cooperative`/`indigenousLed` + discovery badges (one migration; white-space row 16).
13. **Fairs domain**: `fairs` + `fair_participations` + time-boxed aggregated catalog (builds on 9+10) — converts the landing's highest-liability section (`fairs.json`, honesty 1/10) into truth.
14. **Barter domain**: `exchange_offers`/`exchange_agreements`, platform stays facilitator (consistent with `terms.json` §4) — record agreements, don't settle them.
15. **Canastas comunitarias** (cross-org bundles with per-org revenue attribution) + **Jala de Piedra crowdfunding** (`campaigns`/`contributions`, SINPE-reference payments, SNS/SQS mesh, stone-pull visualization) — the research's two signature mechanics, last because they depend on everything above.
16. **Cooperative org type + governance** (multi-owner, proposals/votes) on top of the *enforced* RBAC from Phase 0.

### Standing decision (blocks nothing above, shapes everything after)
**Product thesis** (Phase 11 #6): the sequencing above deliberately makes both futures cheaper — Phase 0–1 is mandatory under either thesis (CR fiscal POS or SSE community platform), and Phase 2 items 9–12 are low-regret under both. Items 13–16 commit to the SSE thesis and should not start before the thesis is explicitly chosen and the monetization narrative ("gratis para siempre" vs scaffolded Stripe) is resolved publicly.

---

## 7. Verdict

The three layers currently form a triangle with one true edge: **system ↔ research agree on direction internally** (the Tsuru codename, the i18n/CMS/RBAC substrates that the research's mechanics need) while **landing ↔ research agree only on vocabulary** (SSE positioning over absent mechanics) and **landing ↔ system agree only on the store-builder basics** (templates, subdomain, WhatsApp — and even those break at the last mile). The reconciliation path is asymmetric and favorable: the contradictions (authorization, secrets, fake flows) are mostly *wiring of already-written code*; the most honest possible landing rewrite is also the most differentiated one (free legal e-invoicing as solidarity); and the research's deepest mechanics (crowdfunding, bundles, governance) have their transport (SNS/SQS), substrate (RBAC, memberships, CMS components), and design language already in place — what is missing is the buyer actor, the cross-org surface, and the decision to build them.
