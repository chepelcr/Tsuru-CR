# Order billing drawer follow-up — 2026-10-14

The follow-up used the UI/UX Pro Max guidance for constrained form layouts, visible request states, touch targets, and responsive verification.

## Changes

- Order crossdocking dialog: order download says **Descargar orden**; the order action says **Ver Crossdocking**.
- Collapsible cards use a bounded grid column and allow their content to shrink. Long activity labels truncate within the drawer instead of widening the card and clipping the fields.
- Dropdown menus are bounded by the viewport width and available height.
- Sale condition, department, delivery point, charge type, and reference catalogs show loading, error, empty, and retry feedback. Loading fields cannot be selected prematurely.
- The data API waits again when a provider clears an already resolved document version. A missing version rejects locally after the bounded wait instead of sending a request without the required parameter; an explicit version does not wait.
- Other charges have one numeric field with attached currency and percentage buttons. Switching from percentage to amount resolves the current charge; switching back derives a percentage from the current amount and subtotal. The active currency symbol follows the document.
- References have full-width type, code, and document number rows, then reason and date in two columns. Inputs have associated labels and 44px targets.

## Verification

Read-only inspection of the signed-in app confirmed all four reported catalogs return options. Opening a billing draft was sufficient to inspect them; no invoice was submitted.

The frontend suite passed **612 tests**. New integration coverage uses the actual catalog hooks and API clients to verify the version parameter, selectable options, retries after failed requests, department prefill, and charge mode conversion. Document-version tests cover provider remount and timeout behavior. Type checks, style policy, production build, and whitespace checks passed.

Browser checks used the actual form components with example data. At 375px and 430px, and a 520px drawer within an 1100px viewport, all fields remained within the drawer with no horizontal overflow. Sale condition and reference menus were opened and selected. Existing global build warnings about large bundles remain.

Local QA screenshots (generated artifacts, not committed):

- Mobile document card: `output/order-checkout-audit/mobile-document.jpg`
- Mobile charge switch: `output/order-checkout-audit/mobile-charge-switch.jpg`
- Mobile references: `output/order-checkout-audit/mobile-references.jpg`
- Light mobile layout: `output/order-checkout-audit/mobile-light.jpg`

Deployed on 14 October 2026 in frontend commit fb6cf53; the deployment workflow succeeded.
