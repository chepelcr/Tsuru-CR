# Tsuru Ecosystem Audit — Phase 5: Real User Journeys (UX Architecture)

**Author:** UX Architect (multidisciplinary audit team)
**Date:** 2026-06-11
**Primary evidence:** `templates/pos-system/src` (Routes.tsx, routePaths.ts, pages, hooks, components), `landing-client/src`, `templates/tsuru-demo/src`, plus backend discovery data.
**Method:** Journeys reconstructed from the actual route table and page code, not from docs. Where docs and code diverge, code wins (and the divergence is flagged).

---

## 0. Journey landscape — what actually exists today

| # | Journey | Persona | Status |
|---|---------|---------|--------|
| J1 | Visitor → marketing site → signup funnel | Prospect | **Broken at the seam** — landing CTAs point at the legacy dashboard, not the POS app where auth now lives |
| J2 | Signup → email verify → org creation (3-step) | New merchant | **Implemented end-to-end**, with a draft/resume mechanism; cashier-role exit is a hard dead end |
| J3 | Daily POS flow: shift setup → sale → e-invoice → Hacienda → notification | Cashier / merchant | **Implemented** (offline-first); **cash closing UI is dead code**, so the day cannot be closed from the UI |
| J4 | Back-office document management (list, PDF/XML, validation, accept/reject, resend) | Merchant / accountant | **Implemented**, with i18n and UX rough edges |
| J5 | Org configuration: fiscal info, Hacienda credentials/certificate, notifications, members/roles, branding | Owner/admin | **Implemented** with a guided "welcome ghost" fiscal onboarding; settings split across two backends |
| J6 | Team invitation → join | Invited member | **Implemented but leaky** — login redirect context is lost; "decline" is a no-op |
| J7 | Customer-facing storefront (buy from a store) | End consumer | **Demo-grade only** — static catalog, checkout = WhatsApp deep link; no order is ever created in any backend |
| J8 | Content/CMS editing & publish | Merchant (storefront) / internal team (landing) | **Two unrelated CMS journeys**: runtime CMS in POS (markets-api) and git-based DXP in landing |

The single route table for the whole POS product is `templates/pos-system/src/Routes.tsx` with paths centralized in `src/routePaths.ts`. There is **no** route outside `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/join/:token`, `/organizations/select|new`, and `/dashboard/*`.

---

## J1 — Visitor → signup funnel (landing → app)

### Steps as built
1. Visitor lands on the static marketing SPA (tsuru.jcampos.dev, GitHub Pages; 15 public routes in `landing-client/src/components/Router.tsx` with ES+EN slug aliases).
2. Explores Features / Fairs / Community / Blog / Examples. The Examples page is the only runtime API call in the whole site (`GET {VITE_API_URL}/api/templates?activeOnly=true`, `landing-client/src/pages/Examples.tsx:106-110`), and preview URLs are convention-derived client-side: `https://{name}-example.tsuru.jcampos.dev` (`Examples.tsx:117`).
3. Clicks **Login / Register** in the navbar → hard-coded external links to `https://admin.tsuru.jcampos.dev[/register]` (`landing-client/src/components/layout/navbar.tsx:130-137`, repeated at 226-233 for mobile).
4. Alternatively submits the Contact form.

### Systems touched
Landing SPA (static) → markets-api (templates list only) → **legacy** dashboard app (admin subdomain).

### Friction & dead ends
- **The funnel hands prospects to the wrong app.** Auth/registration was migrated to the POS app (`pos.tsuru.jcampos.dev`, `templates/pos-system/src/pages/Register.tsx` etc.; see memory `project_pos_dashboard_migration.md`), but the landing still routes signups to the old dashboard at `admin.tsuru.jcampos.dev`. Two divergent signup experiences exist depending on entry point.
- The links are hardcoded despite `VITE_APP_URL` being passed as a build secret in `landing-client/.github/workflows/deploy.yml` and read by nothing — config exists, code ignores it.
- **The Contact form sends nothing.** `handleSubmit` awaits a 1-second `setTimeout` then shows success (`landing-client/src/pages/Contact.tsx:24-38`); `settings.json` honestly records `contact.delivery='none'`. A prospect who "contacted sales" was silently dropped.
- Brand confusion in the journey: site is "Tsuru" at tsuru.jcampos.dev, but `src/content/seo.json` still titles pages "Tsuru" at `tsuru.jcampos.dev`, and the app the CTA leads to is branded Tsuru. Three names in one funnel.

