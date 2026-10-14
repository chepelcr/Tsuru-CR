# Profile photos, sidebar branding and compact order cards

Implemented and deployed on 14 October 2026 using the existing UI UX Pro Max guidance and theme tokens.

- Sidebar branding displays Tsuru alone; removed the organization-name query used only below the logo.
- Profile supports adding and replacing JPG, PNG and WebP photos up to 5 MB. Pending, invalid-file, upload-error and saved feedback are localized in Spanish and English.
- A shared avatar displays the saved photo in the profile, sidebar and header, with initials when a photo fails to load.
- The platform API provides an account-scoped signed upload route, generates the storage filename, binds the MIME type and file length, and persists the permanent URL in Cognito’s standard picture attribute. Profile reloads read that attribute. No database migration is needed.
- Profile security actions use two full-width rows that expand to fill the security card height, with equal row heights and no unused block below.
- Order cards omit the supplier/company name and use two columns for dates, item counts, location and event. Reduced padding and total size shorten the cards; navigation is keyboard accessible. Loading skeletons match the compact layout.

## Verification

- Frontend: 616 tests pass; style policy, TypeScript and production build pass.
- Platform API: 216 tests pass; TypeScript passes. The local package runner’s esbuild executable wrapper fails because it tries to parse a native binary as JavaScript; the equivalent esbuild JavaScript build API successfully produces the bundle.
- HTTP tests verify snake_case contracts, account-specific storage paths, file type/size validation, storage errors and photo persistence/reload.
- Client tests verify upload-before-save ordering, upload/save failure propagation and avatar fallback/retry.
- Browser review at 1100px and 375px confirms no page-level horizontal overflow, shorter two-column order cards, photo controls and immediate header/sidebar avatar updates. Browser photo upload uses a local mocked save; no real account was modified.
- Evidence: `output/profile-orders-audit/{profile,orders}-{desktop,mobile}.png`.

Frontend and platform API changes were deployed together on 14 October 2026 (fb6cf53 and cf83e20). Both deployment workflows succeeded. Existing user photos were not modified.
