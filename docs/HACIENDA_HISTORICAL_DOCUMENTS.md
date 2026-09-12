# Hacienda Historical Documents — execution plan

**Status:** Not started. Written 2026-09-11. Roadmap ids: **TSR-253 … TSR-257**, closes **TSR-167**.

**How to use this document.** It is a task list, not a proposal. Every design decision is
already made and recorded in §0 (the frozen contract) and §1 (verified current state). Execute
the tasks in §2 in wave order. Do **not** re-plan, and do not re-derive the contract — if you
find the contract is wrong, stop and report rather than diverging, because six tasks depend
on it agreeing.

Every fact in §1 was verified by reading the code on 2026-09-11. Line numbers may drift.

---

## 0. The frozen contract

### 0.1 Goal

When an organization saves its Hacienda credentials for the first time, fetch everything that
taxpayer has already emitted, so the POS starts with the correct branches, terminals and
consecutive counters instead of guessing, and the operator can see their pre-Tsuru history.
Every document the POS emits and Hacienda subsequently rules on lands in the same table.

### 0.2 Target flow

```
PUT /organizations/{id}/configurations       POST .../historical-documents/sync
        │  (first credentials saved)                   │  (manual / re-run)
        └─────────────────┬─────────────────────────────┘
                          ▼  SQS tsuru-{env}-document-history.fifo
                             {eventType: SAVE_DOCUMENT_HISTORY, data: "<orgId>"}
              ┌──────────────────────────────────────────────┐
              │              hacienda-history                 │
              │  1. taxpayer id + Hacienda token              │
              │  2. page Hacienda's history endpoint          │
              │  3. parse clave → branch/terminal/type/cons.  │
              │  4. UPSERT hacienda_historical_documents      │
              └────────┬───────────────────────────┬─────────┘
        SAVE_BRANCHES  │                           │  VALIDATE_HISTORICAL_DOCUMENT (one per clave)
                       ▼                           ▼
   SNS organization-branches.fifo      SNS hacienda-validation-topic.fifo
                       │                           │
                       ▼                           ▼
             store-be (NEW SQS entry)       document-validator
       branch_sync_service.sync_from_hacienda   validate_historical(clave)
       upsert branches / terminals /                  │
              consecutives                            │ SAVE_HISTORICAL_DOCUMENT
                                                      ▼  (totals, status, issuer, receiver, errors)
                                       SNS historical-documents.fifo   ← closes TSR-167
                                                      │
                                                      ▼
                                        hacienda-history (2nd SQS source)
                                        UPSERT by (organization_id, clave)
                                                      ▲
                                                      │ same event, also emitted for every POS
                                                      │ document reaching ACCEPTED/PARTIAL/REJECTED
                                             document-validator.poll_and_persist
```

One event (`SAVE_HISTORICAL_DOCUMENT`) and one upsert keyed on `(organization_id, clave)` serve
both sources. A swept document gets a skeleton row first and is enriched when the verdict
arrives; a POS document creates its row at verdict time. `hacienda-history` parses the clave in
both cases, so branch/terminal/consecutive derivation lives in exactly one place.

### 0.3 Table `hacienda_historical_documents`

Owned by sales-be. Model at
`be/sales-be/shared/jbiller_common/models/hacienda_historical_document.py`, class
`HaciendaHistoricalDocument`, exported from `jbiller_common/models/__init__.py`.
Copy the style of `hacienda_document_log.py` (UUID pk, timestamp columns spelled out).

| column | type | notes |
|---|---|---|
| `historical_document_id` | `UUID` | pk, `default=uuid.uuid4` |
| `organization_id` | `String(255)` | not null |
| `clave` | `String(50)` | not null |
| `document_type` | `String(2)` | nullable — `01`,`02`,`03`,`04`,`08`,`09` |
| `branch_number` | `Integer` | nullable |
| `terminal_number` | `Integer` | nullable |
| `consecutive_number` | `BigInteger` | nullable |
| `consecutive_key` | `String(20)` | nullable — raw 20-digit segment of the clave |
| `emission_date` | `DateTime(timezone=True)` | nullable |
| `issuer_name` | `String(255)` | nullable |
| `issuer_id_type` | `String(2)` | nullable |
| `issuer_id_number` | `String(20)` | nullable |
| `receiver_name` | `String(255)` | nullable |
| `receiver_id_type` | `String(2)` | nullable |
| `receiver_id_number` | `String(20)` | nullable |
| `total_amount` | `Numeric(18,5)` | nullable |
| `tax_total` | `Numeric(18,5)` | nullable |
| `atv_status` | `Integer` | `AtvStatus`: 0 PROCESSING, 1 ACCEPTED, 2 PARTIAL, 3 REJECTED |
| `atv_validation_date` | `DateTime(timezone=True)` | nullable |
| `atv_errors` | `JSONB` | nullable — `[{"code": str, "message": str}]` |
| `parent_clave` | `String(50)` | nullable — set on NC/ND discovered under a parent |
| `source` | `String(10)` | `HISTORY` or `POS` |
| `sale_id` | `UUID` | nullable — links to `billing_sales.sale_id` when the document is ours |
| `created_on` / `updated_on` / `deleted_on` | `DateTime(timezone=True)` | as in `hacienda_document_log.py` |
| `status` | `Integer` | not null, default 1 |

Constraint: `UNIQUE (organization_id, clave)` named `uq_hacienda_historical_documents_org_clave`.
Indexes: `idx_hacienda_hist_docs_org (organization_id)`,
`idx_hacienda_hist_docs_org_date (organization_id, emission_date)`,
`idx_hacienda_hist_docs_org_type (organization_id, document_type)`.

### 0.4 Repository

`be/sales-be/shared/jbiller_common/hacienda/repositories/historical_document_repository.py`

```
class HistoricalDocumentRepository(BaseRepository[HaciendaHistoricalDocument]):

    def upsert_by_clave(self, organization_id: str, clave: str, **fields) -> HaciendaHistoricalDocument
        # THE ONLY WRITE PATH.
        # MUST NOT overwrite a non-null stored column with None: the skeleton row is
        # written by the sweep and enriched later by the validator's event, and the two
        # carry different subsets of the columns.

    def search(self, organization_id: str, *, document_types=None, branch_number=None,
               terminal_number=None, atv_status=None, search_term=None,
               start_date=None, end_date=None, sort=None, page=0, size=20
              ) -> tuple[list[HaciendaHistoricalDocument], int]
        # returns (rows, total_elements). search_term matches clave, receiver_name,
        # receiver_id_number, issuer_name.
```

