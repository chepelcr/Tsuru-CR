# Template Missing Layers & Specifications

## Missing Pages Implementation

### 1. Deals/Sale Pages (All Templates)
**Route:** `/deals` or `/sale`

**Requirements:**
- Fetch products with `onSale=true` or `badge=sale` filter
- Display discounted products with original price strikethrough
- Show percentage discount badges
- Filter by category
- Sort by discount percentage

**API Endpoints:**
- Demo mode: `GET /api/templates/:id/products?onSale=true`
- Org mode: `GET /api/organizations/:id/products?onSale=true`

**Templates to implement:**
- beauty-essentials
- tsuru-demo
- tech-gadgets
- vintage-fashion
- artisan-crafts
- gourmet-foods
- fitness-hub
- pet-care

---

### 2. Services Pages (Pet-Care + All Templates)
**Route:** `/services`

**Requirements:**
- Fetch products/services with `isService=true` filter
- Display service cards with duration, price, description
- Show booking/inquiry CTA buttons
- Category filters (grooming, veterinary, training, etc.)
- Service provider information

**API Endpoints:**
- Demo mode: `GET /api/templates/:id/products?isService=true`
- Org mode: `GET /api/organizations/:id/products?isService=true`

**Backend Changes Required:**
- Add `isService` boolean field to Product entity
- Add `isService` filter to product endpoints
- Seed service data for pet-care template

**Templates to implement:**
- pet-care (primary)
- beauty-essentials (spa services)
- fitness-hub (training programs)
- gourmet-foods (catering services)

---

### 3. Categories Pages
**Route:** `/categories`

**Requirements:**
- Display all categories with product counts
- Category cards with images/icons
- Click to filter products by category
- Subcategory support

**API Endpoints:**
- Demo mode: `GET /api/templates/:id/categories`
- Org mode: `GET /api/organizations/:id/categories`

**Templates to implement:**
- tech-gadgets
- All templates (optional enhancement)

---

### 4. Programs Pages (Fitness-Hub)
**Route:** `/programs`

**Requirements:**
- Display fitness programs (could be products with `type=program`)
- Program details: duration, difficulty, goals
- Enrollment/purchase CTA
- Filter by difficulty, duration, goal

**API Endpoints:**
- Demo mode: `GET /api/templates/:id/products?type=program`
- Org mode: `GET /api/organizations/:id/products?type=program`

**Backend Changes Required:**
- Add `type` field to Product entity (product, service, program)
- Add `difficulty` field for programs
- Add `duration` field for programs

---

### 5. About Pages
**Route:** `/about`

**Requirements:**
- Fetch from pages API with `slug=about`
- Display brand story, mission, values
- Team section
- Contact information

**API Endpoints:**
- Demo mode: `GET /api/templates/:id/pages?slug=about`
- Org mode: `GET /api/organizations/:id/pages?slug=about`

**Templates to implement:**
- tech-gadgets
- fitness-hub
- pet-care
- All templates (optional)

---

## Backend API Enhancements Needed

### 1. Product Filtering
Add query parameters to product endpoints:

```typescript
GET /api/templates/:id/products
GET /api/organizations/:id/products

Query params:
- isService: boolean
- onSale: boolean
- type: 'product' | 'service' | 'program'
- category: string
- minPrice: number
- maxPrice: number
- badge: string
```

### 2. Product Entity Updates
Add fields to Product entity:

```typescript
interface Product {
  // Existing fields...
  isService?: boolean;
  type?: 'product' | 'service' | 'program';
  duration?: string; // For services/programs
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // For programs
  originalPrice?: number; // For sale items
  discount?: number; // Percentage
  onSale?: boolean;
}
```

### 3. Template Seed Data
Update template seed to include:
- Service products for pet-care
- Program products for fitness-hub
- Sale/discounted products for all templates
- About page content for all templates

---

## Frontend Hook Enhancements

### Update useContent.ts
Add new hooks:

```typescript
// Fetch products with filters
export function useProducts(filters?: {
  isService?: boolean;
  onSale?: boolean;
  type?: string;
  category?: string;
}) {
  const { mode, id } = useMode();
  
  return useQuery({
    queryKey: ['products', mode, id, filters],
    queryFn: () => api.getProducts(filters),
  });
}

// Fetch single page by slug
export function usePage(slug: string) {
  const { mode, id } = useMode();
  
  return useQuery({
    queryKey: ['page', mode, id, slug],
    queryFn: () => api.getPage(slug),
  });
}
```

### Update api.ts
Add filter support:

```typescript
export const api = {
  getProducts: (filters?: Record<string, any>) => {
    const params = new URLSearchParams(filters);
    return fetch(`${baseUrl}/products?${params}`).then(r => r.json());
  },
  
  getPage: (slug: string) => {
    return fetch(`${baseUrl}/pages/${slug}`).then(r => r.json());
  },
};
```

---

## Implementation Priority

### Phase 1 (High Priority)
1. ✅ Add product filtering to backend endpoints
2. ✅ Update Product entity with new fields
3. ✅ Update useProducts hook with filters
4. ✅ Implement Deals pages for all templates
5. ✅ Implement Services page for pet-care

### Phase 2 (Medium Priority)
6. Implement Services pages for other templates
7. Implement Programs page for fitness-hub
8. Implement Categories page for tech-gadgets
9. Seed service/program data

### Phase 3 (Low Priority)
10. Implement About pages for all templates
11. Add page content to seed data
12. Enhance filtering UI across all templates

---

## Notes

- All pages must work in both demo mode and org mode
- All pages must fetch data from API, no hardcoded data
- All pages must have loading states
- All pages must maintain template-specific design language
- Services are products with `isService=true` flag
- Programs are products with `type=program` flag
- Deals are products with `onSale=true` flag
