# Order details and document PDF audit

Completed locally on 14 October 2026 using ui-ux-pro-max and visual PDF review.

## Changes

| Area | Result |
| --- | --- |
| Mobile order header | Order identity, status, actions, total, downloads and dates have distinct positions. Buttons have at least 44px height; download buttons use two columns on phones. |
| Order lines | Removed the CABYS column, preserved missing fiscal data warnings, and kept horizontal scrolling inside the table. |
| Totals | Subtotal, discounts, net total, tax and final total are distinct. Zero tax remains visible. Document summaries preserve a stored zero net total and support legacy summaries without that field. |
| Order PDF footer | Repeating Tsuru footer with document number and page count; bottom margin reserves its space. |
| Document PDF footer | Fixed disappearing content after the first page by using a system font in the repeated footer. Preserved QR, legal text and branding. |
| Document header | Consecutive/key card fits its contents. Both PDF headers retain the organization's configured logo and size the white panel to the image proportions. |
| Recipient card | Row 1 pairs name and identification; row 2 pairs email and phone; row 3 holds the address. |
| Payment card | Groups sale condition, currency/exchange rate, issue/due dates and payment methods with aligned labels and values. |
| Typography | Document cards and totals use the order PDF's 13px text, line items use 14px, and table headings use 11px. |
| Order dates | Creation and delivery both use DD/MM/YYYY for ISO strings, legacy strings and native dates. |

## Verification

- Frontend style checks, TypeScript check and production build passed.
- All 603 frontend tests passed.
- 45 order PDF/date tests and 39 document PDF tests passed, plus 19 document subtests.
- Reviewed phone, tablet and desktop frames, including light and dark themes; no page-level horizontal overflow.
- Rendered one-page previews and three-page stress samples with wkhtmltopdf 0.12.6 and patched Qt.
- Verified footer text and correct page numbers on every page.
- Verified square logo panels remain square and wide logo panels remain rectangular in both layouts.
- Reviewed final rendered PDF pages for clipping, row alignment, margins and footer clearance.

The order preview uses a saved order snapshot and the image currently served by its configured organization logo URL. The document preview uses sample invoice data with that logo. No business amounts or organization settings were changed. Template changes are now deployed. Existing stored PDFs were not replaced; the updated layouts apply when PDFs are generated again.

## Document card follow-up

The recipient and payment cards have equal widths (49% each with a 2% gutter) and share their bottom edge, following whichever card needs more height. Their backgrounds and borders stretch with the shared table row. Cédula and Teléfono labels begin at the same column edge, with compact label/value spacing and the same 13px base font as name, email, and address. Identification labels use “Cédula” for every identification type. Name, email, address, and payment methods may wrap.

Payment metadata uses four rows: sale condition alone; currency and exchange rate; issue and due dates; then payment methods. Labels and values begin on the same line. Tipo de cambio and Vencimiento labels start at the same column edge, with compact label/value spacing. Condición de la venta, Moneda, Emisión and Medio de pago share one value column. Both sale-condition labels and values wrap at the normal font size; font fitting was removed. Wrapped payment and address continuation lines keep their first line's value-column position.

Purchase invoices label the party card **Emisor** and **De:**; all other supported documents label it **Receptor** and **Para:**.

Verified the final PDF with ordinary, long-text, purchase-invoice, absent-recipient, and multi-page full-document samples. All 69 document PDF tests and 19 subtests pass. Rendered text positions confirm matching fonts, aligned value columns, and inline dates/payment labels. Footer numbering remains present on all stress-sample pages.

The issuer's economic activity appears below Cédula beside the stored organization logo as **Actividad económica: {code} - {name}**. Names resolve from the organization activity snapshot or the country-scoped catalog, including equivalent integer/decimal code spellings; the signed document code remains unchanged. A missing optional catalog does not abort PDF generation. Email and phone share the first issuer-information row, with address on the second row. Their spacing follows the recipient card, and contacts remain compact when notes are absent.

Notes occupy the second column beside issuer information. The **Notas:** label and justified text begin on the same row; all wrapped lines stay in the value column. Notes are no longer included beside totals. Issuer/notes and recipient/payment pairs share their respective bottom edges. Visual and rendered-text geometry checks cover inline justified notes, both contact rows, long values, card heights, and footer counters.

Neighborhood names now reach both PDF addresses. The [document address flow audit](document-address-flow-2026-10-14.md) traces checkout, offline replay, create/update, ORM storage, party snapshots, XML/imports, public responses, related notes and PDF regeneration. The frontend retains the selected ID/name; sales resolves an optional ID before persistence and signing. Names already carried by an existing document remain intact. Final verification passes 623 frontend tests, 69 PDF tests, 91 shared tests, 65 sales API tests and 12 import tests, plus the relevant subtests; two existing shared tests remain skipped.

Discount cells now show `0` when no discount applies, including when all lines have zero or absent discounts. Summary labels follow the requested order: **Total neto** before discounts, **Subtotal** after discounts, then taxes and final total. Calculations and stored business amounts are unchanged.

## Final order-detail audit and release follow-up

- Facturar pedido shares the PDF/Ticket/Excel action group. Billing remains independently gated from export permission, and ticket generation works before a stored attachment exists.
- Order header uses identity, amount and options across the top on wide screens; phones retain a distinct amount row and a two-column action group. All actions are at least 44px high.
- Page content responds to its available width, including space consumed by the sidebar. Narrow desktops use a full-width line table and paired information cards; wide desktops use a larger line-items column alongside customer and delivery information.
- Dates and department share the same label/value structure. Verified no page overflow at 360, 430, 768, 1024, 1280 and 1440px, including long order keys, names and event text, with light and dark themes.
- Document recipient name, email and address now begin in one shared value column. Wrapped continuation lines stay in that column. One-page ordinary/purchase/long-text samples and a three-page complete document retain correct footer numbering.
- Release validation: 620 frontend tests, 216 platform API tests, 80 orders backend tests, 51 document PDF tests and 87 shared sales tests pass. Two existing shared tests are skipped.

## Deployment

All application deployments succeeded on 14 October 2026:

| Repository | Commit | Deployment |
| --- | --- | --- |
| tsuru-pos-system | b0e4f26 | https://github.com/chepelcr/tsuru-pos-system/actions/runs/38632162226 |
| tsuru-management-be | cf83e20 | https://github.com/chepelcr/tsuru-management-be/actions/runs/38622512842 |
| tsuru-store-be | 08293f8 | https://github.com/chepelcr/tsuru-store-be/actions/runs/38622517328 |
| tsuru-sales-be | 7c70584 | https://github.com/chepelcr/tsuru-sales-be/actions/runs/38631478846 |

Verified the live delivered order page at 1440px and 375px: Facturar pedido shares the download group, the wide table fits without horizontal scrolling, the phone page has no horizontal overflow, CABYS is absent, and the company name is absent from sidebar branding. Billing opens the checkout drawer; no invoice was submitted or order data changed.