Register it in that package's `__init__.py` alongside `branch_repository` etc.

### 0.5 Event codes

In `be/sales-be/shared/jbiller_common/hacienda/dtos/events/document_event.py`, add to
`DocumentEventCode` (leave the existing five members untouched, `VALIDATE_HISTORY_DOCUMENT`
included):

```python
VALIDATE_HISTORICAL_DOCUMENT = "VALIDATE_HISTORICAL_DOCUMENT"
SAVE_HISTORICAL_DOCUMENT     = "SAVE_HISTORICAL_DOCUMENT"
```

`VALIDATE_HISTORICAL_DOCUMENT` reuses the existing `DocumentEvent` envelope
(`data.organizationId` + `data.clave`, `attemptNo` optional).
`MessageDeduplicationId = f"{clave}:VALIDATE_HISTORICAL_DOCUMENT"`.

### 0.6 Event `HistoricalDocumentEvent`

New file `jbiller_common/hacienda/dtos/events/historical_document_event.py`, exported from that
package's `__init__.py`. Extends `EventBase` exactly like `DocumentEvent` does.

```jsonc
{
  "_type": "HistoricalDocumentEvent",
  "eventType": "SAVE_HISTORICAL_DOCUMENT",
  "id": "<uuid4>",
  "occurredAt": "<iso8601>",
  "data": {
    "organizationId": "<required>",
    "clave": "<required>",
    "saleId": null,
    "documentId": null,
    "emissionDate": null,
    "atvStatus": 1,
    "atvValidationDate": "<iso8601|null>",
    "issuerName": null, "issuerIdType": null, "issuerIdNumber": null,
    "receiverName": null, "receiverIdType": null, "receiverIdNumber": null,
    "totalAmount": null, "taxTotal": null,
    "errors": [{"code": "...", "message": "..."}],
    "source": "HISTORY"
  }
}
```

Published with `model_dump_json(by_alias=True, exclude_none=True)`,
`MessageGroupId = organizationId`,
`MessageDeduplicationId = f"{clave}:SAVE_HISTORICAL_DOCUMENT:{atvStatus}"`.

### 0.7 Mapper

`be/sales-be/shared/jbiller_common/hacienda/mappers/historical_document_mapper.py`

```
def from_validation(organization_id, clave, response: AtvValidationResponse, *,
                    source: str, sale=None) -> HistoricalDocumentEventPayload

def payload_to_row_fields(payload) -> dict   # payload -> table column names, for the upsert
```

`from_validation` reads `response.parsed_message` (a `HaciendaMessage`, already populated by
`HaciendaValidationService.fetch`) for:

| `HaciendaMessage` field | event field |
|---|---|
| `nombre_emisor` | `issuerName` |
| `tipo_identificacion_emisor` | `issuerIdType` |
| `numero_identificacion_emisor` | `issuerIdNumber` |
| `nombre_receptor` | `receiverName` |
| `tipo_identificacion_receptor` | `receiverIdType` |
| `numero_identificacion_receptor` | `receiverIdNumber` |
| `total_factura` | `totalAmount` |
| `monto_total_impuesto` | `taxTotal` |
| `errors` | `errors` |

**`AtvValidationResponse.from_indicator(response.ind_estado)` is the authority for `atvStatus`,
not `parsed_message.mensaje`.** `parsed_message` may be `None` (an unparseable signed response
is logged and swallowed upstream), so every field sourced from it is optional and must degrade
to `null` rather than raise.

### 0.8 Messaging — `be/sales-be/cloudformation/hacienda-messaging.yml`

Follow the existing validation/pdf/notification triples exactly: FIFO topic + FIFO queue +
DLQ (`maxReceiveCount: 5`, `MessageRetentionPeriod: 1209600`) + `AWS::SNS::Subscription` with
`RawMessageDelivery: true` + `AWS::SQS::QueuePolicy`. `VisibilityTimeout` must be **≥ 6× the
consumer Lambda's timeout** (the house rule stated in that file).

| topic | queue | consumer |
|---|---|---|
| `tsuru-{env}-organization-branches.fifo` (new) | `tsuru-{env}-organization-branches-queue.fifo` (+ dlq) | store-be `cd-backend` |
| `tsuru-{env}-historical-documents.fifo` (**exists**, currently orphaned) | `tsuru-{env}-historical-documents-queue.fifo` (new, + dlq) | `hacienda-history` |

The historical-documents topic is presently defined in
`be/sales-be/app/hacienda-history/cloudformation/historical-documents-topic.yaml`. **Move** it
into `hacienda-messaging.yml` next to its new queue so topic, queue, subscription and policy
live together, and delete the standalone file. Keep the export name unchanged:
`tsuru-${Environment}-historical-documents-topic-arn`.

New exports: `tsuru-${Environment}-organization-branches-topic-arn`,
`...-organization-branches-queue-arn` / `-url` / `-dlq-arn`,
`...-historical-documents-queue-arn` / `-url` / `-dlq-arn`.

### 0.9 SSM — `be/sales-be/cloudformation/hacienda-params.yml`

| SSM path | `AppConfig` key |
|---|---|
| `/tsuru/{env}/hacienda/sns/branches_topic_arn` | `hacienda.sns.branches_topic_arn` |
| `/tsuru/{env}/hacienda/sns/historical_topic_arn` | `hacienda.sns.historical_topic_arn` |
| `/tsuru/{env}/hacienda/sqs/branches_queue_arn` | `hacienda.sqs.branches_queue_arn` |
| `/tsuru/{env}/hacienda/sqs/historical_queue_arn` | `hacienda.sqs.historical_queue_arn` |

Values are `!ImportValue` of the exports in §0.8.

`AppConfig._parameter_path` rewrites **any** key starting with `hacienda.` to
`/tsuru/{env}/hacienda/...` regardless of the calling app's `settings.cfg` `ssmpath`
(`shared/jbiller_common/configuration/app_config.py`). That is exactly why these live in the
shared namespace and why `document-validator` can already read its topic ARNs the same way.

