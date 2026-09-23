# Landing proposal — make order-first businesses feel at home

**Status:** Approved by the owner and deployed to the public landing on 2026-09-23 from `fe/landing/main` commit `26871c0` (Pages run `35931608710`).
**Implemented scope:** Public landing copy and layout, Spanish and English, plus paragraph alignment. No POS behavior, storefront integration, or pricing change was made.
**Companions:** [`LANDING_CLIENT_BRIEF.md`](./LANDING_CLIENT_BRIEF.md) describes the current site. For the current order-to-invoice path, use `fe/pos-system/src/pages/dashboard/OrderDetailPage.tsx`, `src/components/pos/checkout/OrderCheckoutDrawer.tsx`, and `src/lib/orderToInvoice.ts`; §7 of `fe/pos-system/docs/MANUAL_ORDERS.md` still describes an older tab-based flow.

## The gap

The live landing leads with free Hacienda invoicing. A merchant who is taking requests through WhatsApp, a fair stall, or a small shop and is **not using electronic invoicing yet** can reasonably read the page as “this product is for someone further along than me.” Tsuru already gives that merchant a way to record and manage orders. The landing should make that starting point visible before explaining the fiscal path.

The message is **one business, two valid starting points**:

1. **Organize orders today.** Keep products, customers, order details, delivery dates, and status in one place. A manual order is a commercial record, not an electronic tax document.
2. **Invoice a delivered order when applicable.** With fiscal identity and transmission configured, a business can open **Facturar pedido** from a delivered order. Tsuru prepares the invoice from the order's own lines without scanning or re-entering its products. The merchant reviews the fiscal checkout and issues the document; Tsuru links that document back to the order automatically. A registered business can also keep making manual orders that are never invoiced.

The landing should avoid defining the first group as “informal” or implying that Tsuru determines whether a business must register or invoice. Public wording should say **“todavía no usás facturación electrónica”** or **“querés empezar por tus pedidos”**. The platform's `registered-organization` record is a product configuration signal, not a statement about a merchant's legal obligations.

**A third path is planned, not live:** customers will place orders on the merchant's template-based online store and those orders will appear in Tsuru for the merchant to manage. The storefront-to-Tsuru connection is not wired end to end yet (roadmap TSR-118, W11). Today the store/catalog can lead a customer to the merchant through WhatsApp; the merchant creates or manages an order in Tsuru separately. Do not fold future automatic storefront orders into the present-tense order promise.

## Product evidence and boundaries

| What the proposed copy may say | Grounding / limit |
|---|---|
| A business can create a manual order without a fiscal identity configured in Tsuru. | `useFiscalMode` exposes `orders-only`; `PM` is available there, subject to `commercial/create/orders`. |
| An order can include products, customer, quantity, price, delivery details, and an optional proforma choice. | POS manual-order editor and `OrderInfoSection`; the order page lists, searches, filters, and shows status. |
| Orders can be captured while offline and sent when connectivity returns. | The manual-order flow uses the same local outbox as POS sales. Phrase as **queued for sync**, not as already received by the server. |
| A merchant can follow an order through its status. | `OrdersPage` and `OrderDetailPage` show status and the latter can update it. |
| Electronic invoicing is available as a separate configured path, free on every plan. | Existing POS fiscal mode and the published Semilla promise. Keep the invoicing pillar prominent, but make its applicability explicit. |
| A delivered order can become an invoice without scanning or re-entering products. | `OrderDetailPage` offers **Facturar pedido** when the organization is in electronic mode, the order is delivered and not already billed, and the user can create an FE. `OrderCheckoutDrawer` builds the invoice lines from the order itself, not a fresh catalog lookup. The merchant still reviews receiver, taxes, and payment before issuing. |
| The issued document is associated with its source order automatically. | The order reference travels with the document; sales-be publishes a link when it emits the document, and the validator updates its status after Hacienda's verdict. store-be stores the document link on the order. The UI may show processing before acceptance; a rejected document does not count as billed. |
| A customer order placed on a template store will appear in Tsuru automatically **once that integration ships**. | **Planned only.** TSR-118/W11 covers the storefront order POST and template checkout wiring; the owner confirmed the end-to-end path is not connected yet. Label this **Próximamente / Coming soon** wherever shown. |

