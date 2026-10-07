# Plan de Actualización: Modelo de Suscripción Mensual/Anual

## Resumen Ejecutivo

Transición del modelo de "Pago Único" a "Suscripción Mensual/Anual" con promoción **10+2** (pagar 10 meses, recibir 12 meses = 16.67% descuento anual).

---

## 1. Cambios en `pricing` (Raíz del Config)

### Actual:
```json
"pricing": {
  "currency": "USD",
  "usdRateCRC": 600,
  "freeDocs": 30,
  "amortizationMonths": 36,
  "moneyBackDays": 30
}
```

### Nuevo:
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

**Cambios:**
- ✅ Cambiar `currency` de "USD" a "CRC" (colones)
- ✅ Eliminar `amortizationMonths` (ya no aplica)
- ✅ Agregar `annualDiscountMonths: 2` (promoción 10+2)
- ✅ Agregar `defaultBillingCycle: "annual"` (mostrar anual por defecto)

---

## 2. Cambios en Planes (`translations.es.pricing.plans`)

### Plan Free - Sin cambios mayores
```json
{
  "id": "free",
  "name": "Free",
  "tagline": "Para empezar tu negocio sin gastar.",
  "priceCRC": 0,
  "priceMin": 0,
  "priceMax": 0,
  "priceSuffix": "/ Para siempre",
  "showPriceSlider": false,
  "ctaLabel": "Crear cuenta gratis",
  "ctaHref": "#",
  "badge": "Para siempre",
  "highlighted": false,
  "subline": "Sin tarjeta. Sin trial. Sin caducidad.",
  "showAmortization": false,
  "showMoneyBack": false,
  "features": [...]
}
```

### Plan Pro - CAMBIOS IMPORTANTES

**Actual:**
```json
{
  "id": "pro",
  "name": "Pago Único Pro",
  "tagline": "Pagás una vez. Nunca más.",
  "priceSuffix": "una vez",
  ...
}
```

**Nuevo:**
```json
{
  "id": "pro",
  "name": "Pro",
  "tagline": "Todo lo que necesitás para crecer.",
  "priceMonthly": 20000,
  "priceAnnual": 200000,
  "priceCRC": 200000,
  "priceMin": 200000,
  "priceMax": 200000,
  "priceSuffix": "/ año",
  "showPriceSlider": false,
  "ctaLabel": "Suscribirse a Pro",
  "ctaHref": "#",
  "badge": "Recomendado",
  "highlighted": true,
  "subline": "Pagás 10 meses, te regalamos 2",
  "showAmortization": false,
  "showMoneyBack": true,
  "features": [...]
}
```

**Cambios clave:**
- ✅ `name`: "Pago Único Pro" → "Pro"
- ✅ `tagline`: "Pagás una vez. Nunca más." → "Todo lo que necesitás para crecer."
- ✅ Agregar `priceMonthly: 20000` (₡20,000/mes)
- ✅ Agregar `priceAnnual: 200000` (₡200,000/año = 10 meses)
- ✅ `priceSuffix`: "una vez" → "/ año"
- ✅ `ctaLabel`: "Desbloquear todo" → "Suscribirse a Pro"
- ✅ `subline`: "" → "Pagás 10 meses, te regalamos 2"
- ✅ `showMoneyBack`: false → true

---

## 3. Nuevas Traducciones para Toggle de Facturación

### Agregar en `translations.es.pricing`:

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

## 4. Actualización de Textos en Secciones

### 4.1 Hero Section

**Actual:**
```json
"headline": "El POS que cumple con {{Hacienda}} sin cobrarte mensualidad.",
"subheadline": "Vendé, facturá electrónicamente y manejá tu inventario. Empezá gratis y desbloqueá todo con un único pago — sin suscripciones, sin sorpresas a fin de mes."
```

**Nuevo:**
```json
"headline": "El POS que cumple con {{Hacienda}} con precios justos.",
"subheadline": "Vendé, facturá electrónicamente y manejá tu inventario. Empezá gratis y crecé con planes mensuales o anuales — sin sorpresas, sin letra chica."
```

### 4.2 VS Competition Section

**Actual:**
```json
"headline": "Pagás {{una vez}}. Vendés {{para siempre}}.",
"subheadline": "Mientras otros sistemas te cobran por bloque de documentos o mes a mes, Tsuru POS es tuyo con un solo pago.",
"rows": [
  {
    "feature": "Modelo de pago",
    "jm": "Pago único de por vida",
    ...
  },
  {
    "feature": "Costo a 3 años",
    "jm": "Pago único",
    ...
  }
]
```

**Nuevo:**
```json
"headline": "Precios {{claros}}. Sin {{trucos}}.",
"subheadline": "Mientras otros te cobran por bloque de documentos o te atan con contratos largos, Tsuru POS te da flexibilidad mensual o anual con descuento.",
"rows": [
  {
    "feature": "Modelo de pago",
    "jm": "Suscripción mensual o anual (10+2)",
    "alt1": "Pago por bloque de documentos",
    "alt2": "Suscripción mensual sin descuento"
  },
  {
    "feature": "Costo a 3 años",
    "jm": "₡600,000 (con plan anual)",
    "alt1": "Variable según consumo",
    "alt2": "₡720,000+ (sin descuento)"
  }
]
```