The legacy UPPERCASE keys `DOCUMENT_HISTORY_URL`, `DOCUMENT_HISTORY_TOPIC_ARN` and
`DOCUMENT_HISTORY_GROUP_ID` are **retired** — see §1.3, they never resolved.

### 0.10 `SAVE_BRANCHES` event (hacienda-history → store-be)

```jsonc
{
  "_type": "OrganizationBranchesEvent",
  "eventType": "SAVE_BRANCHES",
  "id": "<uuid4>",
  "occurredAt": "<iso8601>",
  "data": {
    "organizationId": "<org uuid>",
    "branches": [
      {
        "number": 1,                 // Hacienda branch CODE (int, 1..999)
        "name": "Sucursal 1",
        "email": "ventas@example.com",
        "phone": "22223333",         // PLAIN STRING (store-be's column is String(50))
        "terminals": [
          {
            "number": 1,             // Hacienda terminal CODE (int)
            "name": "Terminal 1",
            "consecutives": [
              { "documentType": "01", "number": 42 }
            ]
          }
        ]
      }
    ]
  }
}
```

`_type` changes from the legacy `"TaxpayerBranchesEvent"`; nothing ever consumed it.
`consecutives[].number` is the **highest** consecutive seen for that document type.

### 0.11 HTTP endpoints (on the `hacienda-history` Lambda)

Mirror `be/sales-be/app/sales-api/src/controllers/sale_controller.py` — same
`/api/organizations/{organization_id}/…` prefix, same 0-indexed `page` + `size`, same response
envelope as `SaleListResponse`.

| method | path |
|---|---|
| `GET` | `/api/organizations/{organization_id}/historical-documents` |
| `GET` | `/api/organizations/{organization_id}/historical-documents/{clave}` |
| `POST` | `/api/organizations/{organization_id}/historical-documents/sync` |

List query params: `document_types` (comma-separated), `branch_number` (int),
`terminal_number` (int), `atv_status` (int 0–3), `search` (URL-encoded JSON
`{searchTerm,start_date,end_date,sort}` — identical to sales), `page` (int ≥ 0, default 0),
`size` (int 1–250, default 20).

List 200 body:

```jsonc
{ "data": [ /* HistoricalDocument */ ],
  "pagination": { "page": 0, "pageSize": 20, "totalElements": 0, "totalPages": 0 } }
```

`POST .../sync` body `{"force": false}` (optional).
202 → `{"requested": true, "organizationId": "...", "alreadyRequested": false}`.
409 when `historical_requested` is already true and `force` is false.

`HistoricalDocument` JSON is **camelCase on the wire** (`ResponseUtils` dumps `by_alias=True`):
`historicalDocumentId, organizationId, clave, documentType, branchNumber, terminalNumber,
consecutiveNumber, consecutiveKey, emissionDate, issuerName, issuerIdType, issuerIdNumber,
receiverName, receiverIdType, receiverIdNumber, totalAmount, taxTotal, atvStatus,
atvValidationDate, atvErrors, parentClave, source, saleId, createdOn, updatedOn, status`.

The POS client for `SALES_API_BASE` is created with `snakeCaseResponses: true`, so the
**frontend sees snake_case**. FE types must be snake_case — writing camelCase there is exactly
the TSR-165 bug.

### 0.12 RBAC identifier

| | |
|---|---|
| module | `documents` — already exists, already assigned to every org |
| submodule | `historical` — **new** |
| actions | `read`, `export`, `update` (`update` gates the sync/re-run) |
| permission strings | `documents:historical:read`, `documents:historical:export`, `documents:historical:update` |

---

## 1. Verified current state — do not re-investigate

All of this was read on 2026-09-11. It is here so the executor does not rediscover it.

### 1.1 The trigger works, but can never retry

`be/sales-be/app/organization-configurations/src/services/organization_configurations_service.py`
(~line 473), inside `update_organization_configurations`:

```python
if not config.historical_requested:
    from services.document_history_event_service import DocumentHistoryEventService
    event_service = DocumentHistoryEventService()
    event_service.request_document_history(organization_id)
    config.historical_requested = True
```

`request_document_history` **swallows every exception** and returns `None`, so a failed publish
still flips `historical_requested` to `True` permanently. That is the most likely reason the
sweep has never run for any org. It also calls `sts:GetCallerIdentity` on every publish just to
build the queue URL.

`historical_requested` is a real column on `organization_hacienda`
(`alembic/versions/a1b2c3d4e5f6_initial_auth_migration.py`), so no migration is needed for it.

### 1.2 The consumer is deployed but cannot complete

`hacienda-history` is alive (TSR-248 fixed its import errors) and has an enabled SQS event
source on `tsuru-{env}-document-history.fifo`. `DocumentHistoryService.get_document_history`
then fails for several independent reasons:

1. **`id_number = "PLACEHOLDER"`** (`document_history_service.py` ~line 173) — the `emisor`
   query param sent to Hacienda is a literal placeholder string.
2. **Token attribute mismatch** — the service builds
   `type('TokenResponse', (), {'access_token': ..., 'token_type': ...})()` but
   `daos/document_history_dao.py` reads `token_response_dto.accessToken`. Guaranteed
   `AttributeError`.
3. **SSM key case** — the code asks for `DOCUMENT_HISTORY_URL`,
   `DOCUMENT_HISTORY_TOPIC_ARN`, `DOCUMENT_HISTORY_GROUP_ID` (uppercase); `params.yml`
   provisioned `document_history_url`, `document_history_topic_arn`,
   `document_history_group_id` (lowercase). `AppConfig.get_key` maps the key verbatim, so all
   three return `None` → `requests.get(None, ...)` and `sns.publish(TopicArn=None, ...)`.
   Only `hacienda_document_history_limit` matches.
4. **`NotFoundException` arity** — its signature is `__init__(self, message, detail)` but the
   service calls it with one argument. `TypeError`, and the controller's generic
   `except Exception` handler is **commented out**, so the message goes straight to the DLQ
   (`maxReceiveCount: 1` — one failure and it is dead).
5. **`BranchRequestDTO.to_dict()` crashes** — it does `self.residence.to_dict()` but the
   service passes `residence="CR"`, a `str`.
