# Wire convergence + DTO hardening — live status

> **This is a LIVE working document.** Update it in the same session you change
> anything it describes: flip the status cell, add the commit, and note any
> decision a future reader would otherwise re-litigate. It exists so this
> multi-repo effort can be picked up cold — if a session ends mid-way, start
> here.
>
> It complements `tsuru_roadmap.md` rather than duplicating it: the roadmap
> records *what was decided and why* (TSR-265..269); this records *where the
> work is* and *what is left*.

**Goal.** Every service speaks snake_case on the wire, in both directions, and
no payload crossing a boundary is parsed as an untyped dict.

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
| **§4** | **management-be → snake_case** | 🔶 **in progress** | `management-be` `3d5c78a` |
| §4a | └ response seam | ✅ done | `management-be` `3d5c78a` — 343 call sites, one edit |
| §4b | └ request seam + jsonb opt-out | ✅ done | `management-be` `3d5c78a`, corrected in `327a7cb` — `OPAQUE_KEYS` derived from the 9 real jsonb columns |
| §4c | └ zod request DTOs | ⬜ | — |
| §4d | └ OpenAPI regeneration | ⬜ | — |
| §4e | └ SNS `eventType` attribute + FilterPolicy | ✅ done | `management-be` `327a7cb` + `sales-be` `5987bbf` — fixture pinned both sides |
| §4f | └ `fe/pos-system` mirror types | ⬜ | — |
| §4g | └ `fe/landing` (separate repo) | ⬜ | — |

Deploys are green for everything marked done. `fe/dashboard` is **out of scope**
— see §4 decisions.

---

## 2 · What remains: §4, management-be

The only camelCase backend left. `api.tsuru.jcampos.dev`, its own repo
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
| Runtime validation today | **none** — zod is a dependency, `0` `.parse(`/`.safeParse(` in controllers or services |
| Tests | 6 files / 1741 lines, all mock-based, **no HTTP-level or contract test** |

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

The casing seam makes the wire consistent; it does **not** make the input safe.
This is where "proper DTO definitions instead of `.get` from the JSONs" and the
casing work are the same work.

Add zod schemas per endpoint, `safeParse` → 400. Highest risk first — these are
the sites already carrying hand-rolled hygiene because their authors knew they
were dangerous:

1. `OrganizationController.ts:303,400-405,483,533,633` — whole body into jsonb
2. `RBACController.ts:435-437` — untyped array-or-object union cast to `PermissionGrantDto[]`
3. `MembershipController.ts:282,345,403`, `InvitationController.ts:239,295`
4. CMS: `PageController`, `SectionController`, `SectionContentController`
5. The four `*SettingsController`s, `S3UploadController.ts:44`

Note `src/models/*Schema.ts` already exports drizzle-zod `insertXSchema` objects
that are **defined and never invoked** — start from those where they fit.

### §4d — OpenAPI

104 `@swagger` JSDoc blocks carry ~114 camelCase property lines and regenerate
`api-gateway/template.yml` (6700 lines) on deploy via
`scripts/generate-swagger-spec.cjs` → `scripts/gen_api_template.py`. Either
hand-edit the blocks or transform during generation. **The regenerated spec diff
is the review artifact** — same technique that verified data-be.

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

Both get **real snake_case types**, not a converting client: the POS's sales-be
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

### Risk, stated plainly

management-be has **no automated net**: 6 mock-based test files, no HTTP-level
tests, no fixtures, no contract test, no CI test step. Worse, the existing
assertions are `expect(mockRes.json).toHaveBeenCalledWith(mockOrg)` — identity
against the mocked service return — so they would **not catch a middleware-level
transform at all**.

Mitigations, to be part of the work rather than afterthoughts:
1. the two seams, so the diff is concentrated and reviewable;
2. the compiler on both frontends;
3. the regenerated swagger diff;
4. **one HTTP-level wire-format fixture test** — the equivalent of store-be's
   `tests/local/tests.json`, which is exactly what made the store-be/sales-be
   contract break loudly instead of silently.

---

## 3 · Decisions that must not be re-litigated

| Decision | Why |
|---|---|
| **`fe/dashboard` stays on the old contract** | Retired into the POS (roadmap TSR-091); verified nothing deploys it — no buildspec at the monorepo root, no workflow of its own. ~349 reads saved. |
| **Hacienda's own field names keep their aliases** | `ind-estado`, `respuesta-xml`, `nombreEmisor`, and the Spanish public-API fields (`fecha`, `venta`, `descripcion`). That is their wire, not ours. |
| **HTTP header names keep their aliases** | `x-user-id`, `Idempotency-Key`, `x-organization-id` — they cannot be Python identifiers. |
| **`_type` keeps its alias** | A JSON discriminator, not a data field; a leading underscore cannot be a pydantic attribute name. |
| **No legacy camelCase tolerance** | Removed on request. One language, both directions — no dual-spelling validators, no fallback helpers, no aliases. |
| **ISEBA's `proportion` is NOT a product field** | Derived as `quantity × percentage / 100` by `TaxCalculationService`. The product supplies the inputs; only the line can produce the output. The existing tests caught this being added. |
| **A bare `date` search bound means the whole day** | `HistoricalDocumentRepository.search` reads `date` as `< next midnight` and `datetime` as `<= instant`. Collapsing them silently drops a day of results. |
| **Every product fiscal guard is conditional** | An org that is not registered with Hacienda still needs a catalogue. Pinned by `TestNonFiscalProducts`. |
| **Drizzle property names stay camelCase** | The ORM is already mapping them to snake_case columns; renaming 237 of them is churn that fights the library. |
| **`OPAQUE_KEYS` is derived from the schema, never guessed** | The first version included `data` — the payload key of every paginated response and event envelope — which would have left every row in every list camelCase. The list now mirrors the nine real `jsonb` columns, in both spellings. |
| **`codes`/`discounts`/`taxes` are opaque because they are ALREADY snake_case** | Our own fiscal structures, canonicalized by store-be's `20260521_canonicalize_product_jsonb_keys`. Running `keysToCamel` over them turns `tax_type_id` into `taxTypeId` and corrupts the row. |
| **SNS MessageAttribute names are subscription contract** | `FilterPolicy` keys on them. Rename one side alone and the topic still accepts the message while the consumer's queue silently never matches. |

---

## 4 · Verification

```bash
# POS
cd fe/pos-system && pnpm run check && npx vitest run          # 386 + locales guard

# sales-be
cd be/sales-be && ./.venv/bin/python tests/local/probe_matrix.py            # 80 probes
for d in app/*/; do (cd "$d" && ../../.venv/bin/python -m pytest tests -q); done
./.venv/bin/python -m pytest shared/tests -q                   # incl. cross-repo fixture

# store-be
cd be/store-be && ./.venv-migrate/bin/python -m pytest tests -q -m "not integration"   # 431

# data-be — the 34 specs ARE the contract
cd be/data-be && python3 scripts/gen_api_template.py && git diff --stat swagger/

# management-be (§4)
cd be/management-be && pnpm test && pnpm generate:swagger && git diff --stat swagger/ api-gateway/
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
