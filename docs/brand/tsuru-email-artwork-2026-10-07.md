# Tsuru email artwork

The email layout uses two dedicated assets, while the landing Open Graph social card remains unchanged.

- Header: `fe/landing/public/brand/email-header.png` (1200×480), Tsuru logo, current slogan aligned beneath the T, and botanical corner leaves. No waves.
- Footer: `fe/landing/public/brand/email-footer-waves-compact.png` (1200×102), decorative green and gold waves only, with empty alternative text in emails.
- Used by all localized Cognito emails, management account/invitation emails, invoice notification emails, and delivery reports.
- Images use responsive widths and explicit dimensions inside presentation tables. Verification code alignment is retained.

## Artwork provenance

Edited from `fe/landing/public/brand/social-card.png` using the built-in image generation tool. Final exports were resized for their email slots.

Header prompt: Edit the provided Tsuru social card into an email header. Preserve the exact Tsuru wordmark, its leaves and “Vendé a tu ritmo.” aligned beneath the T, with the pale sage and golden corner sprigs. Remove all waves; retain only logo, slogan and leaves on warm cream, with breathing room and no new elements.

Footer prompt: Edit the provided Tsuru social card into a shallow decorative email footer. Retain only organic layered green waves from the lower left and golden waves from the lower right, meeting softly near the middle. Clean cream upper edge; remove logo, text, leaves and sprigs. Same illustration palette and style, with no new decoration.

Compact footer revision: `fe/landing/public/brand/email-footer-waves-compact.png` removes the empty upper band and uses natural image proportions. Edited with the built-in image tool, then trimmed the generated outer padding and exported proportionally. Prompt: preserve the wave curves, colors and thickness; remove only the empty cream above them, without squeezing or flattening the artwork.

Dark artwork (now connected to all outbound templates; the HTML file records the initial concept): `docs/brand/email-previews/email-header-dark.png`, `docs/brand/email-previews/email-footer-waves-dark.png`, and `docs/qa/email-branding/verification-dark-preview.html`.
Built-in image tool prompts: preserve header composition, exact wordmark and slogan, botanical leaves and wave geometry; replace cream background with green-charcoal #202621 and reverse the logo/slogan to warm cream. Keep the green/gold illustration colors. Crop generated outer padding and export proportionally. The preview uses charcoal surfaces, warm cream text, muted sage secondary text and a darker code inset.

## Shared email pattern implementation

`docs/brand/email-theme.css` and `docs/brand/email-theme.json` define the common light/dark rules. `scripts/sync-email-theme.py` copies the theme helpers into the management, sales and store repositories and updates static Cognito templates idempotently. Management generators and the Hacienda notification renderer apply the helper to their final escaped HTML. Delivery reports use the same header, compact footer and theme.

The dark assets are published at `fe/landing/public/brand/email-header-dark.png` and `fe/landing/public/brand/email-footer-waves-dark.png`. Light styles remain inline fallbacks; dark mode uses a media query and Outlook.com's dark-mode selector. Actual dark-mode behavior depends on the receiving email client.

Validated 26 render variants (9 management, 8 Cognito, 8 Hacienda issuer/receiver status variants and 1 delivery report) at 375px and 600px in both light and dark modes. Artwork switching, natural wave proportions, code centering, horizontal fit, placeholders, document content and attachment links were checked. Twelve targeted renderer/theme tests passed. No email was sent during preview validation. The user approved publication after reviewing mobile and desktop variants. Deployment verification is recorded below.

## Publication verification

Published to the SSM-selected dev environment in account 947999370977 on 2026-10-07 through the repositories' GitHub workflows. No local Docker deployment was used.

- Landing artwork: [run 37687363358](https://github.com/chepelcr/tsuru-landing/actions/runs/37687363358). All three newly hosted PNGs match their approved local files byte for byte.
- Account and invitation emails: [run 37687792109](https://github.com/chepelcr/tsuru-management-be/actions/runs/37687792109). The deployed management Lambda is active with updated code.
- Cognito: [run 37687801140](https://github.com/chepelcr/tsuru-cognito-templates/actions/runs/37687801140). All eight SES templates match source exactly; the cache revision matches the template hash. Both user pools retain the custom email trigger. All six CustomMessage triggers return the approved HTML in Spanish and English.
- Hacienda: [run 37687796803](https://github.com/chepelcr/tsuru-sales-be/actions/runs/37687796803). The notification Lambda is active with updated code; all ten sales services pass their warmup checks.
- Delivery reports: [run 37687808138](https://github.com/chepelcr/tsuru-store-be/actions/runs/37687808138). The deployed Lambda is active with updated code and passes its warmup check.

The Spanish and English landing pages still advertise the branded social card through Open Graph and Twitter metadata. Live CustomMessage checks only construct email HTML; no email was sent. No database migration is required for this email-layout publication.
