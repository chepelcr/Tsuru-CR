# Tsuru Brand Asset Generation Guide

Practical guide for generating every visual asset the JMarkets → Tsuru rebrand needs: what to create, exact specs, where each file goes in each repo, generation prompts you can paste into an image tool, and the loading-pattern system. Companion to `tsuru_rebrand_plan.md` (brand strategy) — this doc is the production checklist.

**2026-09-23 implementation note:** The selected Option 2 raster package is in `docs/brand/logo/tsuru_brand_package/`. Its light/reverse wordmarks, icon derivatives, and social card are live in landing, admin, and POS under `public/brand/`. Browser favicons and visible wordmarks switch with light/dark mode. The POS manifest points at the supplied 192/512 icons, and the POS service worker precaches the brand assets. Paths and pending checkboxes below are the original production plan; editable SVG masters remain outstanding.

> **Hard rule from the rebrand plan (§1.3, RIBCA gate):** ship the *name*, the *story paragraph*, and the *natural-pigment palette* only. **No Bribri sacred symbols, no Ú-sure (conical house) mark, no etnogeometric patterns (Jaba/Kó/Penéch), no precolombian iconography** — those are Tier 2, blocked until a real partnership with Bribri organizations exists. For launch: a **wordmark-first logo**, optionally with a *generic botanical* motif (cacao pod / seed / leaf treated as neutral botany, no cultural symbolism).

---

## 1. Brand foundation (inputs for every asset)

**Name story (Tier 0, usable everywhere):** *Tsuru is the Bribri name for cacao — Costa Rica's original currency, a wealth that is grown, shared, and repaid in community.*

**Palette — "pigmentos naturales"** (from the research, Tier 1). Hex for design tools, HSL for the code tokens:

| Role | Name | Hex | HSL (for themes.json / CSS vars) | Use |
|---|---|---|---|---|
| Primary / headings / logo type | Borgoña Tsuru | `#6B2A22` | `7 52% 28%` | Wordmark, H1/H2, primary brand |
| CTA / active | Carmesí Achiote | `#D9381E` | `8 76% 48%` | Buttons, links, alerts |
| Secondary / success | Dosel Talamanca | `#2E5033` | `129 27% 25%` | Secondary UI, success, agro |
| Background | Arena de Mastate | `#F4EFE6` | `39 39% 93%` | Page bg, splash bg |
| Body text | Piedra Sĩã' | `#3D4045` | `218 6% 25%` | Paragraphs |
| Accent / highlight | Oro de Maíz | `#E8B83A` | `43 79% 57%` | Ratings, badges, loader accent |

**Typography:** keep the landing's existing serif-display (headings) + sans (body) pairing — the rebrand plan keeps it (§1.5). The logo wordmark should be a serif with warmth and slight organic character (e.g. Fraunces, Lora, or the landing's current display serif), set in Borgoña Tsuru. Do not introduce a third typeface.

**Tone for imagery:** warm, daylight, real markets/ferias, hands + products, Costa Rican settings. No glossy stock-tech aesthetics, no 3D metaverse renders.

---

## 2. The logo system to generate

Generate ONE master concept, then derive the family. All masters in **SVG** (vector); PNG exports per the matrix in §3.

| Variant | Contents | Used in |
|---|---|---|
| **L1 Wordmark** (primary) | "Tsuru" serif wordmark, Borgoña Tsuru on transparent | Landing navbar/footer, docs, email header |
| **L2 Wordmark dark-mode** | Same, in Arena de Mastate (light) for dark backgrounds | Landing `logoUrlDark`, POS dark sidebar |
| **L3 Isotype / mark** | Square monogram: stylized "T" or a neutral cacao-pod/seed silhouette (generic botany only) | Favicons, app icons, avatars, stand placeholder |
| **L4 Lockup** | Mark + wordmark horizontal | OG images, splash, print |
| **L5 Sub-brand lockups** | "Tsuru POS", "Tsuru Admin", "Tsuru Ferias" — wordmark + small caps suffix in Piedra Sĩã' | POS login/manifest, admin chrome, fairs SPA |
| **L6 Monochrome** | L1/L3 in pure black and pure white | Fallbacks, watermark, favicon SVG |

**Clear space:** ≥ the height of the "T" around all sides. **Minimum sizes:** wordmark 96px wide; isotype 16px (must stay legible — test at favicon size before accepting a concept).

### Generation prompts (paste into your image tool, then vectorize)

- **L1/L4:** `Minimal elegant serif wordmark logo "Tsuru", deep burgundy (#6B2A22) on cream (#F4EFE6), warm organic character, subtle hand-crafted feel, flat vector style, no gradients, no shadows, white background, centered` — generate type-only versions too and consider simply typesetting the wordmark manually in a serif font (cleanest path; AI text rendering is unreliable).
- **L3:** `Minimal flat vector logo mark, abstract cacao pod seed shape, single deep burgundy (#6B2A22) silhouette with one golden (#E8B83A) seed accent, geometric but organic, works at 16px favicon size, no text, no patterns, no indigenous or tribal symbols, white background`
- **Negative prompt (always):** `no tribal patterns, no precolombian iconography, no sacred symbols, no geometric ethnic borders, no 3D, no gradients, no photorealism`

**Vectorization:** generate at ≥1024px → trace to SVG (Inkscape Trace Bitmap, recraft.ai vectorize, or Illustrator Image Trace) → clean nodes → flatten to the exact hex values above.

---

## 3. Required asset matrix (file-by-file, with destinations)

### 3.1 Landing — `tsuru-landing` repo (`landing-client/`)

Upload images through the admin Media library (writes to `public/media/`) or place directly in `public/`; then set the URLs in the admin Site Identity page (writes `src/content/branding.json`).