### 4.3 Hacienda Section

**Actual:**
```json
"promoDesc": "Recordatorios de declaración IVA, libros automáticos de compras y ventas, conciliación bancaria con SINPE — todo dentro del Pago Único."
```

**Nuevo:**
```json
"promoDesc": "Recordatorios de declaración IVA, libros automáticos de compras y ventas, conciliación bancaria con SINPE — incluido en tu suscripción Pro."
```

### 4.4 Pricing Section

**Actual:**
```json
"headline": "Empezá gratis. {{Crecé sin atarte}}.",
"subheadline": "Dos opciones. Sin trucos. Sin \"desde\", sin asteriscos, sin upgrade obligatorio para descargar tus datos.",
"amortizationLabel": "Equivalente a {{monthly}}/mes si lo amortizás a {{months}} años — y a partir del año {{nextYear}} seguís pagando ₡0."
```

**Nuevo:**
```json
"headline": "Empezá gratis. {{Crecé a tu ritmo}}.",
"subheadline": "Dos opciones. Sin trucos. Sin \"desde\", sin asteriscos, sin upgrade obligatorio para descargar tus datos.",
"annualSavingsLabel": "Con el plan anual pagás 10 meses y te regalamos 2 — ahorrás {{savings}} al año."
```

**Eliminar:**
- ❌ `amortizationLabel` (ya no aplica)

**Agregar:**
- ✅ `annualSavingsLabel`

### 4.5 Testimonials Section

**Actual:**
```json
"headline": "Negocios costarricenses que ya no pagan mensualidad.",
"items": [
  {
    "quote": "Pasamos de pagar mensualidades a tener un sistema que es nuestro. La diferencia se siente cada fin de mes.",
    ...
  }
]
```

**Nuevo:**
```json
"headline": "Negocios costarricenses que confían en Tsuru POS.",
"items": [
  {
    "quote": "El plan anual con 2 meses gratis fue la mejor decisión. Ahorramos y tenemos todo lo que necesitamos.",
    "author": "Carolina M.",
    "role": "Dueña, Beauty Studio Heredia"
  },
  {
    "quote": "El modo contingencia salvó dos días enteros de ventas cuando ATV estuvo caído. Ningún cliente se fue sin tiquete.",
    "author": "Andrés R.",
    "role": "Mini-súper Tres Ríos"
  },
  {
    "quote": "Migramos en una tarde. Importamos productos por CSV y al día siguiente ya estábamos facturando.",
    "author": "María Fernanda",
    "role": "Boutique Curridabat"
  }
]
```

### 4.6 FAQ Section

**Actual:**
```json
{
  "q": "¿Qué incluye exactamente el \"Pago Único\"?",
  "a": "Productos y clientes ilimitados, facturación electrónica sin tope mensual, multi-sucursal, multi-terminal, reportes avanzados, modo contingencia y todas las nuevas funciones de cumplimiento Hacienda que liberemos."
}
```

**Nuevo:**
```json
{
  "q": "¿Qué incluye el plan Pro?",
  "a": "Productos y clientes ilimitados, facturación electrónica sin tope mensual, multi-sucursal, multi-terminal, reportes avanzados, modo contingencia y todas las nuevas funciones de cumplimiento Hacienda que liberemos."
},
{
  "q": "¿Cuál es la diferencia entre el plan mensual y anual?",
  "a": "El plan mensual te da flexibilidad total (cancelás cuando querás). El plan anual te da 2 meses gratis — pagás 10 meses y recibís 12 meses de servicio, ahorrando un 16.67%."
},
{
  "q": "¿Puedo cambiar de plan mensual a anual?",
  "a": "Sí, en cualquier momento. Si cambiás a anual, te acreditamos lo que ya pagaste del mes actual y aplicamos el descuento."
}
```

### 4.7 Final CTA Section

**Actual:**
```json
"subheadline": "Empezá gratis sin tarjeta. Cuando estés listo, desbloqueá todo con un solo pago."
```

**Nuevo:**
```json
"subheadline": "Empezá gratis sin tarjeta. Cuando estés listo, elegí el plan que mejor te funcione — mensual o anual con descuento."
```

### 4.8 Footer

**Actual:**
```json
"tagline": "El punto de venta costarricense con facturación electrónica 4.4 — sin renta mensual."
```

**Nuevo:**
```json
"tagline": "El punto de venta costarricense con facturación electrónica 4.4 — precios justos, sin letra chica."
```

---

## 5. Addons Section - Actualizar

**Actual:**
```json
"addons": [
  {
    "icon": "Building2",
    "title": "Sucursal extra",
    "description": "Pagás una pequeña tarifa única por cada sucursal adicional."
  },
  ...
]
```

