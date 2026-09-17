# Wire convergence + DTO hardening — live status

> **This is a LIVE working document.** Update it in the same session you change
> anything it describes: flip the status cell, add the commit, and note any
> decision a future reader would otherwise re-litigate. It exists so this
> multi-repo effort can be picked up cold — if a session ends mid-way, start
> here.
>
> It complements `tsuru_roadmap.md` rather than duplicating it: the roadmap
> records *what was decided and why* (TSR-265..274); this records *where the
> work is* and *what is left*.

**Goal.** Every service speaks snake_case on the wire, in both directions; no
payload crossing a boundary is parsed as an untyped dict; and every HTTP error
uses the same safe, catalog-backed DTO.

---

## 1 · Status at a glance

| # | Area | Status | Repo / commit |
|---|---|---|---|
| §1 | POS types → sales-be wire | ✅ done | `pos-system` `45488c4`, `67a0bc6`, `6d3e1bb` |
| §2 | store-be camelCase leaks | ✅ done | `store-be` `8ccb711` |
| §3 | data-be `by_alias` + 12 fields | ✅ done | `data-be` `988ae4b` |
| §5 | sales-be raw-dict DTOs (F1–F6) | ✅ done | `sales-be` `454da7c`, `dc6a0fb`, `6d6ff83`, `87831c3` |
| §6 | Pacific fiscal test matrix | ✅ done | 3 documents ACCEPTED (…0002/0003/0004) |
| — | Product save-time validation | ✅ done | `store-be` `3ebd6a4` |
| **§4** | **management-be → snake_case** | ✅ **done** | `management-be` `4e83294`, `pos-system` `e7722ef`, `landing` `06a07ee` |
| §4a | └ response seam | ✅ done | `management-be` `3d5c78a` — 343 call sites, one edit |
| §4b | └ request seam + jsonb opt-out | ✅ done | `management-be` `3d5c78a`, `327a7cb`, `4e83294` — strict snake-only input; both root-JSONB route aliases bypass deep conversion |
| §4c | └ zod request DTOs | ✅ done | `management-be` `4e83294` — all mutation bodies + 7 query surfaces; HTTP validation fixtures |
| §4d | └ OpenAPI regeneration | ✅ done | `management-be` `4e83294` — 90 paths / 116 operations / 0 camelCase data or query names |
| §4e | └ SNS `eventType` attribute + FilterPolicy | ✅ done | `management-be` `327a7cb` + `sales-be` `5987bbf` — fixture pinned both sides |
| §4f | └ `fe/pos-system` mirror types | ✅ done | `pos-system` `e7722ef` — type/style check + 386 tests |
| §4g | └ `fe/landing` (separate repo) | ✅ done | `landing` `06a07ee` — typecheck + production build |
| §7 | Common backend error response DTO | ✅ done (code) | management `d95c031`, data `23e48a4`, sales `674ae1f`, store `c369185` — enum-backed exceptions + framework/unhandled normalization |
| §7a | Backend service + error catalogs | ✅ done (code; moved to support-be) | `be/support-be` owns the adopted schema, generated 48-service / 242-error seed and admin resolver; management persistence/routes removed |
| §7b | Support/error/audit event plane | ✅ done (code; manual rollout pending) | new private `tsuru-support-be`; every BE emits SNS request audits and 5xx/errors to filtered SQS queues; durable backend errors send a minimal AppSync hint to the admin-only `/support/platform` channel; POS browser error reporter deleted; admin audit UI added; customer tickets + private image evidence run at `support.tsuru.jcampos.dev` |
| §7c | Dedicated admin identity/API + data editor | ✅ done (code; manual deploy pending) | root `e9e3567`, management `0d3a930`, data `4238cf6`, sales `05690f0` — normal APIs exclude admin writes; root manual gateway + isolated admin Cognito own the control plane |
| §7d | Dashboard/support repo isolation + SSM | ✅ done (code) | private local-only dashboard repo with validation-only CI; root SSM template + reboot loader; support/control-plane deploy remains manual |

