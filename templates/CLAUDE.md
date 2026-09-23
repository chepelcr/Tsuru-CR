# Template System (templates/)

Guidance for the customer-facing store templates in this directory. Loaded when working under `templates/`.

The platform supports **multiple template designs** for customer-facing stores. Each template is a completely independent React application with unique visual identity, components, and user experience.

**📘 See [MULTI_TEMPLATE_ARCHITECTURE.md](../docs/app/MULTI_TEMPLATE_ARCHITECTURE.md)** for complete template system documentation.

### Template Cloning Service

**Backend**: `server/src/services/TemplateCloneService.ts`

When a user selects a template during organization creation (onboarding step 3), the system clones:
- Theme settings (colors, fonts, logo)
- Contact settings (email, phone, social links)
- Payment settings (currency, payment methods)
- Shipping settings (costs, zones, options)
- Pages and page sections (home, about, contact, etc.)
- Section content (hero text, CTAs, images, etc.)
- Categories (optional)

**Two clone methods:**
1. `cloneTemplate()` - Creates NEW organization + clones template content
2. `cloneTemplateToExistingOrg()` - Clones template to EXISTING organization (used in onboarding step 3)

**Template database relationship:**
```
templates table (metadata)
└── organizationId (links to template source organization)
    └── Organization table has all actual content (pages, sections, settings)
```

### Template Development

```bash
# Development
npm run dev:template:tsuru-demo       # Start specific template dev server

# Building
npm run build:template:tsuru-demo     # Build specific template
npm run build:templates               # Build all templates

# Deployment
npm run deploy:all-frontend           # Build all templates + dashboard + deploy to S3
```

### Template Metadata

**Database**: `templates` table (`server/src/entities/Template.ts`)

Fields:
- `name` - Unique template identifier (e.g., 'tsuru-demo')
- `displayName` - Human-readable name (e.g., 'JMarkets Demo')
- `description` - Template description
- `category` - Template category (demo, electronics, fashion, etc.)
- `thumbnailUrl` - Preview image URL
- `isActive` - Whether template is available for selection
- `sortOrder` - Display order in template gallery

**Seed data**: `server/src/seeds/template-seed.ts` creates 8 default templates + sample organizations

### Template Selection Flow

1. User creates organization (Step 1: basic info)
2. User adds contact info (Step 2: optional)
3. **User selects template** (Step 3: template gallery)
   - Dashboard shows active templates from database
   - User clicks template or "Start from scratch"
4. System clones selected template to organization
5. Organization marked as complete (`onboardingStep = 3`)
6. User redirected to organization subdomain with cloned template content