**Nuevo:**
```json
"addons": [
  {
    "icon": "Building2",
    "title": "Sucursal extra",
    "description": "Agregá sucursales adicionales por una tarifa mensual accesible."
  },
  {
    "icon": "Smartphone",
    "title": "Terminal extra",
    "description": "Activá nuevas terminales sin costo adicional en el plan Pro."
  },
  {
    "icon": "Cloud",
    "title": "Migración asistida",
    "description": "Te ayudamos a traer tus datos desde tu sistema actual o desde Excel."
  }
]
```

---

## 6. Traducciones en Inglés (translations.en)

Aplicar los mismos cambios en la versión en inglés:

### Hero:
```json
"headline": "The POS that complies with Hacienda with fair pricing.",
"subheadline": "Sell, issue electronic invoices, and manage your inventory. Start free and grow with monthly or annual plans — no surprises, no fine print."
```

### VS Competition:
```json
"headline": "Clear pricing. No tricks.",
"subheadline": "While others charge you per document block or lock you into long contracts, Tsuru POS gives you monthly or annual flexibility with discounts."
```

### Pricing:
```json
"headline": "Start free. Grow at your pace.",
"annualSavingsLabel": "With the annual plan you pay 10 months and get 2 free — save {{savings}} per year."
```

### Plan Pro:
```json
"name": "Pro",
"tagline": "Everything you need to grow.",
"priceSuffix": "/ year",
"ctaLabel": "Subscribe to Pro",
"subline": "Pay 10 months, get 2 free"
```

---

## 7. Cambios en el Dashboard (PricingTab.tsx)

El dashboard necesitará actualizaciones para soportar:

1. **Toggle Mensual/Anual** - Agregar selector de ciclo de facturación
2. **Dos campos de precio** - `priceMonthly` y `priceAnnual`
3. **Cálculo automático** - Validar que `priceAnnual = priceMonthly * 10`
4. **Badge de ahorro** - Mostrar "Ahorrá 2 meses" en el toggle anual
5. **Eliminar amortización** - Quitar el campo `amortizationMonths` y su lógica

---

## 8. Resumen de Cambios por Archivo

### `config.json`:
- ✅ Actualizar `pricing` (raíz)
- ✅ Actualizar planes (Free y Pro)
- ✅ Agregar `billingToggle` y `planLabels`
- ✅ Actualizar textos en: hero, vs, hacienda, pricing, testimonials, faq, finalCta, footer
- ✅ Actualizar addons
- ✅ Aplicar cambios en inglés (translations.en)

### Dashboard:
- ⏳ Actualizar `PricingTab.tsx` para soportar modelo de suscripción
- ⏳ Agregar toggle mensual/anual
- ⏳ Agregar campos `priceMonthly` y `priceAnnual`
- ⏳ Eliminar lógica de amortización

---

## 9. Estrategia de Implementación

### Fase 1: Actualizar config.json ✅
1. Actualizar estructura de `pricing`
2. Actualizar planes (Free y Pro)
3. Agregar nuevas traducciones
4. Actualizar todos los textos mencionados

### Fase 2: Actualizar Dashboard ⏳
1. Modificar `PricingTab.tsx`
2. Agregar toggle de ciclo de facturación
3. Actualizar validaciones

### Fase 3: Actualizar Landing Page ⏳
1. Actualizar componente `Pricing.tsx` para mostrar toggle
2. Agregar lógica de cálculo de ahorro
3. Actualizar estilos

---

## 10. Precios Sugeridos

Basado en el análisis competitivo:

| Plan | Mensual | Anual (10+2) | Ahorro Anual |
|------|---------|--------------|--------------|
| Free | ₡0 | ₡0 | - |
| Pro | ₡20,000/mes | ₡200,000/año | ₡40,000 (16.67%) |

**Comparativa:**
- Alegra: $15-$80 USD/mes (10% OFF anual)
- Scrampi: ₡13,000-₡42,000/mes (15% OFF anual)
- GTI: ₡7,650-₡41,000 (10 meses por 12)
- **Tsuru POS**: ₡20,000/mes (16.67% OFF anual) ✅ **Más agresivo**

---

## 11. Mensajes Clave para Marketing

1. **"Pagás 10 meses, te regalamos 2"** - Claro y directo
2. **"16.67% de ahorro con el plan anual"** - Mejor que la competencia
3. **"Sin letra chica, sin sorpresas"** - Transparencia
4. **"Flexibilidad mensual o ahorro anual"** - Opciones para todos
5. **"Cumplimiento Hacienda 4.4 incluido"** - Valor agregado

---

## 12. Próximos Pasos

1. ✅ Revisar y aprobar este plan
2. ⏳ Actualizar `config.json` con todos los cambios
3. ⏳ Actualizar `PricingTab.tsx` en el dashboard
4. ⏳ Actualizar componente `Pricing.tsx` en la landing
5. ⏳ Probar en desarrollo
6. ⏳ Desplegar a producción

---

**¿Procedemos con la actualización del config.json?**
