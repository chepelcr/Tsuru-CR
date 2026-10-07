# Sections Analysis - Card-Based Content

## Overview

Analysis of all landing page sections to identify which have card-based content that should be editable in the dashboard.

---

## ✅ Sections with Cards (Need Dashboard Tabs)

### 1. **Features Section** (`/caracteristicas`)
**Status**: ✅ Already config-driven  
**Structure**: Groups of feature cards

```typescript
interface FeatureGroup {
  eyebrow: string;  // e.g., "Punto de venta"
  title: string;    // e.g., "Vendé como te gusta"
  items: Array<{
    icon: string;   // Icon name
    title: string;  // Card title
    desc: string;   // Card description
  }>;
}
```

**Current Config Path**: `translations.es.features.groups[]`  
**Dashboard Tab Needed**: ✅ Yes - "Features" tab

---

### 2. **VS Competition Section** (`/vs`)
**Status**: ✅ Already config-driven  
**Structure**: Comparison table rows

```typescript
interface VsRow {
  feature: string;  // Feature name
  jm: string;       // Tsuru value
  alt1: string;     // Competitor 1 value
  alt2: string;     // Competitor 2 value
}
```

**Current Config Path**: `translations.es.vs.rows[]`  
**Dashboard Tab Needed**: ✅ Yes - "VS Competition" tab

---

### 3. **How It Works Section** (`/como`)
**Status**: ✅ Already config-driven  
**Structure**: Step cards (4 steps)

```typescript
interface Step {
  icon: string;   // Icon name
  title: string;  // Step title
  desc: string;   // Step description
}
```

**Current Config Path**: `translations.es.howItWorks.steps[]`  
**Dashboard Tab Needed**: ✅ Yes - "How It Works" tab

---

### 4. **Hacienda Section** (`/hacienda`)
**Status**: ✅ Already config-driven  
**Structure**: Feature cards (6 cards)

```typescript
interface HaciendaCard {
  icon: string;   // Icon name
  title: string;  // Card title
  desc: string;   // Card description
}
```

**Current Config Path**: `translations.es.hacienda.cards[]`  
**Dashboard Tab Needed**: ✅ Yes - "Hacienda" tab

---

### 5. **Testimonials Section** (`/testimonios`)
**Status**: ✅ Already config-driven  
**Structure**: Testimonial cards (3 testimonials)

```typescript
interface TestimonialItem {
  quote: string;   // Testimonial quote
  author: string;  // Author name
  role: string;    // Author role/company
}
```

**Current Config Path**: `translations.es.testimonials.items[]`  
**Dashboard Tab Needed**: ✅ Yes - "Testimonials" tab

---

### 6. **FAQ Section** (`/preguntas`)
**Status**: ✅ Already config-driven  
**Structure**: Accordion items (Q&A pairs)

```typescript
interface FaqItem {
  q: string;  // Question
  a: string;  // Answer
}
```

**Current Config Path**: `translations.es.faq.items[]`  
**Dashboard Tab Needed**: ✅ Yes - "FAQ" tab

---

## ❌ Sections WITHOUT Cards (No Dashboard Tab Needed)

### 7. **Hero Section** (`/`)
**Structure**: Single hero with headline, subheadline, CTAs  
**Dashboard Tab**: Already covered in "Translations" tab

### 8. **Pricing Section** (`/precios`)
**Structure**: Plan cards  
**Dashboard Tab**: ✅ Already has dedicated "Pricing" tab

### 9. **Final CTA Section** (`/login`)
**Structure**: Single CTA block  
**Dashboard Tab**: Already covered in "Translations" tab

### 10. **Footer Section**
**Structure**: Footer links and info  
**Dashboard Tab**: Already covered in "Translations" tab

---

## 📋 Dashboard Implementation Plan

### New Tabs to Create

1. **Features Tab** - Edit feature groups and cards
2. **VS Competition Tab** - Edit comparison table rows
3. **How It Works Tab** - Edit step cards
4. **Hacienda Tab** - Edit compliance feature cards
5. **Testimonials Tab** - Edit testimonial cards
6. **FAQ Tab** - Edit FAQ accordion items

### Tab Features

Each tab should support:
- ✅ Add new card/item
- ✅ Edit existing card/item
- ✅ Delete card/item
- ✅ Reorder cards/items (drag & drop or up/down buttons)
- ✅ Icon picker (for sections with icons)
- ✅ Live preview in iframe
- ✅ Translations support (ES/EN)

### Common Components Needed

1. **CardEditor** - Generic card editing component
2. **IconPicker** - Icon selection dropdown
3. **ArrayEditor** - Add/remove/reorder items
4. **TranslationInput** - Input with language tabs

---

## 🌐 Translation Structure

All card content is stored in `translations.es` and `translations.en`:

```json
{
  "translations": {
    "es": {
      "features": { "groups": [...] },
      "vs": { "rows": [...] },
      "howItWorks": { "steps": [...] },
      "hacienda": { "cards": [...] },
      "testimonials": { "items": [...] },
      "faq": { "items": [...] }
    },
    "en": {
      // Same structure
    }
  }
}
```

---

## 🎯 Priority Order

1. **High Priority** (Most frequently edited):
   - Features Tab
   - Testimonials Tab
   - FAQ Tab

2. **Medium Priority**:
   - How It Works Tab
   - Hacienda Tab

3. **Low Priority** (Less frequently changed):
   - VS Competition Tab

---

## 📝 Notes

- All sections are already config-driven ✅
- No "burned" (hardcoded) cards found ✅
- All content is translatable ✅
- Icon names use the Icon component's IconName type
- Each section has proper TypeScript interfaces
