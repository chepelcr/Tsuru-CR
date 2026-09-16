# Platform support and incident rollout

This implementation is code-complete locally; no dashboard or backend stack was
manually deployed in this change. The dashboard remains a local platform-admin
console. Do not deploy `be/management-be/cloudformation/lambda.yml` as-is: its
Lambda `Code.ZipFile` is a placeholder and would replace the live bundle.

## Deployment/configuration order

1. Apply `be/management-be/migrations/0021_create_support_system.sql` before
   serving the new support routes. The platform API must still have a working
   database to persist support and incident records.
2. Add the `support` AppSync Events channel namespace in
   `be/sales-be/cloudformation/appsync-events.yml`. Its subscribe authorizer
   restricts `/support/{sub}` to the caller's Cognito `sub`; publishers use IAM.
   Apply the management Lambda role's `appsync:EventPublish` support policy
   without replacing the live Lambda code with the CFN placeholder.
3. Configure one high-entropy `SUPPORT_INGEST_TOKEN` secret for management-be
   and the sales, store and data backend Lambdas. Set each producer's
   `SUPPORT_INCIDENTS_URL` to
   `https://api.tsuru.jcampos.dev/api/public/support/backend-incidents`.
   The backend-ingest route refuses requests when the token is absent or wrong;
   provision the secret through your deploy layer, never in Git or Vite env.
4. Regenerate/deploy the management API Gateway spec, then ship the real Lambda
   bundle. The two public incident endpoints are unauthenticated by the gateway
   so login, registration and landing can report failures. The anonymous route
   never accepts an org/user claim and limits distinct reports per reporter.
5. Set the POS/dashboard `VITE_APPSYNC_EVENTS_URL` to the Events HTTP endpoint
   when available. Missing push configuration only delays refresh: tickets and
   incidents are persisted and re-read after a reconnect. The dashboard's
   `.env.example` has the local API/Cognito variables; the landing has an
   optional `VITE_PLATFORM_API_URL` override.
6. Run the template seed to replace generic beauty demo rows for the seven
   non-beauty templates. New organizations clone the revised rows after the
   seed; existing organization CMS copies are not overwritten automatically.

## What raises an admin incident

- POS React render failures, uncaught browser errors, rejected promises, and
  actual 5xx responses from management, orders or sales API requests.
- The public POS and landing surfaces use anonymous incidents until a signed-in
  POS user and verified org membership are known.
- Server-side HTTP 5xx responses and uncaught HTTP exceptions in sales/data
  services using their shared FastAPI config, and the store FastAPI app. These
  emit service, module, operation/path, status and error name/message when an
  exception exists. The management API records its own 5xx best-effort.
- Health endpoints and ordinary 4xx validation/auth failures are not monitored.

The shared-secret forwarding is best-effort. If the platform API/database is
unavailable at the same time, backend incidents may not persist; platform API
errors from POS are queued locally and retried. Background-only SQS failures,
API Gateway failures before Lambda, and full-service outages require separate
CloudWatch/SNS incident ingestion in the deploy layer. The local dashboard
shows an API loading error when its own management requests fail.