**Do not promise:** that a manual order is a tax receipt, that Hacienda receives it, that the order flow collects payment, that registration with Hacienda is unnecessary, that every merchant can issue an electronic document immediately after signup, or that a template-store customer order already arrives automatically in Tsuru. The invoice is **not issued automatically on delivery**: the merchant chooses **Facturar pedido** and confirms the fiscal checkout. A manual order needs a POS session with a branch and terminal assignment. Do not describe setup as “one click” or “ready in minutes” without validating that path end to end.

## The merchant story to show

Use a **clearly illustrative** example, not a customer testimonial:

> Ana vende pan por encargo. Recibe un mensaje con seis productos para entregar el sábado. En Tsuru prepara el pedido con el cliente, los productos, el total y la fecha de entrega. Después consulta su estado en la lista de pedidos. No tiene que empezar creando un comprobante electrónico para organizar ese trabajo. Más adelante configura la facturación electrónica que le corresponde. Cuando entrega un pedido, abre **Facturar pedido**: las líneas ya están ahí, revisa el comprobante y lo emite. Tsuru lo vincula con el pedido, sin volver a cargar los productos.

This example should become a small visual sequence or real product screenshots: **mensaje → pedido → seguimiento → entrega → factura vinculada, si corresponde**. Capture from the actual POS, with invented sample data and no fabricated business endorsement. Show the invoice step as a continuation of the same order, not as a new sale requiring the products to be entered again.

A separate **future-state** frame may show **cliente compra en la tienda → pedido aparece en Tsuru → comercio lo atiende**. Mark that frame **Próximamente** and keep it visually separate from the working manual-order sequence until the storefront integration is live and verified.

## Proposed landing hierarchy

| Surface | Proposed change | Why |
|---|---|---|
| Home hero | Lead with products, customers, and orders; name the template-based online store and free Hacienda invoicing as the two supporting paths. Keep the free account CTA. | A merchant without invoicing sees an immediate use for Tsuru and recognizes the store as part of the same platform. |
| First proof block | Add an **“Empezá por tus pedidos”** section before the current invoicing section, using the real manual-order flow and an illustrative screen. | Show that “orders-first” is a working capability, not merely an audience claim. |
| How it works | Explain creating an account, adding products/customers, and creating an order. Show fiscal configuration as an additional path where applicable. | The current steps jump from profile to store publishing and skip the order itself. |
| Storefront block | Show the template-based online store and the current share/WhatsApp path. If mentioning customer checkout flowing into Tsuru, use a **Próximamente** badge and a separate future-state sentence. | Keep the online store relevant without presenting the unfinished order integration as live. |
| Invoicing block | Keep the free Hacienda promise. Lead with **“Del pedido entregado a la factura, sin empezar de cero”**, then explain the required fiscal setup and show the order/invoice association. | Invoicing remains a strength and a clear next step for an order-first merchant, without implying that every visitor must use it. |
| `/funcionalidades` | Give order capture and tracking a dedicated feature card near the top. Clarify that automatic Hacienda submission belongs only to electronic documents. | The current grid has an invoice card but no order-management card. Its offline card says everything “factura solo,” which is wrong for manual orders. |
| `/planes` | Keep prices, tier names, and solidarity promises. Add one line that Semilla can start with orders and that fiscal documents remain free when applicable. | Avoid making the free tier sound useful only to taxpayers already issuing documents. |
| Navigation and final CTA | Keep one registration destination; use copy broad enough for both paths. Consider an in-page link to the order proof block. | No new product or signup route is needed. |

The resulting home sequence would be **hero → how it works → orders proof → online store (current sharing + planned direct-order sync) → electronic invoicing → plans → values/community → final CTA**. Community features and storefront order sync continue to be marked as under construction where mentioned.

## Approved public copy

This copy is short enough to work in the landing structure. Spanish is the source; English mirrors its promise. The implemented storefront block separates today's WhatsApp flow from the planned automatic order sync for clearer status.

