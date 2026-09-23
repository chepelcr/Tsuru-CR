# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📍 Ecosystem roadmap — single source of truth (keep it updated)

**`docs/roadmap/tsuru_roadmap.md` is the living tracking document for the entire Tsuru
ecosystem** (TSR-### status board, broken-promise tracker, phase plan, pending manual
steps, changelog). On a fresh session, read it (at minimum §2 boards + §7 pending manual
steps) before planning ecosystem-level work.

**Upkeep is mandatory:** whenever work is completed, started, or newly decided — in this
monorepo OR in any of the split repos (`tsuru-platform-api`, `tsuru-pos-system`,
`tsuru-landing`) — update the roadmap in the same session: change the item's Status +
Evidence cells in §2, refresh §7 manual steps, and append a dated line to the §8
changelog (rules in §1). New work gets a new TSR ID; never renumber or delete rows.
The audit corpus in `docs/audit/tsuru/` is a historical record — do not edit it.

**Live status doc for the wire/DTO convergence.**
`docs/roadmap/wire_convergence_status.md` tracks the multi-repo snake_case +
typed-DTO effort (roadmap TSR-265..269): what is done, what is left, and the
decisions not to re-litigate. It is a **live** document — flip its status cells
and add the commit in the same session you change anything it describes. Start
there when resuming that work.

**QA analysis doc has an Excel twin — keep them in sync.** `docs/qa/POS_FE_QA_ANALYSIS.md`
is the source of truth for the POS FE QA/product analysis and has a generated workbook
`docs/qa/POS_FE_QA_ANALYSIS.xlsx` (one sheet per module, used by the QA team). Whenever the
analysis changes (new findings, status changes, new modules), update the data tables in
`docs/qa/generate_pos_qa_xlsx.py` to match the md and re-run it in the same session
(`python3 docs/qa/generate_pos_qa_xlsx.py`, requires `openpyxl`) so the xlsx never drifts.

## 🚧 Repository Split

This monorepo has been split into separate repositories. **Status of extracted components:**

**Frontend grouping (`fe/`, mirrors `be/`):** the split frontends were relocated under `fe/`
on 2026-06-12 (roadmap TSR-112), parallel to the `be/` backend grouping — `fe/landing`,
`fe/pos-system`, and `fe/dashboard`. Names strip the `tsuru-` repo prefix, like `be/`.

