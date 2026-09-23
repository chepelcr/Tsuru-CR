# Tsuru landing — current client brief

**Updated:** 2026-09-23
**Purpose:** Working brief for the public landing and its visual identity.
**Content source:** `fe/landing/src/content/` (especially `landing.json`, `billing.json`, `features.json`, `plans.json`, `branding.json`, and `themes.json`). The logo handoff is [`LOGO_DEFINITION.md`](./LOGO_DEFINITION.md).
**Release status:** The owner approved the order-first direction in [`LANDING_ORDERS_FIRST_PROPOSAL.md`](./LANDING_ORDERS_FIRST_PROPOSAL.md). It was deployed to the public landing on 2026-09-23 from `fe/landing/main` commit `26871c0` (Pages run `35931608710`).

## Product, audience, positioning

Tsuru is a Costa Rican point of sale and digital storefront for small merchants. A business can start by organizing **products, customers, and manual orders** even if it is not using electronic invoicing yet. With the required fiscal configuration, a merchant can invoice a delivered order from its existing lines, review and issue the document, and have it linked to the order. Electronic invoicing is free on every plan. Its longer-term vision is a digital home for local fairs, barter, and the social solidarity economy. **Tsuru** is the public brand; JMarkets is a former name, not a customer-facing label.

Lead with small businesses that need to keep orders organized: home businesses, food producers, artisans, feria vendors, pulperías, and small shops. Some already issue electronic documents; others will add that workflow when it applies to them. Cooperatives and businesses with teams are the next audience. Fair organizers are a future, consultative audience. The fiscal product and pricing are Costa Rica-specific; the landing is Spanish-first, with English content available.

**Positioning:** “Vendé a tu ritmo. Llevá tus pedidos en orden.” Orders are a useful starting point in their own right. The template store shows the catalog and connects customers through WhatsApp today; automatic customer orders from that store into Tsuru are **Próximamente** (TSR-118/W11). Free Hacienda invoicing is a configured continuation when applicable. Community features are being built openly.

## Landing approach

1. **Start with the order promise.** The hero names products, customers, orders, the template store, and free Hacienda invoicing when applicable. Primary CTA: **“Crear mi cuenta gratis”** to `https://app.tsuru.jcampos.dev/register`; secondary CTA: **“Ver ejemplos”** to `/ejemplos`.
2. **Show the path into the product.** Explain account setup, adding products and customers, and preparing and tracking orders. The order proof block uses a clearly illustrative merchant sequence: message → manual order → tracking → delivery → invoice, if applicable. A manual order is not a Hacienda receipt.
3. **Separate today’s store from its planned integration.** A merchant can share a template-based catalog and talk to customers through WhatsApp today, then prepare their order in Tsuru. Customer orders placed directly in the store appearing automatically in Tsuru are marked **Próximamente / Coming soon** until TSR-118/W11 is wired end to end.
4. **Show invoicing as a continuation.** With fiscal configuration in place, a merchant can open **Facturar pedido** from a delivered order. Tsuru prepares the invoice from the order lines without rescanning products; the merchant reviews and issues it, and Tsuru links the document to the order. The home page keeps a dedicated section about v4.4 receipts, digital signing, Hacienda submission, PDF/email, and offline preparation/sync. `/facturacion` resolves to that section.
5. **Present plans without implying checkout is live.** The home page has a four-plan teaser; `/planes` carries comparison, solidarity promise, FAQ, and details. Semilla starts with orders; fiscal documents remain free when applicable. Amounts are marked preliminary and plan CTAs display **“Próximamente”** while entitlement and billing work is pending.
6. **Explain the mission honestly.** Values and community sections connect order management, online selling, fiscal tools, and selling together. Ferias, trueque, and mutual-support features must be identified as **“en construcción” / “muy pronto”** wherever they appear. Tell the origin story accurately: the project began in **Puntarenas** and was inspired by the Feria del Trueque Verde Manantial in **Guápiles**.
7. **Close with one clear action.** Return to free registration; avoid extra conversion promises without operational backing.

The current home sequence in `fe/landing/src/pages/Landing.tsx` is hero → how it works → orders proof → online store (today + planned sync) → invoicing → plan teaser → values → community pillars → final CTA.

### Copy and proof rules

- Warm, direct, community-minded Spanish. Preserve the published Costa Rican phrasing; English is a faithful second language, not a separate market promise.
- State available capabilities in the present tense. Label planned capabilities explicitly. Do not invent customer counts, testimonials, support hours, security certifications, or guaranteed fair-trade outcomes.
- Keep infrastructure mostly out of primary copy. AWS, serverless, and multi-tenant design are implementation context, not the merchant's reason to sign up.
- Do not imply Tsuru is live across Latin America; Hacienda invoicing is specific to Costa Rica.
- Use real product examples and local merchant settings. Avoid generic stock-tech imagery and false “active fair” examples.
- Keep centered headings, hero/section introductions, and CTAs centered. Justify explanatory prose that is otherwise left aligned, while keeping narrow mobile cards readable.

## Current published plan model

