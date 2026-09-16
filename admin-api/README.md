# Tsuru admin identity and API

This directory is intentionally owned and deployed from the root repository.
It is not referenced by a buildspec, CodePipeline, or backend deployment.

`generate_admin_api.py` builds an explicit API allowlist from the management
and data-service OpenAPI files. The normal management gateway excludes every
`/api/admin` route; the normal data gateway remains GET-only. Data mutations
are reachable only through this API and its dedicated admin Cognito pool.

Generate and validate without changing AWS:

```bash
pnpm run generate:admin-api
python3 admin-api/test_generate_admin_api.py
sam validate --lint --template-file admin-api/template.yml
sam validate --lint --template-file admin-api/admin-cognito.yml
```

Manual deployment:

```bash
pnpm run deploy:admin-api -- dev PACIFIC-PROD
```

After deployment, create administrators with Cognito `admin-create-user` and
copy the stack's `UserPoolId` and `UserPoolClientId` outputs into the local
dashboard environment. Self-registration is disabled and software-token MFA
is mandatory.

The command deploys, in order:

1. `tsuru-<environment>-admin-cognito`, the isolated administrator identity
   pool. It retains the pool on stack deletion and accepts only
   administrator-created users.
2. `tsuru-<environment>-admin-api`, the custom-domain REST API, access logs,
   Cognito authorizer, route allowlist, and scoped invoke permissions for the
   existing management/data Lambdas.

It does not deploy a backend Lambda, the AppSync Events stack, or the local
dashboard. To enable live support hints after the pool exists, update
`be/sales-be/cloudformation/appsync-events.yml` with the admin stack's
`UserPoolId` as `AdminUserPoolId`. Configure `fe/dashboard/.env` from the two
Cognito outputs and the `ApiEndpoint` output, then run:

```bash
pnpm --dir fe/dashboard dev
```

The deploy script resolves the `jcampos.dev` Route53 zone at runtime and uses
the selected AWS profile. No account IDs, pool IDs, or client IDs are stored in
this repository.
