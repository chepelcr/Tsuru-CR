# Order ↔ Document link, dashboard/reports, exchange-rate — live status

**Live document.** Flip a Status cell and add the commit **in the same session** you change
anything described here. Same rule as `wire_convergence_status.md` (CLAUDE.md §roadmap).

Started 2026-09-20. Roadmap ids **TSR-317 … TSR-321** (`docs/roadmap/tsuru_roadmap.md` §2).

Spans **five** repos, four of which are gitignored here and carry their own commits:

| Repo | Local path | Tracked here? |
|---|---|---|
| monorepo (this doc, roadmap) | `.` | yes |
| sales-be | `be/sales-be` | no — own repo |
| store-be ("cd-backend", owns orders) | `be/store-be` | no — own repo |
| pos-system | `fe/pos-system` | no — own repo |
| data-be | `be/data-be` | no — own repo |

---

## 1. Why

1. **The order↔document link is made by the frontend, synchronously, at the wrong moment.**
   `OrderCheckoutDrawer.tsx` POSTs `/orders/{document_number}/invoice` as soon as *our* API
   answers `status === 'confirmed'` — before Hacienda has ruled. A `queued` (offline
   outbox) sale is never linked and nothing re-links it on replay; a document Hacienda later
   **rejects** still marks its order as billed; a failed POST is swallowed as a toast.
2. **Every order is labelled a Walmart order.** `chainInfoFromOrder()` sets
   `purchase_order_number = order.document_number` unconditionally and returns the object
   whenever any field is truthy — so an ordinary pedido `PM-000123` ships `WMNumeroOrden`
   on its signed XML. Walmart's codes belong to Walmart.
3. **Dashboard with Documentos selected** still says "Pedidos por estado" and prints raw
   English `accepted` / `rejected`; top-products shows 5.
4. **"Tendencia de ventas" is identical on all four period tabs** — no date window is sent,
   so every granularity buckets the org's whole history, and the headline above the chart is
   `summary.revenue`, which no granularity affects.
5. **Reportes has no period control at all** and silently reports on Pedidos only.
6. **`GET /countries/{iso_code}/exchange-rate`** calls Hacienda live on every request and
   never reads the table it writes; its commonest failure is a *silent* one that disables
   foreign currency in checkout with HTTP 200.

## 2. Decisions — do not re-litigate

| Decision | Detail |
|---|---|
| Link key | The order's `document_id` holds sales-be's **`Sale.sale_id` UUID** — the id the POS already routes a document by (`/dashboard/documents/{saleId}`). `Sale.document_id` (bigint) rides inside `document_info` as `document_number`. |
| Trigger | **Two publishes.** sales-api claims the order at EMISSION with status 0 (PROCESSING) — that is what stops a second factura while the document is in flight. document-validator then publishes on **ACCEPTED only** (AtvStatus 1), moving the stored status to 1. PARTIAL and REJECTED publish nothing, so a rejected document leaves the claim standing and the order is released through the repair endpoint. |
| DTO | **Clean break**: the order DTO drops `invoice` and emits `document_info`. The POS is the only consumer. |
| Transport | SNS FIFO → SQS FIFO, modelled on the existing `OrganizationBranches` hop (sales-be → store-be). Not EventBridge, not a direct HTTP call. |
| Order number on the document | Rides `other_fields` under **internal** codes, and therefore **reaches the signed XML** as `OtroTexto` — accepted deliberately: it needs no sales-be migration, and the order number is already on the document as the `notes` string "Pedido #…". |
| Publish timing | **After** the DB transaction commits, best-effort, beside the existing `historical_event`. Publishing inside the scope makes an SNS outage roll back the Hacienda verdict. |
| Unmatched order | The consumer **acks** (logs, no retry). A cashier can type a chain PO number freehand, so an unknown number is ordinary, not a poison message. |
| Reportes scope | Periods **and** the Documentos/Pedidos source toggle. |
| Repair path | `POST /orders/{document_number}/invoice` is **kept**, rewritten onto the new columns, for documents whose event was lost. The FE stops calling it. |

## 3. Status board

Status: `Not started` · `In progress` · `Done` · `Blocked`.

### TSR-317 — event-driven document↔order link

