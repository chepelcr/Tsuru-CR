# Dashboard Component Orchestration Plan

## 🎯 Goal

Transform all dashboard tabs from monolithic components into **orchestrators** that compose smaller, focused components. Each component should map directly to what's rendered on the landing page.

---

## 📋 Current State Analysis

### PricingTab (784 lines) - NEEDS SPLITTING ❌

**Current Structure:**
- Main `PricingTab` component (orchestrator)
- Inline components:
  - `NumberField` (local utility)
  - `FeaturesPanel` (150+ lines)
  - `PlanCardEditor` (300+ lines)
  - `ToggleField` (local utility)
  - `FeatureRowEditor` (50+ lines)
  - `ColorPicker` (40+ lines)
  - `FeatureAddDropdown` (50+ lines)

**Should Be:**
```
PricingTab (orchestrator ~100 lines)
├── PricingConfigPanel (currency, rates, subscription settings)
├── MasterFeaturesPanel (master features catalog)
└── PlansList
    └── PlanCard (for each plan)
        ├── PlanHeader (name, badge, delete)
        ├── PlanPricing (monthly/annual prices)
        ├── PlanCTA (CTA label, href, flags)
        └── PlanFeaturesList
            └── FeatureRow (for each feature)
```

---

## 🗺️ Component Mapping: Dashboard ↔ Landing

### 1. PricingTab → Pricing Section

**Landing Components:**
- `src/components/sections/Pricing.tsx` (main section)
  - Billing cycle toggle
  - Plans grid
  - Plan cards with features

**Dashboard Components to Create:**
```
dashboard/pricing/
├── PricingConfigPanel.tsx       (currency, rates, defaults)
├── MasterFeaturesPanel.tsx      (features catalog)
├── PlansList.tsx                (plans orchestrator)
├── PlanCard.tsx                 (single plan editor)
│   ├── PlanHeader.tsx           (name, badge, delete)
│   ├── PlanPricing.tsx          (monthly/annual prices)
│   ├── PlanCTA.tsx              (CTA + flags)
│   └── PlanFeaturesList.tsx     (features list)
│       ├── FeatureRow.tsx       (single feature editor)
│       ├── ColorPicker.tsx      (color selector)
│       └── FeatureAddDropdown.tsx (add feature dropdown)
└── index.ts                     (exports)
```

---

### 2. FeaturesTab → Features Section

**Landing Components:**
- `src/components/sections/Features.tsx`
  - Feature groups (collapsible)
  - Feature cards with icons

**Dashboard Components to Create:**
```
dashboard/features/
├── FeatureGroupsList.tsx        (groups orchestrator)
├── FeatureGroup.tsx             (single group editor)
│   ├── GroupHeader.tsx          (eyebrow, title, collapse)
│   ├── GroupFields.tsx          (eyebrow, title inputs)
│   └── GroupItemsList.tsx       (items list)
│       └── FeatureItem.tsx      (icon, title, desc)
└── index.ts
```

---

### 3. TestimonialsTab → Testimonials Section

**Landing Components:**
- `src/components/sections/Testimonials.tsx`
  - Testimonial cards
  - Author info (name, role, avatar)

**Dashboard Components to Create:**
```
dashboard/testimonials/
├── TestimonialsList.tsx         (testimonials orchestrator)
└── TestimonialCard.tsx          (single testimonial editor)
    ├── TestimonialContent.tsx   (quote, text)
    └── TestimonialAuthor.tsx    (name, role, avatar)
```

---

### 4. FAQTab → FAQ Section

**Landing Components:**
- `src/components/sections/FAQ.tsx`
  - FAQ items (collapsible)
  - Question/Answer pairs

**Dashboard Components to Create:**
```
dashboard/faq/
├── FAQList.tsx                  (FAQ orchestrator)
└── FAQItem.tsx                  (single FAQ editor)
    ├── FAQQuestion.tsx          (question input)
    └── FAQAnswer.tsx            (answer textarea)
```

---

### 5. HowItWorksTab → HowItWorks Section

**Landing Components:**
- `src/components/sections/HowItWorks.tsx`
  - Step cards
  - Step number, title, description

**Dashboard Components to Create:**
```
dashboard/how-it-works/
├── StepsList.tsx                (steps orchestrator)
└── StepCard.tsx                 (single step editor)
    ├── StepNumber.tsx           (step number badge)
    ├── StepTitle.tsx            (title input)
    └── StepDescription.tsx      (description textarea)
```

---

### 6. VSCompetitionTab → VSCompetition Section

**Landing Components:**
- `src/components/sections/VSCompetition.tsx`
  - Comparison table
  - Feature rows (Tsuru vs Competitors)