| Component | New repo | Status |
|---|---|---|
| `fe/pos-system` (Tsuru POS — standalone POS & Costa Rica/Hacienda e-invoicing system; **not** a store-front template) | [`chepelcr/tsuru-pos-system`](https://github.com/chepelcr/tsuru-pos-system) | Extracted; **untracked here** (2026-06-12); relocated to `fe/pos-system` (2026-06-12). Deploys via its own GH Actions to **GitHub Pages** at `app.tsuru.jcampos.dev` (the old S3/CloudFront `pos.j-markets.jcampos.dev` deploy is retired). Develop it there. |
| `fe/landing` (Tsuru landing — public marketing SPA + local JSON-driven content/admin DXP; deploys 100% static) | [`chepelcr/tsuru-landing`](https://github.com/chepelcr/tsuru-landing) | Extracted; **untracked here** (2026-06-12); relocated to `fe/landing` (2026-06-12). Deploys via its own GH Actions. Develop it there. |
| `fe/pos-landing` (Tsuru POS **product marketing site** — pricing/plans, live POS demo, own config-driven dashboard; **not** a storefront template) | — (tracked in this monorepo) | **Tracked here**; relocated from `templates/pos-landing` to `fe/pos-landing` (2026-08-23, TSR-142). No standalone repo exists. Scripts: `npm run dev:pos-landing` / `build:pos-landing` → `dist/pos-landing`. |
| `fe/dashboard` (platform-administration + support/audit console) | [`chepelcr/tsuru-admin-dashboard`](https://github.com/chepelcr/tsuru-admin-dashboard) | Extracted to a private repo and **untracked here** (2026-09-16). Deploys via its **own GH Actions** (OIDC → S3 + CloudFront) to `admin.tsuru.jcampos.dev` (2026-09-17). It also **owns its whole admin control plane** — admin Cognito, the generated admin API gateway, its SSM build config and its hosting — under `fe/dashboard/{cloudformation,api,deploys}` (moved out of the root `admin-api/` on 2026-09-17). |
| `be/cognito-templates` (Cognito `CustomMessage` trigger Lambda + the 8 SES email templates — every verification / forgot-password / invite mail the platform sends) | [`chepelcr/tsuru-cognito-templates`](https://github.com/chepelcr/tsuru-cognito-templates) | Private standalone Python/container repo, **untracked here** (cloned 2026-09-19, TSR-308). Deploys via its own GH Actions on push to `main` (build image → CFN stack → upload SES templates). **arm64, like every other Tsuru Lambda** — a mismatch between `Architectures` and the image platform breaks sign-up with no log line (TSR-137), and it carries a keep-warm rule because a cold image breaks it too (TSR-308). |
| `be/support-be` (support tickets, request audit, backend errors/catalog) | [`chepelcr/tsuru-support-be`](https://github.com/chepelcr/tsuru-support-be) | Private standalone FastAPI Lambda repo, **untracked here**. It has CI validation only; deployment is manual through root `deploys/deploy-support-control-plane.sh`. |
| `server` (Tsuru platform API — users, orgs, RBAC, CMS, multi-tenant backend; Express on Lambda) | [`chepelcr/tsuru-platform-api`](https://github.com/chepelcr/tsuru-platform-api) | Extracted to its own **private** repo; **untracked here** (2026-06-12). Deploys via its own GH Actions. Develop it there. |

**Rules after the split:**
- `fe/pos-system/`, `fe/landing/`, `fe/dashboard/`, `be/support-be/`, `be/cognito-templates/`, and `server/` are gitignored and **no longer tracked** in this repo. The folders may still exist locally as standalone working copies — never `git add -f` them back.
- The monorepo CodePipeline stages / buildspecs that referenced the split paths are obsolete — do not re-point them at the folders (roadmap TSR-090). Dashboard hosting is manual through the support-control-plane command, never an automatic root pipeline.
- **The admin control plane lives in the dashboard repo**, not here: `fe/dashboard/`
  owns `cloudformation/admin-cognito.yml`, `cloudformation/admin-dashboard-params.yml`,
  `cloudformation/hosting.yml`, `cloudformation/deploy-role.yml`, the generated
  gateway in `api/` (`generate_admin_api.py` + committed `template.yml`), and one
  deploy script per stack in `deploys/` (`deploy-all.sh` sequences them). The root
  `admin-api/` directory is **retired** (2026-09-17) — do not recreate it.
  Root convenience entry points: `pnpm run deploy:admin-api` and
  `pnpm run deploy:admin-control-plane` (both `-- <environment> <profile>`).
  `api/template.yml` is GENERATED from the backend OpenAPI sources in sibling
  checkouts (`TSURU_WORKSPACE_ROOT`); it is committed because those specs are not
  present in the dashboard repo's CI, so deploy there with `--skip-generate`.
  Never expose `/api/admin/**` through the normal management API.
- The support/event control plane is also manual-only. Use
  `bash deploys/deploy-support-control-plane.sh <environment> <profile>` from root;
  it consumes the immutable support image built by the private repo's GitHub
  Actions pipeline, then deploys Cognito/AppSync, support-be and the admin edge.
- `fe/pos-landing` is **not** one of the 8 storefront templates — it is the POS *marketing* site and is deliberately excluded from `npm run build:templates`. Keep it out of the template matrix.
- New work on the POS system belongs in `chepelcr/tsuru-pos-system`; new work on the landing site belongs in `chepelcr/tsuru-landing`; new work on the Express platform API belongs in `chepelcr/tsuru-platform-api` — not here. Mirror commits to the monorepo are no longer needed.

**Brand: Tsuru.** The public brand is **Tsuru** (formerly JMarkets). Do not write new
"JMarkets" brand text on any user-facing surface. Infra identifiers are NOT the brand and
stay as-is: domains (`tsuru.jcampos.dev`), buckets (`jmarkets-template-market`), template
POS theme ids `jmarkets`/`jmarkets-demo`, and the `jmarkets_common` lib. (The demo template was rebranded: `jmarkets-demo` -> `tsuru-demo` / repo `template-tsuru-demo`, 2026-07-03, Bribri content.)
See `docs/roadmap/tsuru_rebrand_plan.md` for scope.

## ⚠️ Security Guidelines

**CRITICAL: Never include sensitive information in code or documentation**

- ❌ **DO NOT** hardcode credentials, API keys, tokens, or passwords in code
- ❌ **DO NOT** commit sensitive values to git (use .env files which are gitignored)
- ❌ **DO NOT** include specific credentials in documentation (README, CLAUDE.md, CHANGES.md, etc.)
- ❌ **DO NOT** expose User Pool IDs, Client IDs, database URLs, or AWS account IDs in commits
- ✅ **DO** use environment variables for all sensitive configuration
- ✅ **DO** reference that credentials exist in .env files without showing actual values
- ✅ **DO** use placeholder examples like `your-key-here` or `xxxxx` in documentation
- ✅ **DO** validate that .env files are in .gitignore before committing

**Example - Bad:**
```md
User Pool ID: us-east-1_BUlvy0W4q
Database URL: postgresql://user:pass@host.com/db
```

**Example - Good:**
```md
User Pool ID: Available in .env as AWS_COGNITO_USER_POOL_ID
Database URL: Configure in .env as NEW_DATABASE_URL
```

### Authentication & Email Verification

**📘 See [AUTH_FLOW.md](./docs/app/AUTH_FLOW.md)** for complete authentication flow documentation.

**Security measures:**
- ✅ Email verification required before accessing the system
- ✅ Verification status checked on every profile fetch
- ✅ Unverified users automatically logged out
- ✅ Automatic user sync from Cognito to database for verified users
- ✅ Cognito is the single source of truth for authentication

**Validation flow:**
1. User logs in via AWS Cognito
2. Backend checks email verification status in Cognito
3. If unverified → Return 403 with `needsVerification: true`
4. If verified but not in DB → Auto-sync from Cognito
5. If verified and in DB → Return user profile

## Development Commands

### Server Management (Background Mode)

The server can run in **background mode** (silent, terminal stays available):

```bash
# Start server in background
./reboot-server.sh           # Kills existing processes, starts server in background
                             # Output redirected to logs/server.log
                             # Terminal immediately available

# View server logs
./view-logs.sh               # Real-time log viewing (tail -f logs/server.log)
tail -f logs/server.log      # Alternative direct command

# Stop server
./stop-server.sh             # Gracefully stop background server
pkill -f "tsx server"        # Alternative direct command

# Check server status
ps aux | grep "tsx server"   # View running server process
```

**How it works:**
- `reboot-server.sh` uses `nohup` and redirects output to `logs/server.log`
- Process continues even if terminal is closed
- Logs directory is gitignored automatically
- Shows process ID and helpful commands on startup

## Multi-Tenant Architecture

This application uses a sophisticated multi-tenant architecture where each organization gets isolated data and optional custom domains/subdomains.

### Organization Context Resolution

The `organizationContext` middleware (`server/src/middleware/organizationContext.ts`) resolves which organization a request belongs to by checking **5 sources in priority order**:

1. **Route parameters**: `/api/user/:userId/organization/:orgId` → Direct orgId lookup
2. **X-Organization-ID header**: Explicit organization selection
3. **Subdomain**: `storename.tsuru.jcampos.dev` → Organization lookup by subdomain
4. **Custom domain**: `www.customstore.com` → Organization lookup by custom domain
5. **Query parameter**: `?organizationId=xyz` → For testing/development only

Once resolved, the middleware populates the request object:
```typescript
req.organization      // Full organization object
req.organizationId    // Organization ID
req.userRole          // User's role in this organization
req.isOwner           // Boolean: is user the owner?
req.isAdmin           // Boolean: is user owner or admin?
```

### Frontend Subdomain Detection

The client detects subdomains using `client/src/lib/subdomain.ts`:
- `getSubdomain()` extracts subdomain from `window.location.hostname`
- `SubdomainProvider` in `App.tsx` calls `/api/organizations/by-subdomain/:subdomain`
- Organization context flows to all components via `useSubdomainContext()`

## API Route Structure

The backend uses a **three-tier URL structure** for multi-tenant isolation:

### Organization-Scoped Routes
```
/api/users/:userId/organization/:orgId/...
```

Requires authentication and organization membership. Examples:
- `/api/users/123/organization/456/products` - Product management
- `/api/users/123/organization/456/categories` - Category management
- `/api/users/123/organization/456/orders` - Order management
- `/api/users/123/organization/456/home-content` - CMS content
- `/api/users/123/organization/456/deployments` - Deployment history
- `/api/users/123/organization/456/upload` - S3 file uploads
- `/api/users/123/organization/456/rbac` - RBAC management

**Security Model (Lambda/API Gateway)**:
- ✅ **API Gateway** validates JWT signature and token expiration
- ✅ **API Gateway** validates `userId` in path matches JWT `sub` claim
- ✅ **Database queries** enforce user-scoping via WHERE clauses
- ❌ **No Express middleware** for auth (handled at infrastructure layer)

**Local Development**: Authentication still validated via `requireAuth` middleware

### User-Scoped Routes
```
/api/users/:userId/...
```

Requires authentication, no specific organization. Examples:
- `/api/users/123/profile` - User profile (auto-syncs from Cognito if verified)
- `/api/users/123/verify-email-complete` - Complete email verification
- `/api/users/123/organizations` - User's organizations
- `/api/users/123/memberships` - Organization memberships

**Security Model**: Same as organization-scoped routes (API Gateway validates userId)

### Public Routes
```
/api/...
```

No authentication required. Examples:
- `/api/health` - Health check
- `/api/organizations/check-slug/:slug` - Slug availability
- `/api/organizations/by-subdomain/:subdomain` - Organization lookup
- `/api/invitations/token/:token` - Get invitation details
- `/api/invitations/accept/:token` - Accept organization invitation

## Backend Architecture

### Three-Tier Pattern

The server follows strict separation of concerns:

```
Controllers (server/src/controllers/)
    ↓ (receive HTTP requests, validate input)
Services (server/src/services/)
    ↓ (business logic, orchestration)
Repositories (server/src/repositories/)
    ↓ (data access, Drizzle ORM queries)
Database (PostgreSQL via Supabase)
```

### RBAC System

**Hierarchical permission model**: `Role → Module → Submodule → Action`

- **Modules**: Top-level features (products, orders, customers, etc.)
- **Submodules**: Feature subdivisions (e.g., products.inventory, products.pricing)
- **Actions**: Operations (create, read, update, delete, export, etc.)
- **Roles**: Organization-scoped or system-wide (owner, admin, member)

**Permission checking** (`server/src/middleware/permissions.ts`):
```typescript
requirePermission('products', 'create', 'inventory')
requireAnyPermission([...permissions])
requireAllPermissions([...permissions])
```

**Role-based guards**:
- `requireOrganizationOwner()` - Owner role only
- `requireOrganizationAdmin()` - Admin or owner
- `requireOrganizationMembership()` - Any member

## Frontend Architecture

### Three-App Structure

This project has **three separate React applications**:

1. **landing-client/** - Pure marketing website
   - Port: 3001 in development
   - Deployment: `tsuru.jcampos.dev`
   - Routes: Landing, Planes (`/planes` + `/pricing`), Examples, About, Blog, Contact, Terms, Privacy, Cookies
   - Purpose: Public-facing marketing site **and the monetization surface** — the
     four-tier solidarity pricing model (Semilla/Cosecha/Cooperativa/Feria) lives in
     `src/content/plans.json`, edited at `/admin/plans` (TSR-084). Amounts stay behind
     `config.draftPricing` and CTAs stay inert behind `config.ctaComingSoon` until the
     backend lands. **Implementing plans in the BE/POS: read
     `docs/roadmap/tsuru_plans_implementation.md` first** (TSR-145) — especially §1,
     which lists the capabilities that are legally required and therefore can never be
     gated by plan (all receipt types, ATV contingency mode, data export, no commission).
   - Build output: `dist/landing/`
   - **NO authentication flows** (moved to dashboard)

2. **fe/dashboard/** - Complete admin application
   - Port: 5173 in development (Vite default)
   - Deployment: `admin.tsuru.jcampos.dev` and organization subdomains
   - Routes:
     - **Auth**: Login, Register, VerifyEmail, ForgotPassword, ResetPassword
     - **Organizations**: CreateOrganization (3-step onboarding), SelectOrganization, OrganizationSettings, AcceptInvitation
     - **Admin**: Dashboard, Products, Categories, Orders, Customers, CMS (ContentPage), Settings (General, Theme, Contact, Payment, Shipping), TeamMembers, Profile, DeploymentHistory
   - Purpose: Complete store management and administration
   - Build output: `dist/dashboard/`
   - **Contains all authentication and organization management**

3. **templates/** - Individual store frontends (public-facing stores)
   - Multiple independent Vite apps (tsuru-demo, tech-gadgets, vintage-fashion, artisan-crafts, gourmet-foods, fitness-hub, pet-care, beauty-essentials)
   - Deployment: Organization subdomains (`{org-slug}.tsuru.jcampos.dev`)
   - Purpose: Customer-facing e-commerce stores
   - Each template has unique design, colors, and components
   - See `templates/CLAUDE.md` (loads when working under `templates/`) for details

### **DEPRECATED: client/**
The old `client/` folder has been deprecated. All functionality migrated to `dashboard/`. See `client/DEPRECATED.md` for details.

All three apps use the same tech stack (React 18, Vite, Wouter, Tailwind, Radix UI) but serve different purposes.

### Frontend Standards & Patterns

**📘 See [FRONTEND_STANDARDS.md](./docs/app/FRONTEND_STANDARDS.md) for comprehensive frontend patterns including:**
- Translation system (i18n with LanguageContext)
- Styling standards (Tailwind CSS + CSS variables)
- Component architecture patterns
- Form validation patterns (React Hook Form + Zod)
- State management guidelines
- Custom hooks patterns
- Complete code examples

**Key highlights:**
- **Translation**: Custom LanguageContext with 840+ translation keys (EN/ES)
- **Styling**: Tailwind CSS with HSL-based CSS variables for theming, dark mode via class-based approach
- **Forms**: React Hook Form + Zod validation for all forms
- **Components**: Shadcn/ui component library based on Radix UI primitives
- **State**: React Query (server), Zustand (client persistent), Context (UI global), useState (local)

### Organization Onboarding Flow (dashboard)

**Multi-step draft organization creation** with progressive data saving:

1. **Step 1 (Basic Info)**: Creates organization draft with `onboardingStep = 1`
   - POST `/api/users/:userId/organizations`
   - Saves: name, slug, subdomain, ownerId
   - User can navigate away without losing data

2. **Step 2 (Contact Info)**: Updates contact settings with `onboardingStep = 2`
   - POST `/api/users/:userId/organizations/:id/onboarding/step2`
   - Saves: email, phone, address (optional)
   - Organization persisted as draft

3. **Step 3 (Template Selection)**: Applies template and marks complete with `onboardingStep = 3`
   - POST `/api/users/:userId/organizations/:id/onboarding/step3`
   - Clones selected template content to organization
   - Organization now ready to use

**SelectOrganization page behavior:**
- Shows all organizations with onboarding status badges
- Incomplete organizations (onboardingStep < 3) display "Click to continue setup"
- Does NOT auto-redirect if user's only organization is incomplete
- Allows resuming incomplete organization setup

### State Management

**Server State**: TanStack React Query (`fe/dashboard/src/lib/queryClient.ts`)
- 5-minute stale time for queries
- Automatic AWS Cognito token injection via custom `queryFn`
- Mutations invalidate related queries on success

**Client State**: Zustand for cart (in templates/)
- Persisted to localStorage
- Actions: addToCart, removeFromCart, updateQuantity, clearCart

### Custom Hooks

- `useAuth()` (`fe/dashboard/src/hooks/useAuth.ts`) - Authentication lifecycle with AWS Cognito
  - **📘 See [AUTH_FLOW.md](./docs/app/AUTH_FLOW.md)** for complete authentication flow documentation
  - Handles login, registration, email verification, and user profile management
  - Automatic user sync from Cognito to database
  - Email verification validation on every profile fetch
- `useOrganization()` (`fe/dashboard/src/hooks/useOrganization.ts`) - Organization CRUD, members, invitations
  - Includes `completeOnboardingStep2` and `completeOnboardingStep3` mutations
- `useCmsContent()` (`fe/dashboard/src/hooks/use-cms-content.tsx`) - Dynamic CMS content loading
- `useSubdomainContext()` - Access current tenant organization from context

### API Integration Pattern

URL builders in `fe/dashboard/src/lib/apiUtils.ts` construct the three-tier API structure:

```typescript
buildOrgApiUrl(userId, orgId, '/products')
  → '/api/user/123/organization/456/products'

buildUserApiUrl(userId, '/organizations')
  → '/api/user/123/organizations'

buildPublicApiUrl('/organizations/check-slug/my-org')
  → '/api/organizations/check-slug/my-org'
```

All requests automatically include AWS Cognito JWT tokens via React Query's `queryFn`.

## Database (Drizzle ORM)

### Schema Location
All entity definitions are in `server/src/entities/`:
- `Organization.ts` - Multi-tenant store representation
- `Product.ts`, `Category.ts`, `Order.ts` - Core commerce entities
- `User.ts`, `OrganizationMember.ts` - User and membership
- `Role.ts`, `RolePermission.ts`, `Module.ts`, `Action.ts` - RBAC entities
- `HomePageContent.ts` - CMS content

### Migration Workflow

**Configuration**: `drizzle.config.ts` points to `server/src/entities/index.ts`

```bash
# Development: Push schema changes directly (⚠️ can lose data)
npm run db:push

# Production: Generate migration files
npm run db:generate  # Creates migrations/*.sql
# Then manually review and apply migrations
```

### Key Relationships

```
User ←→ OrganizationMember ←→ Organization
                ↓
              Role → RolePermission → Module/Action

Organization → Product → Category
Organization → Order
Organization → HomePageContent
```

## Important Patterns to Understand

### Security-at-the-Edges Pattern

**Lambda + API Gateway Deployment:**
- ✅ API Gateway validates JWT and enforces `userId` path matching
- ✅ Database queries enforce user/organization scoping in WHERE clauses
- ❌ No Express middleware for authentication (handled at infrastructure layer)
- ✅ Business logic focuses purely on data operations

**Local Development:**
- ✅ `requireAuth` middleware validates JWT tokens
- ✅ Optional: `organizationContext` and `userContext` middleware (currently removed)
- ✅ Consistent security model via database query scoping

**Migration Note**: Authentication middleware (`requireAuth`, `organizationContextMiddleware`, `userContextMiddleware`) were removed in favor of infrastructure-layer security (API Gateway). The `organizationContext.ts` file remains for reference but is not actively used in routes.

Located in: `server/src/middleware/organizationContext.ts` (historical reference only)

### Permission Checking Pattern

RBAC permissions are checked at the route level:

```typescript
router.post(
  '/',
  permissionMiddleware.requirePermission('products', 'create'),
  productController.create.bind(productController)
);
```

Special roles:
- `platform_admin` - Has all permissions globally
- `owner` - Full control within organization
- `admin` - Management privileges within organization

Located in: `server/src/middleware/permissions.ts`

### Frontend Auth Token Injection

React Query automatically injects AWS Cognito tokens into all API requests:

1. Custom `queryFn` in `queryClient.ts` wraps all queries
2. Calls `fetchAuthSession()` from aws-amplify/auth
3. Extracts ID token from session
4. Adds `Authorization: Bearer <token>` header
5. Backend validates token via Cognito

Located in: `client/src/lib/queryClient.ts`

### Subdomain-to-Organization Resolution

**Frontend flow** (Active):
1. App loads → `getSubdomain()` detects subdomain from hostname
2. `SubdomainProvider` calls public API: `/api/organizations/by-subdomain/:subdomain`
3. Organization data stored in React context
4. Components access via `useSubdomainContext()`
5. All organization-scoped API calls include orgId from context

**Backend flow** (Simplified):
1. Controllers receive `orgId` from route path (`/api/users/:userId/organization/:orgId/...`)
2. Services use `orgId` directly in database queries with user-scoping
3. No middleware resolution needed (orgId is explicit in URL)

**Legacy approach**: Previously used `organizationContext` middleware to auto-detect org from subdomain/header/query. Now frontend passes orgId explicitly in URL path for clarity.

Located in:
- Frontend: `client/src/lib/subdomain.ts`, `client/src/App.tsx`
- Backend: Controllers receive orgId via path params