| # | Unit | Repo | Status | Commit / evidence |
|---|---|---|---|---|
| 317.1 | Gate `chainInfoFromOrder()` on a real chain client; add `orderOtherFields()` emitting `TsuruNumeroPedido` / `TsuruOrigenPedido` | pos-system | **Done** | pos-system `src/lib/orderToInvoice.ts` + `src/hooks/useCartFlow.ts`; regression pinned in `orderToInvoice.test.ts` / `chainOtherFields.test.ts` (38 tests green) |
| 317.2 | `OrderDocumentLinkEvent` DTO in `jbiller_common/hacienda/dtos/events/` | sales-be | **Done** | `shared/jbiller_common/hacienda/dtos/events/order_document_link_event.py` |
| 317.3 | `publish_order_document_link()` on the document-validator publisher | sales-be | **Done** | `app/document-validator/src/services/event_publisher.py::publish_order_document_link` |
| 317.4 | `ValidatorPipeline.poll_and_persist` builds the event in-scope on ACCEPTED, publishes post-commit | sales-be | **Done** | `validator_pipeline._build_order_link`, built in-scope, published post-commit; probed over 6 cases |
| 317.5 | `hacienda-messaging.yml` topic/queue/DLQ/subscription/policy + exports | sales-be | **Done** | `cloudformation/hacienda-messaging.yml` — topic/queue/DLQ/subscription/policy + 4 exports |
| 317.6 | `hacienda-params.yml` SSM params for topic + queue ARN | sales-be | **Done** | `cloudformation/hacienda-params.yml` — `sns/order_link_topic_arn`, `sqs/order_link_queue_arn` |
| 317.7 | document-validator `lambda.yml` SNS publish IAM | sales-be | **Done** | `app/document-validator/cloudformation/lambda.yml` |
| 317.8 | store-be `template.yml` second SQS event source + IAM | store-be | **Done** | `cloudformation/template.yml` — `OrderDocumentLink` event source + `OrderDocumentLinkConsumer` policy |
| 317.9 | Model: drop 5 `invoice_*`, add `document_id` + `document_info` | store-be | **Done** | `app/models/order.py` — `document_id` (indexed) + `document_info` |
| 317.10 | Alembic migration with backfill before drop | store-be | **Done** | `alembic/versions/e4f5a6b7c8d9_order_document_link_reshape.py` — backfill before drop |
| 317.11 | `sqs_handler` dispatch on `event_type`; inbound DTO | store-be | **Done** | `app/handlers/sqs_handler.py` dispatches on `event_type`; `app/dtos/requests/order_document_link_dto.py` |
| 317.12 | `link_order_document()` replaces `link_order_invoice()`; mapper, response DTO, ticket service, swagger, gateway | store-be | **Done** | `link_order_document`; mapper, response DTO, ticket service, repair endpoint; swagger+gateway regenerated |
| 317.13 | FE `invoice` → `document_info`; delete `useLinkOrderInvoice` and the checkout call | pos-system | **Done** | `types/order.ts`, `OrderDetailPage`, `OrderCheckoutDrawer`, `useOrders`; tsc clean |
| 317.14 | Cross-repo contract test (publisher JSON ↔ consumer DTO) | sales-be | **Done** | `shared/tests/test_order_link_contract.py` + `store-be/tests/test_order_document_link_consumer.py`, byte-identical fixture in both repos |

### TSR-318 — dashboard panels (pos-system)

| # | Unit | Status | Commit / evidence |
|---|---|---|---|
| 318.1 | Top products 5 → 3 (and fetch 3, not 10) | **Done** | `TopProductsPanel` (`TOP_N`, declared once) + `DashboardPage` fetches 3 |
| 318.2 | Source-aware status panel title → "Documentos por estado" | **Done** | `OrderStatusPanel` takes `source`; `dash.documentStatus` keys (es+en) |
| 318.3 | Spanish document-status labels + per-status tone | **Done** | `DOCUMENT_STATUS_KEYS` in `lib/historicalDocuments`; `historical.status.notSent`; verdict tones |

### TSR-319 — sales-trend endpoint