Previously committed rows are deployed green. The 2026-09-14 §4 completion is
verified and committed; the new support/audit event plane remains pending manual
rollout. `fe/dashboard` remains **local-only** in its own private repository and
is intentionally used as the platform support/audit console.
Its authentication and API traffic use only the dedicated admin plane; the
normal customer/POS Cognito pool is not a fallback.

---

## 2 · Completed implementation: §4, management-be

This was the only camelCase backend left. `api.tsuru.jcampos.dev`, its own repo
(`chepelcr/tsuru-management-be`), TypeScript + Express 4 + Drizzle on Lambda.

### Why it is the large one

| Surface | Volume |
|---|---|
| `res.json(...)` call sites | **343** (327 in controllers, ~20 endpoints across 20 files) |
| Endpoints | ~116 |
| `req.body` reads | 44 — 12 whole-body pass-throughs, 23 destructurings, 2 whitelist loops |
| `req.query` camelCase params | 7 |
| Drizzle camelCase properties → snake_case columns | **237** across 37 entity files |
| `@swagger` JSDoc blocks | 104, ~114 camelCase property lines |
| Runtime validation now | strict zod DTOs on every mutation body and all 7 query surfaces |
| Tests now | 10 files / 136 tests, including HTTP wire-format and request-validation fixtures |

### §4a — Response seam

**Do not rename the 237 Drizzle properties.** `organizationId: varchar("organization_id")`
is the ORM doing its job; renaming cascades into every repository, service and
the `organizationResponse` mapper for no gain.

`res.json` is **already monkey-patched per request** for logging at
`src/config/ExpressAppConfig.ts:87-91`. Insert a deep camelCase→snake_case key
transform there and all 343 call sites convert in one edit. (Roughly half are
single-word error bodies and are unaffected.) This is the direct analogue of
sales-be's `ResponseUtils.create_response`.

Also:
- `src/types/api.ts` pagination → `{page, page_size, total_elements, total_pages}`,
  which finally matches store-be and data-be. Note it is currently imported by
  **nothing** — dead types.
- `src/mappers/organizationResponse.ts` is a hand-written DTO, not a Drizzle
  row, so give it snake_case field names directly.

### §4b — Request seam, and the two traps

A mirror-image snake→camel transform right after `express.json()`
(`ExpressAppConfig.ts:30`), covering the 12 whole-body pass-throughs, the 23
destructurings and the 7 `req.query` params (`activeOnly`, `includeContent`,
`isService`, `onSale`, `pageSize`, `isActive`, `includeInactive`).

> ⚠️ **Trap 1 — stored JSON documents.** `Organization.settings` is free-form
> `jsonb`, and `Component` / `SectionContent` store JSON config blobs. A blanket
> deep transform would rewrite keys **inside those documents** on the way in and
> out, silently corrupting stored content. **These need an explicit opt-out list
> in both transforms.** This is the single most important detail in §4.

> ⚠️ **Trap 2 — string-literal whitelists.** `OrganizationController.ts:400-405`
> and `:483` filter `req.body` against arrays of camelCase field-name *strings*.
> The request transform must run **before** them, or those arrays must be
> renamed — otherwise the whitelist silently drops every field and the update
> becomes a no-op that reports success.

### §4c — zod request DTOs

**Implemented 2026-09-14.** `RequestSchemas.ts` contains strict endpoint DTOs;
`validateBody` / `validateQuery` return field-level 400s using public snake_case
paths. Unknown properties and the legacy bare RBAC permission array are
rejected. Empty-body mutations explicitly accept only omitted/`{}` bodies.

The casing seam makes the wire consistent; it does **not** make the input safe.
This is where "proper DTO definitions instead of `.get` from the JSONs" and the
casing work are the same work.

Coverage includes the formerly highest-risk sites:

1. `OrganizationController.ts:303,400-405,483,533,633` — whole body into jsonb
2. `RBACController.ts:435-437` — untyped array-or-object union cast to `PermissionGrantDto[]`
3. `MembershipController.ts:282,345,403`, `InvitationController.ts:239,295`
4. CMS: `PageController`, `SectionController`, `SectionContentController`
5. The four `*SettingsController`s, `S3UploadController.ts:44`

