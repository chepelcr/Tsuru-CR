# Tsuru Storefront-Deploy MVP — Milestone Map (TSR-118)

**Created:** 2026-06-20 · **Revised:** 2026-06-20 (owner reshaped the public-API approach).
**Owner:** tsuru. **Goal:** a new organization gets a working, HTTPS storefront
auto-deployed at `{slug}.stores.tsuru.jcampos.dev`, consuming **one shared public API**
(a generated API-Gateway that routes to the existing lambdas — no new service), protected by
an **anonymous Cognito** pool; the storefront templates live in their own repos, are visible
online as GH-Pages examples, and their cart captures a **structured CR address** (provincia /
cantón / distrito / barrio / dirección exacta). Plus a landing rebalance (POS · store ·
community harmony). Account **PACIFIC-PROD** (`947999370977`), zone `Z08953202H0791MTWJHTP`.

> **▶ Authoring status (2026-06-30):** W1, W4, W6, W7, W9, W10, W11, W12, W13 **authored +
> statically verified** (typecheck/py-compile/YAML-lint green), pending **manual supervised
> rollout** (DB migrations, SAM/Cognito deploys, repo pushes). W2 (org-site provisioner) and
> the W4 guest-SigV4 signing completion (depends on W7's identity-pool id) remain TODO.
> W1 IaC: `Infrastructure/public-api/{gen_public_api.py,public_api_config.json,template.yml,samconfig.toml,deploy.sh}`
> (20 public paths → 3 lambdas). W7 IaC: `Infrastructure/cognito/tsuru-public-identity-pool.yml`.
>
> Roadmap row **TSR-118** (§2.F). Resolves TSR-080; relates TSR-083/092.
> **Locked decisions (owner):**
> - Public API = **NOT a new service**. A **generator** (like the per-backend
>   `gen_api_template.py`) reads the existing lambdas' endpoint specs and emits **ONE combined
>   public API-Gateway template** whose paths integrate (`aws_proxy`) with the correct existing
>   lambdas. Lives in the **`tsuru-infrastructure` repo** as IaC, deployed manually (SAM).
> - **Anonymous Cognito** protects it (visitors are guests, no login).
> - Org domain = dedicated parent `*.stores.tsuru.jcampos.dev` + **1 wildcard ACM cert** (W3 ✅).
> - Templates = **per-template repos** + **GH-Pages examples** + user-personalized.
> - **Org id is injected into each deployed site** so its API calls return that org's data.
> - **No new public controllers** unless strictly required — the middleware audit (below)
>   proved anonymous calls already work; org stays a **path param** for the MVP (header-based
>   org is deferred, not a priority).

---

## ✅ Feasibility findings (audited 2026-06-20)

**Anonymous access already works** — no new controllers needed:
- **management-be:** public routes (`/api/public/*`, `/api/templates/*`, `/api/organizations/by-subdomain|by-slug|check-*`) are mounted OUTSIDE `attachUserId`; `attachUserId` itself no-ops when there's no userId/bearer (doesn't 401). ✔
- **store-be:** `UserIdMiddleware` only 401s on `/api/users/*`; `/api/organizations/{orgId}/products|categories` are anonymous-readable. ✔
- **data-be / sales-be:** no user-id middleware; read endpoints open. ✔
- **`tsuru-infrastructure`** is a real repo (`chepelcr/tsuru-infrastructure`) → the public-API IaC goes there. ✔
- **Location cascade** for the cart exists in data-be (anonymous): `/countries/all`,
  `/countries/{iso}/states/{s}/counties/{c}/districts/{d}/neighborhoods/...`. ✔
- **store-be `sale`/`client` models already have** `state_id/county_id/district_id/neighborhood_id` →
  structured cart address persists with no schema change. ✔

---

## W1 — Combined public API (generator + IaC in `tsuru-infrastructure`)

**Build a generator** `public-api/gen_public_api.py` in `tsuru-infrastructure` that:
1. reads each backend's `api-gateway/endpoints.json` (or swagger) — the same artifacts the
   per-backend generators emit;
2. selects the **PUBLIC** paths via an allowlist (config), and
3. emits **one** OpenAPI+SAM template `public-api/template.yml` where each path has an
   `x-amazon-apigateway-integration` (`aws_proxy`) pointing at the **owning lambda's** invoke
   ARN, plus the anonymous authorizer (W7) and CORS/OPTIONS for the storefront origins.

