# Tsuru Ferias — Technical Architecture

**Date:** 2026-06-11
**Status:** Approved design (user decisions 2026-06-11). Companion to `docs/roadmap/tsuru_fairs_spec.md` (product spec — read it first for lifecycle/tier semantics).
**Hard constraints encoded:** fairs get their OWN backend service; all BE apps share the one Postgres; stands editable from the POS as an independent section; fairs managed from the landing admin (Tsuru admin) connected to the fairs BE (hybrid — public landing stays 100% static); trueque MVP included.

---

## 1. Service decision: a new standalone FastAPI service (`fairs-be`)

**Recommendation: a new standalone FastAPI + Mangum Lambda service following `E:/dev/cross-app-be` conventions exactly**, deployed behind its own API Gateway (`fairs-api.tsuru.jcampos.dev`), reading/writing the shared Postgres.

Why this and not the Express server or cross-app-be:

- **User decision:** "Fairs get their own backend service; all BE apps share the one Postgres."
- **Sibling precedent:** cross-app-be is the house pattern for a new org-scoped service — FastAPI app composed in `app/configuration/fast_api_config.py`, Mangum handler in `app/main.py` (lines 13–21), controller classes that register routes on the app (`app/controllers/branches_controller.py`), `app/services` → `app/repositories` → `app/models` layering, request/response DTOs in `app/dtos`, alembic in-repo, SAM `cloudformation/template.yml` + `api-gateway/template.yml` + `samconfig.toml` + buildspecs, S3 uploads stack (`cloudformation/s3-uploads.yaml`).
- **Scaffolding path:** the `be-builder` skill (standalone mode, "cross-app-be pattern, organization_id scope key") generates this layout; `alembic-setup`, `lambda-sam-setup`, `deploy-api-setup`, `ssm-params-setup`, `codepipeline-setup`, `local-run-setup` (single-service variant), `lambda-local-test` (uni-lambda) cover the rest of the lifecycle.
- **Why not Express (`E:/dev/BeautyMarket/server`):** that server owns identity/org/RBAC (per `docs/roadmap/rbac_express_contract.md`) and is the legacy markets-api; growing a new product domain there deepens the legacy-vs-new duplication the audit flags (`tsuru_architecture_audit.md` finding: "Legacy markets-api still owns identity/org/CMS… without a declared end-state owner per domain, three systems will keep drifting"). Fairs gets a declared owner from day one.
- **Why not cross-app-be:** it is the POS/commerce domain (sessions, sales, Hacienda). Fairs is a different bounded context with a public read surface; mixing them couples deploy cadence and blast radius.

