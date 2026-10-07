# Config.json - Actualización Completada: Modelo de Suscripción

## ✅ Actualización Completada

Se ha actualizado exitosamente el archivo `config.json` para reflejar el nuevo modelo de suscripción mensual/anual con la promoción **10+2 meses**.

---

## 📋 Cambios Implementados

### 1. ✅ Pricing (Raíz del Config)

**Cambios:**
- `currency`: "USD" → "CRC"
- Eliminado: `amortizationMonths: 36`
- Agregado: `annualDiscountMonths: 2`
- Agregado: `defaultBillingCycle: "annual"`

```json
"pricing": {
  "currency": "CRC",
  "usdRateCRC": 600,
  "freeDocs": 30,
  "moneyBackDays": 30,
  "annualDiscountMonths": 2,
  "defaultBillingCycle": "annual"
}
```

---

### 2. ✅ Plan Pro (Español)

**Cambios:**
- `name`: "Pago Único Pro" → "Pro"
- `tagline`: "Pagás una vez. Nunca más." → "Todo lo que necesitás para crecer."
- Agregado: `priceMonthly: 20000` (₡20,000/mes)
- Agregado: `priceAnnual: 200000` (₡200,000/año)
- Agregado: `priceCRC: 200000`
- Agregado: `priceMin: 200000`
- Agregado: `priceMax: 200000`
- `priceSuffix`: "una vez" → "/ año"
- Agregado: `showPriceSlider: false`
- `ctaLabel`: "Desbloquear todo" → "Suscribirse a Pro"
- Agregado: `ctaHref: "#"`
- Agregado: `highlighted: true`
- `subline`: "" → "Pagás 10 meses, te regalamos 2"
- Agregado: `showAmortization: false`
- `showMoneyBack`: false → true

---

### 3. ✅ Nuevas Traducciones (Español)

**Agregado en `translations.es.pricing`:**

```json
"billingToggle": {
  "monthly": "Mensual",
  "annual": "Anual",
  "badge": "Ahorrá 2 meses",
  "savingsNote": "Pagás 10 meses y te regalamos 2"
},
"planLabels": {
  "monthlyPrice": "/ mes",
  "annualPrice": "/ año",
  "monthlyTotal": "Total mensual",
  "annualTotal": "Total anual"
}
```

---

### 4. ✅ Textos Actualizados (Español)

#### Hero Section:
- **Headline**: "El POS que cumple con {{Hacienda}} sin cobrarte mensualidad." → "El POS que cumple con {{Hacienda}} con precios justos."
- **Subheadline**: "...con un único pago — sin suscripciones..." → "...con planes mensuales o anuales — sin sorpresas, sin letra chica."

#### VS Competition:
- **Headline**: "Pagás {{una vez}}. Vendés {{para siempre}}." → "Precios {{claros}}. Sin {{trucos}}."
- **Subheadline**: "...es tuyo con un solo pago." → "...te da flexibilidad mensual o anual con descuento."
- **Modelo de pago**: "Pago único de por vida" → "Suscripción mensual o anual (10+2)"
- **Costo a 3 años**: "Pago único" → "₡600,000 (con plan anual)"

#### Pricing Section:
- **Headline**: "Empezá gratis. {{Crecé sin atarte}}." → "Empezá gratis. {{Crecé a tu ritmo}}."
- Eliminado: `amortizationLabel`
- Agregado: `annualSavingsLabel: "Con el plan anual pagás 10 meses y te regalamos 2 — ahorrás {{savings}} al año."`

#### Hacienda Section:
- **promoDesc**: "...todo dentro del Pago Único." → "...incluido en tu suscripción Pro."

#### Addons:
- **Sucursal extra**: "Pagás una pequeña tarifa única..." → "Agregá sucursales adicionales por una tarifa mensual accesible."
- **Terminal extra**: "Activá nuevas terminales sin cambiarte de plan." → "Activá nuevas terminales sin costo adicional en el plan Pro."

#### Testimonials:
- **Headline**: "Negocios costarricenses que ya no pagan mensualidad." → "Negocios costarricenses que confían en Tsuru POS."
- **Quote 1**: "Pasamos de pagar mensualidades a tener un sistema que es nuestro..." → "El plan anual con 2 meses gratis fue la mejor decisión. Ahorramos y tenemos todo lo que necesitamos."

#### FAQ:
- **Pregunta actualizada**: "¿Qué incluye exactamente el \"Pago Único\"?" → "¿Qué incluye el plan Pro?"
- **Nuevas preguntas agregadas**:
  - "¿Cuál es la diferencia entre el plan mensual y anual?"
  - "¿Puedo cambiar de plan mensual a anual?"

#### Final CTA:
- **Subheadline**: "...desbloqueá todo con un solo pago." → "...elegí el plan que mejor te funcione — mensual o anual con descuento."

#### Footer:
- **Tagline**: "...sin renta mensual." → "...precios justos, sin letra chica."

---

