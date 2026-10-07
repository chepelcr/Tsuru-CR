# Template Demo Mode Implementation Plan

## Current State Analysis

### ✅ What Exists
1. **Template Controller** (`TemplateController.ts`)
   - GET `/api/templates` - Lists all templates
   - GET `/api/templates/:id` - Get template by ID
   - POST `/api/templates/:id/clone` - Clone template (TODO)

2. **Template Content Tables** (newly created)
   - `template_theme_settings`
   - `template_contact_settings`
   - `template_payment_settings`
   - `template_shipping_settings`
   - `template_pages`
   - `template_page_sections`
   - `template_section_content`
   - `template_categories`

3. **Template Frontend Apps** (`/templates/`)
   - 8 React apps: tsuru-demo, beauty-essentials, tech-gadgets, vintage-fashion, artisan-crafts, gourmet-foods, fitness-hub, pet-care
   - Each deployed to S3 bucket for demo viewing

4. **Organization Content Tables**
   - `theme_settings`
   - `contact_settings`
   - `payment_settings`
   - `shipping_settings`
   - `pages`
   - `page_sections`
   - `section_content`
   - `categories`

### ❌ What's Missing
1. **Demo Mode Detection** - No way to distinguish demo vs org mode
2. **Template Content Endpoints** - No API to fetch template content
3. **Dual-Mode Data Fetching** - Frontend can't switch between template/org data
4. **Template Preview URL** - No previewUrl field in templates table

---

## Implementation Plan

### Phase 1: Add Template Content Endpoints

#### 1.1 Add `previewUrl` to Template Entity
```typescript
// server/src/entities/Template.ts
previewUrl: text("preview_url"), // URL to S3 bucket demo
```

#### 1.2 Create Template Content Service
```typescript
// server/src/services/TemplateContentService.ts
class TemplateContentService {
  async getTemplateContent(templateId: string) {
    // Fetch all template content (theme, contact, pages, etc.)
    return {
      theme: await getTemplateTheme(templateId),
      contact: await getTemplateContact(templateId),
      payment: await getTemplatePayment(templateId),
      shipping: await getTemplateShipping(templateId),
      pages: await getTemplatePages(templateId),
      categories: await getTemplateCategories(templateId),
    };
  }
}
```

#### 1.3 Add Template Content Endpoints
```typescript
// TemplateController.ts
GET /api/templates/:id/content - Get all template content
GET /api/templates/:id/theme - Get template theme
GET /api/templates/:id/pages - Get template pages
GET /api/templates/:id/categories - Get template categories
```

---

### Phase 2: Implement Demo Mode Detection

#### 2.1 Add Mode Detection Middleware
```typescript
// server/src/middleware/modeDetection.ts
export function detectMode(req, res, next) {
  // Check subdomain or query param
  const subdomain = req.hostname.split('.')[0];
  const isDemo = subdomain.startsWith('demo-') || req.query.mode === 'demo';
  
  req.mode = isDemo ? 'demo' : 'org';
  req.templateId = isDemo ? extractTemplateId(subdomain) : null;
  req.organizationId = !isDemo ? getOrgFromSubdomain(subdomain) : null;
  
  next();
}
```

#### 2.2 Update Routes to Support Both Modes
```typescript
// Dual-mode endpoints
GET /api/content/theme?mode=demo&templateId=xxx
GET /api/content/theme?mode=org&orgId=xxx

GET /api/content/pages?mode=demo&templateId=xxx
GET /api/content/pages?mode=org&orgId=xxx
```

---

### Phase 3: Update Frontend Template Apps

#### 3.1 Add Mode Detection in Frontend
```typescript
// templates/*/src/lib/api.ts
const mode = window.location.hostname.includes('demo-') ? 'demo' : 'org';
const id = mode === 'demo' ? getTemplateId() : getOrgId();

export const fetchTheme = () => 
  fetch(`/api/content/theme?mode=${mode}&${mode === 'demo' ? 'templateId' : 'orgId'}=${id}`);
```

#### 3.2 Update Data Fetching Hooks
```typescript
// templates/*/src/hooks/useTheme.ts
export function useTheme() {
  const { mode, id } = useMode();
  return useQuery(['theme', mode, id], () => fetchTheme(mode, id));
}
```

---

### Phase 4: Update Seed Data

#### 4.1 Add Preview URLs to Templates
```typescript
// server/src/seeds/template-seed.ts
{
  name: 'beauty-essentials',
  previewUrl: 'https://demo-beauty-essentials.tsuru.jcampos.dev',
  // ...
}
```

---

## API Endpoints Summary

### Template Endpoints (Public)
```
GET  /api/templates                    - List all templates
GET  /api/templates/:id                - Get template metadata
GET  /api/templates/:id/content        - Get all template content
GET  /api/templates/:id/theme          - Get template theme
GET  /api/templates/:id/contact        - Get template contact
GET  /api/templates/:id/pages          - Get template pages
GET  /api/templates/:id/categories     - Get template categories
```

### Organization Endpoints (Authenticated)
```
GET  /api/users/:userId/organization/:orgId/settings/theme
GET  /api/users/:userId/organization/:orgId/settings/contact
GET  /api/users/:userId/organization/:orgId/pages
GET  /api/users/:userId/organization/:orgId/categories
```

### Unified Content Endpoints (New - Dual Mode)
```
GET  /api/content/theme?mode=demo&templateId=xxx
GET  /api/content/theme?mode=org&orgId=xxx
GET  /api/content/pages?mode=demo&templateId=xxx
GET  /api/content/pages?mode=org&orgId=xxx
```

---

## Implementation Steps

### Step 1: Database Changes
```bash
# Add previewUrl to templates
npm run db:push

# Update seed with preview URLs
npm run db:seed:templates
```

### Step 2: Backend Implementation
1. Create `TemplateContentService.ts`
2. Add template content endpoints to `TemplateController.ts`
3. Create unified content controller (optional)
4. Update routes in `routes.ts`

### Step 3: Frontend Updates
1. Add mode detection utility
2. Update API client to support dual mode
3. Update data fetching hooks
4. Test demo mode on S3 buckets

### Step 4: Testing
1. Test template content endpoints
2. Test demo mode detection
3. Test org mode (existing functionality)
4. Verify S3 bucket demos work

---

## Decision Points

### Option A: Separate Endpoints (Recommended)
- Template endpoints: `/api/templates/:id/content`
- Org endpoints: `/api/users/:userId/organization/:orgId/...`
- Frontend detects mode and calls appropriate endpoint

**Pros:**
- Clear separation
- Existing org endpoints unchanged
- Easy to understand

**Cons:**
- Frontend needs mode detection logic

### Option B: Unified Endpoints
- Single endpoint: `/api/content/theme?mode=demo&id=xxx`
- Backend routes to template or org data

**Pros:**
- Single API interface
- Frontend code simpler

**Cons:**
- More complex backend routing
- Mixing concerns

**Recommendation: Option A** - Keep template and org endpoints separate for clarity.

---

## Next Actions

1. ✅ Confirm approach (Option A or B)
2. Add `previewUrl` to Template entity
3. Create TemplateContentService
4. Add template content endpoints
5. Update seed data with preview URLs
6. Test with Postman/curl
7. Update frontend template apps