| # | Unit | Repo | Status | Commit / evidence |
|---|---|---|---|---|
| 319.1 | Lift `_parse_search` into a shared `parse_search()` | sales-be | **Done** | `parse_search` / `parse_document_types` beside `DocumentSearchDTO`; `SaleController` delegates |
| 319.2 | `/documents/trend` takes `search` + `document_types` + `issued`; filters on `sale_date` | sales-be | **Done** | `/documents/trend` takes `search`/`document_types`/`issued`; filters on `sale_date`; same six search columns as the list |
| 319.3 | `year` added to `GRANULARITIES` | sales-be | **Done** | `GRANULARITIES` in `document_metrics_repository` |
| 319.4 | `year` added to the orders-side `GRANULARITIES` | store-be | **Done** | `GRANULARITIES` in store-be `dashboard_repository`; swagger regenerated |
| 319.5 | FE sends a real window; headline follows the tab | pos-system | **Done** | `lib/dashboardPeriod.trendWindow` (11 tests); headline = sum of plotted points |

### TSR-320 — Reportes page (pos-system)

| # | Unit | Status | Commit / evidence |
|---|---|---|---|
| 320.1 | diario / semanal / mensual / anual selector | **Done** | `reportWindow` + period rail on `ReportePage`; Monday-based weeks pinned |
| 320.2 | Documentos/Pedidos source toggle | **Done** | `lib/dashboardSource` shared with the dashboard |
| 320.3 | Trend chart on the report | **Done** | `SalesChart` on `ReportePage` at `REPORT_GRANULARITY[period]` |

### TSR-321 — exchange-rate hardening (data-be)

| # | Unit | Status | Commit / evidence |
|---|---|---|---|
| 321.1 | Serve from DB, refresh from Hacienda, fall back to last good row | **Done** | `get_rates` ladder: today's row → Hacienda → last good row |
| 321.2 | All-null upstream treated as a miss, not a 200 of nulls | **Done** | `HaciendaExchangeRateDTO.is_empty()`; nulls never persisted, cron included |
| 321.3 | Dict guards in the `mode="before"` validators | **Done** | dict guards on every `mode="before"` validator |
| 321.4 | Country validation + 404; normalise on numeric `iso_code`; align cron env | **Done** | `enums/country_codes.normalize_country`; 404 on anything else; cron default 188 |
| 321.5 | Explicit httpx timeout | **Done** | `EXCHANGE_RATE_TIMEOUT_SECONDS = 10.0` |
| 321.6 | `__table_args__` unique + conflict-tolerant upsert | **Done** | `__table_args__` unique + `IntegrityError` tolerated in the upsert |
| 321.7 | Domain exceptions + error codes; drop the blanket catch; bind `response_model` | **Done** | `enums/exception_codes` + `exceptions/`; blanket catch removed; `response_model` bound; 3 catalog rows |
| 321.8 | Fix `alembic/env.py` stale `app/hacienda-*` paths (blinds autogenerate to 3 tables) | **Done** | `alembic/env.py` → `app/consumer-*` |
| 321.9 | Add `KeepWarmRule` | **Done** | `KeepWarmRule` + permission in `lambda.yml` |

---

## 4. The cross-repo contract

**This is the part that lives in two repos at once and breaks silently if only one moves.**
sales-be publishes it; store-be validates it. Pinned by the contract test (317.14),
mirroring `be/sales-be/shared/tests/test_branches_contract.py`.

### `other_fields` codes on the document

| Code | Value | Emitted for | Purpose |
|---|---|---|---|
| `TsuruNumeroPedido` | `order.document_number` | **every** order | the link key the validator reads |
| `TsuruOrigenPedido` | `order.source` (`manual` / `import` / `storefront`) | every order | tells manual from Walmart |
| `WMNumeroOrden` | the chain's PO number | chain clients **only** | Walmart's reconciliation |
| `WMNumeroVendedor` | supplier code | chain clients only | Walmart |
| `WMEnviarGLN` | ship-to GLN | chain clients only | Walmart |

The validator reads `TsuruNumeroPedido`, falling back to `WMNumeroOrden` for documents
issued before this change.

### `OrderDocumentLinkEvent`

SNS topic `tsuru-{env}-order-document-link.fifo` → SQS `…-order-document-link-queue.fifo`,
`RawMessageDelivery: true`, `MessageGroupId = organization_id`,
`MessageDeduplicationId = "{clave}:LINK_ORDER_DOCUMENT"`.

```jsonc
{
  "id": "<uuid>",
  "event_type": "LINK_ORDER_DOCUMENT",
  "occurred_at": "2026-09-20T14:02:11Z",
  "data": {
    "organization_id": "<org>",
    "order_document_number": "PM-000123",   // or the chain PO number
    "order_source": "manual",               // manual | import | storefront | null
    "document": {
      "document_id":        "9f3a…-uuid",   // Sale.sale_id  → order.document_id
      "document_number":    10427,          // Sale.document_id (bigint)
      "document_type":      "01",
      "consecutive_number": "00100001010000000123",
      "document_key":       "506…",
      "issued_on":          "2026-09-20T14:02:11Z",
      "status":             1,              // AtvStatus.ACCEPTED
      "total_amount":       125340.0,
      "currency_code":      "CRC"
    }
  }
}
```

