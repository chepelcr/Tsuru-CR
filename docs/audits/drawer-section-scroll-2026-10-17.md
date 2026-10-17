# Drawer section navigation — 2026-10-17

Opening Codes in the product editor collapsed taller cards above it while leaving
the drawer at its previous scroll offset. The selected heading could finish above
the visible area. The shared accordion state only managed expansion; the shared
card and drawer did not coordinate scrolling with the 300 ms grid transition.

`Drawer` now delegates manual section openings to `useDrawerSectionScroll`.
`SectionWrapper` exposes its state through `aria-expanded`, links its content
through `aria-controls`, and identifies its toggle for the drawer. The hook waits
for opening and closing card transitions using their actual animation promises,
then scrolls only the containing drawer with a 12 px inset. Canceled transitions
are handled. No page or ancestor drawer scrolling is requested.

Subsequent selection, wheel/touch/pointer/keyboard input, closing the drawer, and
unmounting cancel pending positioning. Initial expansion, data-driven unlocks,
fixed sections, disabled sections, and closing a card do not request scrolling.
Reduced motion disables the card transition and positions without animation.
ContentPage's previous 320 ms timer and `scrollIntoView` workaround were removed
in favor of the shared behavior.

## Coverage from the component audit

| Drawer/form | Section path |
|---|---|
| Products | Product sections and shared fiscal sections use SectionWrapper. |
| Clients | Identity, contact and address use SectionWrapper. |
| Branches and terminals | BranchForm sections and TerminalGeneralSection use SectionWrapper. |
| POS line detail | General, fiscal, discounts, taxes, exemption and commercial value use SectionWrapper. |
| Checkout | Payment, receiver, document, branch/terminal, references, other charges and copies use SectionWrapper. |
| Roles | PermissionMatrix module cards use SectionWrapper with their own accordion state. |
| Fiscal organization editing | FiscalInfoEditDrawer uses SectionWrapper with its own expansion state. |
| Storefront content | ContentPage uses the shared behavior instead of its page-specific timer. |

All of these are rendered inside the shared Drawer, so existing form state and
section expansion rules use the same scroll coordination without per-form code.
Static cards, including organization contact and Hacienda configuration sections,
do not initiate navigation when their expansion state does not change.

## Validation

- **101 test files / 851 tests passed**, including 14 new drawer scroll tests.
  Regression coverage includes final geometry after both sibling and target
  transitions, multiple initially expanded cards, rapid changes, interruptions,
  canceled transitions, data-driven expansion, reduced motion, initial opening,
  closing during transition, and nested drawers.
- `pnpm run check` passed (style policy and TypeScript).
- `pnpm run build` passed; Vite's existing large-chunk advisory remains.
- Browser fixture used the production Drawer, SectionWrapper, accordion hook and
  stylesheet with long sample form fields. Desktop 1280×720, dark phone 375×812,
  and landscape 812×375 all positioned Codes exactly 12 px below the drawer body
  top. Desktop Inventory and Enter activation of Codes also aligned at 12 px.
  Page scroll stayed at 0; phone/landscape had no horizontal overflow. Fixed
  header and footer were visually verified. Temporary fixture files were removed.
- Screenshots: `output/drawer-section-scroll/desktop-codes.png`,
  `mobile-codes-dark.png`, and `landscape-codes.png`; test/build logs share that
  directory.

Changes remain local; no commit, push, deployment, or production data writes.

## Combined release — 2026-10-17

The owner subsequently authorized deployment. These changes are committed in POS `8ab8d2e` and deployed by successful workflow `39061892563`. All 851 POS tests, type/style checks and build pass. See [release evidence](combined-release-2026-10-17.md).
