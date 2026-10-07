# TSURU Rebrand Plan — Tsuru → Tsuru

**Date:** 2026-06-11
**Status:** Approved direction (user decision 2026-06-11). **Spec only — no content changes applied in this workflow.**
**Scope:** All user-facing surfaces — landing content JSONs, POS strings, docs. **Explicitly OUT of scope:** domains, buckets, repos, package names, template/theme IDs, infra (`tsuru.jcampos.dev`, `admin.tsuru.jcampos.dev`, `tsuru-template-market`, `tsuru-demo`, Cognito, CI/CD paths). Those stay until a separate infra-rename workstream.
**Inputs:** `docs/audit/tsuru/tsuru_landing_audit.md`, `tsuru_reconciliation_report.md`, `tsuru_product_strategy.md`, `tsuru_research_reconciliation.md`, `tsuru_executive_vision.md`, `docs/Rebranding Web_ Economía Indígena Solidaria.txt`, plus a fresh grep inventory of `landing-client/src` and `templates/pos-system/src` (2026-06-11).

**Related approved workstreams (context for copy decisions):**
- **Fairs:** a real public fairs application (orgs join fairs, editable stands from the POS, own backend service) is now being built — so fairs copy moves from "false present tense" to **"coming soon, in active development"**, not deletion.
- **Trueque (barter):** an MVP (stand-published barter offers, accept/decline, WhatsApp handoff) is integrated into the fairs spec — same treatment: roadmap-framed, not deleted.
- **RBAC:** being implemented now in the Express server; irrelevant to copy except that it lets us eventually back the "condiciones justas" claim with real enforcement.

---

## 1. Brand decision summary — the Tsuru identity

### 1.1 Decision

**The public brand becomes Tsuru.** "Tsuru" is retired from every user-facing surface. The codebase already chose this name internally (repos `chepelcr/tsuru-pos-system` and `chepelcr/tsuru-landing`, "Tsuru Admin" chrome in `landing-client/src/translations/en.json`, the `tsuru:content-saved` DOM event in `landing-client/src/lib/admin-store.ts`) — the rebrand finishes publicly what the engineering already did privately (`tsuru_landing_audit.md` §1.1; `tsuru_research_reconciliation.md` §1 row "Costa Rican cultural identity").

### 1.2 Name story

From the strategic research (`docs/Rebranding Web_ Economía Indígena Solidaria.txt`, "Tsuru y el Cacao"): **Tsuru (or Tsiru) is the cacao plant in Bribri cosmology — the wife of the creator god Sibö, and the sacred currency of the spirit world ("todas las deudas se pagan con cacao")**. It stands for value that is relational rather than extractive, for the matrilineal economy (only women traditionally prepared the ritual cacao and inherit land), and for wealth that comes from the land of Talamanca, Costa Rica.

The research names Tsuru its **primary naming recommendation** precisely because it replaces "Markets" — a word that evokes the generic free-market paradigm the project opposes — with a Costa Rican symbol of sacred, reciprocal exchange.

**Public-facing name story (short form, usable in About):** *Tsuru is the Bribri name for cacao — Costa Rica's original currency, a wealth that is grown, shared, and repaid in community. We chose it because that is the economy we are building tools for.*

### 1.3 Indigenous-lexicon gating (the RIBCA rule)

Per `tsuru_research_reconciliation.md` §4 and `tsuru_executive_vision.md` §4, depth of Bribri cultural adoption is **explicitly gated**:

| Tier | What | Gate |
|---|---|---|
| **Tier 0 — ship now** | The name "Tsuru" + the one-paragraph name story above (cacao = Costa Rica's original community currency), with attribution to Bribri culture stated respectfully and factually. | None — public, documented cultural knowledge, used with credit, no sacred claims made on our behalf. |
| **Tier 1 — ship now** | Visual *direction* inspired by the research's natural-pigment palette (see §1.5) and warm/organic tone. Colors are colors; no sacred symbols. | None. |
| **Tier 2 — GATED** | Bribri lexicon as information architecture (Iriria for agriculture sections, Ú-sure as community space, Kökö for cooperative groups, Awá for curation roles), cosmology storytelling woven into product flows, Ú-sure/cacao logo mark, etnogeometric (Jaba/Kó/Penéch) patterns, precolombian iconography. | **Blocked until a real consultation/partnership exists with Bribri organizations (RIBCA / Stribrawpa or equivalent).** Using sacred cosmology commercially without the community's participation would invert the research's own dignity principle ("preservación digna"). Until then, none of this ships. |

Practical consequence: **this rebrand wave changes the name, the story paragraph, the honesty of the claims, and (optionally) the palette — and nothing deeper.**

### 1.4 Tone & verbal identity (kept, sharpened)

Keep what already works (audited as the brand's strongest asset, `tsuru_landing_audit.md` §1.2–1.3):

- **Warm, communitarian, first-person plural; Spanish-primary, tuteo** (consistent with existing copy: "Crea tu tienda", "Únete").
- **The origin story stays verbatim in spirit** — UCR TCU "Comer Orgánico", Feria del Trueque Verde Manantial, Guápiles, pandemic. It is the landing's highest-honesty content (About scored 7/10 in `tsuru_reconciliation_report.md` §4) and survives the rebrand with only the name swapped.
- **New rule: honest verbs.** No present tense for unbuilt features; no "garantizamos" without an enforcement mechanism; roadmap features are labeled "en construcción" / "muy pronto". This operationalizes the brand's #1 value (Transparencia), currently its most contradicted one (`tsuru_reconciliation_report.md` §3.2).
- **Spanish cultural terms stay untranslated in EN mode** ("Trueque", "Ferias") — existing intentional pattern, keep it.

### 1.5 Visual direction hints (Tier 1)

Current landing theme is a generic forest green (`landing-client/src/content/themes.json`, primary HSL `123 46% 34%`) with **empty logo slots** in `branding.json` — purpose-built for a swap (`tsuru_gap_analysis` O9 via `tsuru_product_strategy.md` §3).

Recommended target palette, from the research's natural-pigment table (Tier 1 — colors only, no sacred symbols):

| Role | Research name | Hex | UI use |
|---|---|---|---|
| Primary brand / headings | Borgoña Tsuru | `#6B2A22` | Logo type, major headings |
| CTA / active states | Carmesí Achiote | `#D9381E` | Primary buttons, alerts |
| Secondary / success | Dosel Talamanca | `#2E5033` | Secondary UI, agro category, success |
| Background | Arena de Mastate | `#F4EFE6` | Page backgrounds (replaces near-white) |
| Body text | Piedra Sĩã' | `#3D4045` | Paragraph text (replaces near-black) |
| Accent | Oro de Maíz | `#E8B83A` | Ratings, highlights, micro-interactions |

Implementation note: this is a single-file change in `landing-client/src/content/themes.json` (HSL-converted) + logo/favicon uploads into `branding.json` slots. The serif-display + Lucide `Sprout/Leaf/Heart` iconography stays. A wordmark-only logotype ("Tsuru" in Borgoña Tsuru serif) is acceptable for launch; the Ú-sure/cacao mark concept is Tier 2 (gated).

---

## 2. Messaging architecture

### 2.1 The repositioning thesis

From `tsuru_product_strategy.md` §3 and the reconciliation's "hidden asset" finding (`tsuru_reconciliation_report.md` §2): **the strongest implemented capability — free, legal Costa Rica e-invoicing on an offline-first POS — appears in zero of the landing's 22 content entities, while 14 of 27 audited promises are not built.** The rebrand therefore inverts the messaging: *lead with what is real (free billing engine + POS + catalog), and move the solidarity-economy surfaces (ferias, trueque) to an honest, public "coming soon" roadmap — which is now true, since the fairs application is in active development.*

**Positioning statement (adapted from `tsuru_product_strategy.md` §6):**

> **Tsuru is the free point of sale that gives Costa Rica's smallest sellers legal electronic invoicing and a shareable digital catalog — so the people who sell at ferias, from home, and over WhatsApp can formalize without paying for it.** Born from a Universidad de Costa Rica community project in Guápiles, Tsuru is growing — in the open — into the digital home of local fairs and the solidarity economy.

### 2.2 Pillars (in messaging priority order)

| # | Pillar | Headline claim | Backed by (evidence) | Status |
|---|---|---|---|---|
| **M1** | **Facturación electrónica GRATIS** (the headline pillar — the audit's "hidden asset") | "Factura electrónica de Hacienda (v4.4), firmada y enviada automáticamente — gratis." | Live end-to-end pipeline: clave/consecutive → XML → XAdES signing → ATV submit → validation → PDF → email (`biller-apps/auth/app/sales-api/.../sales_pipeline.py`; `tsuru_executive_vision.md` §6 Strength 1) | ✅ Real today |
| **M2** | **Punto de venta que funciona sin internet** | "Registra ventas aunque se caiga la conexión; se sincronizan solas." | Offline-first POS: IndexedDB capture + Background Sync (`templates/pos-system/src/lib/db.ts`, `public/sw.js`) | ✅ Real today |
| **M3** | **Tu catálogo digital, listo para WhatsApp** | "Tienda con plantilla profesional, dirección propia, QR y pedidos por WhatsApp." | Templates + clone service + per-org subdomain provisioning (`server/src/services/TemplateCloneService.ts`; jbiller provisioner). *Honesty caveat:* public product browsing for live orgs is broken until `PublicOrgController` last-mile fix — keep claims at catalog/link/QR level until then. | 🟡 Real with last-mile repair pending |
| **M4** | **Equipo y comunidad dentro de tu negocio** | "Invita a tu equipo: cajeros, colaboradores, cooperativas multi-persona." | Memberships + email invitations live (`server/src/services/{MembershipService,InvitationService}.ts`); never marketed despite cooperative audience | ✅ Real today |
| **M5** | **Ferias y trueque — en construcción, en público** | "Estamos construyendo las ferias digitales y el trueque — y puedes ver el avance." | New fairs backend + POS stand editor + barter MVP (approved workstream). Until shipped, ALWAYS labeled "muy pronto / en construcción". | 🔜 Roadmap (now honestly so) |

### 2.3 Audience-specific value props

| Audience (priority per `tsuru_product_strategy.md` §6) | Pain | Tsuru value prop (honest) | Leading pillar |
|---|---|---|---|
| **1. CR micro-merchants formalizing** (sodas, pulperías, feria vendors, home cooks, artisans) | Must issue facturas electrónicas; enterprise billing software is unaffordable and complicated | "Factura legal gratis, desde el celular, incluso sin internet." | M1 + M2 |
| **2. Cooperatives & organized community groups** | Collective sales need multi-user tools and cost a fortune | "Una cuenta, todo tu equipo: roles, invitaciones, cierres de caja — y facturación legal compartida." | M4 + M1 |
| **3. WhatsApp-first sellers** | Chaotic order intake over chat; no professional presence | "Catálogo con QR y enlace propio; el pedido llega por WhatsApp como siempre." | M3 |
| **4. Fair organizers & buyers (roadmap)** | Fair culture lost digital continuity post-pandemic | "Las ferias vuelven, en digital: stands, descubrimiento y trueque — lo estamos construyendo." | M5 |
| **Deferred: pan-LatAm sellers** | — | Dropped. Only CR fiscal stack is real (CR=188 seeded only); Buenos Aires/Medellín/Oaxaca placeholder personas are removed. | — |

### 2.4 Honest-claims policy: disposition of the 14 not-built promises

Per `tsuru_reconciliation_report.md` §1 (promise numbering from `tsuru_landing_audit.md` §3). Rule: **kill, fix, or move to a public "Muy pronto" roadmap section — nothing stays in false present tense.**

| Promise | Verdict | Disposition |
|---|---|---|
| #10 Fair-trade "Garantizamos…" | Not built | **Reword** — "Garantizamos" → "Trabajamos por condiciones justas y precios transparentes" (aspiración honesta, no guarantee verb) until RBAC + marketplace rules can enforce anything. |
| #11 Barter / trueque (present tense) | Not built | **Move to roadmap section** as "Trueque — muy pronto" (MVP is in the approved fairs spec). Reframe `blog.json` article4 ("Trueque 101 … en la plataforma") as cultural/educational, not product instructions, until the MVP ships. |
| #12 Fairs (3 types) / #13 fair registration flow | Not built | **Move to roadmap section** as "Ferias digitales — en construcción" with a short "being built in the open" note. Remove the fake "Active fairs" badge framing in `Ferias.tsx`/`fairs.json` until the fairs app is live. |
| #14 Mutual support networks | Not built | **Kill** (no workstream exists). May return later with the community layer. |
| #16 "miles de emprendedores" traction | Unsubstantiated | **Kill.** Replace with the verifiable origin-story credential (UCR TCU) or nothing. |
| #17 Testimonials (María/Carlos/Ana, "200 clientes fieles") | Placeholder | **Kill.** Replace only with real, consented CR merchant stories when they exist. |
| #18 24h contact response / #19 placeholder phone | Contradicted (fake form) | **Fix or remove:** either wire contact delivery (SES path exists in 3 backends) or delete the response-time promise and the placeholder phone "+506 XXXX-XXXX". Content-side: remove the promise now; the SES fix is a separate code task. |
| #20 Newsletter promise | UI shell | **Remove** the subscribe UI promise until a backend exists. |
| #21 "secure servers / encryption" / #22 GDPR / #23 cookie banner | Contradicted / not built | **Rewrite legal pages to describe actual practice** (no GDPR claim, no banner description, no encryption claims beyond what is true). Full legal rewrite is its own task; the rebrand pass at minimum swaps names and deletes the contradicted sentences. |
| #6 Order tracking ("en cada paso") | Not built (no consumer-order domain) | **Replace feature card** with a true one (e-invoicing or teams — see §3.2). |

---

## 3. Draft landing copy (ES primary, EN secondary)

All drafts respect the per-entity content model (`landing-client/src/content/*.json`, `{es,en}` fields; CLAUDE.md no-hardcoded-text rule). Drafts below are proposals for the content team — final copy is applied in the execution phase, not in this workflow.

### 3.1 Hero (`landing.json` → `hero`)

```json
{
  "badge": {
    "es": "Hecho en Costa Rica · Economía Social Solidaria",
    "en": "Made in Costa Rica · Social Solidarity Economy"
  },
  "title": {
    "es": "Vende legal. Vende fácil. Vende en comunidad.",
    "en": "Sell legally. Sell easily. Sell in community."
  },
  "subtitle": {
    "es": "Tsuru es el punto de venta gratuito con facturación electrónica de Hacienda para los emprendedores más pequeños de Costa Rica. Crea tu catálogo, recibe pedidos por WhatsApp y emite facturas legales — sin pagar nada.",
    "en": "Tsuru is the free point of sale with Hacienda electronic invoicing for Costa Rica's smallest entrepreneurs. Build your catalog, take orders over WhatsApp, and issue legal invoices — at no cost."
  },
  "cta": { "es": "Crear mi cuenta gratis", "en": "Create my free account" },
  "secondary": { "es": "Ver ejemplos", "en": "See examples" }
}
```

### 3.2 Value props / features section (`features.json` → `featureCards`, replacing the dishonest cards)

Six cards; #1 is new (M1), #5 replaces the not-built "Seguimiento de pedidos", #6 is new (M4):

1. **Facturación electrónica gratis** — ES: "Emite comprobantes electrónicos v4.4 firmados y enviados a Hacienda automáticamente. Lo que otros cobran caro, aquí es gratis." / EN: "Issue v4.4 e-invoices, digitally signed and submitted to Hacienda automatically. What others charge dearly for, here is free." *(icon: FileCheck / ReceiptText)*
2. **Vende aunque no haya internet** — ES: "Registra ventas sin conexión; cuando vuelve la señal, todo se sincroniza y factura solo." / EN: "Record sales offline; when the signal returns, everything syncs and invoices itself." *(icon: WifiOff)*
3. **Diseña tu tienda sin programar** — ES (kept from current card 1): "Elige entre plantillas profesionales adaptadas a tu tipo de negocio. Sin programación." / EN: "Choose from professional templates adapted to your type of business. No coding needed."
4. **Catálogo digital con QR y WhatsApp** — ES (merges current cards 2+4): "Comparte tu catálogo con un enlace y código QR; los pedidos te llegan directo por WhatsApp." / EN: "Share your catalog with a link and QR code; orders reach you directly on WhatsApp."
5. **Tu propio espacio en línea** — ES (kept from current card 6): "Tu tienda tiene una dirección única desde el primer día — fácil de compartir, fácil de recordar." / EN: "Your store gets a unique address from day one — easy to share, easy to remember."
6. **Tu equipo, dentro** — ES: "Invita a cajeros y colaboradores con roles y permisos. Hecho para cooperativas y negocios familiares." / EN: "Invite cashiers and collaborators with roles and permissions. Built for cooperatives and family businesses."

`useCasesSection.title`: ES "¿Quién usa Tsuru?" / EN "Who uses Tsuru?" — keep the three use cases but fix #3 (cooperatives) to remove the present-tense trueque: ES "Grupos comunitarios que gestionan ventas colectivas y proyectos económicos compartidos." / EN "Community groups managing collective sales and shared economic projects."

`cta.subtitle` (kills the "miles de emprendedores" claim): ES "Nacido de un proyecto comunitario de la UCR — construido para vender con propósito." / EN "Born from a UCR community project — built for selling with purpose."

### 3.3 Billing / e-invoicing pillar section (NEW content entity or `landing.json` block)

Proposed new section on the home page between `howItWorks` and `values` (new entity `billing.json` or a `billing` block in `landing.json`; requires the four admin pieces per `landing-client/CLAUDE.md`):

```json
{
  "badge": { "es": "Facturación electrónica", "en": "Electronic invoicing" },
  "title": {
    "es": "Factura legal ante Hacienda — gratis, de verdad",
    "en": "Legal Hacienda invoicing — genuinely free"
  },
  "subtitle": {
    "es": "Formalizarse no debería costar. Tsuru firma y envía tus comprobantes electrónicos a Hacienda automáticamente, para que el negocio más pequeño pueda vender legal desde el primer día.",
    "en": "Going formal shouldn't cost money. Tsuru signs and submits your e-invoices to Hacienda automatically, so even the smallest business can sell legally from day one."
  },
  "points": [
    { "es": "Comprobantes v4.4 firmados digitalmente (XAdES)", "en": "Digitally signed v4.4 receipts (XAdES)" },
    { "es": "Envío y validación automática ante Hacienda (ATV)", "en": "Automatic submission and validation with Hacienda (ATV)" },
    { "es": "PDF y correo al cliente, sin pasos extra", "en": "PDF and customer email, no extra steps" },
    { "es": "Funciona desde el celular, incluso sin conexión", "en": "Works from your phone, even offline" }
  ],
  "note": {
    "es": "Para nosotros, que el vendedor más pequeño pueda facturar legal es economía solidaria en la práctica.",
    "en": "To us, letting the smallest seller invoice legally is solidarity economy in practice."
  }
}
```

(All four bullets are Live capabilities per `sales_pipeline.py` and the offline POS — no aspirational claims.)

### 3.4 Pricing / free positioning (`landing.json` → `finalCta` + values item)

`values.items[3]` (Transparencia) — keep, it stays true: ES "Sin cargos ocultos, sin sorpresas. Operamos de forma abierta y honesta en cada paso."

`values.items[0]` (Comercio justo) — de-fang the guarantee: ES "Trabajamos por condiciones justas y precios transparentes para todos los participantes del ecosistema." / EN "We work for fair conditions and transparent prices for every participant in the ecosystem."

`values.subtitle`: ES "Tsuru está construido sobre valores que ponen a las personas y la comunidad primero" / EN "Tsuru is built on values that put people and community first".

`finalCta`:

```json
{
  "title": { "es": "¿Listo para vender legal y en comunidad?", "en": "Ready to sell legally and in community?" },
  "subtitle": {
    "es": "Crea tu cuenta gratis: punto de venta, catálogo y facturación electrónica incluidos. Sin comisiones sobre tus ventas.",
    "en": "Create your free account: point of sale, catalog, and e-invoicing included. No commissions on your sales."
  },
  "button": { "es": "Empezar gratis", "en": "Start for free" }
}
```

**Free-positioning guardrail** (per `tsuru_product_strategy.md` §6 monetization posture): copy commits to a *permanent free tier for micro-sellers* and *no commissions on sales* — claims that are true and intended to stay true. Copy must NOT say "everything will be free forever"; if paid tiers ever launch (custom domains, multi-branch), they must be announced transparently, and this section already leaves room for that.

### 3.5 Roadmap / "Muy pronto" section (NEW — receives the fairs/trueque copy)

New home-page or Ferias-page section (new entity `roadmap.json` or rework of `fairs.json`):

```json
{
  "badge": { "es": "En construcción", "en": "In the making" },
  "title": { "es": "Lo que viene: ferias y trueque", "en": "What's next: fairs and barter" },
  "subtitle": {
    "es": "Tsuru nació de una feria de trueque, y hacia ahí vamos: estamos construyendo las ferias digitales — con stands, descubrimiento de productores y ofertas de trueque — y lo hacemos en público.",
    "en": "Tsuru was born at a barter fair, and that's where we're headed: we're building digital fairs — with stands, producer discovery, and barter offers — and we're building them in the open."
  },
  "items": [
    {
      "title": { "es": "Ferias digitales", "en": "Digital fairs" },
      "status": { "es": "En desarrollo", "en": "In development" },
      "description": {
        "es": "Ferias con stands virtuales donde los negocios muestran sus productos juntos, como en la feria del barrio.",
        "en": "Fairs with virtual stands where businesses show their products together, just like the neighborhood fair."
      }
    },
    {
      "title": { "es": "Trueque", "en": "Barter (trueque)" },
      "status": { "es": "Muy pronto", "en": "Coming soon" },
      "description": {
        "es": "Publica ofertas de intercambio producto-por-producto desde tu stand y cierra el trato por WhatsApp.",
        "en": "Publish product-for-product exchange offers from your stand and close the deal over WhatsApp."
      }
    }
  ],
  "note": {
    "es": "Sin promesas infladas: cuando cada pieza esté lista, la verás aquí primero.",
    "en": "No inflated promises: when each piece is ready, you'll see it here first."
  }
}
```

### 3.6 About / mission (`about.json`)

`subtitle` / `branding.json tagline` (origin story, name swapped only):
ES: "Tsuru nació en Guápiles, Costa Rica, como un proyecto universitario comunitario en tiempos de pandemia para reconectar comunidades aisladas a través de sus ferias y redes de trueque."
EN: "Tsuru was born in Guápiles, Costa Rica, from a university community project during the pandemic to reconnect isolated communities through their local fairs and barter networks."

New `queEs` paragraph (adds the name story + honest product description):
ES: "Tsuru — el nombre bribri del cacao, la moneda original de Costa Rica — es una plataforma nacida del TCU \"Comer Orgánico\" de la Universidad de Costa Rica, en alianza con la Feria del Trueque Verde Manantial en Guápiles. Hoy es un punto de venta gratuito con facturación electrónica y catálogo digital para emprendedores, comercios locales y cooperativas — y está creciendo, en público, hacia las ferias digitales y el trueque con los que empezó esta historia."
EN: "Tsuru — the Bribri name for cacao, Costa Rica's original currency — is a platform born from the TCU \"Comer Orgánico\" at the Universidad de Costa Rica, in partnership with the Feria del Trueque Verde Manantial in Guápiles. Today it is a free point of sale with electronic invoicing and a digital catalog for entrepreneurs, local businesses, and cooperatives — and it is growing, in the open, toward the digital fairs and barter where this story began."

`mission.description` (rewritten to include formalization-as-solidarity):
ES: "Dar a las comunidades las herramientas digitales para comerciar de forma justa y legal — empezando por lo más concreto: que el vendedor más pequeño pueda facturar gratis — y mantener vivas sus tradiciones de ferias y trueque locales."
EN: "Give communities the digital tools to trade fairly and legally — starting with the most concrete thing: letting the smallest seller invoice for free — and keep their local fair and barter traditions alive."

`team.description` (name swap + honest scale): ES: "Tsuru comenzó como un proyecto universitario comunitario y sigue creciendo con esa misma vocación. Somos investigadores, desarrolladores y defensores de la comunidad que creemos que la tecnología debe servir a las personas — y no al revés."

---

## 4. Change inventory — every file containing Tsuru branding

Grep basis: `Tsuru|Tsuru|tsuru|J Markets` across `landing-client/src` (96 occurrences / 21 files), `templates/pos-system/src` (21 occurrences / 7 files), plus `index.html` files and docs (2026-06-11). **Type:** `C` = content-only (JSON/copy), `K` = code change, `D` = docs.

### 4.1 Landing — content JSONs (`landing-client/src/content/`) — all type C

| File | Refs | What it becomes |
|---|---|---|
| `branding.json` | 3 | `companyName: "Tsuru"`; tagline ES/EN name-swapped (§3.6). **Keep** `adminLoginUrl`/`adminRegisterUrl` domains (`admin.tsuru.jcampos.dev`) — infra, out of scope (separate known issue: they point at the legacy dashboard). Fill `logoUrl`/`faviconUrl` when wordmark assets exist. |
| `navbar.json` | 1 | `brand: {es:"Tsuru", en:"Tsuru"}` |
| `footer.json` | 3 | `brand` → Tsuru; copyright ES/EN → "© 2026 Tsuru. …"; description stays (no name in it). |
| `seo.json` | 4 | `defaultTitle` → "Tsuru - Tu comunidad, tu mercado" (or new hero line "Tsuru — Vende legal, vende fácil"); `defaultDescription` rewritten per §2 (mention facturación electrónica gratuita). **Keep `siteUrl: https://tsuru.jcampos.dev`** — domain out of scope (note: repo CLAUDE.md says GitHub Pages deploy is `tsuru.jcampos.dev`; resolving that drift is the infra workstream). |
| `landing.json` | 2 | `values.subtitle` ES/EN name swap; plus the §3.1/§3.4 copy rework and new billing/roadmap blocks. |
| `features.json` | 1 | `useCasesSection.title` → "¿Quién usa Tsuru?"; plus §3.2 feature-card rework (replaces not-built order tracking, kills "miles de emprendedores"). |
| `fairs.json` | 5 | Name swaps + entire page reframed to "en construcción" roadmap framing (§3.5); remove "Active fairs" present-tense framing. |
| `community.json` | 4 | `subtitle` name swap; **delete** the three placeholder testimonials (incl. "gracias a Tsuru … 200 clientes fieles"); barter block reframed to "muy pronto". |
| `about.json` | 13 | All name swaps + §3.6 rewrites (subtitle, queEs, story paras, mission, team). Origin story content otherwise preserved. |
| `terms.json` | 17 | Name swaps throughout §1–§7 + `docTitleSuffix` → " | Tsuru"; contact email line (see email note below). Keep facilitator stance (§4/§6 — most honest claim). §2 description must stop asserting fairs/barter as current features until shipped. |
| `privacy.json` | 5 | `docTitleSuffix` → " | Tsuru"; `privacy@tsuru.com` ×4 → new alias (see email note); delete/de-claim GDPR + encryption sentences per §2.4. |
| `cookies.json` | 3 | `docTitleSuffix` → " | Tsuru"; rewrite/remove the consent-banner description (#23 — banner doesn't exist). |
| `contact.json` | 2 | `docTitleSuffix` → " | Tsuru"; `hola@tsuru.com` → new alias; remove placeholder phone "+506 XXXX-XXXX" and the 24h-response promise (until SES delivery is wired). |
| `blog.json` | 7 | `author: "Equipo Tsuru"` ×3 → "Equipo Tsuru"; article titles/descriptions name-swapped ("Cómo Crear Tu Espacio Comunitario en Tsuru", etc.); article4 (Trueque 101) reframed as cultural/educational until barter ships. |
| `blog-chrome.json` | 1 | `docTitleSuffix` → " | Tsuru"; remove newsletter promise (#20). |

**Email note:** `hola@tsuru.com` / `privacy@tsuru.com` are brand-domain emails. Since domains are out of scope, replace with working aliases on an owned domain (e.g. existing SES-verified address) or a neutral "página de contacto" reference — do NOT ship `@tsuru.com` addresses that don't exist (would recreate the placeholder-content problem, audit Observation 6).

### 4.2 Landing — code (`landing-client/src` + root) — type K

| File | Refs | What it becomes |
|---|---|---|
| `landing-client/index.html` (lines 6–7) | 2 | `<title>` and meta description → Tsuru versions (must match `seo.json`; the prerender script `scripts/prerender.mjs` re-injects from seo.json — keep both in sync). |
| `src/components/layout/navbar.tsx:63` | 1 | Hardcoded literal `Tsuru` brand text. **Fix properly:** read `navbar.json.brand[lang]` (the entity already exists) — this literal violates the repo's no-hardcoded-text rule. |
| `src/components/layout/footer.tsx:22` | 1 | Same: hardcoded `Tsuru` → read `footer.json.brand[lang]`. |
| `src/pages/About.tsx:40,70` | 2 | Line 40 is a comment (rename optional); line 70 hardcodes `Tsuru` in the story card → move to `about.json` field. |
| `src/translations/es.json` / `en.json` | 10 + 10 | Legacy key-table mirrors of content copy (`values.subtitle`, `about.*`, `footer.copyright`, `terms.acceptanceNotice`, `examples.subtitle`, …). Per `landing-client/CLAUDE.md` these are admin-chrome + Examples-page keys only. Swap the strings to Tsuru where keys are still referenced (`examples.subtitle` is — `src/pages/Examples.tsx`); the rest should be updated in lockstep or pruned if truly dead (verify references before pruning). |
| `src/pages/Examples.tsx:55` | 1 | `featuredTemplateNames = ['tsuru-demo', …]` — **template ID, not branding. DO NOT change** (matches DB template names / live demo subdomains). |

### 4.3 POS app (`templates/pos-system`) — type K (user-facing strings) unless noted

| File | Refs | What it becomes |
|---|---|---|
| `index.html:14` | 1 | `<title>Tsuru POS</title>` → `Tsuru POS` |
| `src/hooks/usePageTitle.ts:3` | 1 | `const BRAND = "Tsuru POS"` → `"Tsuru POS"` (drives all document titles) |
| `src/components/ui/Logo.tsx:17` | 1 | Fallback `displayName = orgName ?? "Tsuru POS"` → `"Tsuru POS"` |
| `src/contexts/LanguageContext.tsx:1161,3196` | 2 | `"auth.login.title": "Tsuru"` (ES + EN blocks) → `"Tsuru"` — login screen brand |
| `src/theme/themes.ts:206,266` | 2 user-facing | Theme display `name: "Tsuru"` → `"Tsuru"` and `name: "Tsuru Demo"` → `"Tsuru Demo"` (shown in the per-org theme picker). **Keep theme IDs** `tsuru` / `tsuru-demo` and `DEFAULT_THEME_ID = "tsuru"` (lines 205/265/747/749/761/763/774) — IDs are persisted in org settings/DB; renaming them is a data migration, out of scope. |
| `src/lib/appCode.ts:2,10`, `src/components/layout/NotificationsBell.tsx:26`, `src/types/cms.ts:110` | 4 | Code comments referencing "the tsuru ecosystem" / `"tsuru-demo"` example. Non-user-facing — optional cleanup ("the Tsuru ecosystem"); never blocks the rebrand. |

Note: POS work belongs in the standalone repo `chepelcr/tsuru-pos-system` per the monorepo split rules (root `CLAUDE.md`); the monorepo copy is dual-tracked, so apply changes wherever the team's current source of truth is and mirror per split policy.

### 4.4 Docs — type D

`grep -rl tsuru docs/` hits ~30 files. Disposition by class:

| Class | Files (examples) | What it becomes |
|---|---|---|
| Living guidance docs | root `CLAUDE.md` (12 refs incl. "Tsuru storefront SaaS" phrasing), `docs/README.md`, `docs/LANDING_CLIENT_BRIEF.md`, `docs/app/MULTI_TEMPLATE_ARCHITECTURE.md`, `docs/DEPLOYMENT*.md` | Replace **brand** usages with "Tsuru (formerly Tsuru)" on first mention, then "Tsuru". **Leave untouched:** domains (`tsuru.jcampos.dev`), bucket names (`tsuru-template-market`), template IDs (`tsuru-demo`), env values — these are real infra identifiers. |
| Audit corpus | `docs/audit/tsuru/*.md` (14 files) | **Do not edit** — historical record; they intentionally document the Tsuru era. |
| Status/implementation archives | `docs/IMPLEMENTATION_*.md`, `docs/TEMPLATE_*.md`, `docs/HOMEPAGE_CMS_*.md`, etc. | Low priority; sweep opportunistically or mark archived. |

### 4.5 Explicitly NOT changed (out of scope, restated)

- Domains/DNS: `tsuru.jcampos.dev`, `admin.tsuru.jcampos.dev`, `api.tsuru.jcampos.dev`, `{slug}.tsuru.jcampos.dev`; `seo.json.siteUrl`; `branding.json` admin URLs.
- AWS resources: `tsuru-template-market` bucket, CloudFront, Route53, Cognito, pipelines (`deploys/setup-template-bucket.js` references).
- Identifiers: template names/IDs (`tsuru-demo` in DB seeds, `Examples.tsx`, POS theme IDs), package names, repo names, `tsuru_common` Python lib.
- The 8 storefront template apps' internal branding (their fate is the §5.7 consolidation decision in `tsuru_product_strategy.md`, not this rebrand).

---

## 5. Phased execution checklist

> Rules for every phase: follow existing patterns (landing per-entity JSON + admin manifest four-pieces; POS LanguageContext keys); never `git commit/push` from automation; leave changes in the working tree for review; never `npm run db:push`.

### Phase R1 — Landing content (content-first; all type C; the DXP was built for this)

- [ ] 1. Swap brand strings in identity entities: `branding.json` (companyName, tagline), `navbar.json`, `footer.json`, `seo.json` (title/description only — NOT siteUrl).
- [ ] 2. Apply §3 copy: `landing.json` (hero, values, finalCta), `features.json` (cards rework incl. e-invoicing + teams cards, kill order-tracking + "miles" claims), `about.json` (§3.6).
- [ ] 3. Add the **billing pillar** content (new `billing.json` entity or `landing.json` block) + render section on `Landing.tsx`/`Funcionalidades.tsx`. New entity ⇒ wire all four admin pieces in `src/admin/manifest.ts` + `admin-store.ts` + prerender `ROUTES`/`seo.json.pages` per `landing-client/CLAUDE.md` checklist. *(This step is C+K.)*
- [ ] 4. Honesty pass: `fairs.json` → roadmap framing (§3.5); `community.json` → delete testimonials, "muy pronto" barter; `contact.json` → remove phone + 24h promise; `blog-chrome.json` → remove newsletter promise; `blog.json` → authors + article4 reframe.
- [ ] 5. Legal pass: `terms.json`, `privacy.json`, `cookies.json` — name swaps + delete contradicted claims (GDPR, banner, encryption); email aliases resolved (no dead addresses).
- [ ] 6. Optional same-wave: palette swap in `themes.json` to the §1.5 natural-pigment palette + wordmark/favicon into `branding.json` slots (Tier 1 only — no gated Tier 2 assets).
- [ ] 7. Sync `index.html` title/meta with `seo.json`; fix the hardcoded brand literals in `navbar.tsx`/`footer.tsx`/`About.tsx` to read their entities (closes the no-hardcoded-text violations). *(K)*
- [ ] 8. Update `src/translations/{es,en}.json` mirrored strings still referenced (at minimum `examples.subtitle`); verify dead keys before pruning.
- [ ] 9. Verify: `pnpm run check`; `pnpm run build && grep -rl "__local" ../dist/landing/assets` (must be empty); `node scripts/prerender.mjs`; visual ES/EN pass on all public routes; confirm zero remaining user-visible "Tsuru" (`grep -ri tsuru src/content src/pages src/components index.html` — only allowed hits: template IDs in `Examples.tsx`, admin URLs in `branding.json`, `seo.json.siteUrl`).

### Phase R2 — POS strings (second)

- [ ] 10. `index.html` title, `usePageTitle.ts` BRAND, `Logo.tsx` fallback → "Tsuru POS".
- [ ] 11. `LanguageContext.tsx` `auth.login.title` (both language blocks) → "Tsuru".
- [ ] 12. `themes.ts` display names → "Tsuru" / "Tsuru Demo" (**IDs unchanged**; confirm the theme picker shows only `name`, never `id`).
- [ ] 13. Sweep for any other user-visible brand strings (`grep -rn "Tsuru" src/` — remaining hits must be comments/IDs only); optional comment cleanup (`appCode.ts`, `NotificationsBell.tsx`, `cms.ts`).
- [ ] 14. Verify: `npm run check` (or repo equivalent), boot the POS, check login screen, browser tab titles, theme picker, org-less Logo fallback. Mirror changes to `chepelcr/tsuru-pos-system` per split policy.

### Phase R3 — Docs (third)

- [ ] 15. Root `CLAUDE.md`: brand phrasing → "Tsuru (formerly Tsuru)"; leave infra identifiers (domains, bucket, template IDs) untouched; same for `landing-client/CLAUDE.md` / `templates/pos-system/CLAUDE.md` where they name the brand.
- [ ] 16. `docs/README.md`, `docs/LANDING_CLIENT_BRIEF.md`, `docs/app/*.md`, `docs/DEPLOYMENT*.md`: same brand-vs-identifier rule.
- [ ] 17. Do NOT edit `docs/audit/tsuru/*` (historical record). Mark stale `IMPLEMENTATION_*/TEMPLATE_*` docs archived or sweep opportunistically.
- [ ] 18. Add a "Brand: Tsuru" note + pointer to this plan in the root `CLAUDE.md` so future agents stop writing "Tsuru".

### Phase R4 — explicitly deferred (tracked, not in this rebrand)

- Domain/infra renames (`tsuru.jcampos.dev` → tsuru domain, bucket, SEO `siteUrl`, admin CTA URLs — which also need re-aiming at the POS app per `tsuru_reconciliation_report.md` §3.5).
- Tier 2 cultural identity (Bribri lexicon IA, Ú-sure/cacao logo, etnogeometric patterns) — **gated on RIBCA/Bribri partnership** (§1.3).
- Contact-form SES delivery, real publish status, legal-pages full rewrite with counsel — trust fixes that pair with, but exceed, the rebrand.
- Theme-ID/template-ID/data migrations (`tsuru` theme id, `tsuru-demo` template rows).
- Monetization narrative publication before any Stripe activation (`tsuru_product_strategy.md` §6).

---

## 6. Acceptance criteria for the rebrand wave

1. No user-visible "Tsuru" on the landing or POS (allowed residue: URLs/IDs listed in §4.5).
2. Free e-invoicing appears as the #1 message on the landing hero + a dedicated section (today it appears in 0 of 22 entities).
3. Zero present-tense claims for unbuilt features; fairs/trueque appear only under explicit "en construcción / muy pronto" labels.
4. Placeholder phone, fake testimonials, "miles de emprendedores", newsletter and 24h-response promises removed.
5. Landing builds clean (`check`, `build`, prerender) with admin tree-shake verified; POS builds and shows Tsuru branding on login/title/theme picker.
6. No Tier 2 Bribri cultural assets shipped without documented RIBCA consultation.