---

## J2 — Signup → verification → organization onboarding

### Steps as built (POS app)
1. **Register** (`/register`, `src/pages/Register.tsx`): 2 sub-steps under a 3-macro-step Stepper (Personal info → Verify → Organization). Step 1: first/last name, email, username, optional gender (with "other" free-text). Step 2: password with Cognito-policy zod schema + strength indicator. Submit → Cognito `signUp`.
2. On `needsVerification`, the form stashes **email, username, names, and the plaintext password** in `sessionStorage` (`Register.tsx:139-145`) and navigates to `/verify-email`.
3. **Verify** (`src/pages/VerifyEmail.tsx`): 6-digit OTP, 60-s resend cooldown, specific error handling for `CodeMismatchException`/`ExpiredCodeException`. On success it **auto-logs-in with the stashed password** (`VerifyEmail.tsx:70-73`), calls `completeVerification` to sync the user into markets-api, clears the stash, and navigates straight to `/organizations/new`.
4. **Create organization** (`/organizations/new`, `src/pages/CreateOrganization.tsx`): 3-step wizard.
   - Step 1 (name/slug/subdomain): slug auto-generated from name, debounced availability check (`checkSlugAvailable`), subdomain preview `{slug}.tsuru.jcampos.dev`. "Next" **creates the org immediately** (markets-api `POST /organizations`) — the org exists as a draft from step 1.
   - Step 2 (contact email/phone/address, all optional) → `onboarding/step2`.
   - Step 3 (theme/template gallery from local `THEME_LIST`) → confirm modal → `onboarding/step3` (clones template content, `includeCategories: true`) + `useUpdateOrgTheme` + live `setThemeId` so the shell repaints (`CreateOrganization.tsx:202-228`).
5. **Resume path:** `SelectOrganization` shows incomplete orgs (`onboarding_step < 3`) with a "Draft / continue setup" badge; clicking stores `resumeOrgId` and the wizard re-hydrates name/slug/contact/theme and jumps to the right step (`CreateOrganization.tsx:79-108`, `SelectOrganization.tsx:41-47`). Well-executed.
6. **Select organization** (`/organizations/select`): auto-enters when exactly one fully-onboarded org exists; otherwise lists orgs; selection writes `sessionStorage['selectedOrgId']`.

### Systems touched
Cognito (signUp/confirm/signIn) → markets-api (`/verify-email-complete`, org create + onboarding step2/step3, theme) → POS shell theming.

### Friction & dead ends
- **Hard dead end for cashiers:** both `SelectOrganization.tsx:32,50` and `CreateOrganization.tsx:224` do `navigate(role === "cajero" ? "/pos" : ROUTES.DASHBOARD)` — but **no `/pos` route exists in `Routes.tsx`**. A user whose role is `cajero` lands on a blank screen (wouter `Switch` matches nothing). `ReportePage.tsx:113` has the same broken `window.location.href = "/pos"` link. The CLAUDE.md-documented standalone cashier flow (`/pos/setup`, `/pos/opening`, `/pos/payment`, `/pos/success`) is **unrouted doc fiction**; of its four screens only `SessionSetupScreen` is reachable (embedded in `POSIntegratedPage.tsx:22,205`) — `PaymentScreen.tsx`, `SuccessScreen.tsx`, `InventoryOpening.tsx` in `src/pages/pos/` are imported by nothing (dead code, confirmed by grep).
- **Plaintext password in sessionStorage** to enable auto-login after OTP (`Register.tsx:140`; `Login.tsx:48-52` does the same for unconfirmed users). Convenient UX, real security smell (XSS-readable, survives the page session).
- The macro-Stepper promises "Organization" as step 3 of registration, but org creation only happens if the user follows the happy path; a user who closes the tab after verification logs in later and is dropped at `/organizations/select` with an empty state + "create" CTA (`SelectOrganization.tsx:65-80`) — recoverable, but the stepper continuity is lost.
- Role gating is cosmetic: `DASHBOARD_ROLES = ["gerente","supervisor","customer","cajero"]` (`Routes.tsx:49`) includes `customer` — the markets-api default role for every freshly synced Cognito user — so the role check excludes nobody in practice.
- `selectedOrgId` lives in **sessionStorage**, so multi-org users re-pick their org in every new tab/browser session; org selection does not survive a restart.

