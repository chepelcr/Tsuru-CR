# Template CMS Integration Guide

## Overview
Each template needs to be updated to use dynamic CMS content while preserving its unique styling. This guide shows the pattern to follow.

## Files to Update Per Template
1. `src/pages/HomePage.tsx` or `src/pages/Home.tsx`
2. `src/components/layout/Footer.tsx`

## Step-by-Step Integration

### 1. Add Imports to HomePage

```typescript
// Add to existing imports
import { useProducts, useHomePage } from '@/hooks/useContent';
import { parsePageSections, getSectionByType } from '@/lib/pageUtils';
```

### 2. Add Hooks in Component

```typescript
export default function HomePage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: pageData } = useHomePage();
  
  // Parse sections
  const sections = parsePageSections(pageData);
  const hero = getSectionByType(sections, 'hero')?.content || {};
  const benefits = getSectionByType(sections, 'benefits')?.content || {};
  const cta = getSectionByType(sections, 'cta')?.content || {};
  const testimonials = getSectionByType(sections, 'testimonials')?.content || {};
```

### 3. Replace Hardcoded Content

#### Hero Section
Replace:
```typescript
<h1>Hardcoded Title</h1>
```
With:
```typescript
<h1>{hero.title || 'Default Title'}</h1>
```

Common hero fields:
- `hero.badge` - Badge text
- `hero.title` - Main heading
- `hero.subtitle` - Description
- `hero.ctaPrimary` - Primary button text
- `hero.ctaSecondary` - Secondary button text
- `hero.image` - Hero image URL
- `hero.stats` - Array of stats `[{label, value}]`

#### Benefits Section
```typescript
{(benefits.items || []).map((benefit: any, index: number) => (
  <div key={index}>
    <h3>{benefit.title}</h3>
    <p>{benefit.description}</p>
  </div>
))}
```

#### CTA Section
```typescript
<h2>{cta.title || 'Join Our Community'}</h2>
<p>{cta.description || 'Subscribe for updates'}</p>
<button>{cta.buttonText || 'Subscribe'}</button>
```

#### Testimonials Section
```typescript
<h2>{testimonials.title || 'What Customers Say'}</h2>
{(testimonials.items || []).map((testimonial: any, index: number) => (
  <div key={index}>
    <p>{testimonial.text}</p>
    <p>{testimonial.name} - {testimonial.role}</p>
  </div>
))}
```

### 4. Update Footer

```typescript
// Add import
import { useContact } from '@/hooks/useContent';

// In component
const { data: contact } = useContact();

// Replace hardcoded values
<a href={`mailto:${contact?.email}`}>{contact?.email}</a>
<a href={`tel:${contact?.phone}`}>{contact?.phone}</a>
<p>{contact?.address}</p>

// Social links
{contact?.instagramUrl && (
  <a href={contact.instagramUrl}>Instagram</a>
)}
{contact?.facebookUrl && (
  <a href={contact.facebookUrl}>Facebook</a>
)}
{contact?.twitterUrl && (
  <a href={contact.twitterUrl}>Twitter</a>
)}
```

## Template Status

### ✅ beauty-essentials
- HomePage: ✅ Fully dynamic
- Footer: ✅ Fully dynamic

### ✅ tsuru-demo
- File: `src/pages/Home.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Status: ✅ Complete

### ✅ tech-gadgets
- File: `src/pages/HomePage.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Status: ✅ Complete

### ✅ vintage-fashion
- File: `src/pages/HomePage.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Status: ✅ Complete

### ✅ artisan-crafts
- File: `src/pages/HomePage.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Status: ✅ Complete

### ✅ gourmet-foods
- File: `src/pages/HomePage.tsx`
- Footer: Missing - needs creation
- Status: ✅ Complete (HomePage only)

### ✅ fitness-hub
- File: `src/pages/Home.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Status: ✅ Complete

### ✅ pet-care
- File: `src/pages/HomePage.tsx`
- Footer: `src/components/layout/Footer.tsx`
- Status: ✅ Complete

## Testing

After updating each template:
1. Run `npm run db:seed:templates` to ensure data is seeded
2. Start dev server: `npm run dev`
3. Visit template URL
4. Verify all sections load from database
5. Check footer shows contact info
6. Test with missing data (should show defaults)

## Important Notes

- **Preserve Styling**: Keep all template-specific classes, colors, and layouts
- **Fallback Values**: Always provide fallback values with `||` operator
- **Type Safety**: Use `any` type for dynamic content or create proper interfaces
- **Icon Mapping**: For benefits with icons, create icon map like:
  ```typescript
  const iconMap: any = { Leaf, Heart, Award, ShieldCheck };
  const Icon = iconMap[benefit.icon] || DefaultIcon;
  ```
