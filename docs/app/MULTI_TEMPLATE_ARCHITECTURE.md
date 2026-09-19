# Multi-Template Architecture Plan

## Overview

Transform the BeautyMarket platform from a single client application to a multi-template system where each template has **completely different designs**, not just different data/colors.

## Current State vs Desired State

### Current State
- **Single client folder** (`client/`) with one design
- Templates only differ in data (colors, logo, content)
- All templates share the same component structure and layout

### Desired State
- **Multiple template folders** (`templates/beauty-market/`, `templates/bella-natural/`, etc.)
- Each template has unique:
  - Color schemes and typography
  - Component layouts and structures
  - Page designs and user experience
  - Visual aesthetics matching their category

---

## Proposed Project Structure

```
BeautyMarket/
├── client/                    # Admin dashboard (unchanged)
│   └── src/
├── landing-client/            # Landing page (unchanged)
│   └── src/
├── templates/                 # NEW: Template designs
│   ├── shared/               # Shared components/utilities
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── ui/
│   │   │   └── common/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── beauty-market/        # Template 1: Pink modern marketplace
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/  # Template-specific components
│   │   │   ├── styles/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── package.json     # Template-specific dependencies
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js  # Template-specific theme
│   │
│   ├── bella-natural/        # Template 2: Green organic theme
│   │   └── ... (same structure)
│   │
│   ├── glam-studio/          # Template 3: Purple luxury theme
│   │   └── ...
│   │
│   ├── royal-hair/           # Template 4: Red premium theme
│   │   └── ...
│   │
│   ├── skin-love/            # Template 5: Rose soft theme
│   │   └── ...
│   │
│   ├── pro-nails/            # Template 6: Amber bright theme
│   │   └── ...
│   │
│   └── beauty-salon/         # Template 7: Indigo professional theme
│       └── ...
│
├── server/                    # Backend (unchanged)
├── setup-template-bucket.js   # UPDATE: Build and deploy all templates
└── package.json              # Root package.json with build scripts
```

---

## Deployed Template URLs

**Live Templates** — since the 2026-06-20 split each one is its own repo
(`chepelcr/template-<name>`) deployed to **GitHub Pages**, and the host pattern
is `{name}.examples.tsuru.jcampos.dev` (NOT the old `{name}-example.` one, and
not the retired `*.j-markets.jcampos.dev` domain). These are also the
`preview_url` values in the `templates` table:

1. **tsuru-demo** (renamed from `jmarkets-demo` on 2026-07-03) → https://tsuru-demo.examples.tsuru.jcampos.dev
2. **tech-gadgets** → https://tech-gadgets.examples.tsuru.jcampos.dev
3. **vintage-fashion** → https://vintage-fashion.examples.tsuru.jcampos.dev
4. **artisan-crafts** → https://artisan-crafts.examples.tsuru.jcampos.dev
5. **gourmet-foods** → https://gourmet-foods.examples.tsuru.jcampos.dev
6. **fitness-hub** → https://fitness-hub.examples.tsuru.jcampos.dev
7. **pet-care** → https://pet-care.examples.tsuru.jcampos.dev
8. **beauty-essentials** → https://beauty-essentials.examples.tsuru.jcampos.dev

**SSL Certificate:** wildcard `*.tsuru.jcampos.dev` in ACM (us-east-1). The ARN
previously written here belonged to the **retired `J-CAMPOS` account** and is
dead; look it up in the live account instead of copying an account id into docs.

---

## Template Design Specifications

### 1. Tsuru (formerly JMarkets) Demo Example (General Marketplace)
**Live URL:** https://tsuru-demo.examples.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Pink `#ec4899` primary, Light Pink `#f472b6` secondary
- **Font:** Inter (modern, clean)
- **Style:** Modern e-commerce, card-heavy layout, clean lines
- **Hero:** Large product showcase with pink gradient overlay
- **Components:** Grid-based product cards, modern filter sidebar
- **Category Cards:** Pink gradient backgrounds with white text

**Unique Features:**
- Trendy Instagram-like product grid
- Prominent search bar with auto-complete
- Large hero image with animated CTA buttons

---

### 2. Tech Gadgets Example (Technology & Electronics)
**Live URL:** https://tech-gadgets-example.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Blue `#3b82f6` primary, Cyan `#06b6d4` secondary, Slate `#64748b` accent
- **Font:** Roboto (tech-focused, clean)
- **Style:** Modern tech, sleek, futuristic, high-contrast
- **Hero:** Dark background with blue/cyan accents and tech imagery
- **Components:** Sharp edges, tech-inspired icons, product spec displays
- **Category Cards:** Blue gradients with tech patterns

**Unique Features:**
- Product specification comparison tables
- Tech specs prominently displayed
- Dark mode aesthetic
- Sleek, modern UI with animation effects