---

## J3 — Merchant daily POS flow (sale → invoice → Hacienda → notification)

### Steps as built
1. **Shift setup:** `/dashboard/pos` (`POSIntegratedPage.tsx:203-206`) — if the zustand `sessionContext` has no branch/terminal, `SessionSetupScreen` renders: pick a station (branch, lazily fetched from cross-app-be `GET /branches?search=status:1`), pick or **create a terminal inline** (drawer with name/code/device-id, `SessionSetupScreen.tsx:61-88`), then "Start shift" — which only writes the zustand store (`setSession`), no server-side shift/assignment is created here.
2. **Build the cart:** product grid (products from cross-app-be), per-line editing through `LineDetailDrawer` (taxes/discounts/CABYS resolved against data-api catalogs; the Hacienda tax/discount engines run client-side — `src/services/taxCalculationService.ts`, `discountCalculationService.ts`).
3. **Attach a client (optional):** client search tab (cross-app-be `/clients`), or edit a one-off receiver via `ClientDrawerForm` in `mode="receiver"`.
4. **Checkout** (`CheckoutDrawer.tsx`): accordion sections — Payment (multiple payment lines incl. SINPE type `06`), Receiver (required for all doc types except Tiquete `04`), Document (sale condition, activity code, currency w/ exchange-rate conversion in `useCartFlow.ts:72-78`), References (required for NC/ND), Copy emails. Validation: fully paid, receiver present, references present (`CheckoutDrawer.tsx:116-120`).
5. **Confirm** → `useCartFlow.handleConfirmPayment` (`useCartFlow.ts:168-294`):
   - builds the canonical Hacienda v4.4 `DocumentDTO`,
   - **persists to IndexedDB first** (`db.sales.add`, offline resilience),
   - decrements local inventory,
   - `POST` to sales-api (`salesOrgPath(orgId)`); on network failure registers Background Sync (`sw.js` replays later),
   - on success marks synced, clears cart, closes the originating document tab (`POSIntegratedPage.tsx:182-184`).
6. **Server side (sales-api / biller-apps/auth):** the POST synchronously allocates the consecutive, builds + XAdES-signs XML, and submits to Hacienda ATV inside the request; async SQS chain then polls validation → generates PDF → sends email/webhook notification (`app/sales-api/src/services/sales_pipeline.py`, `cloudformation/hacienda-messaging.yml`).
7. **Aftermath in the UI** (J4): the document appears in `/dashboard/documents` where the merchant watches validation status and gets the PDF/XML once Hacienda accepts (or rejects).

### Systems touched
POS SPA → IndexedDB/service-worker → sales-api (sale + signing + ATV submit) → Hacienda ATV → SQS chain (validator → PDF → notification via SES/webhook) → data-api (catalogs) → cross-app-be (products, clients, branches/terminals).