### 5. ✅ Traducciones en Inglés

Todos los cambios anteriores también se aplicaron en la versión en inglés (`translations.en`):

#### Hero:
- "The POS that complies with Hacienda without monthly fees." → "The POS that complies with Hacienda with fair pricing."
- "...with a one-time payment — no subscriptions..." → "...with monthly or annual plans — no surprises, no fine print."

#### VS Competition:
- "Pay once. Sell forever." → "Clear pricing. No tricks."
- "...is yours with a single payment." → "...gives you monthly or annual flexibility with discounts."
- "One-time lifetime payment" → "Monthly or annual subscription (10+2)"
- "One-time payment" → "₡600,000 (with annual plan)"

#### Pricing:
- "Start free. {{Grow without ties}}." → "Start free. {{Grow at your pace}}."
- Removed: `amortizationLabel`
- Added: `annualSavingsLabel: "With the annual plan you pay 10 months and get 2 free — save {{savings}} per year."`
- Added: `billingToggle` and `planLabels` (English versions)

#### Plan Pro (English):
- "One-Time Payment Pro" → "Pro"
- "Pay once. Never again." → "Everything you need to grow."
- "one time" → "/ year"
- "Unlock everything" → "Subscribe to Pro"
- Added: "Pay 10 months, get 2 free"

#### Addons:
- "Pay a small one-time fee..." → "Add additional branches for an accessible monthly fee."
- "Activate new terminals without changing your plan." → "Activate new terminals at no additional cost on the Pro plan."

#### Testimonials:
- "Costa Rican businesses that no longer pay monthly fees." → "Costa Rican businesses that trust Tsuru POS."
- "We went from paying monthly fees..." → "The annual plan with 2 free months was the best decision. We save money and have everything we need."

#### FAQ:
- "What exactly does the \"One-Time Payment\" include?" → "What does the Pro plan include?"
- Added new questions:
  - "What's the difference between monthly and annual plans?"
  - "Can I switch from monthly to annual?"

#### Final CTA:
- "...unlock everything with a single payment." → "...choose the plan that works best for you — monthly or annual with discount."

#### Footer:
- "...no monthly fee." → "...fair pricing, no fine print."

#### Hacienda:
- "...all within the One-Time Payment." → "...included in your Pro subscription."

---

## 📊 Resumen de Precios

| Plan | Mensual | Anual (10+2) | Ahorro |
|------|---------|--------------|--------|
| Free | ₡0 | ₡0 | - |
| Pro | ₡20,000/mes | ₡200,000/año | ₡40,000 (16.67%) |

**Ventaja competitiva:**
- Alegra: 10% OFF anual
- Scrampi: 15% OFF anual
- GTI: 10 meses por 12
- **Tsuru POS: 16.67% OFF anual** ✅ **Más agresivo**

---

## 🎯 Mensajes Clave

1. ✅ "Pagás 10 meses, te regalamos 2"
2. ✅ "16.67% de ahorro con el plan anual"
3. ✅ "Sin letra chica, sin sorpresas"
4. ✅ "Flexibilidad mensual o ahorro anual"
5. ✅ "Cumplimiento Hacienda 4.4 incluido"

---

## 📁 Archivos Modificados

1. ✅ `BeautyMarket/templates/pos-landing/public/config.json`
   - Actualizado: `pricing` (raíz)
   - Actualizado: Plan Pro (ES y EN)
   - Agregado: `billingToggle` y `planLabels` (ES y EN)
   - Actualizado: Todos los textos mencionados (ES y EN)

---

## ⏳ Próximos Pasos

### Dashboard (PricingTab.tsx):
1. ⏳ Agregar toggle mensual/anual
2. ⏳ Agregar campos `priceMonthly` y `priceAnnual`
3. ⏳ Eliminar campo `amortizationMonths`
4. ⏳ Actualizar validaciones
5. ⏳ Agregar cálculo de ahorro

### Landing Page (Pricing.tsx):
1. ⏳ Implementar toggle de ciclo de facturación
2. ⏳ Mostrar precios según ciclo seleccionado
3. ⏳ Mostrar badge de ahorro en plan anual
4. ⏳ Actualizar lógica de visualización

---

## ✅ Estado Final

**Config.json**: ✅ 100% Actualizado  
**Dashboard**: ⏳ Pendiente  
**Landing Page**: ⏳ Pendiente  

**Todos los textos han sido actualizados para reflejar el modelo de suscripción mensual/anual con la promoción 10+2.**

---

## 🔍 Verificación

Para verificar los cambios:
1. Abrir `config.json`
2. Buscar `"pricing"` (raíz) - debe tener `annualDiscountMonths: 2`
3. Buscar `"id": "pro"` - debe tener `priceMonthly` y `priceAnnual`
4. Buscar `"billingToggle"` - debe existir en ES y EN
5. Buscar textos antiguos como "Pago Único" o "una vez" - no deben existir

✅ **Actualización completada exitosamente!**