---

### 3. Vintage Fashion Example (Vintage Clothing & Fashion)
**Live URL:** https://vintage-fashion-example.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Sepia Brown `#92400e` primary, Cream `#fef3c7` secondary, Gold `#d97706` accent
- **Font:** Playfair Display (elegant serif for vintage feel)
- **Style:** Vintage, retro, nostalgic, elegant
- **Hero:** Sepia-toned imagery with vintage overlays
- **Components:** Ornate borders, vintage patterns, classic card designs
- **Category Cards:** Cream backgrounds with sepia borders

**Unique Features:**
- Vintage photo filters and overlays
- Retro-styled typography
- Classic era-appropriate design elements
- Warm, nostalgic color palette

---

### 4. Artisan Crafts Example (Handmade & Crafts)
**Live URL:** https://artisan-crafts-example.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Terracotta `#c2410c` primary, Sage Green `#84cc16` secondary, Natural Beige `#d4a373` accent
- **Font:** Poppins (friendly, handcrafted feel)
- **Style:** Organic, handmade, artisanal, rustic
- **Hero:** Natural textures with craft imagery
- **Components:** Rounded corners, hand-drawn elements, organic shapes
- **Category Cards:** Earth-tone backgrounds with craft patterns

**Unique Features:**
- Hand-drawn illustrations and decorative elements
- Artisan story highlights
- Natural, earthy color palette
- Emphasis on handmade/unique product qualities

---

### 5. Gourmet Foods Example (Specialty Foods & Gourmet)
**Live URL:** https://gourmet-foods-example.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Deep Red `#b91c1c` primary, Golden Yellow `#fbbf24` secondary, Forest Green `#166534` accent
- **Font:** Merriweather (elegant, food-appropriate)
- **Style:** Gourmet, sophisticated, appetizing, premium
- **Hero:** High-quality food photography with warm overlays
- **Components:** /Recipe cards, ingredient highlights, chef-inspired layouts
- **Category Cards:** Warm backgrounds with food imagery

**Unique Features:**
- Recipe integration possibilities
- Origin/source highlighting
- Premium product presentation
- Rich, appetizing imagery

---

### 6. Fitness Hub Example (Fitness & Wellness)
**Live URL:** https://fitness-hub-example.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Energetic Orange `#ea580c` primary, Lime Green `#84cc16` secondary, Dark Gray `#1f2937` accent
- **Font:** Montserrat (bold, energetic)
- **Style:** Energetic, motivational, dynamic, athletic
- **Hero:** Action shots with energetic overlays
- **Components:** Bold typography, progress indicators, achievement badges
- **Category Cards:** High-energy gradients with fitness imagery

**Unique Features:**
- Motivational quotes and messaging
- Progress tracking UI elements
- Bold, high-contrast design
- Athletic and dynamic aesthetic

---

### 7. Pet Care Example (Pet Products & Services)
**Live URL:** https://pet-care-example.tsuru.jcampos.dev

**Visual Identity:**
- **Colors:** Playful Purple `#8b5cf6` primary, Bright Blue `#3b82f6` secondary, Coral `#fb923c` accent
- **Font:** Nunito (friendly, playful, rounded)
- **Style:** Playful, friendly, caring, fun
- **Hero:** Pet imagery with playful overlays
- **Components:** Rounded corners, paw prints, pet-themed icons
- **Category Cards:** Soft pastel backgrounds with pet imagery

**Unique Features:**
- Paw print decorative elements
- Pet care tips integration
- Playful, friendly aesthetic
- Warm, caring color palette

---

## Build System Architecture

### Root package.json Scripts

```json
{
  "scripts": {
    // Existing scripts
    "dev": "tsx watch server/src/index.ts",
    "dev:landing": "cd landing-client && npm run dev",
    "build:landing": "cd landing-client && npm run build",
    "build:server": "esbuild server/src/index.ts ...",

    // NEW: Template build scripts
    "install:templates": "npm run install:template:all",
    "install:template:all": "for dir in templates/*/; do (cd \"$dir\" && npm install); done",

    "build:templates": "npm run build:template:all",
    "build:template:all": "npm run build:template:beauty-market && npm run build:template:bella-natural && npm run build:template:glam-studio && npm run build:template:royal-hair && npm run build:template:skin-love && npm run build:template:pro-nails && npm run build:template:beauty-salon",

    "build:template:beauty-market": "cd templates/beauty-market && npm run build",
    "build:template:bella-natural": "cd templates/bella-natural && npm run build",
    "build:template:glam-studio": "cd templates/glam-studio && npm run build",
    "build:template:royal-hair": "cd templates/royal-hair && npm run build",
    "build:template:skin-love": "cd templates/skin-love && npm run build",
    "build:template:pro-nails": "cd templates/pro-nails && npm run build",
    "build:template:beauty-salon": "cd templates/beauty-salon && npm run build",

    "deploy:templates": "npm run build:templates && node setup-template-bucket.js"
  }
}
```

