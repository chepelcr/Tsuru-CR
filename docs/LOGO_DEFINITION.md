# Tsuru logo definition — handoff for a design or image agent

**Status:** The selected Option 2 raster package is in `docs/brand/logo/tsuru_brand_package/` and is live in the three FE apps (2026-09-23). Editable SVG masters remain outstanding.
**Companion:** [`LANDING_CLIENT_BRIEF.md`](./LANDING_CLIENT_BRIEF.md) for the product, landing, and plan story.
**Current use:** Landing navbar/footer, admin login/sidebar, POS chrome, browser favicons, POS install icons, and landing social artwork.

## What the logo must communicate

Design a distinctive, warm, restrained identity for **Tsuru**, the Costa Rican point of sale and storefront that gives small merchants free Hacienda electronic invoicing. Its first impression should be a helpful local business tool: clear enough for an invoice or browser tab, welcoming enough for an artisan or feria vendor, and credible for a growing cooperative. The public story is legal selling today and community commerce being built for the future.

The **exact wordmark is “Tsuru”** (capital T, lowercase s-u-r-u). The logo must not read “JMarkets,” “Tsiru,” or a generic shopping platform name. Make the wordmark the primary asset; a symbol is secondary and should come from the same idea.

### Creative direction

- Start with warm serif letterforms that sit naturally beside the landing's **Playfair Display** headlines. The wordmark may be custom drawn or carefully typeset; preserve easy reading of all five letters at navbar size. Avoid a third, unrelated display typeface.
- Explore subtle, **generic botanical** cues such as a seed, sprout, leaf, or neutral cacao pod silhouette. An abstract **T** is another viable icon direction. The symbol must have a simple silhouette and work without decorative line detail at 16 px.
- Use flat shapes and thoughtful spacing. No 3D effects, shiny gradients, shadows, app-store clichés, shopping carts, AWS/cloud symbols, or literal currency marks.
- Do not present the work as an Indigenous motif. No Bribri sacred or ceremonial imagery, Ú-sure house mark, Jaba/Kó/Penéch patterns, pre-Columbian patterns, invented “tribal” geometry, or cosmology symbols. The rebrand plan gates those ideas on consultation with Bribri organizations. Generic botany is permitted; cultural symbolism is not.

## Palette and typography

| Role | Hex | Use in the logo system |
|---|---|---|
| Primary burgundy | `#6B2A22` | Main wordmark and primary mark on light backgrounds |
| Warm sand | `#F4EFE6` | Light wordmark/mark on dark backgrounds; light canvas |
| Forest green | `#2E5033` | Optional secondary accent only |
| Golden yellow | `#E8B83A` | Optional small accent; remove it for one-color versions |

The landing also uses CTA red `#D9381E` and body charcoal `#3D4045`, but the logo should remain calm beside CTAs. Use the precise hex values in final artwork. Export on **transparent backgrounds** unless the asset is specifically an app icon or social card. Do not rely on color alone to make the mark recognizable.

## Deliverables: one chosen concept, complete family

Present two or three rough **wordmark-first** directions for selection, then refine **one** into the following consistent family. The chosen direction must yield every variant; do not combine unrelated symbols across files.

| ID | Asset | Required version and use |
|---|---|---|
| L1 | Primary wordmark | “Tsuru” in burgundy on transparent background; the navbar/footer default |
| L2 | Reverse wordmark | Same geometry in warm sand or white for dark backgrounds |
| L3 | Standalone symbol | One-color, square-friendly icon for favicon, avatar, app icon, and small UI |
| L4 | Horizontal lockup | L3 to the left of L1, with defined spacing; social artwork and larger placements |
| L5 | Stacked lockup | L3 above the wordmark, optically centered; square placements |
| L6 | Monochrome family | L1, L3, and L4 in pure black and pure white |

Deliver the final masters as **editable SVG** with clean paths and a sensible `viewBox`; provide outlined-text SVGs as well if the master uses a font. Also supply transparent PNG exports at **1×, 2×, and 4×** for the agreed master dimensions. Include a small README identifying fonts/licenses, colors, clear space, and the intended use of each file. A raster-only generated image is a concept reference, not the final logo.

### Required web exports

- `favicon.svg` plus 16×16 and 32×32 PNG (or a multi-size `.ico`), simplified from L3 where needed.
- 180×180 Apple touch icon, and 192×192 / 512×512 square app icons on warm sand. Provide maskable 192/512 variants with sufficient inset for circular and rounded crops.
- 1200×630 social sharing image: L4 on warm sand with a short, legible “Vende legal. Vende fácil.” line. Keep a text-free L4 master separate from this card.
- Preview sheet showing L1–L6 on light `#F4EFE6`, white, and a dark field, plus 16, 32, and 96 px size tests.

**Sizing checks:** the primary wordmark must remain readable at **96 px wide**. The symbol must be recognizable at **16 px** without its color accent. Allow at least one capital-T height of clear space around the full lockups; document any optical adjustment. Inspect the reversed version on the landing's actual dark theme before delivery.

## Integration handoff

The landing component `fe/landing/src/components/layout/brand-logo.tsx` uses the URLs in `fe/landing/src/content/branding.json`:

- `logoUrl`: L1 light wordmark at `/brand/logo-light.png`.
- `logoUrlDark`: L2 reverse wordmark at `/brand/logo-dark.png`.
- `faviconUrl` / `faviconUrlDark`: the light PNG and dark SVG tile at `/brand/`; theme changes update the active browser icon.
- `fe/landing/src/content/seo.json` → `ogImage`: `/brand/social-card.png`.

The PNGs have transparent padding, so the FE logo components crop only their displayed area in CSS; the source assets are untouched. The same light/reverse files live under each app's `public/brand/`. The relevant asset placement and POS reuse are described in `docs/roadmap/tsuru_brand_asset_guide.md`; its older path examples predate the `fe/` repo organization.

## Ready-to-send agent prompt

> Create a wordmark-first logo system for **Tsuru**, a Costa Rican POS and digital storefront for small merchants. The current landing message is “Vende legal. Vende fácil. Vende en comunidad.” Free Hacienda invoicing and selling tools exist today; community fairs and barter are being built. Design warm, clear serif lettering for the exact word **Tsuru**, with an optional simple abstract T or neutral botanical seed/leaf/cacao-pod silhouette. Use `#6B2A22` as the main color, `#F4EFE6` for the reverse/light canvas, and only restrained accents from `#2E5033` or `#E8B83A`. It must work at 32 px navbar height and as a 16 px favicon. Show 2–3 wordmark-first directions, then develop one chosen direction into primary, reverse, standalone mark, horizontal and stacked lockups, and black/white variants. Provide editable SVG masters, transparent PNG exports, favicon/app icons, a 1200×630 sharing card, and a preview sheet. Keep the forms flat and legible. Do not use sacred or Indigenous symbols, Ú-sure architecture, etnogeometric or pre-Columbian patterns, shopping carts, cloud imagery, gradients, or 3D effects. Do not claim the final vector is ready if the lettering or paths still need manual cleanup.

## Acceptance checklist

- [ ] “Tsuru” is spelled correctly and legible at 96 px wide and 32 px navbar height.
- [ ] The icon survives a one-color, 16 px favicon test.
- [ ] Light, dark, black, and white versions are the same design.
- [ ] SVG paths are editable, clean, and use exact palette colors; PNG backgrounds are transparent where required.
- [ ] No gated cultural imagery appears in any variant.
- [ ] `logoUrl` and `logoUrlDark` assets have matching dimensions; icon, favicon, app icons, and social card derive from the same master.
