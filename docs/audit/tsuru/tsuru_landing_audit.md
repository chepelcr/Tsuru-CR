# Tsuru Landing — Product & Positioning Audit

**Scope:** `E:/dev/BeautyMarket/landing-client` (standalone repo `chepelcr/tsuru-landing`), audited as the primary source of truth for product vision, branding, value proposition, audiences, and strategic positioning.
**Method:** Direct reading of all JSON content entities in `landing-client/src/content/*.json` and the public pages in `landing-client/src/pages/*.tsx` that render them. Spanish copy quoted verbatim; analysis in English.
**Date:** 2026-06-11

---

## 1. Branding & Identity

### 1.1 The brand the public sees is "Tsuru", not "Tsuru"

Despite the repo being named `tsuru-landing` (`landing-client/package.json` → `"name": "tsuru-landing"`), **the string "Tsuru" never appears in public-facing content**. Every consumer touchpoint brands the product as **Tsuru**:

| Surface | Evidence |
|---|---|
| Company name | `src/content/branding.json` → `"companyName": "Tsuru"` |
| Navbar / footer brand | `src/content/navbar.json` → `"brand": {"es": "Tsuru"}`; `src/content/footer.json` → same + copyright `"© 2026 Tsuru. Todos los derechos reservados."` |
| HTML title | `index.html` → `<title>Tsuru - Tu comunidad, tu mercado</title>` |
| SEO defaults | `src/content/seo.json` → `"defaultTitle": {"es": "Tsuru - Tu comunidad, tu mercado"}`, `siteUrl: "https://tsuru.jcampos.dev"` |
| Page title suffixes | `contact.json`, `terms.json`, `privacy.json`, `cookies.json`, `blog-chrome.json` → `"docTitleSuffix": " | Tsuru"` |

"Tsuru" exists only in **internal/dev tooling**: the dev-only admin chrome (`src/translations/en.json` → `"admin.appName": "Tsuru Admin"`), DOM event names (`"tsuru:content-saved"` in `src/lib/admin-store.ts`, `src/components/admin/AdminTopbar.tsx`), and the package name. **Conclusion: "Tsuru" is the internal ecosystem/repo codename; "Tsuru" is the implemented consumer brand of this landing.**

### 1.2 Brand narrative (origin story)

The brand is anchored in a specific, verifiable-sounding origin story, repeated verbatim in `branding.json` (tagline) and `about.json` (subtitle):

> "Tsuru nació en Guápiles, Costa Rica, como un proyecto universitario comunitario en tiempos de pandemia para reconectar comunidades aisladas a través de sus ferias y redes de trueque." — `src/content/branding.json` (`tagline.es`)

Expanded in `about.json` (`queEs.description`, `story.paras`):

- Born from the **TCU "Comer Orgánico"** (Trabajo Comunal Universitario) of the **Universidad de Costa Rica**.
- In partnership with the **"Feria del Trueque Verde Manantial"** in Guápiles, Costa Rica.
- Built during COVID-19 as "una recreación digital de las ferias que existían antes" ("a digital recreation of the fairs that existed before").
- Self-described as documentation-driven: "documentamos cada paso de este proceso... Esa documentación vive en Tsuru" (`about.json` → `story.paras[2]`).

The origin story is also embedded in the legal copy: Terms §1 and §5 (`terms.json`) restate that the platform "nació del TCU \"Comer Orgánico\" de la Universidad de Costa Rica" and is IP "producida como parte del TCU".

### 1.3 Tone & verbal identity