### Template-Specific Build Output

Each template builds to its own output directory:
```
templates/beauty-market/dist/ → Deploy to beauty-demo-example S3
templates/bella-natural/dist/ → Deploy to bella-natural-example S3
templates/glam-studio/dist/   → Deploy to glam-studio-example S3
... etc
```

---

## Updated setup-template-bucket.js

### New Features to Add

1. **ACM Certificate Request** (for HTTPS)
```javascript
async function requestWildcardCertificate() {
  // Request *.tsuru.jcampos.dev certificate
  // Return certificate ARN
  // Output DNS validation records for user to add
}
```

2. **Build All Templates First**
```javascript
async function buildAllTemplates() {
  console.log('Building all templates...');
  execSync('npm run build:templates', { stdio: 'inherit' });
}
```

3. **Deploy Each Template from Its Own Build**
```javascript
const TEMPLATE_BUILD_PATHS = {
  'beauty-demo-example': './templates/beauty-market/dist',
  'bella-natural-example': './templates/bella-natural/dist',
  'glam-studio-example': './templates/glam-studio/dist',
  'royal-hair-example': './templates/royal-hair/dist',
  'skin-love-example': './templates/skin-love/dist',
  'pro-nails-example': './templates/pro-nails/dist',
  'beauty-salon-example': './templates/beauty-salon/dist',
};

async function uploadTemplateFiles(subdomain, buildPath) {
  // Upload files from specific template build path
}
```

4. **Update CloudFront with Certificate**
```javascript
async function updateDistributionWithCertificate(distributionId, certificateArn, subdomain) {
  // Update distribution config to include:
  // - ViewerCertificate with certificateArn
  // - Aliases with subdomain
}
```

---

## Shared Components Strategy

To avoid code duplication, create a `templates/shared/` folder with reusable components:

### Shared Components
```
templates/shared/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx           # Customizable navbar
│   │   ├── Footer.tsx           # Customizable footer
│   │   └── PageContainer.tsx    # Standard page wrapper
│   ├── product/
│   │   ├── ProductCard.tsx      # Styled via props/theme
│   │   ├── ProductGrid.tsx
│   │   └── ProductDetails.tsx
│   ├── cart/
│   │   ├── CartButton.tsx
│   │   ├── CartDrawer.tsx
│   │   └── CheckoutForm.tsx
│   └── common/
│       ├── Button.tsx           # Theme-aware button
│       ├── Card.tsx
│       └── Badge.tsx
├── hooks/
│   ├── useCart.ts
│   ├── useProducts.ts
│   └── useTheme.ts
├── lib/
│   ├── api.ts
│   ├── queryClient.ts
│   └── utils.ts
└── types/
    ├── product.ts
    ├── cart.ts
    └── organization.ts
```

### Theme Provider Pattern
Each template imports shared components but provides its own theme:

```typescript
// templates/beauty-market/src/theme.ts
export const theme = {
  colors: {
    primary: '#ec4899',
    secondary: '#f472b6',
  },
  fonts: {
    primary: 'Inter',
  },
  layout: 'modern', // 'modern' | 'organic' | 'luxury' | 'bold' | 'soft' | 'bright' | 'professional'
};

// Shared component usage
import { ProductCard } from '@/shared/components/product/ProductCard';
import { theme } from './theme';

<ThemeProvider theme={theme}>
  <ProductCard product={product} />
</ThemeProvider>
```

---

## Implementation Phases

### Phase 1: Setup Infrastructure (Week 1)
1. Create `templates/` folder structure
2. Create `templates/shared/` with base components
3. Copy current `client/` to `templates/beauty-market/`
4. Set up build scripts in root package.json
5. Test building beauty-market template

### Phase 2: Create Shared Component Library (Week 1-2)
1. Extract reusable components to `templates/shared/`
2. Make components theme-aware
3. Create ThemeProvider context
4. Update beauty-market to use shared components
5. Document shared component API

### Phase 3: Create 6 New Templates (Week 2-4)
**For each template:**
1. Copy shared component structure
2. Create template-specific theme.ts
3. Design unique layouts and component variants
4. Customize colors, fonts, spacing
5. Add template-specific imagery
6. Test responsive design

**Order of creation:**
1. Bella Natural (Green organic)
2. Glam Studio (Purple luxury)
3. Royal Hair (Red premium)
4. Skin Love (Rose soft)
5. Pro Nails (Amber bright)
6. Beauty Salon (Indigo professional)

### Phase 4: Update Deployment Scripts (Week 4)
1. Add ACM certificate request to setup script
2. Update CloudFront distribution config
3. Add certificate ARN to distributions
4. Configure custom domains (CNAME)
5. Test HTTPS access