The endpoint DTOs are intentionally narrower than the existing generated
drizzle-zod insert schemas: path-derived ownership/organization fields and
server-managed columns cannot be mass-assigned.

### §4d — OpenAPI

**Implemented 2026-09-14.** Generation rewrites JSON schema properties,
`required` entries, discriminators and query parameter names to snake_case,
then fails if any camelCase data/query name remains. Path-variable and header
names remain unchanged by design. Regeneration produced 90 paths / 116
operations with zero audit failures.

104 `@swagger` JSDoc blocks carry ~114 internal camelCase property lines and
regenerate `api-gateway/template.yml` (6700 lines) on deploy via
`scripts/generate-swagger-spec.cjs` → `scripts/gen_api_template.py`. The chosen
implementation transforms them during generation. **The regenerated spec diff
is the review artifact** — the same technique that verified data-be.

### §4e — The SNS attribute (cross-repo, must move together)

`app/infrastructure-service-provider/template.yaml:137` in **sales-be** has:

```yaml
FilterPolicy:
  eventType:
    - "ORGANIZATION_REGISTERED"
```

and the publisher is **management-be** `src/services/OrganizationEventPublisher.ts:37`:

```ts
MessageAttributes: { eventType: { DataType: 'String', StringValue: event.eventType } }
```

Message-attribute names are part of the **subscription** contract. Rename one
side alone and messages stop flowing silently. Change both in the same change
and deploy sales-be's template with it. (The pdf-generator's attribute was
already renamed — its topic has no filter policy.)

Also convert management-be's own SNS body (`src/events/EventBase.ts:26`
`eventType`) and give its consumers the field name.

### §4f/§4g — The frontends

**Implemented 2026-09-14.** Both consumers now use snake_case API mirror types,
reads, request bodies and query names. The POS migration also corrected the
invitation route family, member-removal body, and management-backed analytics /
inventory payloads; landing corrected the verification route and platform-RBAC
request mappings.

Both use **real snake_case types**, not a converting client: the POS's sales-be
and store-be types are already snake_case, so camelCase platform types are the
odd ones out, and a converter would leave it speaking two casings internally.

The compiler is the safety net — change the mirror type and `tsc` enumerates
every read. That is how the org-settings change was driven safely.

| Consumer | Surface | Order |
|---|---|---|
| `fe/pos-system` | 24 type files / ~3630 lines of mirrors (`types/{organization,cms,rbac,storefront}.ts`), 42 `api.*` call sites | **first** — the platform API is its login + org-membership path, so a break is a total outage and is obvious in seconds |
| `fe/landing` | ~89 reads, separate repo `chepelcr/tsuru-landing` | second |

Nothing couples them at compile time — the POS mirrors are hand-written copies
whose own comments say so (`types/organization.ts:4`, `types/rbac.ts:2`). A
rename therefore surfaces as `undefined`, silently. They must ship in lockstep
with the backend.

### Risk and mitigation

The original management-be suite was mock-only and could not observe a
middleware-level transform. The completed work adds real HTTP fixtures for
snake responses, snake requests, strict rejection of legacy camelCase,
query-key replacement, opaque JSON documents, timestamps, pagination and the
controller whitelist ordering, plus HTTP request-DTO failure cases.

---

## 3 · Decisions that must not be re-litigated

