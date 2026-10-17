# Combined pending-changes release — 2026-10-17

The owner authorized reviewing, pushing and deploying all pending source changes.
The scope is the seven repositories with changed release files: root workspace,
POS, landing, admin dashboard, management API, Cognito email templates and shared
Cognito infrastructure. Other frontend/backend/template repositories had no
pending changes or unpushed commits when inventoried.

## Included changes

- Account/organization/fiscal onboarding, six-box automatic verification,
  immediate profile/tutorial handoff, final 50/50 profile alignment and independent
  WhatsApp country selection.
- Optional fiscal setup, organization settings summaries/edit drawers, nine
  bundled template previews and shared drawer section positioning.
- Rectangular language flags in POS, landing and admin.
- Signup PostConfirmation welcome email, ten SES templates, verified-profile guard,
  and public WhatsApp mapping without duplicate international prefixes.
- Pending audit documents, the billing planning document and six local design skill
  source packages. Split repositories remain separate; temporary audit outputs and
  accidentally generated root package-manager files are excluded. The latter were
  preserved in a temporary backup outside the repository.

## Validation

- POS: 101 files / 851 tests passed; style/type checks and production build passed.
- Management API: 24 files / 235 tests passed; type check and deployment Lambda
  bundle passed. The generic local esbuild command hit an existing package shim
  issue; the actual Lambda build uses the working JavaScript API.
- Cognito email handler: nine tests passed; CloudFormation template validated.
- Landing: types, environment loader, node checks, build, 22-page static output and
  public-content import checks passed.
- Admin: types, environment loader and production build passed.
- Changed/new source was checked for credential patterns; no findings. All
  repositories passed whitespace checks.
- The account-pool change set preserves every existing parameter. It changes
  LambdaConfig in place; the user pool has no replacement. A private before/after
  snapshot checks that identifiers, clients, domain and authentication/email
  settings are retained.

## Deployment evidence

- Email handler: `6629262`, successful workflow `39061511309`.
- Shared pool template: `28c3c12`; reviewed change set `welcome-hook-20261017`
  applied successfully. PostConfirmation now points to the deployed email handler;
  CustomMessage and the before/after account settings match exactly. Deployed
  warm-up invoke passed; both localized SES welcome templates rendered correctly.
- Landing: `2ea970e`, successful Pages workflow `39061511518`; live HTTP 200.
- Admin: `13d8df5`, successful workflow `39061512012`; live HTTP 200.
- Management API: `93e0fa6`, successful workflow `39061775622`, released after the hook was verified.
- POS: `8ab8d2e`, successful Pages workflow `39061892563`, released after the API.
  Live entry and registration chunks load with HTTP 200; all nine template JPEGs
  match the committed source byte-for-byte. The deployed API runtime health
  returns HTTP 200 through operator invocation; its public gateway stays protected.

No test user, live email or customer-data mutation is part of deployment
verification. Live inbox acceptance remains a separate authenticated signup check.

All five deployment workflows succeeded. Admin verification workflow
`39061511972` also passed. All changed standalone repositories are committed and
pushed; the root documentation/design-source commit completes the source release.

Deployment links:

- [POS](https://github.com/chepelcr/tsuru-pos-system/actions/runs/39061892563)
- [Management API](https://github.com/chepelcr/tsuru-management-be/actions/runs/39061775622)
- [Email](https://github.com/chepelcr/tsuru-cognito-templates/actions/runs/39061511309)
- [Landing](https://github.com/chepelcr/tsuru-landing/actions/runs/39061511518)
- [Admin](https://github.com/chepelcr/tsuru-admin-dashboard/actions/runs/39061512012)