| Asset | Spec | Destination |
|---|---|---|
| Logo (light bg) | L1 SVG (or PNG 480×128 @2x) | `public/media/` → `branding.json.logoUrl` |
| Logo (dark bg) | L2 same dims | `branding.json.logoUrlDark` |
| Favicon | L3: `favicon.svg` + `favicon.ico` (16/32/48 multi-size) | `public/` → `branding.json.faviconUrl` + `index.html` |
| Apple touch icon | L3 on Arena bg, 180×180 PNG, no transparency | `public/apple-touch-icon.png` |
| OG default image | L4 lockup on Arena bg + tagline, **1200×630 PNG/JPG < 300 KB** | `public/media/og-default.png` → `seo.json.ogImage` |
| Theme palette | HSL values from §1 | `src/content/themes.json` (single file change) |
| Brand text | companyName "Tsuru" + new tagline | `branding.json` (admin Site Identity) |

### 3.2 POS — `tsuru-pos-system` repo (`templates/pos-system/`)

The original `/icon-192.png` and `/icon-512.png` manifest paths were broken. The current manifest points to the supplied `/brand/icon-192.png` and `/brand/icon-512.png` in `fe/pos-system/public/`.

| Asset | Spec | Destination |
|---|---|---|
| App icon 192 | L3 on Arena bg, 192×192 PNG | `public/icon-192.png` |
| App icon 512 | L3, 512×512 PNG | `public/icon-512.png` |
| Maskable icons | L3 with 20% safe-zone padding, 192 + 512 PNG (`"purpose": "maskable"`) | `public/icon-192-maskable.png`, `public/icon-512-maskable.png` + manifest entries |
| Favicon | same `favicon.svg`/`.ico` as landing | `public/` + `index.html` |
| Manifest rebrand | `name: "Tsuru POS"`, `short_name: "Tsuru"`, `description`, `theme_color: #6B2A22`, `background_color: #F4EFE6` | `public/manifest.json` (currently `JMarkets POS` / `#E8620A` / `#111111`) |
| Login / sidebar logo | L5 "Tsuru POS" SVG, light + dark | `src/` assets where the current logo/wordmark renders (Login, AuthNavbar, sidebar) |
| Tsuru theme tokens | Map §1 palette into the 28-token registry | `src/theme/themes.ts` (add/replace the default theme) |

### 3.3 Other surfaces

| Asset | Spec | Destination |
|---|---|---|
| Email header | L1 PNG 600×160 on Arena bg | Server email templates (`server/src/templates/`) — invitation/verification emails |
| Tsuru Admin chrome logo | L5 "Tsuru Admin" small SVG | landing admin sidebar header |
| GitHub repo social previews | L4 1280×640 PNG | repo Settings → Social preview (tsuru-landing, tsuru-pos-system, future server repo) |
| Fairs (when SPA ships) | Stand placeholder banner 1200×400; fair OG template 1200×630; 4 stand-type frame accents | future `fairs` SPA `public/` |

---

## 4. Loading patterns (brand-applied)

Principle: **loading is themed by tokens, not by logo animation spam.** One identity motif, used sparingly.

1. **Skeletons (default for content):** keep the POS `SkeletonLoader` pattern — skeleton blocks use `muted` token on `background`; with the Tsuru palette that's warm sand-on-cream automatically. No logo in skeletons. Use skeletons for lists, tables, cards (POS already does; extend to landing admin RBAC tables which currently use spinners for table loads).
2. **Spinner (actions/inline):** keep `Loader2` (lucide) tinted `primary` (Borgoña). Reserve for button-level pending states and small inline waits.
3. **Brand splash (app boot + PWA):** background Arena de Mastate, centered L3 mark with a subtle **"seed pulse"** — 3 dots in Oro de Maíz pulsing sequentially under the mark (CSS keyframes, 1.2s loop, `prefers-reduced-motion: reduce` → static). PWA splash comes free from `manifest.json` (`background_color` + 512 icon) once §3.2 lands.
4. **Page transitions:** none added — prerendered landing is instant; POS keeps route-level skeletons.

Deliverable to generate for this: just the L3 SVG; the pulse is CSS (no GIF/Lottie needed).

---

## 5. Suggested working order

1. **Wordmark (L1/L2)** — unblocks landing navbar/footer + email header.
2. **Isotype (L3)** — unblocks favicon + PWA icons (fixes the broken POS manifest) + splash.
3. **Palette swap** — `themes.json` (landing) + `themes.ts` (POS): pure config, do alongside.
4. **OG/social (L4)** — unblocks SEO + repo previews.
5. **Sub-brand lockups (L5)** — POS login/sidebar, admin chrome.
6. Text rebrand (companyName/tagline/manifest names) rides rebrand Phase R1/R2 (`tsuru_rebrand_plan.md` §5).

**Tooling shortcuts:** realfavicongenerator.net (full favicon set from the L3 SVG), maskable.app (verify safe zone), squoosh.app (OG < 300 KB).

## 6. Definition of done

- [ ] `branding.json` has non-empty `logoUrl`, `logoUrlDark`, `faviconUrl`; companyName = "Tsuru"
- [ ] `seo.json.ogImage` set; OG renders correctly in a WhatsApp share preview (most important channel)
- [ ] POS installs as PWA with Tsuru icon + name, splash shows Arena bg + mark
- [ ] favicon legible at 16px in a browser tab next to other tabs
- [ ] No Tier-2 cultural elements in any shipped asset (review against §1.3 of the rebrand plan)
- [ ] All masters (SVGs) committed to a `brand/` folder in tsuru-landing for future reuse
