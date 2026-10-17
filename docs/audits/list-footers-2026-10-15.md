# List footers and product layout

15 October 2026. Owner request: replace Elementos por página with Mostrar, correct document pages starting at zero, provide document page-size selection, standardize list footers and display two catalog products per row.

The document list passed its zero-based sales API page directly into the one-based shared footer. It also used a fixed size of 20 and hid pagination on a single page. Other lists mixed the shared footer, custom arrows, hard-coded page sizes and footers hidden for one-page results.

The shared Pagination now displays item range, Mostrar / Show, a styled page-size selector and Página X de Y / Page X of Y with accessible previous/next controls. Page-size change is required and returns to UI page one. The selector includes the current API size even when it is absent from suggested values. Empty results show 0-0 items and Page 1 of 1; one-page results retain the selector.

All 18 paginated list/picker surfaces now use this component and provide page-size state or an existing store setter. The custom POS-product and terminal-document footers were replaced. Sales and historical state remain zero-based, with conversion at the footer boundary. Documents, terminal changes and emitted/received/type/search changes reset paging appropriately. Other APIs retain one-based page state. No API contract or backend change was made.

Catalog products and their loading placeholders share the existing document grid: two columns at wider sizes, one on narrow screens, with equal card heights and bottom-aligned prices retained.

Validation: 729 tests across 80 files pass, including 14 new shared-footer/document-adapter regressions. Style policy, TypeScript and production build pass. Browser fixtures verified product columns, document pages 1/13 and 2/13, changing size to 50 returning to page 1/6, styled options, light/dark modes and a 320px viewport without footer overflow. Evidence and fixture: output/list-footers/.

POS commit **45453f0** pushed to main; GitHub Pages deployment [38847960075](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38847960075) succeeded.

Live signed-in verification in the current English session: products use two 466px columns, and the footer remains visible for four products on one page. Documents show Page 1 of 13 / Showing 1-20 of 252, then Page 2 of 13 / Showing 21-40. Choosing 50 requests the larger page and returns to Page 1 of 6 / Showing 1-50. The selector offers 20, 50 and 100. Spanish Mostrar and the matching page/range labels were verified in the local browser preview. The existing language preference was preserved.

Live screenshots: output/list-footers/live-products.png, live-documents-page-one.png, live-documents-size-50.png. No product, document or customer data was edited; only read-only navigation and page-size choices were exercised. Temporary tabs and preview server were closed, and the mobile viewport override was reset.