**Path → lambda map** (use existing paths verbatim so the lambda routes them; no rewrite):
| Public path (on `public-api.tsuru.jcampos.dev`) | Target lambda |
|---|---|
| `/api/public/organizations/{orgId}/{theme,contact,pages,pages/{slug}}` | `tsuru-${env}-api-handler` (management-be) |
| `/api/templates/{id}/...`, `/api/organizations/{by-subdomain,by-slug,check-slug}` | `tsuru-${env}-api-handler` |
| `/api/organizations/{orgId}/products`, `/products/{id}`, `/categories` | `cd-backend-${env}-lambda` (store-be) |
| `/countries/...` location cascade (cart) | `tsuru-${env}-hacienda-locations-lambda` (data-be) |

**Infra (IaC, manual SAM deploy):** `public-api/{gen_public_api.py,template.yml,samconfig.toml}`
+ deploy script; custom domain `public-api.tsuru.jcampos.dev` (+ a CAA permitting amazon on
that subdomain — same fix as the other api hosts); `Lambda::Permission` granting the public
API to invoke each target lambda. Resolves **TSR-080**.

> Org as **path param** for MVP. If a needed public read is missing on a backend, add a minimal
> route there (only `categories`/`products` if the existing store-be paths don't suffice) —
> but the audit shows the needed paths exist. Header-based org (`X-Organization-Id`) is a
> later refinement, not in this MVP.

## W7 — Anonymous (public) Cognito + API protection

A dedicated **Cognito Identity Pool** with **unauthenticated (guest) identities enabled**; its
unauth IAM role is scoped to `execute-api:Invoke` on the public API only. The public API's
methods use **AWS_IAM** auth; storefronts use **Amplify guest credentials** to SigV4-sign
requests (so the API is never wide-open, but visitors need no login). IaC in
`tsuru-infrastructure/cognito/` (new `tsuru-public-identity-pool` stack), exported ARNs/IDs
consumed by W1's template and injected into the templates (W4). *(Lighter fallback if signing
in the static storefront proves heavy: API key + WAF throttling — but the chosen path is the
anonymous Identity Pool.)*

## W2 — Org-site deploy provisioner (sales-be `infrastructure-service-provider`)

1. Re-enable it (fix the import error; uncomment in `scripts/pipeline-build.sh`).
2. Env-drive domain: `DOMAIN_SUFFIX=stores.tsuru.jcampos.dev`, `ROUTE53_HOSTED_ZONE_ID=Z08953202H0791MTWJHTP`,
   `RESOURCE_NAME_PREFIX=tsuru-org` (fix the hardcodes at `route53_service.py:46`,
   `infrastructure_provisioning_service.py:191/320/343`).
3. Attach the **W3 wildcard cert** to each org CloudFront (alias `{slug}.stores.tsuru.jcampos.dev`).
4. **Inject org context at build:** clone the per-template repo (W5), then build with
   `VITE_ORG_ID={org.id}`, `VITE_API_URL=https://public-api.tsuru.jcampos.dev`, and the W7
   identity-pool/region vars → the deployed site runs in **org mode** for that org.
5. Verify SNS → SQS → provisioner → `organization_settings.status=active` end-to-end.

## W3 — Wildcard cert + DNS for org sites ✅ DONE (2026-06-20)

- **ISSUED:** `*.stores.tsuru.jcampos.dev` (+ apex), `arn:aws:acm:us-east-1:947999370977:certificate/759f1f4e-e216-42ee-a729-4bcf025b4228`.
- Needed a **CAA at `stores.tsuru.jcampos.dev`** permitting amazon (issue+issuewild) — `stores.*`
  is under the `tsuru.jcampos.dev` Pages CNAME, so the CAA tree-climb would otherwise inherit
  GitHub's restrictive CAA; the record stops the climb. Per-org A-alias → org CloudFront (W2).

## W4 — Template contract audit + repoint

