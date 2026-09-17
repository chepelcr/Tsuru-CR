# Support, backend-error, and request-audit rollout

The support plane is backend-owned. Browser applications do not report their
own crashes or replay failed HTTP responses into an internal ingest endpoint.
POS only calls support-be for deliberate user ticket actions.

## Runtime flow

1. Every backend HTTP middleware emits `AUDIT_REQUEST_COMPLETED` to the audit
   SNS topic with service, request type, route, status, duration, request ID,
   and user/org identifiers when available. Login, registration and other
   unauthenticated requests remain valid audit records with nullable identity.
2. A 5xx response or uncaught exception also emits
   `BACKEND_ERROR_OCCURRED`. Its public response still contains only the common
   ErrorResponse DTO/catalog code; exception name/message/stack are confined to
   the protected event.
3. SNS message-attribute filters deliver audit and error events to independent
   SQS queues and DLQs. The support Lambda consumes both with partial-batch
   failure reporting and idempotent event IDs.
4. The administrator dashboard reads tickets, backend errors, the catalog, and
   audit history through the dedicated admin API/Cognito plane. The customer
   support gateway at `https://support.tsuru.jcampos.dev` exposes only
   `/api/support/**`; `/api/admin/**` is omitted.
5. Ticket image evidence is uploaded directly to a private, encrypted S3
   bucket with short-lived PUT URLs. The support Lambda validates type/size,
   confirms the uploaded object, and issues five-minute read URLs only after
   rechecking ticket access (or admin-edge access).
6. After a backend error is durably inserted, support-be publishes a
   best-effort AppSync hint to `/support/platform`. Only identities issued by
   the isolated admin pool can subscribe to that shared channel. Ticket
   changes publish the same admin hint or a per-customer `/support/{sub}` hint;
   the event contains no stack trace or ticket body and only invalidates the
   corresponding persisted query.

## Manual deployment order

No dashboard or support API auto-deploy is configured. Use `PACIFIC-PROD` and
run from the root repository:

```bash
bash deploys/deploy-support-control-plane.sh dev PACIFIC-PROD
```

That command deploys admin Cognito, authorizes its `/support/platform` channel
on the existing AppSync Events stack, deploys the support Lambda and two
SNS/SQS event stacks, and wires the customer support and private administrator
API gateways. It then writes `/tsuru/dev/admin-dashboard/**`, builds the
private dashboard with pnpm, and publishes the manual S3/CloudFront site at
`https://admin.tsuru.jcampos.dev`. The support gateway owns
`/tsuru/dev/platform/api/support-url`, which POS resolves during its pnpm build.

The command deliberately does not mutate the database. Apply the migration and
seed explicitly after reviewing the target secret:

```bash
cd be/support-be
ENVIRONMENT=dev AWS_PROFILE=PACIFIC-PROD bash scripts/migrate-db.sh upgrade head
ENVIRONMENT=dev AWS_PROFILE=PACIFIC-PROD python -m app.scripts.seed_error_catalog
```

The initial support Alembic revision adopts the live tables previously created
by management migrations 0021/0022 with `IF NOT EXISTS`, preserves their rows,
and adds `support_evidence`, `audit_records`, and `backend_errors`. It also
removes the customer-users FK from message authors because admin replies use
the isolated admin Cognito pool. Its downgrade intentionally
does not drop adopted ticket/catalog data.

Deploy management-be, data-be, sales-be, and store-be after the topics exist so
their HTTP middleware starts publishing. Each producer has an inline policy
for the deterministic audit/error topic ARNs, so its CloudFormation stack does
not depend on a support-stack export. The current image/code pipelines do not
apply Lambda-role template changes: explicitly run data-be and sales-be
`deploys/deploy-sam-stacks.sh`, store-be `deploys/deploy-lambda.sh`, and the
management role/IAM rollout after reviewing that repo's placeholder-code
warning. Then deploy POS so `VITE_SUPPORT_API_URL` is loaded from SSM. The
dashboard can also still run locally against the same deployed control plane:

```bash
pnpm --dir fe/dashboard env:ssm -- dev PACIFIC-PROD
pnpm --dir fe/dashboard dev
```

## Acceptance checks

- create a POS ticket, open it in the admin dashboard, reply, and observe the
  POS polling refresh;
- create a ticket with JPG/PNG/WebP/GIF evidence, open the private image from
  both POS and the admin gateway, and reject a non-image or image over 5 MB;
- confirm `support.tsuru.jcampos.dev` resolves to the customer support gateway
  and that its SSM URL matches the custom domain;
- call an authenticated backend route and confirm an audit row with user/org;
- call a login/registration route before authentication and confirm a nullable
  user/org audit row;
- force a real backend 500 (not `/health`) and confirm one audit row plus one
  backend-error row with the stable catalog code and an AppSync invalidation in
  the open admin dashboard;
- confirm normal 4xx responses create audit rows but not backend-error rows;
- confirm each queue filter matches only its own `eventType`, and retry/DLQ
  behavior does not duplicate stored event IDs;
- confirm `/api/admin/**` is absent from the customer support gateway and is
  protected by the dedicated admin Cognito authorizer on the admin domain.

API Gateway failures before Lambda invocation and complete AWS regional
outages cannot be emitted by application middleware; those remain CloudWatch
and infrastructure-alarm concerns, not health-endpoint polling.