- **Register:** warm, communitarian, first-person-plural ("Crecemos juntos, no a expensas del otro" — `community.json`), explicitly people-over-tech ("la tecnología debe servir a las personas — y no al revés" — `about.json` → `team.description`).
- **Signature phrases:** "Tu comunidad, tu mercado" (hero, `landing.json`); "vender con propósito" / "sell with purpose" (recurs in `landing.json` finalCta, `features.json` page title + cta); "No solo una tienda — un movimiento" (`about.json` → `queEs.title`); "Más que una tienda — una comunidad" (`community.json` → `title`).
- **Category label worn as a badge:** the hero badge is literally "Economía Social Solidaria" (`landing.json` → `hero.badge`), and the footer self-description is "Plataforma de Economía Social Solidaria para emprendedores, comercios locales y comunidades organizadas." (`footer.json` → `description.es`).
- **Bilingual ES/EN** throughout, Spanish-primary: all content fields are `{es, en}` and components fall back to `es` (`pick = f[lang] ?? f.es`, e.g. `src/pages/Landing.tsx`). Some "EN" fields are intentionally left in Spanish for cultural terms ("Trueque", "Ferias", barter example cards in `community.json`, decorative tags in `about.json`) — the brand keeps Spanish vocabulary as identity markers even in English mode.

### 1.4 Visual identity

- Single active theme in `src/content/themes.json` (`id: "default"`): **green primary** `123 46% 34%` (forest/organic green), **earth-brown accent** `15 25% 34%`, warm off-white background `60 30% 97%` — an organic/agro-ecological palette consistent with the SSE/local-food narrative.
- Serif display headings (`font-serif` on every h1/h2 in `src/pages/Landing.tsx`, `Examples.tsx`), `Sprout`/`Leaf`/`Heart`/`Scale` Lucide iconography (`Landing.tsx`, `cta-security-section.tsx`) — handcrafted/ethical visual codes, not corporate SaaS codes.
- Feature cards are color-coded `"green"`/`"earth"` in `features.json` (`featureCards[].color`).
- `branding.json` has empty `logoUrl`/`logoUrlDark`/`faviconUrl` — **no logo asset is configured**; the brand is currently typographic only.

---

## 2. Target Audiences

Explicitly named audiences, with evidence:

1. **Local entrepreneurs / micro-sellers** — "Conecta con emprendedores locales, publica tus productos..." (`landing.json` → `hero.subtitle`); footer: "para emprendedores, comercios locales y comunidades organizadas" (`footer.json`).
2. **Artisans & makers** — "Vendedores de artesanías que necesitan un catálogo digital bonito para compartir en ferias locales y en línea." (`features.json` → `useCases[0]`).
3. **Food entrepreneurs / home cooks** — "Cocineros caseros y productores de alimentos que venden sus productos por WhatsApp y redes sociales." (`features.json` → `useCases[1]`).
4. **Local cooperatives & organized community groups** — "Grupos comunitarios que gestionan ventas colectivas, trueque y proyectos económicos compartidos." (`features.json` → `useCases[2]`); reinforced by the Oaxaca cooperative testimonial in `community.json` → `stories[2]`.
5. **Local businesses ("comercios locales")** — `footer.json` description; `about.json` → `queEs.description` ("emprendedores, comercios locales y comunidades").
6. **Buyers / neighbors as community members** — fairs are framed for buyers too: "Los compradores pueden descubrir muchos productores locales a la vez" (`fairs.json` → `what.description`); barter participants need not be sellers at all (`community.json` → `barter`).
7. **Fair organizers / whole communities** — "una herramienta para cualquier comunidad que quiera preservar su economía local" (`about.json` → `story.paras[2]`); physical fairs "organizados por comunidades locales" (`fairs.json` → `types[1]`).

**Implicit profile:** low-tech, WhatsApp-first, Spanish-speaking Latin American sellers ("Sin programación" — `features.json`; "WhatsApp — el canal más usado en nuestra comunidad" — `blog.json` → article6). Testimonials place users in Buenos Aires, Medellín, and Oaxaca (`community.json` → `stories`), signaling pan-LatAm ambition beyond the Costa Rican origin.

---

## 3. Product Promises (complete inventory)