Per `templates/{name}` (≈9): base URL `api.tsuru.jcampos.dev` → `public-api.tsuru.jcampos.dev`
(`apiUtils.ts`); base domain `tsuru.jcampos.dev` → `stores.tsuru.jcampos.dev` (`subdomain.ts`);
**org id from injected `VITE_ORG_ID`** (org mode) — don't rely on subdomain lookup alone;
align the called paths to the EXISTING public paths W1 exposes (products/categories from store-be
paths; content from management-be `/api/public/...`); add **Amplify guest auth** to sign requests
(W7). `.env.example` updated. Demo mode (`/api/templates/{id}/...`) kept for the GH-Pages examples.

## W5 — Per-template repos (monorepo-split skill) ✅ DONE (2026-06-20)

8 storefront templates snapshotted into their existing public repos `chepelcr/template-{artisan-crafts,
beauty-essentials,fitness-hub,gourmet-foods,tsuru-demo,pet-care,tech-gadgets,vintage-fashion}`
(clean snapshot; repos flipped **public** so Pages is allowed; monorepo `.gitignore` split markers
added, files still tracked). All converted to **pnpm** (packageManager pin + `pnpm-lock.yaml` +
`preinstall only-allow pnpm`). `pos-landing` (POS marketing) + `pollo-porteno` (no repo) deferred.
A base/starter for user-personalized generation is still TODO.

## W8 — GH-Pages examples for the template repos ✅ DONE (2026-06-20)

