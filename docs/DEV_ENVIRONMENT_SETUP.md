# Tsuru — Development Environment Setup

How to stand up the whole Tsuru ecosystem on a fresh machine and get every repo
wired together. Pair this with `docs/roadmap/tsuru_roadmap.md` (the living status
board) and each repo's own `CLAUDE.md`.

> **Security:** this guide never contains secrets. Credentials come from AWS
> Secrets Manager, CloudFormation stack outputs, or per-repo `.env` files (all
> gitignored). Where a value is needed, the guide says **where to fetch it**.

---

## 1. Architecture at a glance

```
                         ┌─────────────── AWS account: PACIFIC-PROD (947999370977, us-east-1) ───────────────┐
 Landing (GH Pages)      │  Cognito user pool (auth)  ·  W7 guest identity pool (anon storefront signing)     │
 tsuru.jcampos.dev       │  Route53 zone jcampos.dev (Z08953202H0791MTWJHTP)  ·  Secrets Manager  ·  SSM      │
                         │                                                                                    │
 POS (GH Pages)          │  API Gateways (custom domains):                                                    │
 app.tsuru.jcampos.dev   │   api.        → management-be (tsuru-${env}-api-handler, Node/Express Lambda)       │
                         │   orders-api. → store-be      (cd-backend-${env}-lambda, Py/FastAPI)               │
 Dashboard (GH Pages)    │   sales-api.  → sales-be      (container Lambdas)                                   │
 admin.tsuru.jcampos.dev │   data-api.   → data-be       (35 hacienda-* Lambdas)                              │
                         │   public-api. → GUEST federation of the above (AWS_IAM/SigV4)  [W1]                │
 Templates (GH Pages)    │                                                                                    │
 {name}.examples.        │  Org-site provisioner (sales-be infrastructure-service-provider): SNS→SQS→Lambda   │
 tsuru.jcampos.dev       │   mirrors a template example → per-org S3+CloudFront+Route53                        │
                         │   org sites at {subdomain}.stores.tsuru.jcampos.dev  [W2]                          │
 Shared DB               └────────────────────────────────────────────────────────────────────────────────┘
 Supabase (external Postgres) — all backends share it via Secrets Manager `tsuru/dev/database`
```

**Storefront data flow:** template SPA → `@chepelcr/tsuru-storefront-sdk` (guest
SigV4 signing) → `public-api.tsuru.jcampos.dev` → federated to management-be /
store-be / data-be. Demo reads template rows (`/api/templates/{id}/…`); live org
sites read the org (`/api/public/organizations/{orgId}/…` + `/api/organizations/{orgId}/…`).

---

## 2. Prerequisites (tooling)

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS (24 works) | `nvm`/`fnm` recommended |
| pnpm | 9–10 | Templates/landing/POS/SDK use pnpm (`corepack enable`) |
| Python | 3.12 | Backends (store/sales/data-be); `psycopg[binary]` for DB scripts |
| AWS CLI | v2 | profile `PACIFIC-PROD` |
| AWS SAM CLI | ≥1.150 | Lambda deploys (`python -m samcli` if `sam` not on PATH) |
| GitHub CLI | `gh` | auth with `read:packages` scope (see §5) |
| Docker | any | container-Lambda builds (data-be/sales-be) — mostly done in CI |

---

## 3. AWS access

```bash
aws configure --profile PACIFIC-PROD      # keys from the account owner / IAM user
aws sts get-caller-identity --profile PACIFIC-PROD   # expect Account 947999370977
```

Fixed infra you'll reference:

| Thing | Value / where to get it |
|---|---|
| Account | `947999370977` (PACIFIC-PROD) |
| Region | `us-east-1` |
| Route53 hosted zone (jcampos.dev) | `Z08953202H0791MTWJHTP` |
| Cognito **user** pool + client | `aws cloudformation describe-stacks --stack-name tsuru-cognito --query "Stacks[0].Outputs"` |
| W7 **guest** identity pool | `us-east-1:be94bc45-883e-44ff-9eb7-3e58c23ea9e8` (public; baked into template bundles) |
| Public API id | `aws cloudformation describe-stacks --stack-name tsuru-dev-public-api --query "Stacks[0].Outputs"` |
| Shared DB creds | Secrets Manager secret **`tsuru/dev/database`** (host/port/username/password/dbname). Never printed. |
| Env→SSM prefix | `/tsuru/{env}/{service}` (e.g. `/tsuru/dev/cd-backend`, `/tsuru/dev/commondata`) |