### Friction & dead ends
- **The day cannot be closed.** `src/components/pos/ClosingFlow.tsx` (450 lines: expected-vs-declared cash/SINPE/card, `POST /closings` to cross-app-be at line 82) is **imported by nothing** — dead code. The backend closing/reconciliation feature (cross-app-be `closing_service.py`, manager approval) has no reachable UI. The daily journey ends with sales hanging open; reconciliation must happen out-of-band.
- "Start shift" is purely local. No server assignment/session is opened from this screen, yet checkout requires `assignment.assignment_id` from `useAssignment()` (`POSIntegratedPage.tsx:164`) — a cashier with no server-side assignment hits `checkout.error.sessionIncomplete` at the very end of the flow rather than at setup. Late-failing validation = abandoned carts.
- **Hardcoded fiscal default:** `DEFAULT_DOC_DATA.activity_code = '722000'` (`CheckoutDrawer.tsx:48`) instead of deriving from the org's registered economic activities (J5 captures them in fiscal info). Wrong-activity invoices are one tap away for any org that isn't a restaurant-like activity.
- Latency coupling: the sale POST waits on XML signing + a synchronous call to a government service (sales-api design); on slow ATV days the cashier stares at a spinner — the offline path only triggers on hard network failure, not on slow upstream.
- Offline replay auth is shaky: `SaleRecord` carries an unused `token` field; the service-worker replays the stored payload to `syncUrl` with whatever auth it can muster — replay after token expiry is unaudited (POS discovery finding, `src/lib/db.ts`, `public/sw.js`).
- Cart price math duplicates the backend engines (acknowledged dual-maintenance risk, `CALCULATION_AUDIT.md`); the summary is sent as a "hint" and the BE recomputes (`useCartFlow.ts:233-242`) — good design, but any drift surfaces to the user as a mismatch between the screen total and the legal invoice.

---

## J4 — Document (invoice) management

### Steps as built
1. `/dashboard/documents` (`DocumentsPage.tsx`): persistent container; list view vs editor decided by URL (`/dashboard/documents/new/:tabId`). Multi-tab editor state lives in `documentStore` (zustand); stale tab ids redirect back to the list (`DocumentsPage.tsx:47-58`).
2. New documents (FE/TE/NC/ND/…) are created via `NewDocumentButton` → a document tab → the same `POSIntegratedPage` embedded as editor body (per-tab cart, client, receiver — `POSIntegratedPage.tsx:64-99`).
3. From the list, each document opens `DocumentActionModal` with tabs: **Ver PDF** (iframe of `pdf_url`), **Descargar** (PDF/XML/JSON links), **Validación** (Hacienda + receiver validation status blocks), **Reenviar correo** (extra recipient emails → `useResendNotification`), and for *received* documents **Aceptar/Parcial/Rechazar** with a required rejection message (`DocumentActionModal.tsx:37-181`).
4. Until Hacienda validates, PDF/download views show a "Pendiente de validación Hacienda" placeholder (`DocumentActionModal.tsx:188-196`) — the user waits and re-opens.

### Friction
- **The whole modal is hardcoded Spanish** (`VIEW_LABELS`, every helper string in `DocumentActionModal.tsx:11-17,115,147,168`), violating the repo's own hard i18n rule (CLAUDE.md §10). An EN-mode user gets a mixed-language surface in the most legally sensitive screen.
- No push/refresh affordance for validation: status updates only on modal re-open/query refetch; the merchant polls by hand while the backend SQS chain works.
- `xml/regenerate` and parts of notification resend are acknowledged stubs server-side (`app/sales-api/src/controllers/sale_controller.py`) — the UI offers actions whose backend is "v1: stub".

---

## J5 — Organization configuration (fiscal, certificates, members, branding)

### Steps as built
1. **Settings hub** `/dashboard/organization` (`OrgSettingsPage.tsx`): deliberately staged —
   - while queries resolve → spinner (anti-flicker logic documented at lines 43-55);
   - **no fiscal info yet → a "welcome ghost" takes over the page** ("Comenzar" → inline `FiscalInfoStepper`); the settings cards stay hidden until the Hacienda taxpayer profile is saved (`OrgSettingsPage.tsx:66-103`). A real guided-onboarding pattern.
   - configured → card grid linking to Fiscal info / Hacienda credentials / Notifications.
