# Dynamic tutorial analysis and implementation

15 October 2026. Scope: the standalone POS application in `fe/pos-system`, based on the supplied `flows/app_tutorial_workflow.md`. Implemented and verified locally. POS commit `d90c4bb` is pushed to `main`; GitHub Pages deployment [38808968486](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38808968486) succeeded. Verified the public app serves `/assets/index-Rwm5bXtc.js` containing the replacement tutorial and permanent guide.

## Application findings

The app is a React/TypeScript SPA using Wouter, React Query, organization-scoped RBAC, and a theme system. Its work centers on products, customers, working sessions, manual orders and electronic documents. Storefront content and sharing are additional workflows. Electronic document creation is conditioned on the organization's fiscal setup as well as role permissions. A manual order is separate from an issued document.

`Routes.tsx` gates destination pages with `PermissionBoundary`. `usePermissions` resolves grants against the signed-in user and selected organization; it fails closed until ready. `useCanOpenCreateMenu` additionally accounts for the document types the organization can actually create. The tutorial now uses these same checks.

Although `DashboardLayout` looks like a persistent shell, separate route components instantiate it. The tutorial's original placement inside that layout did not give its controller a stable lifetime across route changes. Page entry animations also transform their contents, so the overlay must live outside that tree.

There is no assistant chat or request composer in this app. The reusable workflow's assistant examples were adapted to concrete work examples, expected outcomes, and support guidance. No fictional assistant, sample records, automatic form submission, or automatic document creation was added.

## Problems in the previous tutorial

| Finding | Effect | Resolution |
|---|---|---|
| Controller inside route-specific layouts | Navigation could destroy/restart the tour and its anchor wait | Provider and controller mounted above `Routes` in `App` |
| Immediate automatic navigation | First login could interrupt a deep link and move users into storefront content | Optional welcome on the overview after identity and permissions resolve |
| Fixed three-step storefront flow | POS work and role-specific access were not represented | Up to 12 real work steps; read-only catalog variants |
| Missing anchors treated as permission discovery | Eight-second waits, silent skipping, inaccurate progress | Filter steps before counting; keep missing-target instructions and controls available |
| One server completion flag, no active step | Reloads could not resume the current step; closing and finishing were conflated | Versioned per-user/per-organization progress with stable step IDs and separate statuses |
| Optimistic completion before server acknowledgement | The cached profile could claim successful persistence when a request failed | Local preference persists immediately; server flag updates the profile only on success |
| Replay required clearing the server flag | Replaying depended on a successful network write | Immediate local replay from the header, profile, and guide |
| Copy captured when the old tour started | Language changes could leave the tour's instructions stale | Live English/Spanish copy from the language provider |
| Large content-grid target | Highlight could occupy most of a phone screen | Highlight one real page card |
| No permanent task guide | Help disappeared with the tour | `/dashboard/guide`, accessible from sidebar and account menu |

## Workflow map

| Stable step ID | Destination | Target / availability |
|---|---|---|
| `overview` | `/dashboard` | Orders/documents source tabs; overview read permission |
| `organization` | `/dashboard/organization/general` | Business identity heading; general-settings read permission |
| `create-product` / `products` | `/dashboard/products` | New product for read+create access; catalog heading for read-only access |
| `create-client` / `clients` | `/dashboard/clients` | New customer for read+create access; directory heading for read-only access |
| `sessions` | `/dashboard/sessions` | Session heading; session read permission |
| `create-document` | `/dashboard/documents` | Actual navbar creation menu; same availability as the app's menu |
| `documents` | `/dashboard/documents` | Ledger toggle; emitted or received document read permission |
| `orders` | `/dashboard/orders` | Orders heading; order read permission |
| `reports` | `/dashboard/reports` | Reporting period; general-report read permission |
| `content` | `/dashboard/content` | First actual page card; content read permission |
| `share-store` | `/dashboard` | Store link/QR button; overview read permission |
| `profile` | `/dashboard/profile` | Personal-information profile card; available to authenticated roles |

Each step explains its control, provides a realistic task, and states the expected outcome. Tasks that need records explicitly tell the user to select or create a real record first. The guide uses the same permission-filtered steps.

## Implementation behavior

