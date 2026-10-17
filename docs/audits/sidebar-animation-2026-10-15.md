# Sidebar close animation audit

15 October 2026. Owner clarified that the missing close animation refers to the sidebar group collapsing when navigating away from a subsection.

Each dashboard route previously constructed a fresh `RequireAuth → DocumentVersionProvider → DashboardLayout` tree. Selecting a destination outside the current group replaced the entire sidebar with one initialized for the new route, so the outgoing group disappeared without a CSS transition. The sidebar route effect also skipped null sections, which would leave the old group open after making the layout persistent.

All `/dashboard` paths now enter one persistent `DashboardRoutes` boundary. The child switch retains the existing page paths, lazy loading, per-page permissions and parameter readers. `DashboardPage` continues to provide page-level permission/loading/transition handling; the version provider and auth guard stay above the persistent layout. The sidebar effect follows `sectionOf(active)` even when it returns null, allowing the existing grid-row transition to collapse the outgoing group on standalone destinations.

Six tests in `src/Routes.sidebar.test.tsx` exercise the real Routes, DashboardLayout route mapping and DashboardSidebar, with peripheral services and page data mocked. They assert the same sidebar and accordion DOM elements survive route changes, cover manual group switches, same-group pages, standalone pages, route-driven cross-group changes, product detail parameters, organization subpage matching and permission denial. The focused persistence regression fails against the previous Routes implementation and passes with the fix. The existing 12 real blog/provider tests still pass.

The isolated browser preview recorded actual transition frames: Tsuru closed from 82px through intermediate values to 0px; Commercial Management opened to 205px, then closed through intermediate values to 0px when navigating Products → Panel. The fixture and frame data are preserved in `output/sidebar-animation/`; they are outside the application repository.

POS commit **4e46a77** pushed to main. **715 tests across 78 files**, style policy, TypeScript and production build pass. GitHub Pages deployment [38821142305](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38821142305) succeeded. The existing build chunk-cycle/size warnings are unchanged.

Live signed-in verification after deployment: Products opened with Gestión Comercial expanded. Selecting Panel kept keyboard focus on its existing navigation button, changed the group to `data-open=false`, and yielded successive heights **194.69px → 173.98px → 144.49px → 0px** with the existing 250ms grid-row transition. The dashboard then showed all groups fully collapsed. Captured frames and the final screenshot are `output/sidebar-animation/live-close-frames.json` and `live-panel.png`. No business data was changed; the temporary live tab was closed.