2. **Fiscal info** `/dashboard/organization/fiscal-info` (`OrgRegisteredOrgPage.tsx`): empty → `FiscalInfoStepper`; configured → `FiscalInfoSummaryCard` + edit drawer. Data = registered_organizations on the sales-api gateway (`useRegisteredOrganization`).
3. **Hacienda credentials** `/dashboard/organization/hacienda` (`OrgHaciendaPage.tsx`): first-time → `HaciendaCredentialsStepper` (ATV username/password, P12 signing certificate + PIN); after → summary tab + `HaciendaConfigDrawer`. Backed by `useOrgConfigurations` → sales-api auth lambda (root-mounted, no `/api` prefix — `src/lib/api.ts` `authOrgPath`).
4. **Notifications** `/dashboard/organization/notifications`; **theme/branding/general/contact/payment/shipping** sub-pages hit markets-api settings categories (`orgSettingsPath`, singular path shape).
5. **Members & roles** `/dashboard/members` (`MembersPage.tsx`): list with search + client-side pagination; invite drawer (email + role from markets-api `GET /rbac/roles`, `MembersPage.tsx:71-78`); pending invitations with resend/cancel; remove member (confirm modal → `DELETE` membership using the *member's* userId as path subject, `MembersPage.tsx:149-156`).

### Systems touched
markets-api (org, settings categories, members/invitations/RBAC, SES invite emails) + sales-api auth lambda (fiscal profile, ATV credentials, certificate, notification settings) — **one user journey, two backends with different path conventions**.

### Friction & risks
- The fiscal journey collects the org's **economic activities**, but J3's checkout ignores them (hardcoded `722000`) — the two halves of the fiscal setup→use journey don't meet.
- The certificate/credentials a user uploads in step 3 are stored **as raw bytes/plaintext in Postgres and returned by GET** (`app/organization-configurations/src/models/organization_configuration.py`; biller-apps/auth discovery) — the UX implies vault-grade handling ("credentials" stepper), the system doesn't deliver it.
- Role choice in the invite drawer is only as good as RBAC seeding, and **no backend enforces roles at all** (markets-api: `middleware/permissions.ts` never mounted; cross-app-be: no membership check) — the members/roles journey *manages* permissions that nothing checks. Combined with the missing API-Gateway userId↔JWT matching (server discovery), member "removal" and invites are honor-system security.
- Settings sprawl: payment/shipping/branding pages are storefront-era leftovers from the dashboard migration; for a POS/e-invoicing merchant they are noise on the critical path to fiscal compliance.
- Two org-path shapes on markets-api (`/memberships/organization/{o}` vs singular `/organization/{o}`) are a documented 404 trap (`src/lib/api.ts` comments) — invisible to users until a feature silently fails.

---

## J6 — Team invitation → join

### Steps as built
1. Owner invites (J5) → SES email with link to `/join/:token`.
2. `/join/:token` (`AcceptInvitation.tsx`): fetches invitation by token (public endpoint), validates expiry/status.
3. **Unauthenticated visitor** → card with "Sign in" / "Create account" buttons carrying `?redirect=/join/{token}` (`AcceptInvitation.tsx:119,127`).
4. **Authenticated** → details card (org, role, email); accept disabled on **email mismatch** with a warning (`AcceptInvitation.tsx:187-257`); accept → `POST /api/invitations/accept/{token}` → success card → auto-redirect to `/organizations/select` after 2 s.

### Friction & dead ends
- **The redirect contract is broken on both ends.** `Login.tsx` never reads the `?redirect=` query param — after login it always navigates to `SELECT_ORG` (`Login.tsx:42-46`); `Register.tsx` ignores it too. Likewise `RequireAuth` stores `sessionStorage["redirectAfterLogin"]` (`Routes.tsx:72`) that **no code ever reads** (grep: only the write site exists). An invited user who signs in must re-find the invite email and click the link again — the most common team-join path silently drops its context.
- **"Decline" doesn't decline** — it just navigates to `/organizations/select` (`AcceptInvitation.tsx:262-267`); the invitation stays pending forever from the owner's perspective (until expiry), polluting the pending list in J5.
- Email mismatch is a hard block with no remedy offered (no "log out and sign in as {email}" action) — correct safety behavior, dead-endy presentation.

---

## J7 — Customer-facing store journey (legacy storefronts)

### Steps as built
1. Consumer reaches a storefront — either a demo (`{template}-example.tsuru.jcampos.dev`, 8-9 Vite template apps under `templates/`) or, in theory, an org's own subdomain provisioned by the infra microservice.
2. Browses Home/Products/ProductDetail/Deals (e.g. `templates/tsuru-demo/src/pages/`), adds to a zustand cart.
3. **Checkout** (`templates/tsuru-demo/src/components/cart/checkout-modal.tsx`): name, phone, CR province/canton/district cascade **from a client-side static dataset** (`@/data/locations`), delivery method → builds a WhatsApp message and `window.open("https://wa.me/{phone}?text=…")` (`checkout-modal.tsx:144-145`). Cart cleared, done.

### Reality check
- **No order is ever created in any backend.** cross-app-be "orders" are wholesale POs ingested from Excel (`app/services/excel_parser.py`), not storefront orders; markets-api has no order endpoints at all. The end-to-end "e-commerce platform" customer journey terminates in a WhatsApp chat.
- The demo template doesn't fetch runtime CMS content (no `by-subdomain`/`/api/public` calls found in `tsuru-demo/src`) — catalog/content are bundled, so the CMS-edit→storefront-update loop (J8) is not demonstrably closed for these templates.
- The publish pipeline behind "your store is live" is largely simulated server-side: publish uploads a `config.json` and immediately marks success (`server/src/services/DeploymentService.ts:58-88`).
- **Verdict:** J7 is a demo/sales artifact, not a live consumer journey. The real revenue journeys today are J3/J4 (POS + e-invoicing) and the cross-docking ops flows (Excel-driven, no SPA journey of their own beyond Orders/Confirmations pages in the POS dashboard).

---

## J8 — Content/CMS editing & publish

Two unrelated journeys share the word "CMS":

### J8a — Merchant storefront CMS (POS app, runtime-backed)
1. `/dashboard/content` (`ContentPage.tsx`): page cards (from markets-api `pages` with sections/content) → drawer per page → accordion of sections (`SectionWrapper` + `BaseSectionEditor`) → per-section save (`saveContent.mutate`, bulk-update shape, `ContentPage.tsx:119-125`).
2. Section reorder buttons exist but are **client-side display order only** — `moveSection` mutates local state and the new order is never persisted (`ContentPage.tsx:128-137`); reorder work is lost on reload. Misleading affordance.
3. "History" button → `/dashboard/deployments` (`DeploymentsPage.tsx`): Pending tab shows the accumulated pre-deployment, **Publish** → markets-api publish → switches to History tab with 5-s polling. Inline banners instead of toasts.
4. Adjacent: `/dashboard/gallery` (media via sales-api auth lambda presigned uploads) and `/dashboard/templates` (template gallery).
5. Downstream, publish = `config.json` upload + SNS re-provision nudge (see J7) — the merchant sees "Deployment successful" for a pipeline that doesn't build anything.

### J8b — Landing DXP (internal, git-backed, dev-only)
1. Editor runs the site locally (`pnpm dev`), opens `/admin/*` (26 editor pages; gated by compile-time `ADMIN_ENABLED`, `landing-client/src/lib/admin-enabled.ts` — no auth, tree-shaken from prod).
2. Edits bilingual JSON entities (Zustand slices, dirty-tracking) → saves via Vite dev middleware `POST /__local/content` → **Publish = `git add/commit/push`** (`landing-client/plugins/local-cms.ts`) → GitHub Pages deploy.
3. Friction: developer-only journey by design (a non-technical marketer cannot publish); prerender route list and inventory graph require manual sync (`scripts/prerender.mjs:26-42`).

The third CMS copy — the old dashboard app's content editor — still exists at `admin.tsuru.jcampos.dev` (J1 sends users there), making **three content-editing surfaces** with different storage models.

---

## Cross-journey friction summary (ranked)

| # | Issue | Journey | Evidence | Severity |
|---|-------|---------|----------|----------|
| 1 | `cajero` role routed to nonexistent `/pos` → blank screen; standalone cashier screens are unrouted dead code | J2/J3 | `SelectOrganization.tsx:32,50`, `CreateOrganization.tsx:224`, `ReportePage.tsx:113`, `Routes.tsx` (no `/pos`), unimported `src/pages/pos/{PaymentScreen,SuccessScreen,InventoryOpening}.tsx` | **Blocker** for the cashier persona |
| 2 | Cash-closing UI (`ClosingFlow.tsx`, `POST /closings`) unmounted — no way to close the day | J3 | `components/pos/ClosingFlow.tsx` defined, zero imports | **High** (compliance/ops gap) |
| 3 | Login/Register ignore `?redirect=` and `redirectAfterLogin` — invitation + deep-link context lost | J6, all auth re-entry | `Login.tsx:42-46`, `Routes.tsx:72` (write-only), `AcceptInvitation.tsx:119,127` | High |
| 4 | Landing CTAs hardcode the legacy dashboard URL; contact form is fake | J1 | `navbar.tsx:130-137`, `Contact.tsx:24-38` | High (top-of-funnel) |
| 5 | Checkout default `activity_code='722000'` ignores the org's registered fiscal activities | J3/J5 | `CheckoutDrawer.tsx:48` | High (fiscal correctness) |
| 6 | Storefront "purchase" = WhatsApp link; no orders exist anywhere; publish pipeline simulated | J7/J8a | `tsuru-demo .../checkout-modal.tsx:144-145`, `DeploymentService.ts:58-88` | High (product-truth) |
| 7 | Plaintext password stashed in sessionStorage for post-OTP auto-login | J2 | `Register.tsx:140`, `Login.tsx:48-52` | Medium-high |
| 8 | Roles/permissions journey manages RBAC that no backend enforces; `customer` default role passes the only FE gate | J5/J2 | `Routes.tsx:49,76-78`; server discovery (permissions middleware unmounted) | Medium-high (security illusion) |
| 9 | Shift "start" is local-only; assignment requirement fails late at payment confirm | J3 | `SessionSetupScreen.tsx:90-105`, `POSIntegratedPage.tsx:163-167` | Medium |
| 10 | `DocumentActionModal` hardcoded Spanish; CMS section reorder not persisted | J4/J8a | `DocumentActionModal.tsx:11-17`, `ContentPage.tsx:128-137` | Medium |
| 11 | Invitation "decline" is a no-op; email-mismatch dead end without remedy | J6 | `AcceptInvitation.tsx:235-268` | Medium |
| 12 | Org/tab selection in sessionStorage (per-tab re-selection); settings split across two backends with trap-prone path shapes | J2/J5 | `useOrganization.ts:75-91`, `src/lib/api.ts` path comments | Low-medium |

## What the journeys reveal about the product

The **only complete, production-credible end-to-end journey** today is the merchant e-invoicing loop: register → verify → create org → guided fiscal setup → sell → sign/submit to Hacienda → manage documents. Everything storefront-shaped that the marketing site sells (templates, stores, deployments, customer checkout) is either demo-grade (J7), simulated (publish), or duplicated legacy (third CMS, old dashboard). The cashier persona — nominally the core POS user — is the one with the hardest dead end (#1) and the missing day-close (#2), suggesting the POS app is currently operated by owner/manager-type users via `/dashboard/pos` rather than dedicated cashier devices.