**Dashboard Components to Create:**
```
dashboard/vs-competition/
├── ComparisonTable.tsx          (table orchestrator)
└── ComparisonRow.tsx            (single row editor)
    ├── FeatureCell.tsx          (feature name)
    ├── TsuruCell.tsx         (Tsuru value)
    └── CompetitorCell.tsx       (competitor value)
```

---

### 7. HaciendaTab → Hacienda Section

**Landing Components:**
- `src/components/sections/Hacienda.tsx`
  - Benefit cards
  - Icon, title, description

**Dashboard Components to Create:**
```
dashboard/hacienda/
├── BenefitsList.tsx             (benefits orchestrator)
└── BenefitCard.tsx              (single benefit editor)
    ├── BenefitIcon.tsx          (icon selector)
    ├── BenefitTitle.tsx         (title input)
    └── BenefitDescription.tsx   (description textarea)
```

---

### 8. PricingAddonsTab → PricingAddons Section

**Landing Components:**
- `src/components/sections/PricingAddons.tsx`
  - Addon cards
  - Name, price, description

**Dashboard Components to Create:**
```
dashboard/pricing-addons/
├── AddonsList.tsx               (addons orchestrator)
└── AddonCard.tsx                (single addon editor)
    ├── AddonHeader.tsx          (name, price)
    └── AddonDescription.tsx     (description textarea)
```

---

### 9. MetaTab → Meta/SEO

**Dashboard Components to Create:**
```
dashboard/meta/
├── SiteMetaPanel.tsx            (title, description)
├── SEOPanel.tsx                 (keywords, OG tags)
└── FaviconPanel.tsx             (favicon URL)
```

---

### 10. ThemeTab → Theme/Styling

**Dashboard Components to Create:**
```
dashboard/theme/
├── AccentColorPicker.tsx        (accent color selector)
├── DarkModeToggle.tsx           (dark mode toggle)
└── AdvancedPalettePanel.tsx     (advanced colors)
```

---

### 11. SectionsTab → Sections Visibility

**Dashboard Components to Create:**
```
dashboard/sections/
├── SectionsList.tsx             (sections orchestrator)
└── SectionToggle.tsx            (single section toggle)
    ├── SectionName.tsx          (section name)
    ├── VisibilityToggle.tsx     (visible toggle)
    └── VariantSelector.tsx      (variant buttons)
```

---

### 12. ProductsTab → Products Section

**Landing Components:**
- `src/components/sections/Products.tsx`
  - Product cards
  - Name, price, image

**Dashboard Components to Create:**
```
dashboard/products/
├── ProductsList.tsx             (products orchestrator)
└── ProductCard.tsx              (single product editor)
    ├── ProductImage.tsx         (image URL)
    ├── ProductName.tsx          (name input)
    └── ProductPrice.tsx         (price input)
```

---

### 13. TranslationsTab → Translations

**Dashboard Components to Create:**
```
dashboard/translations/
├── TranslationSectionsList.tsx  (sections orchestrator)
└── TranslationSection.tsx       (single section)
    └── TranslationField.tsx     (single field editor)
```

---

## 🎨 Shared Component Library

### Already Created (Phase 1-3)
- ✅ `<LangToggle />` - Language switcher
- ✅ `<TextField />` - Text input
- ✅ `<TextAreaField />` - Textarea
- ✅ `<NumberField />` - Number input
- ✅ `<ItemActions />` - Action buttons
- ✅ `<AddButton />` - Add button
- ✅ `<Toggle />` - Boolean toggle
- ✅ `<Collapsible />` - Collapsible section

### To Create (Phase 4)
- 🔲 `<IconPicker />` - Icon selector with preview
- 🔲 `<ImageUpload />` - Image upload/URL input
- 🔲 `<ColorPicker />` - Color picker (extract from PricingTab)
- 🔲 `<Card />` - Consistent card wrapper
- 🔲 `<CardHeader />` - Card header with title/actions
- 🔲 `<CardContent />` - Card content wrapper
- 🔲 `<DragHandle />` - Drag handle icon
- 🔲 `<Badge />` - Badge component
- 🔲 `<Dropdown />` - Dropdown menu

---

## 📐 Architecture Principles

### 1. Single Responsibility
Each component should do ONE thing well:
- ✅ Good: `<PlanPricing />` handles pricing inputs
- ❌ Bad: `<PlanCard />` handles everything

### 2. Composition Over Inheritance
Build complex UIs by composing simple components:
```tsx
<PlanCard>
  <PlanHeader />
  <PlanPricing />
  <PlanCTA />
  <PlanFeaturesList />
</PlanCard>
```

### 3. Props Down, Events Up
- Parent passes data down via props
- Child emits events up via callbacks
- No prop drilling (use context if needed)