| Decision | Why |
|---|---|
| **`fe/dashboard` stays local-only in a private repo** | It is the platform support/admin/audit console, but the owner explicitly keeps deployment out of this implementation. Its workflow validates only; root SSM supplies runtime config. |
| **The admin API deploys manually from the root repository** | It is a control-plane composition over existing management/data Lambdas, not another backend service. `admin-api/generate_admin_api.py` owns the explicit route allowlist and `pnpm run deploy:admin-api -- <env> <profile>` is the only deployment entry point. |
| **Support/audit/error ingestion is backend-to-SNS, never browser-to-HTTP** | Every backend request emits `AUDIT_REQUEST_COMPLETED`; backend 5xx/unhandled failures additionally emit `BACKEND_ERROR_OCCURRED`. SNS attributes and queue filters are one contract. POS sends only deliberate support ticket actions. |
| **support-be owns support persistence and catalogs** | The standalone Lambda consumes both SQS queues and serves tickets/catalog/admin reads. Its Alembic revision adopts the already-live management 0021/0022 tables without dropping data, then adds `audit_records` and `backend_errors`. |
| **Normal APIs never publish platform-admin writes** | The management generator excludes `/api/admin/**`; the data generator remains GET-only. The dedicated gateway publishes both sets behind the isolated admin pool, and management additionally verifies the pool issuer/client from stage variables. |
| **Data-editor forms are generated from OpenAPI** | Thirty mutable catalog services expose their actual path parameters and request fields; import-only CABYS is not mislabeled as a JSON create form. The manifest regenerates with the gateway so the dashboard does not maintain another hand-written catalog contract. |
| **Error `message` is the catalog code** | Human copy drifts and may leak internals. Resolve by `(service, message)`; numeric legacy codes are service-scoped, while `COMMON_*` falls back to the `common` catalog service. |
| **Unhandled details never go on the public wire** | Stack traces and exception text are logged and sent only through the protected backend error SNS/SQS path. The public DTO contains the stable code and safe validation coordinates. |
| **Hacienda's own field names keep their aliases** | `ind-estado`, `respuesta-xml`, `nombreEmisor`, and the Spanish public-API fields (`fecha`, `venta`, `descripcion`). That is their wire, not ours. |
| **HTTP header names keep their aliases** | `x-user-id`, `Idempotency-Key`, `x-organization-id` — they cannot be Python identifiers. |
| **`_type` keeps its alias** | A JSON discriminator, not a data field; a leading underscore cannot be a pydantic attribute name. |
| **No legacy camelCase tolerance** | Removed on request. One language, both directions — no dual-spelling validators, no fallback helpers, no aliases. |
| **ISEBA's `proportion` is NOT a product field** | Derived as `quantity × percentage / 100` by `TaxCalculationService`. The product supplies the inputs; only the line can produce the output. The existing tests caught this being added. |
| **A bare `date` search bound means the whole day** | `HistoricalDocumentRepository.search` reads `date` as `< next midnight` and `datetime` as `<= instant`. Collapsing them silently drops a day of results. |
| **Every product fiscal guard is conditional** | An org that is not registered with Hacienda still needs a catalogue. Pinned by `TestNonFiscalProducts`. |
| **Drizzle property names stay camelCase** | The ORM is already mapping them to snake_case columns; renaming 237 of them is churn that fights the library. |
| **`OPAQUE_KEYS` is derived from the schema, never guessed** | The first version included `data` — the payload key of every paginated response and event envelope — which would have left every row in every list camelCase. The list now mirrors the nine real `jsonb` columns, in both spellings. |
| **A root JSON document needs a route-level bypass** | `OPAQUE_KEYS` protects values beneath a named key; it cannot protect the body root. Both mounted aliases of `PUT .../organizations/:orgId/settings` bypass request-key inspection/conversion and are pinned by HTTP fixtures. |
| **`codes`/`discounts`/`taxes` are opaque because they are ALREADY snake_case** | Our own fiscal structures, canonicalized by store-be's `20260521_canonicalize_product_jsonb_keys`. Running `keysToCamel` over them turns `tax_type_id` into `taxTypeId` and corrupts the row. |
| **Legacy camelCase requests fail at the seam** | A conversion function naturally leaves an already-camel key unchanged. The seam therefore audits first and returns 400, except inside explicitly opaque caller-owned documents. |
| **OpenAPI transforms data fields, not protocol metadata** | JSON property maps, `required` fields, discriminators and query names are snake_case; OpenAPI keywords, path variables and HTTP header names retain their required spellings. |
| **Theme icon columns use the existing migration** | `loading_icon` and `product_fallback_icon` already exist from migration `0011`; the missing Drizzle mappings and organization response fields were restored, with no new migration. |
| **SNS MessageAttribute names are subscription contract** | `FilterPolicy` keys on them. Rename one side alone and the topic still accepts the message while the consumer's queue silently never matches. |