`data.document` is stored **verbatim** as the order's `document_info` JSON; `document_id` is
copied to the order's indexed `document_id` column.

---

## 5. Deploy order and manual steps

Nothing here deploys itself — the per-service SAM stacks are deployed by hand.

1. **sales-be `hacienda-messaging.yml`** — creates the topic/queue and the exports.
2. **sales-be `hacienda-params.yml`** — turns those exports into the SSM params the
   publisher resolves (`hacienda.sns.order_link_topic_arn`). Must follow 1.
3. **store-be migration** against dev (`alembic upgrade head`) — **before** the consumer
   ships, or the handler writes to columns that do not exist.
4. **store-be lambda** — picks up the new SQS event source (`!ImportValue` needs 1).
5. **sales-be document-validator lambda** — picks up the publish IAM + the new code.
6. **pos-system** — last: it stops calling the HTTP endpoint and reads `document_info`,
   so store-be must already be emitting it.

Between 5 and 6 the order badge briefly has two writers (the FE POST and the event). Both
are idempotent on the same document id, so the overlap is safe.

Reverse for a rollback: pos-system first.

## 6. Out of scope (deliberate)

- The dead "Descargar PDF" / "CSV" buttons on Reportes (no `onClick`).
- `AnalyticsPage.tsx` — unrouted dead code; used as a design reference for the period rail, not revived.
- The FE's `sale_date` / `total_amount` `"X~Y"` range syntax, which `DocumentSearchDTO`
  silently ignores (`extra="ignore"`). Pre-existing FE/BE drift, tracked separately.
- `Sale` gaining a real `order_id` FK. The order number in `other_fields` is the link;
  a column would be cleaner but needs a sales-be migration this work does not require.

## 7. Known consequences accepted

- **The "Facturado" badge is no longer instant.** The order is CLAIMED at emission, so it
  cannot be billed twice, but it reads "Facturando — en validación" until Hacienda accepts.
  Calling it billed before the verdict would be a claim nobody has checked.
- **A REJECTED document leaves its order claimed.** The validator publishes only on
  ACCEPTED, so nothing releases the claim on its own — deliberate, and the consequence is
  that re-billing after a rejection needs the repair endpoint
  (`POST /orders/{document_number}/invoice`). If that proves too manual, the fix is a
  release publish on REJECTED, not a change to what "linked" means.

---

## 8. Follow-up: TSR-322 — the customers edit flow

Reported 2026-09-20, in the same session. Unrelated to the order link except that both
were "the API said no and the screen did not say why".

| # | Unit | Repo | Status | Commit / evidence |
|---|---|---|---|---|
| 322.1 | The edit save PATCHed the status route; switch to PUT | pos-system | **Done** | `useClients.useUpdateClient` |
| 322.2 | Move client status to `/{client_id}/status`, the convention every other controller follows | store-be | **Done** | `clients_controller`; `ClientStatusRequestDTO` (1-3, not the order DTO's 1-5) |
| 322.3 | `validate_at_least_one_field` accepts `business_name` | store-be | **Done** | `client_request_dto`; the POS never fills `client_name` for an EMPRESA |
| 322.4 | Identification length checked per type code, mirroring the POS | store-be | **Done** | `ID_NUMBER_LENGTHS`; masked and raw both pass; passports counted whole |
| 322.5 | Surface FastAPI's `detail` in API errors | pos-system | **Done** | `lib/api.apiErrorMessage` + 6 tests |
| 322.6 | Detail page reuses the one drawer; delete the drifted copy | pos-system | **Done** | `ClientFormBody.tsx` deleted; seeding pinned by `clientFormSeeding.test.ts` |
| 322.7 | `notes` implemented end to end (it had no column, no DTO, no response field) | store-be + pos-system | **Done** | migration `f5a6b7c8d9e0`; `clientToDto` for the full-replace PUT |
| 322.8 | Client DTO contract tests — there were none | store-be | **Done** | `tests/test_client_request_dto.py`, 27 tests |