6. **`KeyError` in `create_branches_process`** — reads `document['creditNote']` and
   `document['debitNote']` unconditionally, but `DocumentMapper` only adds those keys when
   Hacienda returned `notasCredito`/`notasDebito`.
7. **`NameError` in `DocumentMapper`** — `receiver` is defined only inside
   `if RECEIVER.dto in document_history`, yet the debit-note and credit-note loops reference
   `if receiver:` unconditionally. A document with notes but no `receptor` raises.
8. The pagination loop terminates only on an empty response or an API exception — never on a
   short page — so a misbehaving endpoint spins to the 60 s Lambda timeout.
9. `handle_sqs_message` in `src/app.py` **returns inside** the `for` loop over `Records`.
   Harmless at `BatchSize: 1`, silently lossy if that is ever raised.
10. `daos/document_history_dao.py` **prints the access token to stdout**.

### 1.3 Nothing consumes what it publishes (TSR-167)

`TriggerSNSService` publishes both `SaveDocumentHistory` (documents) and `SAVE_BRANCHES`
(branches) to `tsuru-{env}-historical-documents.fifo`, which has **zero subscriptions**.
`SAVE_BRANCHES` appears exactly twice in the whole monorepo: the enum definition and that one
publish call. It is a leftover from the Java `io.ivois.api.billing` system whose consumer was
never ported.

### 1.4 There is no table

Nothing persists the swept documents. `get_document_history` returns `json.dumps(list)` as the
Lambda's return value, which SQS discards. `voucherTotal`, `taxTotal`, `atvValidationDate` and
`atvErrors` are hardcoded `None` in `DocumentMapper`, and `atvStatus` is hardcoded to
`DocumentStatusCodes.NOT_VALIDATE` (1).

### 1.5 What is worth keeping

- `src/utils/document_utils.py` — `parse_key` (50-char clave → country/date/taxpayer/
  consecutive/situation) and `parseConsecutiveString` (20-digit consecutive →
  branch(3) / terminal(5) / documentType(2) / number(10)). These are correct and load-bearing.
- The branch → terminal → max-consecutive-per-document-type grouping in
  `document_history_service.py` (`_process_branches`, `create_branches_process`,
  `add_consecutive_process`). The logic is sound; only the plumbing around it raises.

### 1.6 The shared stack already has most of the machinery

- `jbiller_common/hacienda/clients/hacienda_atv_client.py` → `get_history(token, params)`,
  with retries, timeouts and tolerant unwrapping of list-or-wrapped-dict responses.
- `jbiller_common/hacienda/services/hacienda_history_service.py` → `fetch_history` (date-range).
- `app/document-validator/src/services/organization_token_resolver.py` →
  `OrganizationTokenResolver`, a duck-typed per-org token cache. The repo **deliberately
  duplicates this per Lambda** (sales-api has its own copy); copy it, do not import across apps.
- `jbiller_common/hacienda/repositories/organization_aggregate_repository.py` →
  `find_full_profile(org_id)` gives `taxpayer_identification`, `primary_email`, and the
  Hacienda credentials. This is what replaces `"PLACEHOLDER"`.
- `jbiller_common/hacienda/dtos/responses/hacienda_message.py` → `HaciendaMessage` already
  carries totals, issuer, receiver and parsed errors. `ValidatorPipeline` parses it today and
  reads **only** the error list; the totals and counterparties are parsed and then ignored.

### 1.7 Branches / terminals / consecutives are owned by store-be

`branches`, `terminals` and `consecutives` are store-be's tables. sales-be carries read-only
mirrors in `jbiller_common/models/` whose docstrings say *"Do NOT write from auth services"*.
The one deliberate exception is `consecutive_repository.increment_and_format`, which sales-api
owns per Hacienda's exclusivity rule.

store-be is **HTTP-only today**: `app/main.py` is `is_warmup_event` + `Mangum(app)`, with no
`Records` branch and no SQS event source anywhere in its CloudFormation.

`branch_service.create_branch` is create-only and **raises on a duplicate code** — it is not an
upsert, which is why Task 5.2 adds a separate sync service instead of reusing it.

Uniqueness is **org-scoped, not branch-scoped**: `(organization_id, code)` is unique on both
`branches` and `terminals`.

### 1.8 RBAC — how the seed actually behaves

Verified in `be/management-be/src/seeds/rbac-seed.ts`:

- `seedModules` skips modules that already exist. ✅ idempotent
- `seedSubmodules` inserts submodules that are missing from an existing module. ✅ **this is
  what creates `documents/historical`**
- `seedSubmoduleActions` iterates every submodule row in the DB, looks up
  `submoduleActionMatrix['module/submodule'] ?? BASELINE_SUBMODULE_ACTIONS`, and inserts the
  missing `(submodule, action)` pairs. ✅ idempotent
- `seedRolePermissions` **skips any role that already has ≥ 1 permission row**:
  ```ts
  if (existingPermissions.length > 0) {
    console.log(`Permissions for role '${roleName}' already exist, skipping...`);
    continue;
  }
  ```
  ⚠️ So editing `rolePermissionMatrix` and re-running `db:seed` is a **no-op for grants on an
  existing database**.

That last point does **not** block us, because `RBACService.resolveEffectivePermissions`
treats a grant with `submodule_id = NULL` as module-wide and applies it to every *available*
submodule:

| role | existing grant | gets `documents/historical`? |
|---|---|---|
| `platform_admin` | user-level bypass | yes |
| `owner` | `isOwner` short-circuit — all grantable actions | yes |
| `admin` | module-wide `documents: [create, read, update, cancel, export, upload]` | yes → `read`, `export`, `update` |
| `manager` | module-wide `documents: [create, read, update]` | yes → `read`, `update` (not `export`) |
| `staff` | only `documents/emitted` + per-doc-type overrides | **no** — deliberate |

**Therefore: `pnpm run db:seed` alone is sufficient. No migration, no `db:seed:org-modules`,
no destructive `db:reseed-rbac`.** `documents` is already in `BASE_ORG_MODULE_NAMES`, so every
organization already has the module assigned.

Propagation latency after the seed: 60 s (`RBACService` cache TTL) + the POS React Query
`staleTime` of 5 min on `my-permissions`.