| Placement | Español | English |
|---|---|---|
| Hero heading | **Vendé a tu ritmo. Llevá tus pedidos en orden.** | **Sell at your pace. Keep every order organized.** |
| Hero supporting text | Tsuru reúne tus productos, clientes y pedidos en un solo lugar, y te da una tienda en línea para mostrar lo que vendés. Empezá por organizar pedidos aunque todavía no usés facturación electrónica; cuando te corresponda, facturá gratis ante Hacienda. | Tsuru brings your products, customers, and orders together and gives you an online store to show what you sell. Start by organizing orders even if you are not using electronic invoicing yet; when it applies to you, invoice through Hacienda for free. |
| Orders section heading | **Primero, que ningún pedido se te pierda.** | **First, keep every order in sight.** |
| Orders section body | Prepará pedidos con productos, cliente, total y entrega; consultá su estado desde un mismo lugar. Un pedido te ayuda a organizar el trabajo: no es un comprobante de Hacienda. | Prepare orders with products, customer, total, and delivery details; follow their status in one place. An order helps organize the work: it is not a Hacienda receipt. |
| Storefront section heading | **Tu tienda muestra lo que vendés.** | **Your store shows what you sell.** |
| Storefront section body | Compartí tu catálogo desde una tienda hecha con una plantilla y conversá con tus clientes por WhatsApp. **Próximamente**, los pedidos hechos directamente en la tienda aparecerán en Tsuru. | Share your catalog through a template-based store and talk with customers on WhatsApp. **Coming soon**, orders placed directly in the store will appear in Tsuru. |
| Invoicing section heading | **Del pedido entregado a la factura, sin empezar de cero.** | **From delivered order to invoice, without starting over.** |
| Invoicing section body | Si tu negocio tiene la configuración fiscal necesaria, podés facturar un pedido entregado sin volver a cargar sus productos. Revisás el comprobante, lo emitís ante Hacienda y Tsuru lo vincula automáticamente con el pedido. La facturación electrónica sigue siendo gratuita en todos los planes. | With the required fiscal setup, you can invoice a delivered order without re-entering its products. Review the document, issue it to Hacienda, and Tsuru automatically links it to the order. Electronic invoicing remains free on every plan. |
| Feature card | **Pedidos para vender con orden.** Registrá lo que te piden, a quién se entrega y cuándo; seguí el avance desde la lista de pedidos. | **Orders that keep work organized.** Record what was requested, who receives it, and when; follow progress from your order list. |
| Final CTA | **Empezá con tu próximo pedido. Crecé a tu ritmo.** | **Start with your next order. Grow at your pace.** |

The earlier hero's “Vende legal” line was replaced as part of the approved copy change. It was easy to misread beside a message aimed at businesses without electronic invoicing.

## Alignment and layout rule for the approved landing change

Keep **centered headings, hero copy, centered section introductions, and centered CTAs** as they are. **Justify prose that is otherwise left aligned**: explanatory paragraphs in cards, split sections, use cases, plan descriptions, footer description, and longer informational/legal copy. Apply this to the public landing pages in both languages. Keep navigation, labels, buttons, prices, short metadata, tables, and list controls aligned for scanning; these are not prose paragraphs. Use component-level `text-justify` rather than a global paragraph rule so centered content stays centered. Inspect narrow mobile cards for stretched spacing and adjust paragraph width or layout where needed.

## Approval and implementation checklist

- [x] Owner approved the two-path positioning, illustrative merchant story, bilingual copy, home sequence, and dedicated orders feature card.
- [x] Updated the landing JSON content and React layout together, with bilingual fields in the dev-only content editor.
- [x] Applied paragraph alignment to public pages and inspected the order/store sections at narrow and wide widths in Spanish and English, in both themes. The compact example card stays left aligned only on narrow mobile to avoid stretched word spacing.
- [x] Checked that manual orders are described as commercial records, while invoicing keeps the fiscal configuration, delivery, review, and user-initiated emission conditions.
- [x] Kept template-store customer orders explicitly marked **Próximamente / Coming soon** until the TSR-118/W11 storefront checkout, public API, and Tsuru order list are connected and verified end to end.
- [x] Type-checked, built, prerendered, and previewed locally before any publish decision.
- [x] Released the approved landing change from `fe/landing/main`; the Pages run passed and the live home metadata and landing bundle contain the order-first copy.