### Phase 5: Build & Deploy All Templates (Week 5)
1. Run `npm run install:templates`
2. Run `npm run build:templates`
3. Request ACM certificate
4. Validate DNS records
5. Run `npm run deploy:templates`
6. Test all 7 templates live

### Phase 6: Testing & Refinement (Week 5-6)
1. Visual QA on all templates
2. Cross-browser testing
3. Mobile responsiveness testing
4. Performance optimization
5. Accessibility audit
6. Fix bugs and polish

---

## ACM Certificate Setup

### Step 1: Request Certificate
```bash
aws acm request-certificate \
  --domain-name "*.tsuru.jcampos.dev" \
  --subject-alternative-names "tsuru.jcampos.dev" \
  --validation-method DNS \
  --region us-east-1
```

### Step 2: Add DNS Validation Records
AWS will provide CNAME records to add to Route53:
```
Name: _abc123.tsuru.jcampos.dev
Type: CNAME
Value: _xyz456.acm-validations.aws.
```

### Step 3: Wait for Validation
Certificate status changes from `PENDING_VALIDATION` to `ISSUED` (5-30 minutes).

### Step 4: Update CloudFront Distributions
Add certificate ARN to each distribution's `ViewerCertificate` config.

---

## File Size & Performance Considerations

### Current Approach (Single Build)
- One build shared by all templates
- Size: ~2MB
- Loaded by all users regardless of template

### New Approach (Multi-Build)
- Seven separate builds
- Each optimized for its template
- Size: ~1.5MB each (tree-shaking template-specific code)
- Users only load their template's build

**Benefits:**
- Smaller bundle sizes per template
- Better code splitting
- Template-specific optimizations
- No unused code

---

## Testing Strategy

### Local Development Testing
```bash
# Test individual template
cd templates/beauty-market
npm run dev

# Test build
npm run build
npx serve dist
```

### Preview All Templates Locally
Create a simple HTML file to link to all templates:
```html
<!-- preview-templates.html -->
<h1>Template Previews</h1>
<ul>
  <li><a href="http://localhost:5173" target="_blank">Beauty Market</a></li>
  <li><a href="http://localhost:5174" target="_blank">Bella Natural</a></li>
  ...
</ul>
```

Run all templates on different ports:
```bash
# Terminal 1
cd templates/beauty-market && npm run dev -- --port 5173

# Terminal 2
cd templates/bella-natural && npm run dev -- --port 5174

# ... etc
```

---

## Migration from Current State

### Current client/ folder
**Decision:** Keep or migrate?

**Option A:** Keep current `client/` as admin dashboard
- `client/` = Admin dashboard (products, orders, CMS)
- `templates/` = Public-facing store designs

**Option B:** Migrate to beauty-market template
- Move current `client/` → `templates/beauty-market/`
- Remove old `client/` folder
- Keep only landing-client and server

**Recommendation:** **Option A** - Keep separation between admin and storefront.

---

## Next Steps (User Decision Required)

Before implementing, please confirm:

1. ✅ **Approve overall architecture?**
2. ✅ **Keep admin dashboard (`client/`) separate from templates?**
3. ✅ **Shared component library approach acceptable?**
4. ✅ **Build all 7 templates or start with 2-3 as proof of concept?**
5. ✅ **Timeline expectations (4-6 weeks realistic)?**

---

## Estimated Effort

| Task | Time | Notes |
|------|------|-------|
| Infrastructure setup | 2 days | Folder structure, build scripts |
| Shared component library | 5 days | Extract and make theme-aware |
| Beauty Market template (refactor existing) | 3 days | Adapt current design |
| Create 6 new templates | 15 days | ~2.5 days per template |
| SSL certificate setup | 1 day | ACM + CloudFront config |
| Deployment script updates | 2 days | Multi-template support |
| Testing & QA | 5 days | All templates, all devices |
| Bug fixes & polish | 3 days | Refinement |
| **Total** | **~36 days** | ~5-6 weeks with one developer |

---

## Questions to Answer

1. Should templates share the same routing structure or have unique page structures?
2. Do all templates need the same features (cart, checkout) or can some be simplified?
3. Should we version templates (v1, v2) for future updates?
4. How should users switch between templates after initial selection?
5. Should template selection happen at organization creation only or allow switching later?

---

## Success Criteria

✅ Seven visually distinct templates deployed
✅ Each accessible at `{name}-example.tsuru.jcampos.dev` with HTTPS
✅ Each template has unique design language
✅ Shared components reduce code duplication
✅ Build system supports all templates efficiently
✅ Deployment script handles all templates
✅ Mobile responsive on all templates
✅ Performance metrics meet standards (LCP < 2.5s)

---

**Ready to proceed?** Please review and approve this plan before I begin implementation!