### 1.9 Pre-existing drift found on the way (fix it in the same pass)

`NAV_PERMISSION.ivaReport = ["reports", "iva"]` and
`ROUTE_PERMISSIONS.reportsIva = [["reports","read","iva"]]` in the POS, but
`defaultSubmodules.reports` in `rbac-seed.ts` contains only `general`. There is no
`reports/iva` submodule seeded, so that nav item goes permanently invisible the moment
`RBAC_ENFORCEMENT` leaves `log`. Same class of bug, one line to fix — see Task 6.2.

### 1.10 IVOIS references still in the tree

`command grep -ril ivois` (note: the shell's `grep` is a gitignore-aware wrapper that silently
skips `be/sales-be` and `fe/pos-system` — **use `command grep`**):

| file | what |
|---|---|
| `be/sales-be/shared/jbiller_common/hacienda/templates/pdf/invoice_footer.html` | **`Comprobante generado por IVOIS (3-101-512496)`, `www.ivois.io`, the IVOIS logo (inline base64), `.ivois-logo` class — on every emitted fiscal document** |
| `be/sales-be/app/hacienda-history/settings.cfg` | `appname = IVOIS-TaxpayerDocumentsHistoryBatch-App` ×3 |
| `be/sales-be/app/hacienda-history/src/exceptions/*` | the `IvoisException` tree |
| `be/sales-be/app/hacienda-history/src/app.py` | commented-out sample event referencing `io.ivois.api.billing` |
| `be/sales-be/scripts/build-lambda.sh` | dead legacy — `IVOIS-DEV` profiles, `ivois-*-hacienda-authentication` stacks that no longer exist |
| `be/sales-be/app/hacienda-history/scripts/build-lambda.sh` | dead legacy, same shape |
| `be/sales-be/app/hacienda-history/cloudformation/DEPRECATED_CLEANUP.md` | obsolete migration notes |
| `be/sales-be/.kiro/specs/hacienda-history-ssm-migration/MIGRATION_SUMMARY.md` | obsolete |
| `be/sales-be/app/document-pdf-generator/src/services/html_service.py:7` | comment |
| `fe/dashboard/src/lib/htmlPdfGenerator.ts:105` | comment |
| `be/data-be/.gitignore:67` | `scripts/_replace_ivois.ps1` |
| `docs/audit/tsuru/*` | **DO NOT TOUCH** — CLAUDE.md makes the audit corpus a historical record |
| `be/sales-be/tests/local/out/**` | generated + gitignored, regenerates clean |

---

## 2. Tasks

Five independent git repos share one working tree. Cross-repo tasks cannot collide; the three
tasks inside `be/sales-be` have **strictly disjoint file ownership**, stated per task.

| path | repo | branch |
|---|---|---|
| `.` | `Tsuru-CR` | `develop` |
| `be/sales-be` | `chepelcr/tsuru-sales-be` | `develop` |
| `be/store-be` | `chepelcr/tsuru-store-be` | `develop` |
| `be/management-be` | `chepelcr/tsuru-management-be` | **`main` — branch before committing** |
| `fe/pos-system` | `chepelcr/tsuru-pos-system` | **`main` — branch before committing** |

Rules for every task: read the repo's `CLAUDE.md` first (sales-be's §7 "Things not to do" is
binding); copy the named reference file rather than inventing a shape; do not commit until the
whole wave is reviewed.

---

### WAVE 0 — the contract. Everything else depends on it.

#### T0.1 — Model, repository and migration
**Repo:** sales-be · **Owns:** `shared/jbiller_common/models/`, `shared/jbiller_common/hacienda/repositories/`, `alembic/versions/`

1. Create `shared/jbiller_common/models/hacienda_historical_document.py` per §0.3. Style
   reference: `shared/jbiller_common/models/hacienda_document_log.py`.
2. Export `HaciendaHistoricalDocument` from `shared/jbiller_common/models/__init__.py`.
   **Do not** add a `_load_model(...)` line to `alembic/env.py` — that path is for
   service-local models only and shared models are already picked up through
   `from jbiller_common.models import Base`. Adding it produces a duplicate-table warning.
3. Create `shared/jbiller_common/hacienda/repositories/historical_document_repository.py`
   per §0.4; export from that package's `__init__.py`.
4. Generate the Alembic migration in `alembic/versions/`. Follow the existing file-naming
   style (`<hash>_<snake_description>.py`); the most recent head is
   `l2m3n4o5p6q7_create_user_notification_tables.py`.