### 4. Colocate Related Components
Group components by feature, not by type:
```
✅ Good:
dashboard/pricing/
  ├── PlanCard.tsx
  ├── PlanHeader.tsx
  └── PlanPricing.tsx

❌ Bad:
dashboard/
  ├── cards/PlanCard.tsx
  ├── headers/PlanHeader.tsx
  └── forms/PlanPricing.tsx
```

### 5. Mirror Landing Page Structure
Dashboard components should map 1:1 with landing page components:
- `dashboard/pricing/PlanCard.tsx` ↔ `sections/Pricing.tsx` (plan card)
- `dashboard/features/FeatureGroup.tsx` ↔ `sections/Features.tsx` (feature group)

---

## 🚀 Implementation Plan

### Phase 4: Component Orchestration (Week 4)

#### Step 1: Extract PricingTab Components (Day 1-2)
1. Create `dashboard/pricing/` directory
2. Extract `PricingConfigPanel` component
3. Extract `MasterFeaturesPanel` component
4. Extract `PlanCard` and sub-components
5. Update `PricingTab` to orchestrate

**Expected Result:**
- PricingTab: 784 lines → ~100 lines (87% reduction)
- 10+ new focused components
- 0 TypeScript errors

#### Step 2: Extract FeaturesTab Components (Day 2-3)
1. Create `dashboard/features/` directory
2. Extract `FeatureGroup` component
3. Extract `FeatureItem` component
4. Update `FeaturesTab` to orchestrate

**Expected Result:**
- FeaturesTab: 220 lines → ~80 lines (64% reduction)
- 5+ new focused components

#### Step 3: Extract Array-Based Tabs (Day 3-4)
1. Extract TestimonialsTab components
2. Extract FAQTab components
3. Extract HowItWorksTab components
4. Extract HaciendaTab components
5. Extract PricingAddonsTab components

**Expected Result:**
- Each tab: ~140 lines → ~60 lines (57% reduction)
- 15+ new focused components

#### Step 4: Extract Remaining Tabs (Day 4-5)
1. Extract VSCompetitionTab components
2. Extract ProductsTab components
3. Extract MetaTab components
4. Extract ThemeTab components
5. Extract SectionsTab components
6. Extract TranslationsTab components

**Expected Result:**
- Each tab: ~100 lines → ~40 lines (60% reduction)
- 20+ new focused components

#### Step 5: Create Shared Component Library Extensions (Day 5)
1. Extract `<ColorPicker />` from PricingTab
2. Create `<IconPicker />` component
3. Create `<ImageUpload />` component
4. Create `<Card />` wrapper components
5. Create `<Dropdown />` component

**Expected Result:**
- 5+ new shared components
- Consistent UI across all tabs

---

## 📊 Expected Results

### Code Metrics
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| PricingTab LOC | 784 | ~100 | **-87%** |
| FeaturesTab LOC | 220 | ~80 | **-64%** |
| Avg Tab LOC | ~150 | ~50 | **-67%** |
| Total Components | 22 | 80+ | **+58 components** |
| Reusable Components | 9 | 20+ | **+11 components** |

### Developer Experience
- ✅ **Easier to understand**: Each component has a single purpose
- ✅ **Easier to test**: Small, focused components
- ✅ **Easier to maintain**: Changes are isolated
- ✅ **Easier to extend**: Add new features by composing components
- ✅ **Better mapping**: Dashboard mirrors landing page structure

### User Experience
- ✅ **Consistent UI**: Same components everywhere
- ✅ **Better performance**: Smaller components = better React optimization
- ✅ **Fewer bugs**: Less code = fewer bugs

---

## 🎯 Success Criteria

### Code Quality
- [ ] All tabs are orchestrators (~50-100 lines each)
- [ ] All inline components extracted to separate files
- [ ] All components have single responsibility
- [ ] All components map to landing page structure
- [ ] 0 TypeScript errors
- [ ] 0 duplicate code

### Documentation
- [ ] Each component has JSDoc comments
- [ ] Each component has usage examples
- [ ] Component mapping document created
- [ ] Architecture principles documented

### Testing
- [ ] All tabs still function correctly
- [ ] All features still work
- [ ] No regressions
- [ ] Performance is maintained or improved

---

## 📝 Next Steps

1. **Review this plan** with the team
2. **Start with PricingTab** (most complex, biggest impact)
3. **Extract components incrementally** (one at a time)
4. **Test after each extraction** (ensure no regressions)
5. **Document as you go** (JSDoc + examples)
6. **Repeat for all tabs** (follow the same pattern)

---

**Status**: 📋 **PLANNING PHASE**  
**Next**: Extract PricingTab components  
**Timeline**: 5 days (1 week)  
**Priority**: High (improves maintainability significantly)

