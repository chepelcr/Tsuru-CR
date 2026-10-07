# Tsuru rename and email rollout

Local source, templates, scripts and infrastructure definitions now use Tsuru.
The rename is committed and pushed to the standalone repositories. The 2026-10-07
rollout used AWS account 947999370977, us-east-1, environment `dev`, verified from
SSM stage values and the shared Secrets Manager reference `tsuru/dev/database`.
GitHub Actions built and deployed the services; no local Docker was used.

## Emails and images

- Cognito: eight localized SES templates in `be/cognito-templates/ses/templates`.
- Platform: verification, password reset, welcome, account access and invitations use one table-based layout.
- Sales: issuer/receiver email layouts use the current palette and social header; merchant logos and PDF branding remain independent.
- Images: “Vendé a tu ritmo.” is the single slogan, left-aligned beneath the T.
- Publish landing brand assets before uploading the SES templates and deploying backend changes. Email clients fetch the absolute HTTPS PNG from the landing site.
- Upload Cognito templates using its existing pipeline. The trigger caches SES templates for the lifetime of a warm Lambda container; redeploy the trigger after upload so fresh containers fetch the updated templates.

## Persisted data

Applied `be/management-be/migrations/0026_tsuru_saved_identifiers.sql` to the platform database.
Applied sales Alembic revision `t9u0v1w2x3y4` (equivalent to the standalone theme SQL) using the existing SSM/Secrets configuration.
Both organization theme tables now have zero legacy IDs; the demo template was already canonical. Both preserve organization/template UUIDs and only change old identifier values. Browser theme reads normalize old IDs and write the canonical ID back to storage. Applied historical SQL keeps its old source values so fresh database creation can still migrate correctly.

The catalog shared Python package is now `tsuru_common`; all imports, Docker copy paths and package discovery were updated together. Rebuild data-service images together with the shared package. The sales base exception is now `TsuruException`, with its callers updated in the same checkout.

## Existing AWS resources

A template or stack filename change does not migrate an existing resource. Inventory the current stacks before cutover. Preserve Cognito pool/client IDs, existing user accounts, database identifiers, secrets and storage contents. Do not run destructive cleanup scripts to perform a rename.

Use `Infrastructure/scripts/migrate-brand-parameters.py` to preview copying each old SSM namespace to the canonical one. It is dry-run by default; `--apply` copies missing parameters, never overwrites a conflicting target, prints no values, and retains sources for rollback. The platform canonical namespace is `/tsuru/{env}/platform`; `settings.cfg` and the fallback agree on it. Configure each source/target prefix explicitly from the deployed inventory.

CloudFormation stack and export names require coordinated consumer updates. For replacement-sensitive resources (Cognito pools, databases, S3 buckets), use retention/import or a staged parallel cutover with data migration; do not allow an unattended replacement. S3 bucket names themselves cannot be renamed in place. Switch DNS and frontend URLs only after their Tsuru destinations are serving, and keep old domain redirects during the transition. Verify login, signup/resend, reset password, invitations, organization themes and storefront provisioning before retiring old resources.

Old names remain only as explicit migration inputs and previously applied SQL history. Git history and ignored/generated dependencies are outside the source rename.

## Live rollout verification — 2026-10-07

- Landing, POS, admin dashboard, management, data, sales, support image and Cognito workflows passed.
- All 34 data services and 10 sales services were rebuilt and updated together with their shared libraries.
- Support Lambda was updated to the immutable image produced by its image-only GitHub workflow.
- Cognito uploads the eight SES templates before its stack update; the template hash environment value recycles cached templates.
- Synthetic Cognito invocations covered signup, resend, reset, attribute verification and admin account creation in Spanish and English without sending email.
- The dedicated admin pool now uses the same branded CustomMessage function and SES sender, with a pool-scoped invocation permission. Its retained pool, client IDs, password policy and MFA setting are preserved in `Infrastructure/cognito/tsuru-admin-cognito.yml`.
- Organization invitation URLs now use `/tsuru/dev/platform/app/url` (`https://app.tsuru.jcampos.dev`), owned by the existing platform SSM stack. The admin dashboard URL remains its separate admin destination.
- All 50 Tsuru dev Lambda configurations were Active with Successful updates.
- The public organization slug check returned HTTP 200; the data gateway requires authentication as expected.
- Landing HTML includes absolute Open Graph/Twitter social-card URLs without requiring JavaScript. The published PNG returns HTTP 200, uses image/png and measures 1200×630.
- Store and infrastructure references already used canonical live resource names; no resource replacement or SSM prefix copy was required.

## Additional deployment checks

- Spanish and English published landing HTML each has one Open Graph image and one Twitter image tag, absolute HTTPS URLs, 1200×630 dimensions, PNG type and localized image descriptions. The live image SHA-256 matches the updated source artwork.
- Read-only Lambda requests successfully returned country catalog data and Hacienda document version 4.4 after the namespace rename.
- Startup probes identified a pre-existing missing `openpyxl` dependency in pharmaceutical forms. The dependency is now declared in both requirements and package metadata and deployed through the data workflow.
