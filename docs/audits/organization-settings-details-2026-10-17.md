# Organization settings detail pages — 2026-10-17

Implemented locally with the ui-ux-pro-max review workflow. Nothing committed,
pushed, or deployed; the owner will deploy with other pending changes.

| Page | Audit result / resulting behavior |
|---|---|
| General information | Was an immediate form. Now a saved summary and Edit drawer, including name, description, logo, business identity and visible features. |
| Storefront branding | Was an immediate form. Now a summary and Edit drawer using the existing branding payload and validation. |
| Contact | Was an immediate form. Now a summary (including resolved location names) and Edit drawer. |
| Payments | Was an immediate form. Now a summary and Edit drawer; secrets are not exposed in the summary. |
| Shipping | Was an immediate form. Now a summary and Edit drawer; zero amounts and false toggles remain distinguishable from missing values. |
| Appearance | Was an immediate write-on-selection gallery. Now a current-theme summary and drawer. Selection is a draft until successful Save; failures preserve the saved theme. |
| Fiscal info | Preserved first-time welcome/wizard and configured summary/Edit drawer. |
| Hacienda API | Preserved existing setup/detail flow and fiscal prerequisite. |
| Notifications | Preserved existing detail/Edit drawer and fiscal prerequisite. |
| Templates | Gallery preserved per owner instruction. Added previews for all nine catalog designs and shared missing-image handling in cards and preview dialogs. |

## Editing behavior

Read-only roles see summaries without edit actions. Native form submission from
the fixed drawer footer keeps existing validation active. Pending saves/uploads
lock dismissal and inputs; failed saves retain entered values and display the
error in the drawer. Cancel resets form drafts. General feature visibility now
commits with a successful General save rather than changing during an edit.

## Template images

The seeded thumbnail paths were `/templates/{name}.jpg`, but no such files
shipped with the POS. All nine files now contain original images generated
with the built-in image_gen tool, per the owner's preference for generated
artwork instead of website screenshots. Each image represents its template's
sector and palette, with a consistent horizontal editorial-photography style.
No interface elements, screenshot text, or browser chrome are present.

The JPEG assets replace the screenshots at their existing gallery paths;
`TemplateThumbnail` still serves both cards and preview dialogs and retains
its fallback for unknown or failed custom images. The exact prompt set and
original generation paths are recorded in
`docs/audits/template-preview-prompts-2026-10-17.json`.

## Validation

- 51 focused tests passed: summaries, drawer saves/cancel, read permissions,
  failure/retry, pending-save locks, validation, theme staging, fiscal
  prerequisites, all nine shipped preview assets, and missing-image fallback.
- Type/style checks and production build passed.
- Browser verification used isolated local organization data and mutations;
  no live organizations, settings, templates, uploads, or account data changed.
- All nine generated template covers visually inspected. General summary/drawer and
  gallery verified in the browser. Earlier fiscal navigation and phone-layout
  checks remain covered by the fiscal tests.

## Combined release — 2026-10-17

The owner subsequently authorized deployment. These changes are committed in POS `8ab8d2e` and deployed by successful workflow `39061892563`. All 851 POS tests, type/style checks and build pass. See [release evidence](combined-release-2026-10-17.md).
