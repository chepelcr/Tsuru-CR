# Template Pages Data Fetching Validation Plan

## ✅ COMPLETED

### Infrastructure Files Deployed (8/8)
- ✅ beauty-essentials
- ✅ tsuru-demo
- ✅ tech-gadgets
- ✅ vintage-fashion
- ✅ artisan-crafts
- ✅ gourmet-foods
- ✅ fitness-hub
- ✅ pet-care

### Files Copied to All Templates
- ✅ `src/contexts/SubdomainContext.tsx` - Fetches config.json and manages mode
- ✅ `src/lib/mode.ts` - detectMode() and detectModeSync() functions
- ✅ All App.tsx files wrapped with SubdomainProvider

### Existing Infrastructure (Already Present)
- ✅ `src/lib/api.ts` - All templates have this
- ✅ `src/hooks/useContent.ts` - All templates have this

## Pages Using API Correctly

All templates have these pages that use hooks:
- ✅ HomePage - Uses useProducts()
- ✅ ProductsPage - Uses useProducts()
- ✅ ProductDetailPage - Uses API
- ✅ DealsPage - Uses useProducts({ onSale: true })
- ✅ ServicesPage - Uses useProducts({ isService: true })
- ✅ ProgramsPage - Uses useProducts({ type: 'program' })
- ✅ AboutPage - Static content

## How It Works

1. **On Load**: SubdomainContext fetches `/config.json` from S3 bucket
2. **Config Contains**:
   - Demo: `{ templateId: "uuid", mode: "demo" }`
   - Prod: `{ orgId: "uuid", mode: "prod" }`
3. **API Calls**: useContent hooks use config to call correct endpoints
   - Demo: `/api/templates/:templateId/products`
   - Prod: `/api/users/:userId/organization/:orgId/products`

## Deployment Flow

### Demo Templates
1. `setup-template-bucket.js` runs
2. Uploads template files to S3
3. `scripts/generate-bucket-configs.js` creates config.json with templateId
4. Frontend fetches config.json and uses template endpoints

### Production Orgs
1. Organization infrastructure provisioned
2. `DeploymentService.deployToS3()` runs
3. Uploads org files and creates config.json with orgId
4. Frontend fetches config.json and uses org endpoints

## Testing Checklist
- [ ] Run `npm run db:seed` to create/update template data
- [ ] Run `node scripts/generate-bucket-configs.js` to create config files
- [ ] Test demo template: `https://beauty-essentials-example.tsuru.jcampos.dev`
- [ ] Verify products load from API
- [ ] Verify deals/services/programs pages work
- [ ] Test production org deployment