Each repo has a pnpm **GitHub Pages** workflow (demo mode via bundled `public/config.json`
`{mode:demo,templateId}`, build env `VITE_API_URL=https://api.tsuru.jcampos.dev` +
`VITE_BASE_DOMAIN=examples.tsuru.jcampos.dev`, SPA 404 fallback). **All 8 live + HTTPS 200 at
`{name}.examples.tsuru.jcampos.dev`** (Route53 CNAME → chepelcr.github.io; per-repo Pages cname set;
LE cert auto-provisioned — the github.io-inherited CAA permits Let's Encrypt). Demo data served by
management-be public `/api/templates/{id}/...`.
**Pending:** account-level GitHub domain verification — ONE TXT for `examples.tsuru.jcampos.dev`
(covers all subdomains); needs the GitHub-generated challenge value (Settings→Pages→Add a domain).

## W9 — Structured cart address in all templates

Add the **CR location cascade** (provincia → cantón → distrito → barrio + dirección exacta) to
every template's cart/checkout, sourced from the public API's `/countries/...` (data-be) routes —
mirroring the POS `LocationSelect`. Persists to store-be `sale` fields
(`state_id/county_id/district_id/neighborhood_id` + free-text address) that already exist. A
shared checkout-address component (copied into each template, or in the base template) is preferable.

## W6 — Landing harmony rebalance (`fe/landing`) — independent

Connect the 3 pillars without false present-tense (fairs stay "coming soon"): `landing.json`
hero subtitle + how-it-works step 3 + community-spotlight section + values; `features.json`
+community/fairs card (roadmap accent); `community.json` "hoy vs. pronto"; `about.json`
"de la visión a la práctica: hoy".

---

## W10 — Product types (product/service/offer/program) + offer flag + filtering

**Current (store-be `app/models/product.py`):** has `type` (string, default `"product"`),
`is_service` (bool), `on_sale`/`original_price`/`discount`, `duration`, `difficulty`. **No
`is_offer`; no `type`/offer filters; "program" not a first-class kind.** Search is a single
`?search=field:value,...` param parsed via `app/enums/product_search_filters.py` (NAME, CODE,
CATEGORY_ID, STATUS, PRICE, SALE_PRICE, ORDER_BY — **no type/offer**).

**Map:**
1. **Model** — formalize `type` as an enum `product | service | program`; add **`is_offer`**
   boolean (an offer is a product/service on promotion — the "check"). Reconcile with the
   existing `is_service`/`on_sale` (migrate `is_service→type='service'`, keep `on_sale` for the
   discounted-price mechanics; `is_offer` is the storefront "Oferta" flag). store-be migration
   (the `sale` model already has structured-address fields — no change there).
2. **Filters** — add `TYPE` (`type:product|service|program`) and `IS_OFFER` (`isOffer:true`)
   to `ProductSearchFilters` + repository/service handling.
3. **Dashboard product form** — add the "Es oferta" checkbox + a type selector (product/
   service/program) in POS `ProductDrawerForm`/sections.
4. **Templates (W4)** — filter via the existing search-param approach, e.g.
   `?search=type:product,isOffer:true,orderBy>name`; an "Ofertas" view/section keys off `isOffer`.

## W11 — Finish a pedido → tracked order in the BE (not just WhatsApp)

**Current:** template checkout (`templates/*/src/components/cart/checkout-modal.tsx`) only
builds a `wa.me/...?text=` link — **no order persisted**. store-be `orders_controller.py` has
list/get/parse(Excel)/status but **no simple storefront order-create**.

**Map (this is the ONE required new public WRITE endpoint):**
1. **store-be** — add `POST /api/organizations/{orgId}/orders` (storefront create): body =
   customer name/phone + **structured address (W9)** + delivery method + line items
   `[{product_id, quantity}]`; creates an order/pedido row (`order_status='pending'`), returns
   id + tracking number. Anonymous (storefront) — protected by the W7 guest creds at the gateway.
2. **public API (W1)** — expose this POST path → store-be lambda (writes allowed for the
   `orders` create path under the anonymous identity-pool role).
3. **templates** — checkout POSTs the order FIRST, then opens WhatsApp with the order id/tracking
   in the message (on failure: keep the cart, show error). Grounds promise #6 / **TSR-081**.

## W12 — `programs` as a template-gated dashboard submodule

**Map:** add a `programs` module/submodule to `rbac-seed.ts` (`DEFAULT_ORG_MODULE_NAMES`,
`defaultModules`, `defaultSubmodules`, `submoduleActionMatrix`, `rolePermissionMatrix`) →
`db:reseed-rbac`; add the POS sidebar item + `NAV_PERMISSION` entry + `ProgramsPage` + route.
**Template-gated visibility:** the section appears only when the org's selected template
includes a programs section — detect via the org's cloned `template_page_sections`
(`sectionType==='programs'`, `isActive`) or a `programs_enabled` flag set at clone time
(`TemplateCloneService`); the sidebar/page gate combines `can('programs','read',...)` AND
"template includes programs" (mirrors the existing `storefront/templates` conditional pattern).
Programs are then a product `type='program'` (W10) surfaced in their own dashboard section.

## W13 — Landing blog posts open (`fe/landing`)

**Current:** `Blog.tsx` "Ver/Read more" buttons have **no onClick/href**; there's only a `/blog`
list route (no `/blog/:slug`); `blog.json` articles have `id`+`excerpt` but **no `slug`/`content`**.
**Map:** add `slug` + bilingual `content` to `blog.json`; create `BlogDetail.tsx`; add
`/blog/:slug` route in `Router.tsx`; wire the list buttons to `navigate(/blog/${slug})`; add the
detail route to `prerender.mjs` + `seo.json`. (Part of the W6 landing area; tracked separately.)

---

## Sequencing
W3 ✅ → W2. W7 (anon cognito) → W1 (authorizer) → W4 (templates sign + repoint). W1 → W2
(inject public-api base) + W11 (public order POST path). W5 (repos) → W8 (gh-pages) + W2 (clone).
W9 (cart address) → W11 (order body). W10 (types/offer) → W4 (template filtering). W6 + W13
(landing) independent. W12 (programs) independent of the API track (RBAC + POS + template-gate).

**MVP cut:** W1 + W7 + W3(✅) + W2(re-enable/repoint/inject) + W4 + one W5 base template +
W9 cart address + W10 product types/offers + W11 tracked pedido = a real org gets a live
signed-API storefront at `{slug}.stores.tsuru.jcampos.dev` where visitors filter
products/services/offers, place a tracked order, and hand off to WhatsApp.
W8 (examples), W12 (programs), W6+W13 (landing) in parallel.

## Verification
1. Public API: `public-api.tsuru.jcampos.dev` returns org theme/contact/pages (management-be),
   products/categories (store-be), and the location cascade (data-be) — anonymously via guest
   creds; unsigned/forbidden requests rejected (W7).
2. Create a test org → provisioner → `organization_settings.active` → `https://{slug}.stores.tsuru.jcampos.dev`
   serves the storefront with that org's data (org id injected); cart shows the CR location cascade.
3. Each `template-{name}` example loads on its GH-Pages URL (demo mode).
4. Landing: 3 pillars balanced in the hero→features→how-it-works journey; fairs still honest.