| # | Promise / Claim | Source | Notes |
|---|---|---|---|
| 1 | Create your store "en minutos" with a template that fits your style/business | `landing.json` → `howItWorks.steps[0]` | Backed by real template system in the platform (monorepo `templates/`, `/api/templates`). |
| 2 | Professional store templates, "Sin programación" (no coding) | `features.json` → `featureCards[0]` ("Diseña tu tienda") | Implemented — Examples page fetches live templates from `${VITE_API_URL}/api/templates?activeOnly=true` (`src/pages/Examples.tsx`). |
| 3 | Sell via WhatsApp: share catalog link, receive orders directly through WhatsApp | `features.json` → `featureCards[1]`; `landing.json` → `howItWorks.steps[2]`; `about.json` ("vender (principalmente por WhatsApp)") | Core distribution promise; positioned as the primary sales channel. |
| 4 | Product/catalog management: photos, descriptions, prices, "todo en un lugar", manageable "desde cualquier lugar" | `features.json` → `featureCards[2]`; `landing.json` → `howItWorks.steps[1]` | Matches POS/dashboard capabilities of the wider platform. |
| 5 | Shareable digital catalog with **QR code** + link, usable on social, messaging, print | `features.json` → `featureCards[3]` ("Catálogo digital compartible") | Concrete capability claim (QR). |
| 6 | Order tracking: manage orders, keep customers informed "en cada paso del proceso" | `features.json` → `featureCards[4]` | |
| 7 | Own online address from day one ("Tu tienda tiene una dirección única desde el primer día") | `features.json` → `featureCards[5]` | Maps to per-org subdomains (`{slug}.tsuru.jcampos.dev`) in the platform. |
| 8 | **Free to start / free store**: "Crea tu espacio gratis", "Empezar gratis", "Crear tu tienda gratis", "Crea tu tienda gratis" | `landing.json` → `finalCta`; `about.json` → `team.button`; `features.json` → `cta.button`; `community.json` → `cta.subtitle` | Repeated 4+ times; the only pricing statement on the entire site (no paid tier mentioned anywhere). |
| 9 | **No hidden fees** / transparent pricing: "Sin cargos ocultos, sin sorpresas." / "Sin costos ocultos." | `landing.json` → `values.items[3]`; `community.json` → `values[3]`; `about.json` → `values[3]` | Strong commercial promise stated as a core value. |
| 10 | Fair trade guarantee: "Garantizamos condiciones justas y precios transparentes para todos los participantes del ecosistema." | `landing.json` → `values.items[0]` | Note the verb "Garantizamos" (we guarantee) — strongest-worded claim on the site; legally softened in `terms.json` §4/§6 (platform is only a "facilitador", provided "as is"). |
| 11 | **Barter system (trueque)**: members can "intercambiar productos o servicios sin dinero. Habilidades, tiempo, bienes — todo tiene valor." with a 3-step flow (list / find / agree & exchange) | `community.json` → `barter` | Presented as an existing product feature ("Nuestro sistema de trueque permite..."); also Blog article4 "Trueque 101: Cómo Hacer Tu Primer Intercambio... en la plataforma" (`blog.json`). **No barter functionality is evidenced in the platform's documented backend (products/orders/categories CMS)** — flagship differentiator, apparently aspirational. |
| 12 | **Fairs (ferias)** as organized events — three types: virtual fairs, local/physical fairs, barter & exchange fairs | `fairs.json` → `types` | Virtual fairs "Promovidos en toda la comunidad Tsuru". |
| 13 | Fair participation flow: set up store → "Inscríbete en una feria... solicita participar como vendedor" → sell & connect | `fairs.json` → `howJoin` | Implies a fair-registration/application feature; no public UI on the landing performs this (CTA routes to generic register URL `admin.tsuru.jcampos.dev/register`, `branding.json`). |
| 14 | Mutual support networks: "Encuentra colaboradores, mentores y clientes que creen en el comercio local." | `community.json` → `mutual` | Community/social-graph promise; no corresponding feature evidenced. |
| 15 | Preserve and document community fair culture: "Preserva y documenta la cultura de ferias comunitarias" | `about.json` → `queEs.points[3]`, `story.paras[2]` | Mission-level promise unique to this brand. |
| 16 | Traction claim: "Únete a miles de emprendedores que ya venden con propósito." (thousands of entrepreneurs) | `features.json` → `cta.subtitle` | Unverifiable marketing number; in tension with the project's stated young/university scale. |
| 17 | Testimonial claims: "ahora tengo 200 clientes fieles"; barter of design-for-legal-services; cooperative got digital presence "sin necesitar un programador ni pagar una fortuna" | `community.json` → `stories[0..2]` | Named personas (María González/Buenos Aires, Carlos Ruiz/Medellín, Ana Morales/Oaxaca) — read as illustrative placeholder testimonials, not verified customers. |
| 18 | Contact responsiveness: "Generalmente respondemos a todas las consultas dentro de 24 horas durante los días laborales." | `contact.json` → `responseTimeDesc` | **Contradicted by implementation**: the contact form is a fake submit — `src/pages/Contact.tsx` resolves a 1s `setTimeout` then shows success; `src/content/settings.json` → `"contact": {"delivery": "none"}`. No message is delivered anywhere. |
| 19 | Contact channels: `hola@tsuru.com`, phone "+506 XXXX-XXXX" (placeholder), "San José, Costa Rica" | `contact.json` → `contactInfo` | Phone is literally an unfilled placeholder shipped in content. |
| 20 | Newsletter: "Suscríbete a nuestro boletín... Respetamos tu privacidad. Puedes desuscribirte en cualquier momento." | `blog-chrome.json` → `newsletter`, `privacyNote` | Subscribe UI promise; no backend evidenced in this static site. |
| 21 | Data security: "Tus datos se almacenan en servidores seguros con tecnología de cifrado" + physical/electronic/procedural safeguards | `privacy.json` → §3 | |
| 22 | **GDPR compliance**: "Cumplimos con las regulaciones de protección de datos aplicables, incluyendo el GDPR" + data-subject rights (access/correct/delete/port) via `privacy@tsuru.com` | `privacy.json` → §7, §6 | Strong compliance claim for a university-born community project. |
| 23 | Cookie consent banner: "Cuando visitas Tsuru por primera vez, mostramos un banner de consentimiento de cookies" with accept/reject/customize, changeable "a través de la configuración de tu cuenta" | `cookies.json` → `manageSections[1]` | **Not implemented on the landing** — no consent banner component exists in `src/components/` or `src/App.tsx`. Claim references account settings that belong to the separate admin app. |
| 24 | Users keep ownership of their content; platform gets non-exclusive display license | `terms.json` → §5 | Creator-friendly IP stance, consistent with brand values. |
| 25 | Platform is facilitator only; user-to-user transactions/barter are between the parties | `terms.json` → §4, §6 | Defines the marketplace model: no payment intermediation claimed. |
| 26 | Community commitment pledge: users agree to participate "con respeto, honestidad y solidaridad... pedimos a cada usuario que honre ese espíritu en cada interacción." | `terms.json` → `acceptanceNotice` | Values codified into the ToS — unusual and on-brand. |
| 27 | Live store examples to browse ("Ver ejemplos") | `landing.json` → `hero.secondary`; `src/pages/Examples.tsx` | Implemented: fetches real templates from the platform API and links to `https://{name}-example.tsuru.jcampos.dev`. |