Repo: new `chepelcr/tsuru-fairs-be` (or `fairs-be` folder pending the user's repo-split conventions — `monorepo-folder-split` skill applies if incubated in BeautyMarket first). Naming below assumes service name **`fairs-be`**, API host **`fairs-api.tsuru.jcampos.dev`**.

---

## 2. System context

```
                         ┌──────────────────────────────────────────────┐
                         │              VISITORS (no auth)              │
                         └───────────────┬──────────────────────────────┘
                                         │ HTTPS (public read + beacons)
   landing (static, GH Pages)            ▼
   tsuru.jcampos.dev ── link ──▶ ┌─────────────────────┐
   /ferias page stays JSON DXP   │  FAIRS PUBLIC SPA   │  new Vite SPA
                                 │ ferias.tsuru..  │  S3+CloudFront (§6)
                                 └─────────┬───────────┘
                                           │ public endpoints (no JWT)
┌─────────────────────┐                    ▼
│  POS app (merchant) │ org-scoped  ┌──────────────────────┐   admin endpoints  ┌─────────────────────────┐
│ pos.tsuru..     │────────────▶│      FAIRS BE        │◀──────────────────│  TSURU ADMIN            │
│ new "Ferias" section│  JWT +      │  FastAPI + Mangum    │  Cognito JWT      │  (landing-client/src/   │
│ fairsApi client     │  x-user-id  │  fairs-api.tsuru.. │  platform-admin   │  admin, BE-connected    │
└─────────┬───────────┘             └──────┬───────┬───────┘  group claim      │  "Ferias (online)" grp) │
          │                                │       │                           └─────────────────────────┘
          │ existing APIs                  │       │ presigned uploads
          ▼                                ▼       ▼
┌──────────────────────┐      ┌────────────────┐ ┌─────────────────────┐
│ markets-api (Express)│      │ SHARED POSTGRES│ │ S3 stand-assets     │
│ orgs, users, RBAC    │      │ fairs_* tables │ │ bucket + CloudFront │
│ orders-api(cross-app)│      │ owned by       │ │ (s3-uploads.yaml    │
│ products, categories │      │ fairs-be;      │ │  pattern)           │
│ sales-api (jbiller)  │      │ organizations/ │ └─────────────────────┘
└──────────────────────┘      │ products read- │
                              │ only mappings  │
                              └────────────────┘
```

Integration is via the shared Postgres (read-only mappings) + HTTP — **no new SNS/SQS in v1** (metrics are written synchronously/batched by the BE itself).

---

## 3. Data model (shared Postgres, `fairs-be`-owned)

### 3.1 Shared-DB ownership contract (the audit lesson — read first)

The architecture audit's D4 finding is the direct warning: *"Shared-DB multi-repo schema ownership; cross-app-be mutates platform tables and fabricates orgs (`owner_id='system'`)"* and *"the shared Postgres is the real integration bus… any migration can silently break siblings"* (`docs/audit/tsuru/tsuru_architecture_audit.md`). The fairs service therefore ships with an explicit contract:

| Rule | Detail |
|---|---|
| **Table prefix** | Every fairs-owned table is prefixed `fairs_` (e.g. `fairs_fairs`, `fairs_stands`). Unambiguous ownership at a glance; no name collisions with the three existing alembic/drizzle histories. |
| **Writes** | fairs-be writes ONLY `fairs_*` tables. It NEVER inserts/updates/deletes `organizations`, `products`, `users`, or any platform table. No `_sync_organization`-style fabrication — if an org row is missing, that's a 404/422, never an auto-create. |
| **Reads** | `organizations` and `products` are mapped **read-only** in SQLAlchemy, exactly like cross-app-be does (`app/models/organization.py` docstring: "Existing BeautyMarket columns are mapped read-only so we can access them without breaking anything"). Only the columns needed are mapped. |
| **FKs to platform tables** | `organization_id` columns are plain `String` + index, **no DB-level FK** to `organizations` (matches `app/models/branch.py:19`). Rationale: a DB FK from a fairs table would let a fairs migration/constraint block platform-table operations owned by another repo. Product references likewise store `product_id: String` without FK; staleness is handled at read time (missing product ⇒ slot dropped from the public render). |
| **FKs within the fairs domain** | Real FKs with `ON DELETE CASCADE` between `fairs_*` tables (the domain owns itself). |
| **Migrations** | Alembic lives in the fairs-be repo (own `alembic_version` table name: `alembic_version_fairs`, configurable via `version_table` in `env.py`) so the three existing alembic histories are untouched. Every migration file carries a docstring declaring touched tables (the existing cross-repo mitigation), and `fairs_*`-only is enforceable by review. |
| **Schema doc** | `fairs-be/docs/DB_CONTRACT.md` lists owned tables, read-only mappings, and the no-write rule — the "document the contract" remedy the audit asks for. |

### 3.2 Tables

Conventions per cross-app-be house style: UUID PKs (`UUID(as_uuid=True), default=uuid.uuid4`), `TimestampMixin` (`created_at`/`updated_at`), `StatusMixin` where soft-state applies, `organization_id: String(255)` scope key, composite org-first indexes (`app/models/base.py`, `app/models/branch.py`).

#### `fairs_fairs`
| Column | Type | Notes |
|---|---|---|
| `fair_id` | UUID PK | |
| `slug` | String(100), unique, indexed | public URL key |
| `name` | String(255) | |
| `description_es` / `description_en` | Text / Text nullable | bilingual, ES-first |
| `type` | String(20) | `event` \| `permanent` |
| `status` | String(20), indexed | `draft` \| `published` \| `live` \| `ended` \| `archived` (lifecycle per spec §4) |
| `join_policy` | String(20) | `open` \| `apply` \| `invite` |
| `stand_review_required` | Boolean default false | gate stands through `pending_review` |
| `allow_late_join` | Boolean default true | |
| `cover_image_url` | String(500) nullable | |
| `accent_color` | String(30) nullable | HSL triple string, matching the theme token format |
| `categories` | JSONB | ordered list of zone tags offered by this fair |
| `min_stands_to_publish` | Integer default 6 | empty-hall guard |
| `setup_opens_at` / `starts_at` / `ends_at` | timestamptz nullable | null for permanent |
| `barter_enabled` | Boolean default true | fair-level trueque switch |
| `sort_order` | Integer default 0 | directory ordering |
| `created_by` | String(255) | admin user sub |

#### `fairs_stand_types` — the data-defined catalog (spec §6)
| Column | Type |
|---|---|
| `stand_type_id` | UUID PK |
| `name` | String(50), unique (e.g. `toldo`, `stand`, `galeria`, `pabellon`) |
| `display_name_es` / `display_name_en` | String(100) |
| `tier` | Integer |
| `card_size` | String(10) — `sm`\|`md`\|`lg` |
| `max_gallery_images` / `max_products` | Integer (0 = none, -1 = unlimited/soft-cap in service) |
| `allows_video` / `allows_barter` / `featured_placement` | Boolean |
| `frame_assets` | JSONB — skin asset URLs/keys |
| `sort_priority` | Integer |
| `is_active` | Boolean |

#### `fairs_fair_stand_types` — which types a fair offers (+ caps)
`id` UUID PK · `fair_id` FK→`fairs_fairs` CASCADE · `stand_type_id` FK→`fairs_stand_types` · `max_count` Integer nullable · unique(`fair_id`,`stand_type_id`).

#### `fairs_stand_profiles` — the org's master stand (one per org)
| Column | Type | Notes |
|---|---|---|
| `stand_profile_id` | UUID PK | |
| `organization_id` | String(255), unique, indexed | NO db FK (contract §3.1) |
| `display_name` | String(255) | defaults from org name |
| `slug` | String(100) | defaults from org slug; per-fair URL segment |
| `theme_ref` | String(100) | theme id from the POS registry (`themes.ts` ids: `beauty-essentials`, `artisan-crafts`, …); resolved like `ThemeContext` does: org.theme → org.template_name → default |
| `accent_override` | String(30) nullable | curated-palette HSL triple (Pabellón perk) |
| `logo_url` / `banner_url` | String(500) nullable | logo defaults from org settings/logo |
| `description` | String(280) | content-restraint cap enforced in DTO |
| `whatsapp_number` | String(30) | E.164; the single CTA |
| `links` | JSONB | `{instagram?, facebook?, store_url?}` |
| `default_product_ids` | JSONB | ordered product id list (strings, no FK) |
| `completed_trades_count` | Integer default 0 | trueque trust signal |

#### `fairs_participations`
| Column | Type | Notes |
|---|---|---|
| `participation_id` | UUID PK | |
| `fair_id` | UUID FK→`fairs_fairs` CASCADE, indexed | |
| `organization_id` | String(255), indexed | |
| `status` | String(20), indexed | `applied` \| `approved` \| `rejected` \| `withdrawn` \| `removed` |
| `stand_type_id` | UUID FK→`fairs_stand_types` | chosen tier |
| `applied_at` / `decided_at` | timestamptz | |
| `decided_by` | String(255) nullable | admin sub |
| unique(`fair_id`,`organization_id`) | | one stand per org per fair |

#### `fairs_stands` — per-fair instance (inherits profile, stores overrides)
| Column | Type | Notes |
|---|---|---|
| `stand_id` | UUID PK | |
| `participation_id` | UUID FK→`fairs_participations` CASCADE, unique | 1:1 |
| `fair_id` / `organization_id` | UUID idx / String(255) idx | denormalized for public queries |
| `status` | String(20), indexed | `draft` \| `pending_review` \| `published` \| `hidden` |
| `zone` | String(50) | one of the fair's categories |
| `overrides` | JSONB | sparse: `{display_name?, banner_url?, description?, accent_override?, product_ids?, video_url?}` — null/absent = inherit from profile |
| `sort_order` | Integer default 0 | admin featured ordering |
| `published_at` | timestamptz nullable | |
| `barter_disabled` | Boolean default false | moderation switch |

Effective stand content = `profile ⊕ overrides`, resolved in the service layer (one resolver, reused by public read + preview).

#### `fairs_stand_assets` — fixed gallery slots
`asset_id` UUID PK · `stand_profile_id` FK nullable · `stand_id` FK nullable (exactly one set: profile gallery vs per-fair gallery) · `kind` String(20) (`gallery`|`banner`|`logo`|`frame`) · `url` String(500) · `width`/`height` Integer · `sort_order` Integer · `status` (StatusMixin). Per-type caps enforced in service against `stand_types.max_gallery_images`.

#### `fairs_barter_offers` (spec §9)
| Column | Type | Notes |
|---|---|---|
| `offer_id` | UUID PK | |
| `fair_id` | UUID FK, indexed | offers are fair-scoped (liquidity rule) |
| `stand_id` | UUID FK→`fairs_stands` CASCADE, indexed | |
| `offered_product_ids` | JSONB | 1–3 product ids (catalog-backed, no FK) |
| `wanted_description` | String(280) | "lo que busco a cambio" |
| `wanted_category` | String(50) nullable | structured hint |
| `status` | String(20), indexed | `open` \| `accepted` \| `declined`* \| `expired` \| `cancelled` \| `completed` (*declined applies to proposals; offer returns to `open`) |
| `settlement_type` | String(20) default `'direct'` | v2 mutual-credit forward-compat |
| `expires_at` | timestamptz | fair `ends_at` or +60d (permanent) |
| `accepted_proposal_id` | UUID nullable | |
| `handoff_at` | timestamptz nullable | WhatsApp handoff timestamp |
| `completed_at` | timestamptz nullable | |

#### `fairs_barter_proposals`
`proposal_id` UUID PK · `offer_id` FK CASCADE idx · `proposer_stand_id` FK idx · `proposed_product_ids` JSONB (1–3) · `message` String(280) nullable · `status` String(20) (`proposed`|`accepted`|`declined`|`withdrawn`) · `decided_at` timestamptz.

#### `fairs_reports` — abuse (spec §9.5)
`report_id` UUID PK · `target_kind` String(20) (`offer`|`stand`) · `target_id` UUID idx · `reason` String(30) enum · `detail` String(500) nullable · `reporter_fingerprint` String(64) (hashed IP+UA for rate limiting; no visitor accounts) · `status` String(20) (`open`|`actioned`|`dismissed`) · `actioned_by` nullable.

#### `fairs_stand_metrics_daily` — analytics rollup
`id` UUID PK · `stand_id` FK CASCADE · `fair_id` · `date` Date · `views` / `product_clicks` / `whatsapp_taps` / `gallery_views` / `barter_proposals` Integer · unique(`stand_id`,`date`). Raw beacons land in `fairs_metric_events` (append-only: `event_id`, `stand_id`, `fair_id`, `kind`, `occurred_at`, `fingerprint`) and a scheduled rollup (EventBridge cron → the same Lambda with a rollup route, or a small scheduled handler) aggregates + prunes events older than 7 days. v1 may even roll up synchronously on write with `UPDATE … SET views = views + 1`-style upserts; the events table is the safety valve for dedup/abuse analysis.

### 3.3 Read-only platform mappings (in `fairs-be/app/models/`)

- `Organization` → `organizations`: `id, name, slug, subdomain, logo_url?, settings (jsonb, for theme/logo fallback), template_id, is_active` — mirroring `E:/dev/cross-app-be/app/models/organization.py`. Theme resolution mirrors the POS rule (`templates/pos-system/src/contexts/ThemeContext.tsx:105-112`): explicit org theme → template name → default.
- `Product` → `products`: `id, organization_id, name, description, price, image_url, status, type` — subset of `E:/dev/cross-app-be/app/models/product.py`. Public stand reads join featured `product_ids` against this mapping and silently drop inactive/missing products.

---

## 4. API surface (`fairs-api.tsuru.jcampos.dev`)

Three tiers, mirroring the ecosystem's path conventions (org-scoped `/api/organizations/{organization_id}/…` + `x-user-id` header exactly like cross-app-be controllers, e.g. `branches_controller.py`).

### 4.1 Public — no auth (consumed by the fairs SPA)

```
GET  /api/public/fairs                                  # directory: status in (published|live|ended), paginated
GET  /api/public/fairs/{fair_slug}                      # fair detail + categories + stand-type legend
GET  /api/public/fairs/{fair_slug}/stands               # hall: published stands only; ?zone=&search=&barter=true&page=
GET  /api/public/fairs/{fair_slug}/stands/{stand_slug}  # resolved stand (profile⊕overrides), products, active offers
GET  /api/public/fairs/{fair_slug}/barter-offers        # trueque section of the floor
POST /api/public/metrics                                # beacon batch: [{stand_id, kind, ts}] — rate-limited
POST /api/public/reports                                # report an offer/stand — rate-limited by fingerprint
```

Public endpoints expose ONLY published fairs/stands and never leak org internals (no owner ids, no draft content) — the audit's IDOR criticism (G1/G2) makes the explicit allow-list serializer non-negotiable.

### 4.2 Org-scoped — Cognito JWT (API Gateway authorizer) + `x-user-id` (consumed by the POS)

```
GET    /api/organizations/{org_id}/fairs/available                  # joinable fairs (+ remaining type caps)
GET    /api/organizations/{org_id}/participations                   # my fairs + statuses + completeness
POST   /api/organizations/{org_id}/fairs/{fair_id}/participations   # apply/join {stand_type_id}
DELETE /api/organizations/{org_id}/participations/{id}              # withdraw

GET|PUT /api/organizations/{org_id}/stand-profile                   # master stand (auto-created on first GET from org+theme defaults — fairs_* write only)
GET|PATCH /api/organizations/{org_id}/stands/{stand_id}             # per-fair instance (overrides, zone, type change)
POST   /api/organizations/{org_id}/stands/{stand_id}/publish        # validates minimum-content gate → published|pending_review
POST   /api/organizations/{org_id}/stands/{stand_id}/unpublish
GET    /api/organizations/{org_id}/stands/{stand_id}/preview        # resolved content for the preview modal (§7.3)
POST   /api/organizations/{org_id}/stand-assets/presign             # S3 presigned upload {kind, content_type, target}
POST|DELETE /api/organizations/{org_id}/stand-assets[...]           # register/remove slot assets (cap-enforced)

GET    /api/organizations/{org_id}/stands/{stand_id}/metrics        # daily series + totals

# Trueque
GET    /api/organizations/{org_id}/stands/{stand_id}/barter-offers
POST   /api/organizations/{org_id}/stands/{stand_id}/barter-offers          # type must allow barter; cap 5 active
PATCH  /api/organizations/{org_id}/barter-offers/{offer_id}                 # cancel / mark completed
GET    /api/organizations/{org_id}/barter-offers/{offer_id}/proposals
POST   /api/organizations/{org_id}/fairs/{fair_id}/barter-offers/{offer_id}/proposals   # propose (must own a published stand in the same fair)
POST   /api/organizations/{org_id}/barter-proposals/{proposal_id}/accept    # → returns both prefilled wa.me links, stamps handoff_at
POST   /api/organizations/{org_id}/barter-proposals/{proposal_id}/decline
```

Authorization: API Gateway validates the JWT; the service additionally verifies the caller belongs to `org_id` (membership check via the read-only mapping of the membership table, or the markets-api `GET /api/users/{u}/memberships` as fallback) — fixing, not repeating, the audit's "membership-free authorizer" finding.

### 4.3 Platform-admin — Cognito JWT with `cognito:groups` containing `platform_admin` (consumed by the Tsuru admin)

```
CRUD /api/admin/fairs                          + POST /api/admin/fairs/{id}/publish|end|archive
CRUD /api/admin/stand-types
GET  /api/admin/fairs/{id}/participations      + POST .../{pid}/approve|reject|remove
GET  /api/admin/fairs/{id}/stands?status=pending_review
POST /api/admin/stands/{id}/hide|unhide|approve
PUT  /api/admin/fairs/{id}/stand-order         # featured ordering [stand_id...]
GET  /api/admin/reports?status=open            + POST /api/admin/reports/{id}/action {hide_offer|disable_barter|dismiss}
GET  /api/admin/fairs/{id}/analytics
```

The `platform_admin` group claim is enforced **server-side in a FastAPI dependency** (decode → check groups), never trusted from the client. This aligns with the RBAC workstream's special role (`server/src/middleware/permissions.ts` `platform_admin` semantics).

### 4.4 Swagger

Response examples + spec maintained per the repo's `swagger-setup` conventions (`swagger/` folder like cross-app-be), and `api-gateway/endpoints.json` drives the gateway refresh (`deploy-api-setup` skill pattern).

---

## 5. Backend internals (cross-app-be layout, applied)

```
fairs-be/
├── app/
│   ├── main.py                      # Mangum handler + uvicorn local (copy of cross-app-be shape)
│   ├── configuration/fast_api_config.py
│   ├── controllers/                 # public_fairs_controller, stands_controller, participations_controller,
│   │                                # stand_profile_controller, barter_controller, admin_fairs_controller,
│   │                                # admin_moderation_controller, metrics_controller
│   ├── services/                    # fair_service, participation_service, stand_service (content resolver +
│   │                                # publish gate), stand_type_service, barter_service (state machine +
│   │                                # wa.me builder), metrics_service, moderation_service, theme_service
│   ├── repositories/                # one per aggregate, SQLAlchemy
│   ├── models/                      # fairs_* tables + read-only Organization/Product mappings
│   ├── dtos/{requests,responses,common}/
│   ├── enums/                       # fair_status, stand_status, participation_status, barter_status, report_reason
│   ├── middleware/                  # auth dependency (JWT decode, org membership, admin group)
│   └── exceptions/
├── alembic/  + alembic.ini          # version_table = alembic_version_fairs
├── api-gateway/{template.yml, endpoints.json, samconfig.toml}
├── cloudformation/{template.yml, params.yml, s3-uploads.yaml, codepipeline.yml}
├── swagger/ · tests/ · docs/DB_CONTRACT.md
└── docker-compose.yml · Dockerfile  # local-run-setup single-service pattern
```

Key service rules:
- `stand_service.resolve(stand)` is the single profile⊕overrides resolver used by public reads, org preview, and admin review — one rendering truth.
- `barter_service` owns the state machine; transitions validated server-side; `accept` is transactional (offer `accepted` + proposal `accepted` + sibling proposals auto-`declined` + `handoff_at` stamped) and returns the prefilled `wa.me` payloads for both parties.
- Publish gate (`stand_service.validate_publishable`): logo + (banner or ≥1 gallery image) + description + WhatsApp + zone; returns a checklist payload the POS renders directly.

---

## 6. Public fairs frontend: a new small Vite SPA

**Recommendation: a separate Vite SPA (`tsuru-fairs-client`) deployed to S3 + CloudFront at `ferias.tsuru.jcampos.dev`** (rename to a Tsuru domain rides the existing separate domain workstream — no infra renames now, per the rebrand plan scope).

Why not embed in the landing:
- The landing is contractually **100% static with NO runtime backend** (`landing-client/CLAUDE.md`: "driven entirely by bundled JSON content files with NO runtime backend — it deploys 100% static", deployed on GitHub Pages). A live fairs hall is runtime-API-driven by definition; embedding it breaks the landing's core architectural guarantee and its prerender/SEO model.
- Independent deploy cadence and bundle budget: the fairs SPA must stay lean for low-end Android; the landing carries marketing weight + dev-only admin.
- The landing keeps its role: the static `/ferias` marketing page (content `fairs.json`) links out to the live app — same pattern as landing → POS app links today.

Why not inside the POS app: the POS requires Cognito auth at the shell; visitors must browse with zero auth/JS-weight overhead.

Implementation notes:
- Same stack family (React 18 + Vite + TS + Tailwind + wouter) so POS components/patterns port directly.
- Routes: `/` (directory) · `/feria/:fairSlug` (floor) · `/feria/:fairSlug/:standSlug` (stand). ES default, EN structure-ready (content from the BE is bilingual where applicable).
- Hosting/deploy: reuse the POS frontend pattern — `cloudformation/frontend-site.yml`-style stack + S3 sync + CloudFront invalidation via GitHub Actions OIDC (`gh-actions-aws-deploy` skill; precedent: `templates/pos-system/.github/workflows/deploy.yml` + `scripts/deploy.sh`).
- SEO: fairs/stands are public marketing surfaces → prerender fair directory + fair pages at build is NOT possible (live data); instead serve a small SSR-less approach: dynamic head tags client-side v1, CloudFront function or prerender service in backlog. Acceptable for v1 because discovery is link/WhatsApp-driven.
- Performance budget: card-grid virtualization not needed at MVP scale; lazy-load gallery images (`loading="lazy"`), no video autoplay, thumbnails via S3 + CloudFront with long-cache keys.

---

## 7. Theme inheritance & preview modal

### 7.1 Shared theme token registry

The POS theme registry is the source of truth: `templates/pos-system/src/theme/themes.ts` defines `THEME_TOKENS` (28 CSS-variable names), `ThemeDef` (id, fonts, radius, light/dark HSL maps) and `THEMES` for the 8 store templates + defaults. The fairs SPA **vendors a copy of this registry** (extract to a tiny shared package `@tsuru/themes` when the repo-split tooling allows; until then a synced copy with a header comment pointing at the canonical file — same approach the registry itself took from the template configs, per its own docstring "Source of truth for each template's palette is that template's tailwind.config + index.css").

### 7.2 Default resolution (server-side)

When `fairs-be` auto-creates a stand profile it resolves `theme_ref` the same way `ThemeContext.tsx` does (lines 105–112): org explicit theme (`organizations.settings`/`theme` field the POS PATCHes via `useUpdateOrgTheme`, `templates/pos-system/src/hooks/useOrganization.ts:251-259`) → org `template_id`/template name → `DEFAULT_THEME_ID`. Logo defaults from org settings (`server/src/entities/Organization.ts` `OrganizationSettings.theme.logoUrl`). The profile stores the **resolved id**, so later org-theme changes don't silently restyle live stands (merchant can re-sync from the editor with one button: "Usar el tema de mi tienda").

### 7.3 Scoped application + preview data flow

- **Public SPA:** stand page/card components apply the theme **scoped to a container**, not `:root` (unlike the POS `applyTheme` which styles the whole app — `ThemeContext.tsx:76-91`): a `<StandThemeScope themeId accentOverride>` wrapper sets the same `--token` variables via inline style on a wrapper div; all stand components use the standard `hsl(var(--token))` Tailwind classes beneath it. Light mode default; dark follows the visitor's `prefers-color-scheme` using the theme's `dark` map.
- **Stand rendering components** (`StandCard`, `StandPage` sections) live in the fairs SPA and are **mirrored into the POS** for the preview modal (vendored copy or shared package, same policy as the token registry).
- **Preview modal flow (POS):**

```
Stand editor state (unsaved, in React)
   └─ mapped to the same ResolvedStand shape the public API returns
       (local merge: profile ⊕ overrides ⊕ unsaved edits — no server round-trip needed;
        GET /stands/{id}/preview exists for parity/QA)
   └─ <PreviewModal>
        tabs: "Mi stand" → <StandPage data={resolved}/>   |   "En la feria" → <StandCard data={resolved}/>
        viewport toggle: mobile(default 390px frame)/desktop — CSS container width, not iframe
        wrapped in <StandThemeScope> so POS chrome keeps its own theme while the
        preview shows the stand's inherited template theme
```

This satisfies the decision's "preview modal" + "defaults to the org's store template theme" with zero duplicate styling systems — the same 28-token contract everywhere.

---

## 8. Tsuru admin integration (hybrid model)

- **What stays:** the public landing remains static JSON DXP; `fairs.json` remains the marketing page entity (rebrand plan updates its copy).
- **What changes:** the admin (`landing-client/src/admin/`) gains a new sidebar group **"Ferias (online)"** of BE-connected pages. The manifest already models API-backed pages with `online: true` (read-only Templates precedent — `src/admin/manifest.ts:15-30,128-133`); fairs pages extend this to read-write: same `PAGES[]` rows (`online: true`, group `"platform"` or a new `"fairs"` `AdminGroup`), pages under `src/admin/pages/fairs/`, React Query against `VITE_FAIRS_API_URL`, **no entry in `VERSION_FILES`/content versions** (they are not file-backed entities — exactly how Templates is excluded today).
- **Auth prerequisite (load-bearing):** the admin currently has *no authentication* and is dev-only via the tree-shake gate (`landing-client/CLAUDE.md` "Admin tree-shake gate"). BE-connected **write** sections require: (a) Cognito login in the admin app (Amplify is already a dependency — `src/lib/amplify.ts` configures when IDs are present), restricted to users in the `platform_admin` Cognito group; (b) the fairs BE enforcing the group claim on every `/api/admin/*` request (§4.3) so the client gate is UX, not security. Until the admin ships auth, fairs admin pages run in the dev-only admin exactly like the rest (acceptable: it never reaches production builds), with the BE still requiring a real admin JWT — the developer logs in via a small Cognito login panel inside the fairs pages.
- This keeps the user's hybrid rule clean: static public site, BE-connected admin sections only.

### POS client wiring

Per POS conventions (`templates/pos-system/CLAUDE.md` §2): add a fourth API helper in `src/lib/api.ts` — `fairsApi` with base `VITE_FAIRS_API_URL` (default `https://fairs-api.tsuru.jcampos.dev`) and `fairsOrgPath(orgId, endpoint)` → `/api/organizations/{o}{e}`, injecting the same Bearer token + `x-user-id` header as `crossAppApi`. Hooks in `src/hooks/useFairs.ts` (query keys `["fairs", orgId, ...]`), services-free (thin fetch hooks like `useClients`), pages per spec §7.1, nav item in `DashboardSidebar.tsx` `NAV_ITEMS`, all strings through `t()` (ES+EN) in `LanguageContext.tsx` under a new `fairs.*` namespace.

---

## 9. Assets: S3 for stand images

- Dedicated bucket `tsuru-{env}-fairs-assets` via the `s3-uploads.yaml` pattern already in cross-app-be (`E:/dev/cross-app-be/cloudformation/s3-uploads.yaml`), fronted by CloudFront, long-cache immutable keys (`stand-assets/{org_id}/{uuid}.webp`).
- Upload flow: POS asks `POST /stand-assets/presign` → fairs-be validates kind/size/content-type + per-type caps → presigned PUT → client uploads (after client-side crop to slot spec: logo 200×200, banner 1200×400, gallery 4:3) → `POST /stand-assets` registers the row. The BE never proxies bytes (Lambda payload limits + cost).
- Frame/skin assets (`stand_types.frame_assets`) are admin-uploaded to the same bucket under `frames/`.

---

## 10. Key sequence flows

**Visitor browse (anonymous):**
```
SPA → GET /api/public/fairs → directory
    → GET /api/public/fairs/navidad-2026 + /stands?zone=belleza → floor cards (theme-scoped)
    → GET /stands/{standSlug} → stand page (resolved content + products + offers)
    → tap WhatsApp → navigator opens wa.me → SPA fires POST /api/public/metrics [{kind:"whatsapp_tap"}] (sendBeacon)
```

**Merchant joins + publishes (POS):**
```
POS → GET /fairs/available → POST /fairs/{id}/participations {stand_type_id}
    → (open policy) participation approved; stand auto-drafted from profile (theme/logo/products resolved server-side)
    → editor PATCHes overrides; presign+upload gallery; preview modal renders locally
    → POST /stands/{id}/publish → gate validated → published (or pending_review)
```

**Trueque accept + handoff:**
```
Stand B: POST /fairs/{f}/barter-offers/{o}/proposals
Stand A (POS Trueque tab): POST /barter-proposals/{p}/accept
   fairs-be TX: offer=accepted, proposal=accepted, siblings=declined, handoff_at=now
   ← { wa_link_a, wa_link_b }  (prefilled: fair, both stands, offered/proposed product names)
Either side later: PATCH /barter-offers/{o} {status:"completed"} → profile.completed_trades_count++
Cron/rollup: offers past expires_at → expired
```

---

## 11. Build order (suggested milestones)

1. **M1 — Service skeleton + schema:** scaffold via `be-builder` (standalone) + `alembic-setup`; `fairs_*` tables + read-only mappings; `DB_CONTRACT.md`; local run + lambda-local tests.
2. **M2 — Admin vertical:** admin endpoints + Tsuru admin "Ferias (online)" pages (fairs CRUD, stand types, dev-mode Cognito login panel). Seed the 4 stand types + 1 permanent fair.
3. **M3 — Merchant vertical:** org-scoped endpoints + POS Ferias section (join, profile/stand editor, presigned uploads, publish gate, preview modal).
4. **M4 — Public vertical:** fairs SPA (directory/floor/stand, theme scope, WhatsApp CTA, metrics beacons) + S3/CloudFront/Route53 deploy + api-gateway stack.
5. **M5 — Trueque:** offers/proposals/accept/handoff, trueque filter + badge, reports + moderation queue, expiry job.
6. **M6 — Hardening:** metrics rollup, fair analytics, rate limiting on public POSTs, landing `/ferias` copy flip to live links (rebrand-plan coordinated).

---

## 12. Security checklist (audit-informed)

- Public serializers are allow-lists; drafts/hidden/org-internals never serialized (audit G1/G2 IDOR lesson).
- Org-scoped routes verify membership server-side — not just JWT validity (audit "membership-free authorizers").
- Admin routes verify the `platform_admin` group claim in the service, not the gateway alone.
- Public POSTs (`/metrics`, `/reports`) rate-limited per fingerprint + API Gateway throttling; bodies size-capped.
- No secrets in repo; DB creds via the shared Secrets Manager secret `tsuru/{env}/database` + SSM params (`shared-db-secrets` pattern), per CLAUDE.md security rules.
- fairs-be never writes platform tables (contract §3.1) — reviewed per migration.
- wa.me links are server-built from validated E.164 numbers; user text URL-encoded (no injection into the prefilled message).
