# Browser origins in SSM

CORS origin lists are comma-separated strings. The logical configuration key is
`cors.allowed-origins`; it maps to the following SSM names:

| Backend | Development parameter |
| --- | --- |
| Public content | `/tsuru/dev/content-api/cors/allowed-origins` |
| Blog | `/tsuru/dev/blog-api/cors/allowed-origins` |
| Support | `/tsuru/dev/support-api/cors/allowed-origins` |
| Store | `/tsuru/dev/cd-backend/cors/allowed-origins` |
| Sales (all HTTP Lambdas, including API-key management) | `/tsuru/dev/commondata/cors/allowed-origins` |
| Platform / management | `/tsuru/dev/platform/cors/allowed-origins` |

Use `stag` and `prod` in place of `dev` for those environments. Sales deliberately
uses the shared namespace rather than the individual Lambda's app namespace.
The other services use their existing configured base path.

Infrastructure ownership lives in `tsuru-infrastructure/cors/template.yml`
(mirrored here at `Infrastructure/cors/template.yml`). All six development
parameters were imported into `tsuru-dev-cors-ssm-params`. The companion deploy
script preserves existing SSM values and accepts origin overrides without source
edits. New staging/production settings require explicit values.

Edit the String parameter in AWS Systems Manager Parameter Store. Preserve every
origin that must remain allowed. Use an exact scheme, hostname and port, without
a trailing slash. The landing dev server uses `http://localhost:3001`; `127.0.0.1`
is a different origin. No origin-list source edits or content publication are needed.

Public, blog, support and platform use their existing SSM-first config resolver,
then `CORS_ALLOWED_ORIGINS`, then the prior default policy. Store and sales use
their existing environment-first resolver, then SSM, then prior defaults. Sales
still permits its first-party domain regex and uploads CDN; store still permits
its first-party regex. A narrowed explicit list does not remove those policies.

Origin lists are captured when the application starts. After editing a parameter,
restart a local server or recycle the Lambda execution environments (a configuration
update or deployment). The config clients cache SSM reads; waiting for the cache
TTL alone does not rebuild already-created CORS middleware. Validate both OPTIONS
and a real GET: successful preflight alone is insufficient.

On 2026-10-05, development parameters were created with the existing policies,
including `http://localhost:3001` for the public content API. Source changes and
targeted tests exist in each independent backend repository. The public API's
SSM reader was released and verified using an authenticated GET from
`http://localhost:3001`, with the temporary CORS environment override removed.
An unlisted origin received no CORS allow-origin header. Other backend readers
need their normal code release before they use the new parameters.