**Acceptance:** `STAGE=dev AWS_PROFILE=PACIFIC-PROD AWS_REGION=us-east-1 ./.venv/bin/python -m alembic upgrade head`
succeeds; `\d hacienda_historical_documents` shows the unique constraint and three indexes;
`upsert_by_clave` called twice with different column subsets leaves both sets populated
(the second call must not null out the first's columns).

#### T0.2 — Event DTOs, codes and mapper
**Repo:** sales-be · **Owns:** `shared/jbiller_common/hacienda/dtos/events/`, `shared/jbiller_common/hacienda/mappers/`, `shared/jbiller_common/hacienda/services/hacienda_history_service.py`

1. Add the two `DocumentEventCode` members per §0.5.
2. Create `historical_document_event.py` per §0.6; export it.
3. Create `mappers/historical_document_mapper.py` per §0.7; export it.
4. Add `fetch_issued(organization_id, identification_number, offset, limit)` to
   `HaciendaHistoricalService`… i.e. `HaciendaHistoryService`, alongside the existing
   date-range `fetch_history`, so both callers share one `HaciendaAtvClient`. It calls
   `get_history(token, {"emisor": identification_number, "offset": offset, "limit": limit})`.

**Acceptance:** layer-1 probe — construct a `HistoricalDocumentEvent`, round-trip it through
`model_dump_json(by_alias=True)` and `model_validate_json`, and assert the JSON matches §0.6.
`from_validation` with `parsed_message=None` returns a payload with nulls and does not raise.

#### T0.3 — Messaging and SSM
**Repo:** sales-be · **Owns:** `cloudformation/hacienda-messaging.yml`, `cloudformation/hacienda-params.yml`, `app/hacienda-history/cloudformation/historical-documents-topic.yaml` (deletion)

1. Add both topic/queue/DLQ/subscription/policy sets per §0.8.
2. Move the historical-documents topic out of the standalone file and delete that file.
3. Add the four SSM parameters per §0.9.

**Acceptance:** `aws cloudformation validate-template` passes on both templates; every
`!ImportValue` in §0.8/§0.9 resolves to an export declared in the same change or already live.

> **Hand off to Wave 1:** §0 of this document *is* the contract. Do not restate it; point
> agents at it.

---

### WAVE 1 — six tasks, parallel.

#### T1.1 — Rewrite `hacienda-history`
**Repo:** sales-be · **Owns:** `app/hacienda-history/**` and the one-line `SERVICES` addition in `scripts/gen_api_template.py` · **Must not touch:** anything else · **Depends on:** T0.1, T0.2, T0.3

**Delete** (superseded by shared code, or dead):
`src/daos/document_history_dao.py`, `src/services/trigger_sns_service.py`,
`src/services/trigger_sqs_service.py`, `src/services/sqs_message_error_log_service.py`,
`src/repositories/sqs_message_error_log_repository.py`, `src/models/sqs_message_error_logs.py`,
`src/repositories/hacienda_token_repository.py`, `src/models/hacienda_token.py`,
`src/exceptions/**` (the whole ivois tree), `src/dtos/responses/**`, `src/dtos/models/**`,
`src/dtos/requests/document_history_event_request_schema.py`, `scripts/build-lambda.sh`,
`cloudformation/DEPRECATED_CLEANUP.md`.
Exceptions come from `jbiller_common.exceptions` from now on.

**Keep unchanged in substance:** `src/utils/document_utils.py`, and the branch/terminal/
consecutive grouping logic (§1.5).

**Rewrite `src/services/document_history_service.py`:**
- taxpayer id ← `OrganizationAggregateRepository.find_full_profile(org).taxpayer_identification`
- token ← a local copy of `OrganizationTokenResolver` (copy the file from
  `app/document-validator/src/services/`; the repo duplicates it per Lambda by design)
- fetch ← `HaciendaHistoryService.fetch_issued(...)` (T0.2)
- pagination stops on an empty page **or a short page** (`len(page) < limit`), with a hard
  page cap
- branch email/phone from the aggregate (`primary_email`, registered-org profile) — remove the
  `"noreply@example.com"` / `("506","00000000")` / `"CR"` placeholders
- persist a skeleton row per document via `HistoricalDocumentRepository.upsert_by_clave`
  (`source="HISTORY"`, `atv_status=0`), including NC/ND rows with `parent_clave` set
- fix the `KeyError` (§1.2 #6) and `NameError` (§1.2 #7) in the mapper/grouping paths
- publish `SAVE_BRANCHES` and one `VALIDATE_HISTORICAL_DOCUMENT` per clave via a new
  `src/services/event_publisher.py`, modelled on
  `app/document-validator/src/services/event_publisher.py`

**New consumer** for `SAVE_HISTORICAL_DOCUMENT`: parse the clave, map the payload through
`payload_to_row_fields`, `upsert_by_clave`.

**`src/app.py` becomes dual-mode**, copying `app/document-validator/src/app.py` in shape:
`is_warmup_event` first, then `Records` → Powertools `BatchProcessor(event_type=EventType.SQS)`
with the `if "Message" in body` SNS unwrap, else `Mangum(app, lifespan="off")`. Fix the
return-inside-the-loop bug (§1.2 #9). Keep calling `configure_logging()`.

**Config:** retire the uppercase keys; read topic ARNs from `hacienda.sns.*` (§0.9).
Keep `hacienda_document_history_limit`.

**`cloudformation/lambda.yml`:** add the second SQS event source on
`tsuru-${Environment}-historical-documents-queue-arn`; add `sns:Publish` on both new topics.

**`settings.cfg`:** `appname = Tsuru-HaciendaHistory-App` (×3).

**Acceptance:** `python -m tests.local.runner` cases pass for `SAVE_DOCUMENT_HISTORY` and
`SAVE_HISTORICAL_DOCUMENT`; `command grep -ri ivois app/hacienda-history/` returns nothing;
the mapper handles a document with notes but no `receptor`, and one with no notes at all.

#### T1.2 — HTTP surface on `hacienda-history`
**Repo:** sales-be · **Same owner as T1.1** (do them together) · **Depends on:** T1.1

1. `src/controllers/historical_documents_controller.py` implementing §0.11. Reference:
   `app/sales-api/src/controllers/sale_controller.py` for the `self.router` +
   `OpenAPIExamples.create_responses(...)` convention and the `Routes:` docstring block.
2. Response DTOs `HistoricalDocumentResponse` / `HistoricalDocumentListResponse` reusing
   `PaginationResponse` (`shared/jbiller_common/dtos/responses/sale_list_response_dto.py` is
   the envelope reference).
3. The `POST .../sync` handler publishes `SAVE_DOCUMENT_HISTORY` to
   `tsuru-{env}-document-history.fifo` and honours `force`.
4. Register the controller in `src/app.py`.
5. Add `"hacienda-history"` to `SERVICES` in `scripts/gen_api_template.py`.
   **Do not run the generator** — that is T2.1, and it must run after every route exists.

**Acceptance:** `python -m tests.local.runner` http cases return 200/202/409 as specified;
the service's `app.openapi()` builds without a running DB (that is what the generator does).

#### T1.3 — `document-validator`
**Repo:** sales-be · **Owns:** `app/document-validator/**`, `app/organization-configurations/src/services/*` · **Must not touch:** `shared/`, `cloudformation/`, `scripts/` · **Depends on:** T0.1, T0.2

1. `handlers/sqs_handler.py` — dispatch `VALIDATE_HISTORICAL_DOCUMENT` →
   `pipeline.validate_historical(organization_id, clave)`.
2. `services/validator_pipeline.py`:
   - new `validate_historical(organization_id, clave)`: poll ATV, then publish
     `SAVE_HISTORICAL_DOCUMENT` with `source="HISTORY"`. It **must not** call `_dispatch_next`
     — a historical document has no Sale and no XML, so GENERATE_PDF would fail downstream.
   - in `poll_and_persist`, after `_update_sale_with_status`, when `status` is terminal
     (ACCEPTED / PARTIAL / REJECTED) publish the same event with `source="POS"` and the
     `sale_id` / `document_id` populated. Best-effort: a publish failure must be logged and
     swallowed, never roll back the Sale update.
   - `batch_history` keeps its `VALIDATE_HISTORY_DOCUMENT` entry point but **stops fetching**:
     it publishes `SAVE_DOCUMENT_HISTORY` so `hacienda-history` owns the sweep. Remove
     `HaciendaHistoryService` from `ValidatorPipeline.__init__`.
3. `services/event_publisher.py` — add `publish_save_historical(...)` reading
   `hacienda.sns.historical_topic_arn`.
4. `cloudformation/lambda.yml` — `sns:Publish` on the historical topic.
5. **Trigger fix** (`app/organization-configurations/src/services/`):
   - `document_history_event_service.py`: `request_document_history` returns `bool`; resolve
     the queue URL from SSM instead of `sts:GetCallerIdentity`.
   - `organization_configurations_service.py`: set `config.historical_requested = True`
     **only when the publish returned True**.

**Acceptance:** layer-2 case `sqs_validate_historical_document.json` produces exactly one
`SAVE_HISTORICAL_DOCUMENT` publish and zero `GENERATE_PDF` publishes; an existing
`sqs_save_document.json` run still publishes `GENERATE_PDF` **and** now also one
`SAVE_HISTORICAL_DOCUMENT`; a forced publish failure in the org-config path leaves
`historical_requested` false.

#### T1.4 — store-be branch sync consumer
**Repo:** store-be · **Depends on:** §0.10 only (not on any sales-be code)

1. `app/handlers/sqs_handler.py` (new) — Powertools `BatchProcessor`, SNS-envelope unwrap
   (`if "Message" in body`), dispatch on `eventType == "SAVE_BRANCHES"`, return
   `processor.response()`.
2. `app/main.py` — add the `Records` branch ahead of Mangum, keeping `is_warmup_event` first.
3. `app/services/branch_sync_service.py` (new) — `sync_from_hacienda(organization_id, branches)`:
   - branches matched on `(organization_id, code)`; create when absent; when present **leave
     operator-edited `name` / `type` / `location` alone**
   - terminals matched on `(organization_id, code)` — note uniqueness is org-scoped, not
     branch-scoped (§1.7)
   - consecutives matched on `(terminal_id, document_type_id)`; `current_number` **only ever
     moves up**, never down — a re-used consecutive is a rejected document
   - defaults the event cannot carry: `type` ← the org's first `branch_types` row, else
     `'stand'`; `created_by` ← the reserved system id `"hacienda-history"`. Both are recorded
     so an operator can distinguish a swept branch from a hand-made one.
   - fully idempotent: running the same event twice changes nothing
4. `cloudformation/template.yml` — SQS `Events:` block (`BatchSize: 10`,
   `FunctionResponseTypes: [ReportBatchItemFailures]`) importing
   `tsuru-${Environment}-organization-branches-queue-arn`, plus the SQS IAM actions
   (`ReceiveMessage`, `DeleteMessage`, `GetQueueAttributes`, `ChangeMessageVisibility`).

**Do not** reuse `branch_service.create_branch` — it raises on duplicate codes (§1.7).

**Acceptance:** a unit test feeding the §0.10 payload twice produces the same rows both times;
a second event carrying a *lower* `consecutives[].number` leaves `current_number` unchanged;
existing HTTP routes still work (`pytest tests/test_branches_handler.py tests/test_terminals_handler.py`).

#### T1.5 — RBAC submodule
**Repo:** management-be · **Depends on:** §0.12 only

Single file, `src/seeds/rbac-seed.ts`:

1. `defaultSubmodules.documents` — append
   `{ name: 'historical', displayName: 'Históricos', description: 'Documentos históricos de Hacienda', sortOrder: 9 }`.
   Append rather than insert, so the existing doc-type submodules keep their `sortOrder`.
2. `submoduleActionMatrix` — add `'documents/historical': ['read', 'export', 'update']`.
   Without this entry it silently inherits full CRUD (`?? BASELINE_SUBMODULE_ACTIONS`).
3. `rolePermissionMatrix` — **no change needed**, and add a comment saying why: `owner` is
   covered by the `isOwner` short-circuit, `admin` and `manager` by their existing module-wide
   `documents` grants, and `staff` is deliberately excluded because a cashier has no business
   reading the taxpayer's full pre-Tsuru history (§1.8).

**Do not** add a new top-level module, do not touch `BASE_ORG_MODULE_NAMES`, do not run
`db:reseed-rbac` (destructive; loses custom org-role grants), and do not write a migration —
modules and submodules are data rows, not DDL.

**Rollout:** `pnpm run db:seed` only. `db:seed:org-modules` is unnecessary because `documents`
is already assigned to every org.

**Acceptance:** after `pnpm run db:seed`, a `submodules` row `historical` exists under the
`documents` module; `submodule_actions` has exactly three rows for it; `GET /my-permissions`
for an `admin` member returns `documents:historical:read`, for a `manager` returns
`documents:historical:read` but **not** `:export`, and for `staff` returns neither. Allow 60 s
for the `RBACService` cache.

#### T1.6 — POS frontend module
**Repo:** fe/pos-system · **Depends on:** §0.11 and §0.12 only

Router is **wouter**. Three gating layers with *different* failure modes — match each:
nav item fail-**open** until permissions resolve, route fail-**closed**, in-page actions
fail-**open**.

| # | file | change |
|---|---|---|
| 1 | `src/routePaths.ts` | `DASHBOARD_HISTORICAL_DOCUMENTS: "/dashboard/documents/historical"` + `historicalDocumentDetailPath(clave)` |
| 2 | `src/Routes.tsx` | `lazy()` imports; `ROUTE_PERMISSIONS.historicalDocuments = [["documents","read","historical"]]` (and `historicalDocumentDetail`); `<Route>` entries wrapped in `<DashboardPage permissions={…}>`. **Detail route BEFORE the list route** — `Switch` takes the first match. Read the param in a small wrapper component and pass it as a prop, as `DocumentDetailRoute` does |
| 3 | `src/components/layout/navIds.ts` | add `"historicalDocuments"` to the `NavId` union |
| 4 | `src/components/layout/DashboardSidebar.tsx` | `ITEM_META` entry (`{ icon: "archive"-or-similar from `Icon.tsx`'s `IconName` union, labelKey: "shell.historicalDocuments" }`) + `NAV_PERMISSION: historicalDocuments: ["documents", "historical"]`. **Documentos is a standalone item, not a section** — add this as a second standalone item, do not convert Documentos into a collapsible section |
| 5 | `src/components/layout/DashboardLayout.tsx` | `getActiveNav()` branch — **`/dashboard/documents/historical` must be tested BEFORE `/dashboard/documents`** — and the `NAV_PATHS` entry (the record is non-`Partial`; TS errors if omitted) |
| 6 | `src/lib/api.ts` | `export const salesHistoricalPath = (orgId: string, suffix = '') => \`/api/organizations/${orgId}/historical-documents${suffix}\`;` next to `salesTaxReportPath`. Use the existing `salesApi` client — no new base URL, no new env var, no `vite-env.d.ts` change |
| 7 | `src/types/historicalDocument.ts` | `HistoricalDocument` + list response, **snake_case** (`salesApi` is `createClient(SALES_API_BASE, { snakeCaseResponses: true })`). Reuse `src/types/pagination.ts` |
| 8 | `src/hooks/useHistoricalDocuments.ts`, `useHistoricalDocument.ts`, `useSyncHistoricalDocuments.ts` | React Query. Copy `useSales.ts` for the `URLSearchParams` + `toWireSearch()` shape and `useSale.ts` for the detail hook. The sync mutation invalidates `['historical-documents', orgId]` |
| 9 | `src/pages/dashboard/HistoricalDocumentsPage.tsx`, `HistoricalDocumentDetailPage.tsx` | list + detail. Reuse `ListToolbar`, `EmptyState`, `Pagination`, `FiltersModal`. Call `usePageTitle` |
| 10 | `src/components/historical-documents/` | `HistoricalDocumentsFiltersModal.tsx` (template: `OrdersFiltersModal.tsx` — exported `…AdvancedFilters` interface + `EMPTY_…_FILTERS` const + draft state), card, skeleton, `index.ts` barrel |
| 11 | `src/locales/{en,es}/documents.json` | a `historical.*` key block |
| 12 | `src/locales/{en,es}/common.json` | `shell.historicalDocuments` |
| 13 | `src/locales/{en,es}/access.json` | `rbac.sub.documents.historical` |

Behaviour:
- A "Sincronizar" button gated on `!permsReady || can("documents", "update", "historical")`,
  calling `POST .../sync`.
- The empty state must distinguish **"no documents"** from **"never synced"** and offer the
  sync button in the second case. This is the situation every existing org is in today.
- `<Pagination>` is **1-based**, sales-api is **0-based**. `useSales`/`DocumentsListView`
  already bridge this — copy that, do not invent a second convention.
- Do **not** copy `IssuedReceivedToggle.tsx`; it has hardcoded Spanish strings, a known violation.

**Acceptance:** `pnpm check` (= `check:styles && tsc --noEmit`) and `pnpm vitest run` both pass.
Note the two CI gates that will otherwise fail the build: `src/locales/locales.test.ts`
TS-parses all of `src/`, collects every `t("literal")` and asserts the key exists in
`translations.es` *and* that EN/ES key sets match per namespace; `scripts/check-styles.mjs`
fails on static inline `style={{…}}` and on any hex colour literal outside `src/theme/`.

#### T1.7 — IVOIS purge (everything except the PDF footer)
**Repo:** monorepo + sales-be · **Must not touch:** `app/hacienda-history/**` (owned by T1.1), `invoice_footer.html` (blocked — see §5), `docs/audit/**`

Work the table in §1.10: delete `be/sales-be/scripts/build-lambda.sh`,
`be/sales-be/.kiro/specs/hacienda-history-ssm-migration/MIGRATION_SUMMARY.md`; reword the two
code comments; drop `be/data-be/.gitignore:67`.

**Acceptance:** `command grep -ril ivois . --exclude-dir=node_modules --exclude-dir=.git`
returns only `invoice_footer.html`, `docs/audit/**`, `docs/roadmap/tsuru_roadmap.md`,
`be/sales-be/tests/local/out/**`, and this document.

---

### WAVE 2 — after every route exists.

#### T2.1 — Regenerate the API Gateway template
**Repo:** sales-be

```bash
cd be/sales-be && python3 scripts/gen_api_template.py
```

Commit the regenerated `api-gateway/template.yml` and `api-gateway/endpoints.json`.

⚠️ **Must run last.** The generator rewrites the *whole* gateway — every route, every service —
and a service whose spec fails to build has its routes **dropped**. It aborts rather than
writing a partial template (TSR-244), so a failure here means a broken import somewhere, not a
reason to pass `--allow-partial`.

#### T2.2 — Fix the `reports/iva` drift
**Repo:** management-be · See §1.9.

Add `{ name: 'iva', displayName: 'Declaración IVA', description: 'Reporte de declaración de IVA', sortOrder: 2 }`
to `defaultSubmodules.reports` and `'reports/iva': ['read', 'export']` to
`submoduleActionMatrix`. Re-run `pnpm run db:seed`.

#### T2.3 — PDF footer rebrand
**Repo:** sales-be · **BLOCKED** — see §5.

#### T2.4 — Documentation
**Repo:** monorepo

`docs/roadmap/tsuru_roadmap.md`: close **TSR-167**; add **TSR-253** (hacienda-history rewritten
onto the shared stack), **TSR-254** (branch/terminal sync into store-be), **TSR-255**
(historical documents table + read API), **TSR-256** (IVOIS purge — call out the PDF footer
explicitly: it is a third party's cédula on live fiscal documents), **TSR-257** (POS module +
`documents/historical` RBAC submodule). Append a dated §8 changelog line. Never renumber or
delete rows.

Also: a line in `be/sales-be/CLAUDE.md` (hacienda-history is no longer an ivois-era outlier and
now has an HTTP surface) and in `fe/pos-system/CLAUDE.md` §5.1 if it enumerates nav ids.