---

## 4. Value Proposition Map

**Core proposition (hero):** "Tu comunidad, tu mercado" — "Conecta con emprendedores locales, publica tus productos y participa en una economía que pone a las personas primero." (`landing.json` → `hero`).

| Audience | Pain | Promised gain | Enablers (claimed features) | Source |
|---|---|---|---|---|
| Micro-entrepreneurs (artisans, home cooks) | No affordable/easy digital presence; can't code | A beautiful own store + unique URL in minutes, free | Templates, no-code, subdomain, QR/shareable catalog | `features.json`, `landing.json` |
| WhatsApp-first sellers | Informal, chaotic order intake | Orders received through the channel they already use, with tracking | WhatsApp selling, order tracking, catalog management | `features.json` cards 2–5 |
| Cooperatives / community groups | Digital presence costs "una fortuna"; collective sales are hard | Collective sales, barter, shared economic projects without a programmer | Store + community features | `features.json` → `useCases[2]`, `community.json` → `stories[2]` |
| Community members (incl. non-sellers) | Money-gated exchange; post-pandemic disconnection | Moneyless exchange of skills/time/goods; reconnection | Barter system, mutual support networks | `community.json` → `barter`, `mutual` |
| Buyers | Hard to find local producers | Discover many local producers at once | Fairs (virtual/local/barter) | `fairs.json` |
| Fair organizers / communities | Fair culture endangered (pandemic precedent) | Digital continuity + cultural preservation/documentation | Fairs platform, documentation mission | `about.json`, `fairs.json` |