MSYS/Git-Bash gotcha: prefix AWS calls with `export MSYS_NO_PATHCONV=1` so
leading-slash args (log groups, `file://`) aren't path-mangled.

---

## 4. Repos + clone layout

The **monorepo** is `chepelcr/Tsuru-CR` (this repo). The split repos are cloned as
working copies **inside** the monorepo tree but are **gitignored** there (see
`.gitignore`). Clone layout:

```
E:/dev/Tsuru/                         # monorepo (chepelcr/Tsuru-CR) — branch: develop
├─ fe/
│  ├─ landing/                        # chepelcr/tsuru-landing            (GH Pages)   [ignored]
│  ├─ pos-system/                     # chepelcr/tsuru-pos-system         (GH Pages)   [ignored]
│  ├─ storefront-sdk/                 # chepelcr/tsuru-storefront-sdk     (GH Packages)[ignored]
│  └─ dashboard/                      # chepelcr/tsuru-admin-dashboard (private/local-only) [ignored]
├─ be/
│  ├─ management-be/                  # chepelcr/tsuru-management-be (private)          [ignored]
│  ├─ store-be/                       # chepelcr/tsuru-store-be                          [ignored]
│  ├─ sales-be/                       # chepelcr/tsuru-sales-be                          [ignored]
│  ├─ data-be/                        # chepelcr/tsuru-data-be                           [ignored]
│  └─ support-be/                     # chepelcr/tsuru-support-be (private/manual deploy)[ignored]
├─ templates/
│  ├─ gourmet-foods/  …               # chepelcr/template-<name> (×8)                   [ignored]
├─ Infrastructure/                    # chepelcr/tsuru-infrastructure (public-api gen, cognito, iam) [ignored]
└─ (docs, cloudformation, deploys, admin-api — tracked)
```

Clone commands (run from `E:/dev/Tsuru`):

```bash
git clone https://github.com/chepelcr/tsuru-landing.git          fe/landing
git clone https://github.com/chepelcr/tsuru-pos-system.git       fe/pos-system
git clone https://github.com/chepelcr/tsuru-storefront-sdk.git   fe/storefront-sdk
git clone https://github.com/chepelcr/tsuru-management-be.git    be/management-be
git clone https://github.com/chepelcr/tsuru-store-be.git         be/store-be
git clone https://github.com/chepelcr/tsuru-sales-be.git         be/sales-be
git clone https://github.com/chepelcr/tsuru-data-be.git          be/data-be
git clone https://github.com/chepelcr/tsuru-support-be.git       be/support-be
git clone https://github.com/chepelcr/tsuru-admin-dashboard.git  fe/dashboard
for n in gourmet-foods artisan-crafts beauty-essentials fitness-hub \
         tsuru-demo pet-care tech-gadgets vintage-fashion; do
  git clone "https://github.com/chepelcr/template-$n.git" "templates/$n"
done
# (template-tsuru-demo is the former template-jmarkets-demo, rebranded 2026-07-03)
git clone https://github.com/chepelcr/tsuru-infrastructure.git Infrastructure
```

> `.gitignore` already lists all of these, so they never get committed into the
> monorepo. Never `git add -f` them back.

---

## 5. GitHub Packages (the storefront SDK)

Templates consume `@chepelcr/tsuru-storefront-sdk` from **GitHub Packages**.

**Local dev** — create `~/.npmrc` (or a repo `.npmrc`, already committed in each
template) and export a PAT with `read:packages`:

```
@chepelcr:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```
```bash
export NODE_AUTH_TOKEN=$(gh auth token)   # gh account must have read:packages
```

