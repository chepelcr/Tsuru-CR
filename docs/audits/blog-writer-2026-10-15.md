# Blog writer route audit

15 October 2026. Scope: `https://app.tsuru.jcampos.dev/dashboard/blog`, the POS route/shell/provider chain, and the writer's loading and editing states.

## Confirmed failure and repair

The live signed-in route displayed `Error: useDocumentVersion must be used within a DocumentVersionProvider`. The same error was reproduced locally by a regression test before applying the repair.

The blog route constructed `RequireAuth → DashboardLayout → BlogWriterPage` directly. Other dashboard routes use the shared `DashboardPage` wrapper, which places `DocumentVersionProvider` above the layout. `DashboardLayout` calls the real `useOfflineBootstrap` hook before its organization check, and that hook unconditionally reads `useDocumentVersion`. Consequently the blog failed before its editor could render, including for authors without an organization.

The repaired route uses `DashboardPage` without a business-permission requirement. The existing strict context hook remains intact. The writer retains access for all supported authenticated roles and the layout's existing no-organization blog exception. Loading or failing document-version catalogs do not prevent the writer from rendering.

## Findings

| Priority | Finding | Disposition |
|---|---|---|
| P1 | Blog route bypassed the required document-version provider and crashed on entry | Fixed through the standard dashboard wrapper; reproduced before repair and covered by regression tests |
| P2 | A failed article-list request also displayed “You have no articles yet” | Fixed: the empty message now requires a successful, non-loading query |
| P3 | Writer did not set its browser page title | Fixed: uses the existing localized My articles / Mis artículos title |
| P2 | Selecting another post or New article replaces an unsaved draft without confirmation | Fixed by the drawer follow-up: article switching is unavailable while the editor is open; dirty close requires discard confirmation |
| P2 | Article switching and slug controls remain active while a save is running; upload completion also updates a block by a captured index/document | Fixed by the drawer follow-up: save/upload operation locks prevent edits, switching and dismissal; upload completion reads the current document |

The broader editor plan already tracks autosave, undo/redo, unsaved-change protection and richer preview behavior. This repair does not claim those features are complete. The read-only live audit did not create, submit, publish or upload article content.

## Regression coverage

`src/Routes.blog.test.tsx` exercises the actual Wouter route, `DashboardLayout`, `DocumentVersionProvider`, `useOfflineBootstrap`, writer and document editor. Network/storage-heavy peripheral shell services are mocked; the provider and failing hook are deliberately real.

The 12 tests cover direct blog entry, document-version injection before bootstrap, all four supported roles without commercial permissions, an absent organization, guide/blog navigation, document catalog loading/errors, sign-in redirect preservation, the disabled feature flag, and the retry-versus-empty-state behavior. The direct-entry test failed with the reported context error before the route change and passed afterward.

## Release verification

- POS commit **59220f7** pushed to `main`; GitHub Pages deployment [38816288177](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38816288177) succeeded.
- **698 tests passed across 76 files**, including the 12 new blog route/state tests. Style policy, TypeScript and production build passed. Existing chunk-cycle/size build warnings remain outside this repair.
- Reopened the deployed URL in the signed-in browser session. The browser title was `Tsuru POS - Mis artículos`; the sidebar, article-list empty state and draft editor rendered without the missing-provider error. No save, submission or upload was performed.
- Live before/after evidence: `output/blog-audit/before.png`, `output/blog-audit/after.png`. Regression reproduction, full test output and build output are saved in the same directory.
- The provider repair did not exercise editorial writes. The drawer follow-up below adds local draft close and operation safeguards; end-to-end moderation/publication acceptance remains separate.

## Article drawer and shared controls follow-up

Owner clarification: use a drawer, not a centered editor modal. The page now presents only the article list and its new-article action. Both a fresh draft and a selected article open the existing shared `Drawer`, with an 880px desktop width, full viewport width on smaller screens, a scrolling body and fixed footer actions.

The editor reuses `Button`, `Input`, `FormLabel`, `Card`, the shared textarea class and the custom `SelectField` listbox. Image layouts have Spanish/English labels, the shared padded chevron trigger, token-styled options and selected/hover states. A nested selector consumes Escape before the surrounding drawer. A separate shared confirmation dialog protects dirty closes; unchanged fresh drafts close immediately. Refresh/tab close warns while dirty or processing. Saving and uploading disable edits, switching, save/submit and dismissal so late results cannot replace a newer draft. Upload completion also merges against the latest document.

Eleven additional tests cover initial list-only rendering, drawer open/close and focus restoration, cancel/discard, draft create/update/submit with revision versions, review-locked articles, save failure, pending-save locks, image layout options and Escape, image-text layout restrictions, successful/failed uploads and before-unload protection. Mutations use mocks; no live editorial data is written.

POS commit **fea0e89** pushed to main. **709 tests across 77 files**, style policy, TypeScript and production build pass. Local browser verification covers light/dark modes and widths 320, 390, 768 and the normal desktop viewport; drawer width and page width match on smaller screens without overflowing controls. Screenshots and the isolated preview fixture are preserved in `output/blog-drawer/`. GitHub Pages deployment [38819760671](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38819760671) succeeded.

Remaining editor work includes autosave, undo/redo, richer previews and protection against browser-history/client-route navigation; close/refresh guards do not persist a draft across those transitions. Real author/moderator save-upload-submit-review-publish acceptance is still pending under TSR-358.

Live verification after deployment: the signed-in Spanish article page renders the list without an inline editor. Nuevo artículo opens Nuevo borrador in the shared drawer. Adding an unsaved image block exposes the custom Alineación listbox with Ancho completo, Ancho, Izquierda and Derecha. Escape closes only the listbox; closing the dirty drawer opens the localized discard confirmation. The 390px live layout has no overflowing editor controls, and discard returns focus to Nuevo artículo. Screenshots: `output/blog-drawer/live-drawer.png`, `live-alignment.png`, `live-mobile.png`. All temporary draft content was discarded; no article or image was saved, uploaded or submitted. Browser sizing was restored and temporary tabs closed.