**Value spine (the six principles, `community.json` → `values`):** Comercio justo · Producción local · Consumo consciente · Transparencia · Colaboración · Intercambio. The landing home page uses a four-value subset (`landing.json` → `values.items`: Comercio justo, Consumo consciente, Comunidad local, Transparencia), and the same three pillars (Transparencia / Comercio justo / Comunidad local) are repeated as trust pills in the hero, final CTA, and the shared CTA section (`landing.json`, `src/content/cta-security.json` + `src/components/sections/cta-security-section.tsx`).

**Pricing in the value prop:** free, with no hidden fees — the site never mentions commissions, plans, or paid tiers anywhere.

---

## 5. Strategic Positioning & Mission

**Mission (verbatim, `about.json` → `mission.description.es`):**
> "Dar a las comunidades las herramientas digitales para mantenerse conectadas, comerciar de forma justa y mantener vivas sus tradiciones de ferias y trueque locales — sin importar lo que el mundo les depare."

**Category claimed:** "Plataforma de Economía Social Solidaria" (Social Solidarity Economy platform) — stated as the hero badge (`landing.json`), the footer self-description (`footer.json`), and a Terms-of-Service definition (`terms.json` §1). Barter fairs are called "Economía Social Solidaria pura" (`fairs.json` → `types[2]`). An entire blog article is dedicated to defining the category ("¿Qué es la Economía Social y Solidaria?", `blog.json` → article2, authored by "TCU Comer Orgánico").

**Positioning, decomposed:**
- **Against generic e-commerce SaaS:** "No solo una tienda — un movimiento" (`about.json`); "emprendedores que valoran la comunidad sobre la complejidad" (`features.json` → `page.subtitle`); "Más que una tienda — una comunidad" (`community.json`).
- **Moneyless economy as differentiator:** barter/trueque is elevated to a principle ("El valor no siempre necesita dinero. El trueque es bienvenido aquí." — `community.json` → `values[5]`) and a fair type — no mainstream store-builder competitor claims this.
- **Cultural preservation as purpose:** the platform frames itself as infrastructure for keeping fair culture alive and documented (`about.json` → `story`, `queEs.points`; blog article5 "Las Ferias Locales como Infraestructura Comunitaria").
- **Academic/communal legitimacy:** UCR TCU provenance is used as a trust anchor in About, Terms (§1, §5), and blog authorship ("TCU Comer Orgánico", "UCR TCU", "Feria Verde Manantial" — `blog.json`).
- **Channel strategy:** WhatsApp-native commerce for LatAm informal sellers, not checkout-and-payments e-commerce; the platform explicitly does not intermediate transactions (`terms.json` §4).