**CI** — each template workflow sets `permissions: packages: read` and
`NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (same-owner public package). Missing
`packages: read` → `ERR_PNPM_FETCH_403`.

**Publish a new SDK version** (from `fe/storefront-sdk`): bump `package.json`,
`git tag vX.Y.Z && git push --tags` → the repo's `publish.yml` publishes via
`GITHUB_TOKEN`. Then bump the version in each template.

---

## 6. Per-component config & how to run

### Backends (management-be / store-be / sales-be / data-be / support-be)
- Config resolves: env vars first → else AppConfig → SSM `/tsuru/{env}/{service}/…`
  → DB creds via Secrets Manager `tsuru/{env}/database`.
- Local `.env` (gitignored) per repo — see each `.env.example`. Never commit real values.
- **management-be** (pnpm): `pnpm i && pnpm run dev` (:5000). Migrations: numbered
  SQL in `migrations/` applied with `pnpm run db:run-migration migrations/<f>.sql`
  (schema is otherwise synced via `db:push`; there is no drizzle migration table).
- **store/sales/data-be** (Python): `pip install -r requirements.txt`; alembic under
  `alembic/`. Deploy via each repo's GH Actions (OIDC → ECR/SAM) or `deploys/*.sh`.
- **support-be** (Python): generated standalone FastAPI Lambda. CI validates only;
  deploy manually from root with `bash deploys/deploy-support-control-plane.sh dev PACIFIC-PROD`.

### Frontends
- **landing** (`fe/landing`): pnpm; GH Pages at `tsuru.jcampos.dev`. Build env in the
  workflow / repo secrets (`VITE_API_URL=https://api.tsuru.jcampos.dev`, Cognito ids).
- **pos-system** (`fe/pos-system`): pnpm; GH Pages at `app.tsuru.jcampos.dev`. Reads
  `VITE_API_URL`/`VITE_ORDERS_API_URL`/`VITE_SALES_API_URL`/`VITE_DATA_API_URL`/`VITE_SUPPORT_API_URL`
  (all `*.tsuru.jcampos.dev`) + Cognito ids.
- **dashboard** (`fe/dashboard`, private standalone repo): local-only. Run
  `pnpm run env:ssm -- dev PACIFIC-PROD && pnpm run dev`; its CI does not deploy.
- **templates** (`templates/*`): pnpm; GH Pages at `{name}.examples.tsuru.jcampos.dev`.
  Each `main.tsx` calls `configureStorefrontAmplify({identityPoolId, region})`; the
  demo `public/config.json` carries the **template UUID**; workflow env supplies
  `VITE_IDENTITY_POOL_ID` + `VITE_AWS_REGION`. Data goes through the SDK → public API.

### storefront-sdk (`fe/storefront-sdk`)
```bash
cd fe/storefront-sdk && npm install && npm run build   # tsc → dist/
```

### Infrastructure / public API
- `Infrastructure/public-api/`: `public_api_config.json` is the route allowlist;
  `python gen_public_api.py -o template.yml` regenerates, then `bash deploy.sh`
  (or `python -m samcli deploy --config-env dev`). Stack `tsuru-dev-public-api`.
- The org-site provisioner lives in `be/sales-be/app/infrastructure-service-provider`
  (Lambda `tsuru-dev-infrastructure-service-provider-lambda`, SNS
  `tsuru-dev-organization-events`). See [[org-site-provisioner-live]] notes in the roadmap.

---

## 7. Smoke tests

```bash
export MSYS_NO_PATHCONV=1
curl -s -o /dev/null -w "%{http_code}\n" https://api.tsuru.jcampos.dev/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://tsuru.jcampos.dev/            # landing
# Guest-signed public API (needs the W7 identity pool): see scratchpad guest_call.py
```

A live org storefront should serve a signed bundle (`AWS4-HMAC`, `public-api`) with a
`config.json` of `{mode:"live", orgId:"<uuid>", templateId:"<name>"}` — note **orgId
is the org UUID**, never the slug (slug is only the subdomain + S3 bucket name).

---

## 8. Deploy paths (who deploys what)

| Component | Mechanism | Target |
|---|---|---|
| management/data/sales/store-be | each repo's GH Actions (OIDC → SAM/ECR) | `*-api.tsuru.jcampos.dev` |
| landing / pos-system / templates | each repo's GH Actions → GitHub Pages | `tsuru.` / `app.tsuru.` / `{name}.examples.tsuru.` |
| storefront-sdk | tag `v*` → `publish.yml` | GitHub Packages |
| public API | manual: `gen_public_api.py` + `sam deploy` | `public-api.tsuru.jcampos.dev` |
| org sites | provisioner Lambda (SNS event) | `{subdomain}.stores.tsuru.jcampos.dev` |
| dashboard | monorepo CodePipeline (`buildspec-frontend-dashboard.yml`) | `admin.tsuru.jcampos.dev` |

Keep `docs/roadmap/tsuru_roadmap.md` updated when you complete/start work (per the
repo policy in the root `CLAUDE.md`).
