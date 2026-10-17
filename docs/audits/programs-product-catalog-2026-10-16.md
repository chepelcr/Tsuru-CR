# Programs consolidated into the product catalog

## Investigation

Programs already use `products.type = 'program'`, the ordinary product request/response DTOs and product endpoints. There is no independent Program entity or DTO. Template products use the same classification for courses, training plans and experiences; CMS Programs pages describe their public presentation.

The dashboard sidebar exposed Programs using `programs/programs` permissions alone. The duplicated dashboard page checked `section_type === 'programs'`, whereas the template seed creates a page with `type/slug = 'programs'` containing a `hero` section. This made the sidebar destination redirect to the dashboard. Its role grants also differed from the `commercial/products` grants used by the shared editor and product API.

## Result

- Programs are managed in **Gestión Comercial → Productos**, with a Program checkbox in the shared drawer/detail form. The checkbox writes the existing `type` value, so no second database boolean or new DTO is needed. Existing service/program classifications survive edits.
- **Filters → Catalog type** selects products, services, programs or all types. The filter combines with existing searches and is reflected in the URL. New entries inherit the selected catalog type; changing type filters clears bulk selection.
- The unused dashboard `ProgramsPage` and `useProgramsEnabled` hook were deleted, together with the sidebar item, separate route permission and unused translations.
- `/dashboard/programs` remains as a compatibility redirect to `/dashboard/products?type=program`, guarded by product permissions.
- The RBAC seed no longer creates a Programs module or grants. `be/management-be/migrations/0028_retire_programs_module.sql` removes only that obsolete module and its dependent RBAC rows. It preserves custom roles and other grants; program-only grants are not expanded into access to the whole product catalog.
- The public Programs pages and CMS template content remain. Verified `fitness-hub` still calls `useProducts({ type: 'program' })`; `fe/storefront-sdk/src/client.ts` sends `type=program` for demo APIs and `search=type:program` for live APIs.
- `ProductSearchFilters.TYPE` already existed in store-be. Its exact-match contract is documented and now exercised against real SQL queries for all three types alongside name/status constraints.

## Verification

- POS: **753 tests pass**, including checkbox/payload round trips, filter apply/clear, creation from a filtered catalog and legacy-link permission checks.
- Management: **226 tests pass** and TypeScript check passes.
- Store-be: **3 new SQL type-filter tests pass**, using an in-memory database without production connections.
- POS style/TypeScript checks, production build and whitespace checks pass. The build retains its existing bundle-size warning.

The consolidation was committed, pushed and deployed on 2026-10-16. The targeted RBAC migration was applied without reseeding custom roles. The follow-up removal of the legacy service boolean also deployed across both backends, SDK 2.0.0 and all eight storefront templates; public Programs pages retain their type filter. Full migration and release evidence is in `docs/audits/legacy-product-service-flag-2026-10-16.md`.