**Social-solidarity / cooperative / fair-trade vocabulary census:** "Economía Social Solidaria" (landing hero, footer, fairs, terms), "comercio justo" (landing, community, about, terms ×2, cta-security), "trueque" (branding tagline, about, community, fairs, blog ×2, terms), "cooperativas" (features useCases, community stories), "consumo consciente" (landing, community, about, blog), "solidaridad" (terms §2, acceptanceNotice), "redes de apoyo mutuo" (community), "economía comunitaria" (about decorative tagline, seo description). This language saturates every entity — it is the brand, not garnish.

---

## 6. Observations

1. **Brand split: internal "Tsuru" vs public "Tsuru".** The ecosystem/repo identity (Tsuru — `package.json`, admin chrome, the standalone repos `tsuru-landing`/`tsuru-pos-system`) is invisible to users; all public content says Tsuru. Any rebranding to "Tsuru" would require touching essentially every content file (`branding.json`, `navbar.json`, `footer.json`, `seo.json`, all `docTitleSuffix` fields, `terms.json`/`privacy.json` body copy, `index.html`).
2. **Deployment-identity drift.** `seo.json` declares `siteUrl: "https://tsuru.jcampos.dev"` and `branding.json` points CTAs at `https://admin.tsuru.jcampos.dev`, while the repo's own `landing-client/CLAUDE.md` states the site is hosted at `https://tsuru.jcampos.dev`. Canonical URLs, sitemap, and OG tags generated from `seo.json` would therefore point at the old domain.
3. **Marketing vs implemented platform gap.** The landing sells an SSE community/barter/fairs platform, but the monorepo platform it fronts (multi-tenant store builder: templates, products, orders, subdomains — see root `CLAUDE.md`) only evidences promises #1–#7. The flagship differentiators — **barter system (#11), fair registration (#12–13), mutual support networks (#14)** — have no visible implementation and should be treated as **aspirational/roadmap claims presented in present tense**.
4. **Broken promise in the contact flow.** `contact.json` promises a 24h response, but `src/pages/Contact.tsx` fakes submission (1s `setTimeout` → success toast) and `settings.json` sets `contact.delivery: "none"`. Messages are silently discarded — a trust liability for a brand whose #1 value is "Transparencia".
5. **Compliance claims exceed the implementation.** `privacy.json` claims GDPR compliance and `cookies.json` describes a consent banner with accept/reject/customize; no consent banner exists in the landing codebase, and "configuración de tu cuenta" refers to a different app. Cookie examples even list Google Analytics and marketing cookies (`cookies.json` → `types`) with no corresponding scripts in the site.
6. **Placeholder content shipped as fact.** Phone "+506 XXXX-XXXX" (`contact.json`), named testimonials with specific numbers ("200 clientes fieles", `community.json`), and "miles de emprendedores" (`features.json`) are unverified/placeholder; testimonial geographies (Buenos Aires/Medellín/Oaxaca) widen the story beyond the Costa Rican origin, intentionally or not.
7. **Pricing strategy is "free, full stop."** Four CTAs say gratis and two values say no hidden fees; there is zero monetization narrative anywhere on the site. Any future pricing introduces direct conflict with promises #8–#9.
8. **Legacy naming residue.** `cta-security-section.tsx` is named "security" but renders the values pills (Transparency / Fair trade / Local community) from `cta-security.json` — a relic of a previous, security-themed positioning, now repurposed to values messaging.
9. **Strong content architecture.** The no-hardcoded-text rule holds in practice: every audited page imports its own content entity (`grep` of `from "@/content/..."` across `src/pages/` and layout components), Blog routes through `src/services/blog.service` over `blog.json`, and Examples is the only page with live API dependence — so the landing genuinely is the editable single source of truth it is designed to be.
10. **Internal value-set inconsistency (minor).** Home shows 4 principles (`landing.json`), Community shows 6 (`community.json` adds "Producción local" and "Colaboración"/"Intercambio"), About shows 4 (`about.json`). Harmless, but a canonical values list does not exist in one place.