The public model is **four tiers in colones (CRC)**, following a harvest metaphor. `fe/landing/src/content/plans.json` is the source for names, copy, prices, and flags. **Paid amounts are drafts, include IVA, and are not yet purchasable** (`draftPricing: true`, `ctaComingSoon: true`). The owner-level plan and organization quota have been implemented (`TSR-284`); feature entitlements, upgrade UX, and billing remain planned (`TSR-145/146`). Do not describe the published feature allowances as enforced today.

| Plan | Published price | Intended customer and shape |
|---|---|---|
| **Semilla** | **₡0, forever** | Small seller starting with manual orders and tracking. Invoicing and legal essentials remain available with fiscal setup; current published allowance is 30 receipts/month, 50 products, 30 clients, one branch and one terminal, plus catalog/QR/WhatsApp. Receipt volume is planned as a **soft allowance**, never a reason to block issuing a legal document. |
| **Cosecha** | **Draft: ₡20.000/month or ₡180.000/year** | Growing business: unlimited products/clients and receipts, connection of a domain the merchant buys and renews separately (DNS ownership verification before use), up to five team members, advanced reports, and premium templates. The merchant-facing domain setup is planned, not live yet. |
| **Cooperativa** | **Draft: ₡35.000/month or ₡315.000/year** | Multi-branch and larger teams: unlimited branches/terminals and seats, fine-grained roles, consolidated reporting, and assisted migration. |
| **Feria** | **A conversar** | Fair organizers and community projects: several organizations in one fair, public directory, barter, and community support. Consultative provisioning; no self-service purchase or fixed price. Fair capabilities are roadmap items. |

The annual drafts reflect **12 months for the price of 9**. Do not turn draft prices into finalized advertising until `draftPricing` is cleared and implementation is ready.

In the management backend, the **plan belongs to the user** (`users.plan`); organizations derive it from their owner. The implemented owner quotas are **Semilla 1 organization, Cosecha 3, Cooperativa unlimited, Feria 3**. This is product behavior, not an extra feature row currently advertised on `/planes`. `docs/roadmap/tsuru_plans_implementation.md` began before this owner-level decision; use `be/management-be/src/lib/plans.ts` and roadmap `TSR-284` for the current quota model.

### Promises across every tier

- Electronic invoicing remains free, including **all receipt types** (FE, TE, NC, ND, FC, FEX) and **ATV contingency mode**. Legal ability to issue a document must not depend on payment.
- **No commission on sales.**
- **Data export is free.**
- **Semilla does not expire and needs no card.**

These promises are published on `/planes` and constrain future product and design work. Paid tiers sell scale and convenience, not legal capability.

## Visual identity for the landing

The implemented palette is warm and grounded, inspired by natural pigments; the landing currently uses these colors in `themes.json`:

| Role | Color |
|---|---|
| Primary burgundy / wordmark | `#6B2A22` |
| CTA red | `#D9381E` |
| Secondary forest green | `#2E5033` |
| Warm sand background | `#F4EFE6` |
| Body charcoal | `#3D4045` |
| Golden accent | `#E8B83A` |

The page pairs **Playfair Display** headings with readable sans-serif body text. Keep typography warm and editorial, with generous space, clear card grouping, and subtle motion. The brand should feel useful, trustworthy, local, and approachable. Light and dark modes both need a legible logo.

The raster package in `docs/brand/logo/tsuru_brand_package/` is live on the landing, admin dashboard, and POS (2026-09-23). The landing navbar/footer use the light and reverse wordmarks; its favicon switches with the color mode; and `seo.json` points to the supplied social card. The POS manifest uses the supplied app icons. Editable vector masters remain a later production step. See [`LOGO_DEFINITION.md`](./LOGO_DEFINITION.md) for the asset family and handoff.

The name story may be told with attribution to Bribri culture. **Do not introduce Bribri sacred symbols, an Ú-sure/cacao cosmology mark, etnogeometric patterns, or pre-Columbian motifs into logo or landing assets without the consultation/partnership required by `docs/roadmap/tsuru_rebrand_plan.md` §1.3.** A neutral botanical seed or leaf is acceptable as generic nature imagery; a wordmark-only logo is also valid.

## Source and status references

- Landing structure and copy: `fe/landing/src/pages/Landing.tsx`, `fe/landing/src/content/landing.json`, `billing.json`, `features.json`
- Plans and CTA state: `fe/landing/src/content/plans.json`, `fe/landing/src/pages/Planes.tsx`
- Identity slots and colors: `fe/landing/src/content/branding.json`, `themes.json`, `seo.json`, `fe/landing/src/components/layout/brand-logo.tsx`
- Strategy and cultural boundary: `docs/roadmap/tsuru_rebrand_plan.md` §1–2; production asset context: `docs/roadmap/tsuru_brand_asset_guide.md`
- Implemented owner plan and quota: `be/management-be/src/lib/plans.ts` and roadmap `TSR-284`; remaining entitlement work: `docs/roadmap/tsuru_plans_implementation.md` and roadmap `TSR-145/146`