- `TutorialProvider` owns welcome, navigation, stable-ID progress, replay and completion. The storage key is `tsuru:tutorial:v2:<userId>:<orgId>`. Existing server completions are respected; explicit replay opts into the replacement. Blocked or malformed storage falls back to memory. Removed or revoked steps resolve to the first available step.
- `TutorialSpotlight` renders through a portal to `document.body`. An SVG backdrop cuts out the live target bounds with 8px padding; instructions use a 16px gap and a maximum width of 380px. Placement prefers right, then left, then available vertical space. Long instructions scroll while navigation remains visible.
- Measurement responds to target and panel resize, DOM changes, nested scroll, window resize and visual-viewport changes. It follows entry transforms for 500ms, including targets that appear late. Each selected element scrolls into view once; scrolling is not repeatedly forced during ordinary remeasurement.
- Matching anchors on unrelated routes are ignored. The tutorial offers an explicit return action if the user leaves the relevant route. Missing or off-screen controls retain instructions, progress and navigation.
- The dialog focuses its instruction region on each step, resets instruction scrolling, traps keyboard focus, supports Escape and explicit Close, respects the app's overlay stack, and restores focus to replay when a route has removed the original trigger. Background content is inert while the teaching dialog is active; the transparent cutout does not execute business actions.
- Colors, typography and layering follow application tokens. `--z-tutorial` is above the existing drawer layers. Tutorial actions and example labels use the accent foreground/background pair to remain readable in dark mode.
- The old `driver.js` dependency, lockfile entries and popover overrides were removed.

## Verification

- **686 tests passed across 75 test files**, including **36 new tutorial tests**. Coverage includes permissions, read-only variants, translated content, delayed profile readiness, route remounts, previous/next, dismissal, replay, completion, reload, scope isolation, missing steps, blocked/malformed storage, guide navigation, live language changes, placement, delayed/replaced targets, late animations, nested scrolling, keyboard navigation, nested dialogs and cleanup.
- Style policy and TypeScript checks passed.
- Production build and service-worker generation passed. The build still reports Pagination re-export/chunk cycles and a chunk-size warning; these were not expanded into unrelated refactoring.
- Browser verification used the actual tutorial provider, renderer and guide with temporary local identity/permission/page fixtures, without calling business APIs. Tested normal desktop size, 1440×900, 375×812 portrait and 667×375 landscape. Verified highlight geometry, scrollable copy, accessible footer controls, route progression through all 12 owner steps, four-step read-only filtering, missing-target navigation, English/Spanish, dark mode, guide replay, Escape, focus restoration, and persisted completion after reload.
- Measured dark-mode contrast for tutorial eyebrow, example label and Next action: **11.42:1, 7.66:1 and 7.66:1**, respectively, using computed browser colors.
- Local preview evidence: `output/tutorial-audit/desktop.png` and `output/tutorial-audit/mobile-dark.png`. These show the actual tutorial components against fixture pages, not a production deployment.

## Deployment and acceptance

The code is pushed in POS commit `d90c4bb` and successfully deployed through the normal GitHub Pages workflow. No migration or backend contract change is required. After deployment, verify one authenticated owner and one restricted role against real page data, including an organization with no storefront pages and an organization without electronic invoicing configured. Production authenticated acceptance has not been claimed by the local fixture checks.

### Profile target follow-up

Owner feedback: the final “Your profile and help are always nearby” step should highlight the complete personal-information card. Moved the existing `profile` anchor to that card and removed it from the tutorial replay title. POS commit `7f5ae9b` pushed; deployment [38810167363](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38810167363) succeeded. Verified the public profile bundle `ProfilePage-8qSvSJjd.js` places the anchor on the personal-information card. All 36 tutorial tests, style/type checks and the production build pass.

### Guide alignment and Tsuru navigation follow-up

POS commit `3dadfe4` aligns each pair of guide cards with shared CSS grid rows for headings, descriptions, task examples, outcomes and navigation. Content keeps its natural height; mobile cards remain stacked. A Tsuru sidebar accordion now contains Getting started / Primeros pasos and My articles / Mis artículos. Guide access remains available independently of business RBAC; the article item retains its existing feature flag. The accordion opens for either active route and is shared by desktop and the mobile drawer.

Verification: 40 tutorial/translation tests pass, style/type checks and production build pass. In a browser using actual guide/sidebar components with local fixtures, all six paired task blocks had a 0px vertical difference in both ES and EN. A 375px mobile viewport had one content column and no horizontal overflow; navigation through the mobile Tsuru section closed the drawer correctly. Screenshot: `output/tutorial-audit/guide-aligned-desktop.png`. Deployment [38812702636](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38812702636) succeeded. Verified the public bundle contains the Tsuru group with guide/blog items and the shared-row guide markup/CSS.