---

## 4 · Verification

```bash
# POS
cd fe/pos-system && pnpm run check && pnpm exec vitest run   # 386 + locales guard

# sales-be
cd be/sales-be && ./.venv/bin/python tests/local/probe_matrix.py            # 80 probes
for d in app/*/; do (cd "$d" && ../../.venv/bin/python -m pytest tests -q); done
./.venv/bin/python -m pytest shared/tests -q                   # incl. cross-repo fixture

# store-be
cd be/store-be && ./.venv-migrate/bin/python -m pytest tests -q -m "not integration"   # 431

# data-be — the 34 specs ARE the contract
cd be/data-be && python3 scripts/gen_api_template.py && git diff --stat swagger/

# management-be (§4)
cd be/management-be
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vitest run                              # 136
node scripts/generate-swagger-spec.cjs                      # 90 paths, zero camel data/query names
python3 scripts/gen_api_template.py                         # 116 operations

# landing (§4g)
cd fe/landing && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/vite build

# common error catalog/contract (TSR-272)
cd ../..
python3 scripts/generate_backend_error_catalog.py
cd be/management-be && pnpm run check && pnpm test
cd ../data-be && PYTHONPATH=shared python3 -m pytest tests/test_error_contract.py -q
cd ../sales-be && PYTHONPATH=shared python3 -m pytest shared/tests/test_error_contract.py -q
cd ../store-be && python3 -m pytest tests/test_error_contract.py tests/test_observability_events.py -q

# support-be generated boundary + event/control-plane dry run (no AWS mutation)
cd ../support-be
python3 -m pytest -q
python3 <be-builder-skill-root>/tools/be_builder.py \
  validate --spec be-builder.manifest.json --output .
DATABASE_URL=sqlite+pysqlite:///:memory: python3 scripts/gen_api_template.py
bash deploys/deploy-all.sh dev PACIFIC-PROD --plan

# dedicated admin control plane (TSR-274; validates only, does not deploy)
cd ../..
pnpm run generate:admin-api
sam validate --lint --template-file admin-api/admin-cognito.yml
sam validate --lint --template-file admin-api/template.yml
cd fe/dashboard && pnpm run check && pnpm run build
cd ../../be/management-be && pnpm run check && pnpm test
```

Live checks that have proven meaningful:

- every data-api catalog the POS consumes returns **zero camelCase keys**;
- `GET /sales` and the store-be endpoints return snake_case, pagination included;
- **after §4**: POS login + organization switch still work (that path *is* the
  platform API), the org theme still follows the selected organization, and an
  org-settings save round-trips — the settings PUTs are the whole-body-into-jsonb
  endpoints, so they are what proves the opt-out list correct;
- a POS sale still emits end to end, since it crosses all four services.

---

## 5 · Known follow-ups (out of scope, recorded so they are not lost)

- **F7** — `hacienda_authentication_dao.py` returns a bare `(status, dict)` whose
  second element has three different shapes, while `HaciendaTokenResponse`
  already exists unused. The DAO is also duplicated verbatim in two places.
- **F8** — the outbound Hacienda submission payload is built as a dict literal
  with camelCase keys and a conditional key.
- **`_build_document_dict`** — two divergent producers
  (`document-notification/notification_pipeline.py:399`,
  `document-pdf-generator/pdf_pipeline.py:247`) feeding three consumers and the
  Jinja templates; one emits both `trade_name` and `tradeName`.
- **No CI runs tests** in store-be, data-be or management-be. Worth fixing
  independently of this effort.
- **`referenceTypes` doc-vs-catalog discrepancy** — blocks REP support
  (see `sales-be/shared/.../enums/reference_code.py`).
