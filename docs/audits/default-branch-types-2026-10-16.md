# Default Branch type and leading icons — 2026-10-16

Follow-up to TSR-368 and the owner's request for a default named **Branch** in every organization, more icon choices, and one leading icon in the icon and branch type selectors.

- Store migration `20261016_default_branch_types` creates or marks one persisted, active `branch` / `Branch` default for every organization. A partial unique index prevents multiple active defaults per organization. All **5 organizations** in dev have exactly one default, named **Branch**.
- Catalog reads and automatic branch registration ensure the default exists for new organizations, including organizations without branches. Bootstrap is idempotent and preserves later customization; existing branch assignments and custom types are retained. The default remains editable and cannot be deleted.
- New branch forms select the catalog's default explicitly, independent of display order. The type manager shows the default badge.
- Expanded the icon picker to **20 choices**. The icon picker, branch type field and branch type filter use the shared selector with one leading icon in the selected value and in each option.

Validation: POS **742 tests / 83 files passed**, TypeScript, style policy and production build passed. Store **41 focused tests passed**, covering catalog bootstrap, organization isolation, registration, CRUD and permissions.

| Repository | Commit | Successful deployment |
|---|---|---|
| POS | `33a6983` | [38919577291](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38919577291) |
| Store | `c7363f4` | [38919575586](https://github.com/chepelcr/tsuru-store-be/actions/runs/38919575586) |

Live verification: store Lambda is Active / Successful, uses the current image and returns the expected warmup response. A read-only database check confirms 5 organizations, 5 defaults and 5 named Branch. Authenticated POS verification confirms the default badge, all 20 icon options, one icon before each option label and selected label, and Branch selected in a new branch form despite its saved display order being 2. Preview forms were canceled without saving live records. Both code repositories are clean after push.
