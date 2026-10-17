# Legacy product service boolean removed

`type` (`product`, `service`, `program`) now owns storefront classification throughout live products, demo template products, POS forms, the storefront SDK and the eight Services pages. Runtime models, request/response contracts, query filters and seeds no longer read or write `is_service` / `isService`. Generated API contracts were updated. Public Programs pages retain their `type:program` filter.

Hacienda's numeric CABYS classification remains separate. Tests exercise a medical CABYS row (type ID 6) while changing the storefront classification among all three values; the CABYS link, fiscal type and unit of measure survive the response round trip.

## Data migration and rollout

- Store-be: `alembic/versions/20261016_drop_product_is_service.py` is the new single Alembic head. It recovers legacy service rows with a blank/default product classification, preserves explicit service/program types, then drops `products.is_service`. Downgrade reconstructs the boolean from the catalog type.
- Management: `migrations/0029_drop_template_product_is_service.sql` does the same for `template_products`; its column existence guard permits reruns.
- Historical migrations/snapshots retain the old field so existing migration chains can be replayed.
- Publish the updated template bundles first: their `type:service` requests already work with the existing APIs/SDK. Deploy the new backends and apply the two column-removal migrations as a coordinated schema release, since old backends still select the retired columns. The Programs RBAC cleanup migration `0028` was also applied during this release.

Rollout completed on 2026-10-16 against the live Tsuru **dev** environment in PACIFIC-PROD (`tsuru/dev/database`). All code repositories are committed, pushed and clean. SDK **2.0.0** is published, and all eight templates pin it in their package manifests and dependency lockfiles.

## Verification

- **58 store-be tests pass**, covering product validation, fiscal defaults, all three type searches, response round trips and an upgrade/downgrade of the real Alembic migration on a disposable database. PostgreSQL SQL generation and the single-head migration chain also pass.
- **231 management tests pass**, including the real template-products HTTP route: service/program filters combine with discounts, the retired query parameter is rejected, and fiscal numeric IDs are rejected as storefront types. TypeScript check passes.
- **25 focused POS tests pass**, including shared form mapping, program checkbox and product filter interactions; style/TypeScript checks and the production build pass.
- **6 SDK tests pass**, covering product/service/program request construction and response normalization in demo and live modes. `npm test` builds the SDK and runs Node's built-in test runner with its module-mocking flag; no new dependency was installed for the tests.
- All **8 changed storefront templates build** against the local SDK source using temporary Vite configs. The subsequent release pinned SDK 2.0.0 using an integrity hash verified against the successful package publication; all eight deployment workflows then passed frozen-lockfile installation, build, Pages deployment and organization-site notification.
- Runtime legacy-reference scan and whitespace checks pass. Existing build-size and Pydantic deprecation warnings remain.

## Applied migrations and live verification

Applied management `0028_retire_programs_module.sql` and `0029_drop_template_product_is_service.sql`, plus store Alembic revision `20261016_drop_is_service`. The final Alembic head is recorded in the database and both retired columns are absent.

A compatibility default allowed the new store backend to insert while the old column was still present. The columns were dropped after the new backends deployed. A protected local snapshot was retained before migration. Whole-row hashes excluding the removed boolean confirm all **54 live products** and **52 template products** are unchanged, including prices, CABYS links and fiscal data. All roles and unrelated grants are unchanged; only the **20 obsolete Programs grants** were removed.

After migration, guest SigV4 requests returned HTTP 200 for service/program filters on all eight demo templates and product/service/program filters on the live catalog. Responses omit the retired boolean, and the obsolete demo `is_service` query is rejected with HTTP 400. Both backend Lambdas are Active / Successful.

## Successful releases

| Repository | Commit | Workflow |
|---|---|---|
| tsuru-store-be | `cefcb8c` | [38926147543](https://github.com/chepelcr/tsuru-store-be/actions/runs/38926147543) |
| tsuru-management-be | `79522ce` | [38926419423](https://github.com/chepelcr/tsuru-management-be/actions/runs/38926419423) |
| tsuru-pos-system | `2dd7d75` | [38925390732](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38925390732) |
| tsuru-storefront-sdk | `bc2a22d` | [38925266819](https://github.com/chepelcr/tsuru-storefront-sdk/actions/runs/38925266819) |
| template-beauty-essentials | `b6d1ecc` | [38925857620](https://github.com/chepelcr/template-beauty-essentials/actions/runs/38925857620) |
| template-tsuru-demo | `05a4ba1` | [38925861720](https://github.com/chepelcr/template-tsuru-demo/actions/runs/38925861720) |
| template-tech-gadgets | `ecfbea1` | [38925868211](https://github.com/chepelcr/template-tech-gadgets/actions/runs/38925868211) |
| template-vintage-fashion | `3ab6b26` | [38925870474](https://github.com/chepelcr/template-vintage-fashion/actions/runs/38925870474) |
| template-artisan-crafts | `41890b3` | [38925875926](https://github.com/chepelcr/template-artisan-crafts/actions/runs/38925875926) |
| template-gourmet-foods | `caf651b` | [38925881648](https://github.com/chepelcr/template-gourmet-foods/actions/runs/38925881648) |
| template-fitness-hub | `6e56433` | [38925885112](https://github.com/chepelcr/template-fitness-hub/actions/runs/38925885112) |
| template-pet-care | `dd45828` | [38925888465](https://github.com/chepelcr/template-pet-care/actions/runs/38925888465) |
