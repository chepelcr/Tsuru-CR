# List footer placement

15 October 2026. Owner request: keep table/list footers at the bottom of the available page when results are empty or shorter than the screen, especially received documents.

The shared pagination previously followed the last row in normal document flow. Dashboard routes did not pass the shell's remaining height through the transition wrapper, and documents placed the footer inside the scrolling list after a 256px empty state.

The dashboard shell and route transition now pass through available height. A page-level container with a direct shared pagination footer becomes a flex column; spare vertical space goes above the footer. Existing card and grid sizes remain natural. The rule also covers page-level lists added later, while nested picker/detail pagination stays scoped to its own container. Long pages can grow and retain normal scrolling.

Documents propagate the same flex sizing through their persistent page container and keep the footer in a separate non-scrolling sibling. Empty/error content fills the list area. Pagination keeps the established shared controls and a 16px inset.

Validation used an isolated copy of HEAD plus only these seven changed files, excluding concurrent unrelated workspace work: all **729 tests across 80 files**, style policy, TypeScript and production build pass. The build retains its existing chunk-size warning. Desktop preview at 541px height: a short product list footer ends at y=501 (40px page padding), and short/empty documents end at y=525 (16px inset). At 320×700 the empty document footer ends at y=684 with no horizontal overflow. A full document page grows naturally and the footer follows the last card without overlapping it. Evidence: `output/footer-anchor/`.

Before deployment, the live received-documents empty footer ended at y=444.5 in a 588px viewport. After deployment it ends at y=524 in a 540px viewport, keeping the intended 16px inset. The live four-product catalog at 1280×900 ends its footer at y=860 (40px page padding) while all four cards remain 92px tall. The live received-documents empty state at 320×700 ends the footer at y=684 with a 320px document width and no overflow.

POS **1c794d3** implements the fix; final **c2840c8** keeps concurrent branch-navigation documentation out of this release while preserving it in the working tree. The seven released files match the isolated validated source byte for byte. GitHub Pages deployment [38849528724](https://github.com/chepelcr/tsuru-pos-system/actions/runs/38849528724) succeeded. Screenshots: `live-documents-empty.png`, `live-products-short.png`, `live-documents-empty-mobile.png` in `output/footer-anchor/`. Preview server and temporary tabs closed; viewport override reset. No business records edited.
