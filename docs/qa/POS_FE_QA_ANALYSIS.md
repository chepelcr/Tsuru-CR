# Análisis de Producto — Tsuru POS Frontend (`fe/pos-system`)

> **Documento de preparación para QA.** Inventario funcional completo del frontend del POS
> con descripción, estado de implementación, incidencia (TSR-###) y bugs/riesgos conocidos,
> para saber qué está completamente implementado y qué falta antes del ciclo de QA.
>
> - **Fecha del análisis:** 2026-07-09 · **Commit analizado:** `65f2ca9` (rama `main`, sincronizada con remoto)
> - **Repo:** [`chepelcr/tsuru-pos-system`](https://github.com/chepelcr/tsuru-pos-system) · **Despliegue:** `https://app.tsuru.jcampos.dev` (GitHub Pages)
> - **Fuentes:** código de `fe/pos-system/src/`, `TASKS.md` y `docs/migration/01–06` del repo, y `docs/roadmap/tsuru_roadmap.md` (tablero TSR)
> - **Gemelo en Excel:** `docs/qa/POS_FE_QA_ANALYSIS.xlsx` (una hoja por módulo). **Regla:** todo cambio a este
>   documento debe regenerar el Excel en la misma sesión (script: `docs/qa/generate_pos_qa_xlsx.py`).

---

## 1. Resumen ejecutivo

**Qué es la app:** Tsuru POS es el punto de venta + facturación electrónica de Costa Rica
(Hacienda v4.4) y, tras la migración del dashboard admin (TSR-091), también la **superficie
única de administración**: organizaciones, miembros/roles RBAC, productos, clientes B2B,
pedidos, CMS del storefront y despliegues.

**Stack:** React 18.3 + TypeScript 5.6 + Vite 5.4, router `wouter`, TanStack Query v5,
Zustand (carrito), react-hook-form + zod, AWS Amplify (Cognito), Dexie (offline/IndexedDB),
Tailwind. Gestor de paquetes: **pnpm**.

**Backends consumidos (3 bases + 1 prefijo):**

| Cliente | Variable | Dominio | Usos |
|---|---|---|---|
| `api` | `VITE_API_URL` | `api.tsuru.jcampos.dev` (management-be) | perfil, orgs, RBAC, CMS, plantillas, despliegues, media |
| `crossAppApi` / `ordersApi` | `VITE_ORDERS_API_URL` | `orders-api.tsuru.jcampos.dev` (store-be) | sesiones, puestos, dashboard, clientes, productos, categorías, catálogos `/api/data/*` |
| `salesApi` | `VITE_SALES_API_URL` | `sales-api.tsuru.jcampos.dev` (sales-be) | documentos electrónicos, validación ATV, XML, notificaciones |
| data-api | `VITE_DATA_API_URL` | `data-api.tsuru.jcampos.dev` (data-be) | catálogos Hacienda, tipo de cambio, versiones de documento |

**Estado global (resumen de la tabla maestra §3):**

| Estado | Módulos |
|---|---|
| ✅ Completo | Autenticación, Dashboard, POS/editor, Productos, Categorías, Clientes B2B, Sesiones/Puestos, Roles RBAC, Config. de organización, Perfil, **Motor fiscal (los 10 tipos de impuesto + cascada de descuentos)**, **Catálogos data-api (~45 hooks)** |
| 🟡 Parcial | Facturación electrónica (FE listo; Lambdas XML/notificación como stubs), Pedidos (mutaciones sin verificar), Programas (filtro BE pendiente), Reportes (analytics sin verificar), Referencias NC/ND (TSR-126) |
| ⚠️ Sin verificar | Confirmaciones (cross-docking), **CMS/Galería/Plantillas/Despliegues (riesgo más alto: endpoints "nunca ejercitados por el POS")** |
| ❌ Faltante / muerto | Cierre de caja (`ClosingFlow` sin montar), **Exoneraciones v4.4 (TSR-124)**, **Otros cargos v4.4 (TSR-125)**, páginas huérfanas (`AnalyticsPage`, `AssignmentsPage`, flujo `src/pages/pos/*`) |

**Señales duras del código:** 30 marcadores `TODO(verify-endpoint)`, 5 pruebas POS en 2 archivos
(TSR-097 en progreso), permisos RBAC en modo *fail-open* hasta el flip de enforcement (TSR-027).

---

## 2. Convenciones

**Estados:**

| Símbolo | Significado |
|---|---|
| ✅ Completo | Implementado en FE y conectado a un endpoint verificado en producción |
| 🟡 Parcial | Funciona el flujo principal, pero hay partes pendientes o dependencias BE incompletas |
| ⚠️ Sin verificar | FE implementado pero el contrato del endpoint **no está confirmado** (`TODO(verify-endpoint)`) — puede fallar en runtime |
| 🔒 Bloqueado por backend | FE listo; el backend correspondiente es stub o no existe |
| ❌ Faltante | No implementado, no accesible, o código muerto |

**Prioridad QA:** `Alta` (flujo fiscal/legal o riesgo alto de fallo), `Media`, `Baja`.

**Incidencias:** todas usan IDs `TSR-###` del tablero `docs/roadmap/tsuru_roadmap.md` §2.
Los hallazgos y actualizaciones de este análisis recibieron **TSR-119 … TSR-133** (ver §4). Nunca se
renumeran ni reutilizan IDs.

---

## 3. Tabla maestra por módulo

### 3.1 Autenticación y onboarding

Rutas: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/join/:token`, `/organizations/select`, `/organizations/new`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Login / Logout | Cognito vía Amplify (`AuthContext`); guarda `redirectAfterLogin` | ✅ | TSR-008 | Credenciales ya no se guardan en `sessionStorage`; se elimina cualquier valor legacy | Alta |
| Registro | Formulario multi-paso con ubicación estructurada (cascada CR), panel de historia Sibö/cacao (TSR-113) | ✅ | TSR-008 | Verificación usa `autoSignIn` de Amplify sin persistir el password | Alta |
| Verificación de email | OTP Cognito; requerida antes de entrar | ✅ | — | **SES en sandbox**: los correos solo llegan a direcciones verificadas (roadmap §7 paso 2) — bloqueará registro de testers nuevos | Alta |
| Recuperar / restablecer contraseña | Flujo Cognito completo | ✅ | — | — | Media |
| Invitaciones (`/join/:token`) | Aceptar invitación a organización | 🟡 | TSR-012 | El botón "Rechazar" es no-op; redirects `?redirect=` se pierden en algunos flujos | Media |
| Selección / creación de organización | `SelectOrganization`, `CreateOrganization` (onboarding) | ✅ | TSR-117 | Re-link de org por email tras el pool nuevo de Cognito ya resuelto (verificar en QA) | Media |

### 3.2 Dashboard (inicio)

Ruta: `/dashboard` (`DashboardPage.tsx`).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Widgets de inicio | `SalesChart`, `LiveStationsPanel`, `TopProductsPanel` con datos reales de `GET …/dashboard` | ✅ | — | — | Media |
| Acciones rápidas de documento | Crear factura/tiquete, ver documentos (gateadas por RBAC doc-type) | ✅ | TSR-109 | — | Media |
| Compartir QR | `QrShareModal` con URL del storefront | ✅ | — | — | Baja |

### 3.3 POS / Editor de documentos (punto de venta)

Ruta: `/dashboard/documents/new/:tabId` — el POS vive **dentro** del editor de documentos
(`POSIntegratedPage`); la ruta independiente `/dashboard/pos` fue retirada (redirect).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Carrito + catálogo | `ProductGrid`/`ProductsPanel`, `CartSidebar`, store Zustand persistido, sync offline (Dexie) | ✅ | — | **El carrito se comparte entre tabs de documento** (limitación conocida, TASKS.md T7.4-futuro) | Alta |
| Detalle de línea | `LineDetailDrawer` con impuestos Hacienda v4.4 (tipos 01–12/99, CABYS) y descuentos | ✅ | TSR-004 | El motor de impuestos TS es un espejo del de Python — deriva = facturas legalmente incorrectas (contract tests pendientes) | **Alta** |
| **6 tipos de documento** | FE (`01`), TE (`04`), NC (`03`), ND (`02`), FC (`08`), FExp (`09`) — cada uno con submódulo RBAC de creación propio (`documents/fe`…`fexp`), color e identidad de tab | ✅ | TSR-109 | Cajero restringido debe ver SOLO FE+TE en los 3 menús de creación | **Alta** |
| Checkout — sección Documento | Condición de venta (catálogo), actividad económica registrada de la org, plazo de crédito, moneda del documento | ✅ | TSR-006 | Auto-selecciona la primera actividad activa y bloquea el envío si la org no tiene una configurada | **Alta** |
| Checkout — sección Pagos | Pagos múltiples por venta: efectivo `01`, tarjeta `02`, cheque `03`, transferencia `04`, SINPE `06`, otro `99` (+texto libre) | ✅ | — | La regla `Σ pagos == total` NO se valida en BE (ver §3.19) — probar pagos que no cuadran | **Alta** |
| Checkout — sección Receptor | `ReceiverPicker` + borrador con cascada de ubicación CR (resuelve `neighborhood_id` → nombre) | ✅ | — | Receptor obligatorio según tipo de doc (FE sí, TE no) — probar la matriz | Alta |
| Checkout — Referencias y Copias | `ReferencesSection` (obligatoria para NC/ND) + `CopiesSection` (correos en copia) | 🟡 | TSR-126 | Referencias sin auditoría Nota 10/10.1 | **Alta** |
| Multi-moneda del documento | Precios base en CRC; con doc en USD/EUR las líneas y totales se dividen por `exchange_rate` (UI + payload) | ✅ | — | Redondeo tras la división — comparar totales FE vs BE en moneda extranjera | **Alta** |
| **Venta offline** | Persiste primero en IndexedDB, intenta POST inmediato y reenvía desde la app autenticada al reconectar/iniciar sesión | ✅ | **TSR-130** | Queue con estados/reintentos + token Cognito fresco; `Idempotency-Key` compartida con sales-be evita duplicados. Probar reconexión real y errores permanentes | **Alta** |
| Cierre de caja | `ClosingFlow.tsx` (450 líneas, backend con soporte completo) | ❌ | TSR-005 | Componente **nunca montado** — el ciclo de cajero no se puede cerrar desde la UI | **Alta** |
| Apertura de sesión / turno | Selección de sesión activa; turno server-side pendiente | 🟡 | TSR-005 | Turno server-side al iniciar sesión aún no implementado | Alta |

### 3.4 Facturación electrónica (Hacienda)

Ruta: `/dashboard/documents` (+ detalle). Hooks: `useSales`, `useGenerateXml`, `useXmlFiles`, `useInvoiceValidation`, `useValidationAction`, `useResendNotification`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Lista / detalle de documentos | Emitidos y recibidos, badges de estado ATV, "Pendiente" para PDF/XML nulos | ✅ | — | — | Alta |
| Emisión (pipeline completo) | clave/consecutivo → XML → firma XAdES → ATV → poll de validación → PDF → correo | 🟡 | TSR-001 | Pipeline BE vivo y maduro, pero el x-user-id del sales-api es **spoofable** (default `"anonymous"`) — atribución de auditoría en documentos legales | **Alta** |
| Regenerar XML / reenviar notificación | `DocumentActionModal`: ver PDF, descargar, validación, reenviar correo, aceptar/rechazar | 🔒 | TSR-009 | Los dos endpoints jbiller son **stubs** (regenerate XML, resend notification) — el botón existe pero el BE no hace nada real | **Alta** |
| Aceptación de doc. recibidos | Aceptar / aceptación parcial / rechazar con envío a Hacienda | ✅ | TSR-119 | Acciones y estados traducidos ES/EN | Alta |
| Búsqueda compleja / filtros | `ComplexSearchModal`, `DocumentTypesFilter`, filtros de fechas/tipos/montos | 🟡 | — | Contrato de filtros del sales-api **WIP**: el FE envía filtros que el parser BE aún no soporta (p. ej. rangos de totales); comentado en `ComplexSearchModal.tsx:12` | Alta |
| Credenciales fiscales de la org | Configuración P12/PIN/ATV (tarjeta Hacienda en org-settings) | ✅ | TSR-002, TSR-003 | **Crítico (legal):** credenciales en texto plano en BD y retornadas por GET; realm OAuth de Hacienda hardcodeado a staging (`rut-stag`) | **Alta** |

### 3.5 Productos e inventario

Rutas: `/dashboard/products`, `/dashboard/products/:productId`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| CRUD de productos | `ProductDrawerForm` con 11 secciones fiscales (CABYS, IVA, otros impuestos, descuentos, empaques, inventario) | ✅ | — | Verificar que el form usa el mismo `TaxCalculationService` que `LineDetailDrawer` (TASKS.md T7.3 pendiente) | Alta |
| Importación Excel/CSV | `ProductExcelUpload` carga masiva | ⚠️ | — | `TODO(verify-endpoint)` en `ProductExcelUpload.tsx:95` | Media |
| Acciones masivas | `ProductBulkBar`: activar/desactivar + seleccionar todo | ✅ | — | — | Media |

### 3.6 Categorías

Ruta: `/dashboard/categories`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| CRUD de categorías | Página standalone con drawer (antes solo dropdown de lectura) | ✅ | — | Escrituras (POST/PUT/DELETE) con `TODO(verify-endpoint)` en `useCategories.ts` | Media |

### 3.7 Clientes (B2B)

Rutas: `/dashboard/clients`, `/dashboard/clients/:clientId`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| CRUD de clientes | Lista + detalle con tabs Resumen/Pedidos/Tiendas/Departamentos, notas, WhatsApp | ✅ | — | — | Media |
| Tiendas y departamentos | `ClientStoresList`, `ClientDepartmentsList` (capa B2B) | ⚠️ | — | `useStores.ts` y `useDepartments.ts` completos con `TODO(verify-endpoint)` | Media |
| Historial de pedidos | `ClientOrderHistory` real | ⚠️ | — | `useClientOrders.ts` sigue sin verificar; llaves muertas `clients.orders.comingSoon*` eliminadas | Media |

### 3.8 Pedidos

Rutas: `/dashboard/orders`, `/dashboard/orders/:orderId`. Son **pedidos B2B/marketplace**
(cross-app-be), distintos de los documentos electrónicos del POS. Máquina de estados:
`pending → processing → shipped → delivered / cancelled` (el BE recibe códigos numéricos 1–5).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Lista con búsqueda y paginación | `OrdersPage` con término de búsqueda + paginación normalizada (tolera snake_case y camelCase del BE) | ✅ | — | — | Media |
| Filtros avanzados | `OrdersFiltersModal`: multi-estado (default excluye entregados+cancelados), doble rango de fechas (entrega y creación), ordenamiento de 6 vías | 🟡 | TSR-013 | El hook compone un string compuesto `search` — `TODO(verify-endpoint)`: sin confirmar que el BE lo parsee (`useOrders.ts:121`) | **Alta** |
| Detalle del pedido | `OrderDetailPage` (639 líneas): timeline de estados, líneas, cliente/proveedor/envío, totales | ✅ | — | Fechas llegan como `DD/MM/YYYY` string — probar valores malformados | Media |
| Transiciones de estado | Avanzar/cancelar vía `PATCH /orders/{doc}` con código numérico | ⚠️ | TSR-013 | `TODO(verify-endpoint)`: el legacy usaba `PUT /orders/{doc}/status`, el POS usa PATCH — contrato sin confirmar (`useOrders.ts:174`) | **Alta** |
| Importación Excel de pedidos | `OrderExcelUpload` + `XlsxDropZone` → base64 `POST /orders/parse` | ⚠️ | TSR-013 | `TODO(verify-endpoint)` en el shape `{data, name, contentType}` (`useOrders.ts:209`) | **Alta** |
| Reprocesar pedido | `ReprocessDialog` + `ReportColorSelector` (esquemas de color del reporte) → `POST /orders/{doc}/reprocess {color}` | ⚠️ | TSR-013 | `TODO(verify-endpoint)` (`useOrders.ts:194`) | Alta |
| Cross-docking (pedidos tipo 73) | `CrossdockingUploadDialog` (Excel+color) → `POST /orders/{doc}/crossdocking/parse`; `CrossdockingSummaries` (ítems/cajas/puntos de venta); `CrossdockingPDFPreview` (iframe) | ⚠️ | TSR-013 | `TODO(verify-endpoint)` (`useOrders.ts:226`); el tipo de pedido `73` es un código mágico del dominio | **Alta** |
| Adjuntos del pedido | Descargas: PDF del pedido, Excel original, "nuevo reporte" | ✅ | — | Probar adjuntos nulos (pedido sin reprocesar) | Media |

### 3.9 Confirmaciones (cross-docking)

Rutas: `/dashboard/confirmations`, `/dashboard/confirmations/:confirmationNumber`. Agrupan
pedidos para entrega consolidada. **Todo el hook `useConfirmations.ts` está marcado
`TODO(verify-endpoint)`** — módulo completo sin contrato BE confirmado.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Lista / detalle | `ConfirmationsPage` + `ConfirmationDetailPage` (`ConfirmationCard`) | ⚠️ | TSR-013 | Contratos sin confirmar (archivo completo) | **Alta** |
| Crear confirmación | `CreateConfirmationDialog` + `OrderMultiPicker` (selección múltiple de pedidos) | ⚠️ | TSR-013 | — | **Alta** |
| Agregar pedidos a confirmación | `AddOrdersDialog` → PUT | ⚠️ | TSR-013 | — | Alta |
| Cambiar estado de confirmación | Reusa la máquina de estados de pedidos | ⚠️ | TSR-013 | — | Alta |
| Quitar pedido de confirmación | DELETE (tolera respuesta 204 vacía) | ⚠️ | TSR-013 | — | Alta |
| Correos de entrega | Notificación por cliente al confirmar | 🔒 | TSR-013 | BE con branding "Modas Laura" y `EMAIL_RECIPIENT` estático hardcodeados (`email_service.py`) | **Alta** |

### 3.10 Reportes

Ruta: `/dashboard/reports` (`ReportePage.tsx`).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Reportes de sesión/ventas | Reporte básico por sesión | ✅ | — | — | Media |
| Analytics | Consumidores de `orgPath('/analytics')` existen | ⚠️ | TSR-014 | Endpoints de analytics en markets-api "sin verificar" | Media |

### 3.11 Sesiones y puestos

Rutas: `/dashboard/sessions`, `/dashboard/stations`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Sesiones | `SessionsPage` + `SessionConfig` (creación multi-paso) | ✅ | — | Tormenta de refetch ya corregida (cache 5 min) — verificar que no regresó | Media |
| Puestos (sucursales/terminales) | `PuestosPage`, catálogo de tipos de sucursal | ✅ | TSR-139 | Catálogo `branch_types` implementado en store-be (4 rutas); el TODO de `useBranchTypes` quedó obsoleto. Las sucursales se direccionan por `code` entero, no UUID (TSR-149) | Baja |
| Aprobación de cierres | Autorización de cierre de caja | 🔒 | TSR-010 | `is_manager` default `True` en BE ("backward compatibility") — cualquier usuario aprueba cierres | Alta |

### 3.12 Miembros y roles (RBAC)

Rutas: `/dashboard/members`, `/dashboard/roles`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Gestión de miembros | Invitar, asignar rol, remover | ✅ | TSR-024 | — | Media |
| Roles y matriz de permisos | `RolesPage` + `RoleDrawerForm` + `PermissionMatrix` org-scoped; catálogo espejo 1:1 del sidebar | ✅ | TSR-037 | — | Media |
| Gating de acciones en toda la app | 133 elementos accionables gateados (hide-not-disable) + nav + doc-types + org-settings por tarjeta | ✅ | TSR-110, TSR-038, TSR-109, TSR-107 | **`usePermissions()` es fail-open** mientras `RBAC_ENFORCEMENT=log` — el ocultamiento de permisos NO es confiable hasta el flip (TSR-027) | **Alta** |

### 3.13 Configuración de organización

Rutas: `/dashboard/organization` + 9 sub-páginas (general, branding, contacto, pago, envío, hacienda, notificaciones, info-fiscal, tema).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| 9 tarjetas de configuración | Hub + sub-páginas con RBAC por tarjeta; persistencia arreglada (falso "Pendiente" resuelto) | ✅ | TSR-107, TSR-108 | Endpoints puntuales de storefront-settings aún con `TODO(verify-endpoint)` (migración 05) | Media |
| Configuración Hacienda | Stepper de credenciales fiscales | ✅ | TSR-002 | Ver §3.4 — credenciales en claro (crítico legal) | **Alta** |
| Tema por organización | Persistencia en `organization_settings.theme` | ✅ | TSR-108 | — | Baja |

### 3.14 CMS / Storefront (contenido, galería, plantillas, despliegues)

Rutas: `/dashboard/content`, `/dashboard/gallery`, `/dashboard/templates`, `/dashboard/deployments`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Editor de contenido (CMS) | Páginas/secciones del storefront (`useCmsContent`) | ⚠️ | TSR-129 | **Riesgo más alto del QA**: la migración 04 lo marcó "el módulo más riesgoso"; endpoints nunca ejercitados por el POS | **Alta** |
| Galería de medios | Registro de media server-backed (`useMediaLibrary`) | 🟡 | — | Relativamente nuevo; probar subida/borrado | Media |
| Galería de plantillas | Aplicar plantilla vía `PUT …/organizations/{org}/template` idempotente (`{templateId, includeCategories}`; `null` = desasignar) | ✅ | — | Endpoint dedicado verificado (2026-06-13) | Media |
| Pipeline de publicación del POS | `useDeployments` (markets-api): pre-deployment `ready` → `POST /pre-deployments/{id}/publish` → historial con poll de 5s (`building/uploading/success/error`) | ⚠️ | **TSR-129** | *"None of these endpoints are currently exercised by POS"* (comentario en el hook) — y compite con el pipeline real de sitios org (fila siguiente): decidir cuál superficie el POS | **Alta** |
| **Despliegue real de sitios org (provisioner)** | Backend en sales-be (TSR-118 W2, **vivo desde 2026-07-03**): evento SNS `ORGANIZATION_REGISTERED`/`TEMPLATE_UPDATED` → espejo del bundle de la plantilla → `config.json {mode:live, orgId, templateId}` → sitio en `{subdomain}.stores.tsuru.jcampos.dev` | 🟡 | TSR-118, TSR-129 | **No tiene UI en el POS** (ni trigger ni visibilidad de estado); los bundles de ejemplo desplegados predatan W1/W4 — el sitio org renderiza el shell pero **no carga datos** hasta rebuild de plantillas con firma guest. QA E2E: registrar org → verificar sitio vivo → verificar datos | **Alta** |

### 3.15 Programas

Ruta: `/dashboard/programs` (gateada por plantilla + RBAC).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Programas (productos `type=program`) | Submódulo template-gated (TSR-118 W12) | 🟡 | TSR-118 | El filtro `type` puede no existir aún en BE; la página degrada a estado vacío | Media |

### 3.16 Perfil

Ruta: `/dashboard/profile`.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Editar perfil | Nombre/usuario (`PUT /api/users/{userId}/profile`); cambio de contraseña vía Cognito | ✅ | — | `useProfile.ts` con `TODO(verify-endpoint)` puntual | Baja |

### 3.17 Código huérfano / no accesible

| Elemento | Descripción | Estado | Incidencia (TSR) | Prioridad QA |
|---|---|---|---|---|
| `AnalyticsPage.tsx`, `AssignmentsPage.tsx` | Páginas admin presentes en `src/pages/dashboard/` pero **sin ruta ni import** — inaccesibles | ❌ | TSR-120 | Baja (decisión de producto: migrar o borrar) |
| Flujo de dispositivo `src/pages/pos/*` | SessionSetupScreen, InventoryOpening, PaymentScreen, SuccessScreen — documentado en CLAUDE.md §5 pero **no cableado en `Routes.tsx`** | ❌ | TSR-120 | Baja |
| `ClosingFlow.tsx` | 450 líneas de cierre de caja con BE listo, nunca montado | ❌ | TSR-005 | **Alta** (es funcionalidad faltante, no solo código muerto) |

### 3.18 Shell de la app y funcionalidades transversales

Funciones que cruzan todos los módulos: layout, notificaciones, offline, tema, idioma, exportes.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Sidebar + navegación | `DashboardSidebar` con secciones/ítems gateados por RBAC (`NAV_PERMISSION`), drawer móvil, toggle colapsable, rol org-scoped en el footer | ✅ | TSR-038, TSR-111 | — | Media |
| Campana de notificaciones | `NotificationsBell` + `NotificationsContext`: niveles info/warning/destructive, CTA, targeting por app, eventos silenciosos | 🟡 | **TSR-128** | **100% client-side**: estado en memoria (useState), se pierde al refrescar; el tipo `source:"be"` existe pero **ningún backend publica** — el servicio de notificaciones es futuro (`CATALOG_INVALIDATION_TODO.md`) | Media |
| Modo oscuro | `useDarkMode` (clase `dark` en `<html>`, variables CSS); toggle en `AuthNavbar` y `DashboardHeader` | ✅ | — | Recorrer páginas clave en dark — regla del repo: cero colores hardcodeados | Media |
| Cambio de idioma ES/EN | `useLanguageSwitch` en ambas superficies (auth + dashboard); ES default | ✅ | TSR-119 | Fugas conocidas de documentos corregidas; mantener recorrido EN en regresión | Alta |
| Offline / sincronización | Dexie v2 + `PendingSalesSyncBridge` autenticado; `SyncPill` muestra online/offline/syncing/pending/error | ✅ | **TSR-130** | El SW ya no reenvía ventas; validar reconexión, reinicio de app y aislamiento por usuario | **Alta** |
| Exportar CSV | Botón "CSV" en `ReportePage` (generación en navegador, sin deps) | ✅ | — | Verificar escape de comillas/comas y acentos (BOM) | Media |
| Exportar PDF | "Descargar PDF" en `ReportePage` (html2canvas + jsPDF, A4) | ✅ | — | Render de canvas en reportes largos (multi-página) | Media |
| **Impresión de ticket 80 mm** | Ticket generado en el **backend** (`ticket.html` → wkhtmltopdf 72 mm → S3), expuesto en `attachments.ticket_url` vía `POST /orders/{doc}/ticket`; botón en `OrderDetailPage` | ✅ | **TSR-127** | Se descartó imprimir desde el navegador: dos maquetadores para el mismo comprobante harían que una reimpresión dejara de coincidir con el original. Regenera a propósito para tomar el consecutivo/QR tras facturar. Faltan comandas por estación | Media |
| Paginación | Componente `Pagination` compartido (page size, totales) en todas las listas | ✅ | — | — | Baja |
| Estados de carga/error | Skeletons por página (sweep 2026-06-13), `ErrorBox`, `EmptyState`, `PageTransition` | ✅ | — | — | Baja |
| Responsive / móvil | Drawers móviles (nav, documentos), panel de notificaciones centrado (fix TSR-111), toolbar con container queries | ✅ | TSR-111, TSR-132 | Drawers/modales compartidos usan portal + stack de overlays; probar página scrolleada y overlays anidados | Media |
| Sesión y token | Amplify/Cognito maneja refresh de token; `getToken()` inyectado en los 4 clientes API | ✅ | — | Probar expiración de sesión larga (dejar la app abierta >1h y operar) | Media |

### 3.19 Motor fiscal — impuestos y descuentos (transversal)

Servicios puros en `src/services/` (`taxCalculationService.ts` 411 líneas, `discountCalculationService.ts`),
consumidos por `LineDetailDrawer` (carrito), `ProductDrawerForm` (productos) y el preview de totales.
Enums Hacienda centralizados en `src/lib/enums/hacienda.ts` (nunca literales `'01'`). Mapa
spec-vs-implementación: `CALCULATION_AUDIT.md` del repo POS.

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| **Los 10 tipos de impuesto** | `01` IVA, `02` ISC, `03` IUC, `04` ISEBA, `05` ISEBEC, `06` IPT, `07` IVACE, `08` IVARBU, `12` ISEC (5% fijo), `99` Otros — cada uno con su fórmula propia | ✅ | TSR-004 | Motor TS espejo del Python sin contract tests — deriva = facturas incorrectas | **Alta** |
| IVACE (07) base manual | Base imponible manual con validador `base_amount ≥ subtotal tras descuento` (`IvaTaxSection`) | ✅ | — | — | Alta |
| IVARBU (08) por factor | `factor × subtotal` (catálogo de factores) | ✅ | — | — | Alta |
| Impuestos de monto específico (03/04/05/06) | Requieren `tax_amount_id` + `quantity` (+ `percentage`/`volume_consumption`); montos del catálogo `useAllTaxAmounts`, aplanados a `TaxAmountsById` | ✅ | — | Dos rutas de resolución (monto inline al seleccionar vs catálogo) — probar ambas | **Alta** |
| ISEBEC (05) por prefijo CABYS | `3401*` (alcohólicas: tarifa por % alcohol) vs `2202*` (no alcohólicas: monto manual, fórmula con `volume_consumption`) | ✅ | — | Branching por prefijo CABYS — caso de borde clave | **Alta** |
| Impuesto asumido por fábrica | Routing de ISEC/IUC vía flag `has_factory_tax`; otros especiales vía config estática; IVA absorbido con descuentos 01/03 (Nota 20) | ✅ | — | Lógica más compleja del motor — matriz de casos obligatoria | **Alta** |
| IVA sobre base original | Descuentos 01/03 (regalía/bonif.) y 02 (IVA-al-cliente) calculan IVA sobre el subtotal PRE-descuento; facturas de exportación igual | ✅ | — | — | **Alta** |
| CABYS → IVA automático | `useCabysSearch` retorna `tax_rate.percentage` que se auto-aplica al seleccionar | ✅ | — | — | Alta |
| **Cascada de descuentos secuencial** | Hasta 5 descuentos aplicados en cascada al remanente (NO suma de porcentajes — el BE rechaza payloads naive); monto absoluto gana sobre porcentaje; clamp a [0, remanente] | ✅ | — | — | **Alta** |
| Tipos de descuento 01/02/03/99 | Regalía (01), Regalía-IVA-al-cliente (02), Bonificación (03), Otro (99 — exige `reason`, error `REASON_REQUIRED` inline) | ✅ | — | Nota: el CLAUDE.md del repo aún documenta el código de error viejo `NATURE_DISCOUNT_REQUIRED` (drift doc-vs-código) | Alta |
| **Exoneraciones** | Bloque `Exoneracion` de v4.4 (tipo doc 01–11, tarifa exonerada, monto) | ❌ | **TSR-124** | **No existe en el form de línea**; campos de exención del producto llegan en tipos pero **sin UI de edición**; hooks `useAllExemptions`/`useExemptionValidation`/`useAllExemptionIssuingInstitutions` existen y están **sin usar** | **Alta** |
| **Otros cargos (documento)** | Bloque `OtherCharges` v4.4 (códigos 01–10/99, hasta 15 por documento; 04 exige tercero) | ❌ | **TSR-125** | No implementado en FE ni en BE de ventas; `useAllOtherCharges` sin usar | **Alta** |
| Referencias (NC/ND) | `ReferencesSection` en checkout con catálogos `useAllReferenceCodes`/`useAllReferences` | 🟡 | **TSR-126** | CALCULATION_AUDIT lo marca "parcial — pendiente auditoría vs Nota 10/10.1" (cobertura de códigos + `Razon` obligatoria) | **Alta** |
| Suma de medios de pago | Regla `Σ MedioPago == TotalComprobante` | 🔒 | — | No se aplica en el BE de ventas (CALCULATION_AUDIT §4, fuera de alcance del repo POS) — QA debe probar pagos que no cuadran | Alta |
| Redondeo | Decimal(18,5), round-half-up en el 6º dígito según spec | ⚠️ | TSR-004 | El FE opera en float de JS; verificar contra totales del BE (los contract tests de TSR-004 son la mitigación) | **Alta** |

### 3.20 Catálogos data-api (servicios de datos por módulo)

Capa de catálogos Hacienda: **~45 hooks** en `src/hooks/useDataApi.ts` sobre `src/services/data-api/`
(35 DTOs). `DocumentVersionContext` auto-inyecta `document_version_id` (v4.4) en las llamadas que lo
requieren; `DocumentCurrencyContext` + `ExchangeRateContext` manejan multi-moneda (CRC/USD/EUR) en
carrito, checkout y recibo. **El fix `65f2ca9` (2026-07-03) restauró justo esta capa** (la URL default
de data-api no resolvía — tipo de cambio, versiones de documento y todos los catálogos caían).

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Catálogos fiscales en línea/producto | `useAllTaxes/TaxRates/TaxFactors/TaxAmounts/DiscountTypes/FactoryTaxCharges/CabysSearch/MeasurementUnits/ProductTypes` → `LineDetailDrawer`, `TaxesTab`, `IvaTaxSection`, `OtherTaxSection`, `FiscalInfo*`, `ProductDrawerForm` y sus sections | ✅ | — | Si data-api cae, el form fiscal queda sin opciones — probar estados de error/carga | **Alta** |
| Catálogos de checkout | `useAllSaleConditions` (DocumentSection), `useAllPayments` (PaymentSection), `useAllReferenceCodes/References` (ReferencesSection), `useAllCurrencies` (moneda del documento) | ✅ | — | — | Alta |
| Catálogos de clientes | `useAllIdentifications/Countries/CustomerTypes` en `ClientFormBody`/`IdentitySection`; cascada de ubicación CR `useStates/Counties/Districts/Neighborhoods` | ✅ | — | — | Media |
| Catálogos de org registrada (Hacienda) | `useTaxpayerInfo` + `useAllIdentifications/Countries` en `HaciendaInfoStep` (consulta de contribuyente real) | ✅ | — | — | Alta |
| Tipo de cambio | `useExchangeRates` → `ExchangeRateContext`; conversión en ProductGrid, CartRow/Sidebar/LineEditor, Receipt, CheckoutDrawer | ✅ | — | Roto hasta `65f2ca9` por URL default; verificar ₡/USD/EUR en cada superficie | **Alta** |
| Versiones de documento | `useAllDocumentVersions` → `DocumentVersionContext` (v4.4); auto-inyección del param | ✅ | — | No pasar `document_version_id` manualmente (regla del repo) | Media |
| **Cache agresivo de catálogos** | `staleTime: 24h`, `gcTime: 7d`, persistido a `localStorage` (`pos-system-rq-cache`, maxAge 7d) | ✅ | — | **Un cambio de catálogo en Hacienda puede tardar hasta 7 días en reflejarse**: el feed de invalidación (`useCatalogInvalidationFeed`, eventos `catalogs.updated`) está montado pero el **servicio BE de notificaciones que lo alimenta no existe aún** (`docs/CATALOG_INVALIDATION_TODO.md`) | **Alta** |
| Catálogos sin consumidor | `useAllExemptions`+`useExemptionValidation` (TSR-124), `useAllOtherCharges` (TSR-125), `useAllDocumentTypes`, `useAllPharmaceuticalForms`, `useAllRegimes`, `useAllNationalTaxpayerCompanies`, `useAllNotificationCodes`, `useAllTransactions`, `useAllTaxConditions`, `useAllTaxRateCodes`, `useDollarRate/useEuroRate` | ❌ | TSR-124, TSR-125 | Actividades económicas ya se obtienen de la organización registrada; los demás hooks siguen sin UI | Media |

---

### 3.21 Tipos de negocio y verticales (TSR-150…164)

| Funcionalidad | Descripción | Estado | Incidencia (TSR) | Bugs / Riesgos | Prioridad QA |
|---|---|---|---|---|---|
| Tipo de negocio | 9 tipos + 2 toggles independientes (`is_retail_supplier`, `is_pyme`); el BE escribe `organization_modules` | ✅ | TSR-150 | Los toggles NO son tipos: un minisúper puede ser PYME *y* proveedor de cadena | Alta |
| Gating de verticales | `useBusinessType` lee la lista de módulos y **falla cerrado** | ✅ | TSR-150 | No usa `hasModule()`: ese falla *abierto* y auto-concede al owner — correcto para un permiso, incorrecto para un vertical | Alta |
| Onboarding progresivo | Paso 1 del asistente se revela en beats (nombre → tipo → toggles → resumen) | ✅ | TSR-150 | El resumen se deriva de `BUSINESS_TYPE_MODULES`, no de copy fijo, para que no mienta | Media |
| Pedido manual — 2 tarjetas | Documento **ausente** (no colapsado); Pago eliminado; toggle de proforma; número editable | ✅ | TSR-151 | Punto de entrega sin texto libre: punto registrado / dirección del receptor / cascada CR | Alta |
| Endpoint de pedidos manuales | `POST /orders` discriminado por `source`; totales recalculados; `Idempotency-Key` | ✅ | TSR-152 | El cuerpo del storefront (sin `source`) sigue validando igual — verificado | Alta |
| `SelectField` | Listbox propio, teclado + ARIA; 32 archivos convertidos sin tocar handlers | ✅ | TSR-153 | Un `<option>` nativo no se puede estilizar; el popup lo dibuja el SO | Media |
| Menú "Más" de pagos | Bug de capas CSS: `.dropdown-menu` fuera de `@layer` ganaba a las utilities | ✅ | TSR-153 | Verificado en el CSS compilado | Alta |
| Mesas / cuentas abiertas | Full-stack; una cuenta de bar **es** una mesa dinámica | ✅ | TSR-154/158 | Direccionadas por `branch_code` entero (TSR-149) | Media |
| Combos | Explotan en componentes al agregar al carrito | ✅ | TSR-154 | Un combo con 13% y exento **no puede ser una línea plana** en un comprobante fiscal | **Alta** |
| Servicio 10% | Línea propia, nunca recargo sobre el total | ✅ | TSR-154 | Se excluye de su propia base o se compone en cada recálculo | Alta |
| Cuenta dividida | Por línea o en partes iguales; N documentos | ✅ | TSR-154 | `sharesReconcile` verifica que las partes sumen la cuenta original | Alta |
| Búsqueda por código | **Sin gate** — cualquier organización | ✅ | TSR-155 | Verificado contra datos reales de dev; funciona sin conexión | Alta |
| Código de balanza | Peso/precio embebido en EAN-13, parametrizable | ✅ | TSR-155 | El layout no está estandarizado: cada tienda configura su balanza | Media |
| Proformas | Estado `quote`, no un tipo de documento | ✅ | TSR-156 | Guarda bloquea `quote → delivered`: una cotización sin aprobar no debe facturarse | **Alta** |
| Puntos de venta manuales | CRUD junto al importador de Excel | ✅ | TSR-157 | Totales derivados; sobre-asignar devuelve 422 nombrando la línea | Media |
| Happy hour | Ventanas que cruzan medianoche; nunca sube el precio | ✅ | TSR-158 | El servidor re-resuelve al enviar: el reloj del cliente no fija precios fiscales | **Alta** |
| Lotes / FEFO | Primero el que vence, no el que llegó | ✅ | TSR-159 | Stock sin fecha va al final; `0` días = vence hoy | Media |
| Facturación recurrente | Cadencia con recorte de mes | ✅ | TSR-160 | Genera **borrador**, nunca transmite; falta EventBridge | Media |
| Unidades con conversión | Stock en rollos, venta por metro | ✅ | TSR-161 | Factor 0 rechazado; `price_override` gana | Baja |
| Agenda | Un módulo, dos verticales (salón y taller) | ✅ | TSR-162 | `asset_id` nullable: el salón agenda una persona, el taller persona + vehículo | Media |
| Órdenes de trabajo | `PM` con `order_type='work_order'` | ✅ | TSR-163 | No es una entidad nueva; `client_assets` sí, para historial por activo | Media |
| Importación Excel estructurada | Descuento `07 Comercial` + impuestos del producto | ✅ | TSR-152 | Sólo 01/03 desvían IVA a fábrica; 07 debe seguir siendo rebaja de precio | **Alta** |
| Ferias | **Fuera del selector** a propósito | ❌ | TSR-164 | Es agrupación multi-organización, no un tipo de negocio | Baja |


## 4. Hallazgos nuevos de este análisis (TSR nuevos)

Registrados en el tablero `docs/roadmap/tsuru_roadmap.md` §2 en esta sesión:

| TSR | Hallazgo | Detalle / evidencia | Severidad |
|---|---|---|---|
| **TSR-119** | Fugas de i18n: español hardcodeado en componentes de documentos | **Resuelto 2026-08-06:** acciones, estados, filtros y ordenamiento usan llaves ES/EN; llaves muertas `clients.orders.comingSoon*` eliminadas | Media |
| **TSR-120** | Páginas huérfanas sin decisión de producto | `AnalyticsPage.tsx` y `AssignmentsPage.tsx` sin ruta; flujo cajero `src/pages/pos/*` sin cablear. Decidir: migrar a rutas o eliminar | Baja |
| **TSR-121** | Higiene de repo: `.env.example` y README obsoletos | `.env.example` aún apunta a `markets-api.jcampos.dev`/`orders-api.jcampos.dev` (dominios muertos pre-rebrand) y nombra "JMarkets POS"; `README.md` es boilerplate npm en un repo pnpm | Baja |
| **TSR-122** | Carrito compartido entre tabs de documento | El estado del carrito no se persiste/restaura por tab (TASKS.md T7.4-futuro); editar dos documentos en paralelo mezcla líneas | Media |
| **TSR-123** | Este documento de análisis QA (md + xlsx) | Entregable de preparación de QA — Done | — |
| **TSR-124** | Exoneraciones v4.4 sin UI | El bloque `Exoneracion` (tipo doc 01–11, tarifa, monto) no existe en el form de línea; los campos de exención del producto tienen round-trip de tipos pero sin editor (CALCULATION_AUDIT gap #8); hooks `useAllExemptions`/`useExemptionValidation`/`useAllExemptionIssuingInstitutions` sin usar | Alta |
| **TSR-125** | Otros cargos (documento) no implementado | Bloque `OtherCharges` v4.4 (códigos 01–10/99, hasta 15/doc) ausente en FE y en el BE de ventas; `useAllOtherCharges` sin usar; además `Σ MedioPago == TotalComprobante` no se valida en BE | Alta |
| **TSR-126** | Referencias NC/ND parciales | `ReferencesSection` sin auditoría contra Nota 10/10.1 (cobertura completa de `ReferenceCode` + `Razon` obligatoria) — riesgo de notas de crédito/débito rechazadas | Alta |
| **TSR-127** | Impresión de recibo de venta inalcanzable | `PRINT_RECEIPT.md` referencia `src/pages/pos/POSPage.tsx`, archivo que ya no existe; el único `window.print` vive en `ReportePage`; `Receipt.tsx` del checkout no tiene botón de impresión — un POS que no imprime recibos | Alta |
| **TSR-128** | Notificaciones sin backend ni persistencia | `NotificationsContext` es 100% client-side (useState) — se pierde al refrescar; el tipo `source:"be"` existe pero nada lo publica; bloquea también el feed de invalidación de catálogos (`useCatalogInvalidationFeed`) | Media |
| **TSR-129** | Dos pipelines de despliegue sin reconciliar | El POS surfacea el pipeline markets-api (`pre-deployments`→publish→history), nunca ejercitado; el despliegue REAL de sitios org es el provisioner de sales-be (TSR-118 W2, vivo), sin UI en el POS. Decidir cuál superficie el POS y verificar/retirar el otro | Alta |
| **TSR-130** | **Replay de ventas offline roto** | **Resuelto 2026-08-06:** replay autenticado en primer plano con token fresco, queue Dexie v2, estados/reintentos, aislamiento por usuario e idempotencia org-scoped en sales-be | **Alta** |
| **TSR-131** | Recibo de checkout perdía sus totales y el tab se cerraba antes de mostrar el resultado | **Resuelto 2026-08-06:** snapshot previo al clear, recibo confirmado/encolado persistente y cierre del tab únicamente al iniciar “Nueva venta” | Alta |
| **TSR-132** | Drawers/modales ocultos o recortados por scroll/transform del contenido | **Resuelto 2026-08-06:** portal al body, overlay stack, body lock con ref-count, Escape/backdrop topmost, focus trap/restoration, semántica dialog y `100dvh`; 3 tests de regresión | Alta |
| **TSR-133** | Bundle principal del POS supera 500 KB | Build 2026-08-06: ~1.49 MB minificado / ~365 KB gzip. Separar rutas/chunks en un trabajo de performance independiente | Media |

**Deuda ya registrada que QA debe conocer (no duplicada aquí):** TSR-097 (cobertura POS iniciada,
5 pruebas; faltan flujos), TSR-133 (code splitting), TSR-002/003/004/007 (deuda fiscal/seguridad,
ver §5). TSR-008 y TSR-011 quedaron resueltos el 2026-08-06.

---

## 5. Deuda crítica de seguridad/fiscal (contexto obligatorio para QA)

Del roadmap §6 (riesgos abiertos) — no son bugs de UI, pero condicionan qué puede validarse:

| Riesgo | Descripción | TSR | Severidad |
|---|---|---|---|
| **R1** | Credenciales fiscales (certificados P12, PINes, passwords ATV) en texto plano en Postgres y retornadas por GET; realm OAuth de Hacienda hardcodeado a staging | TSR-002, TSR-003 | **Crítica (legal)** |
| **R2** | Verdad fiscal duplicada: dos asignadores de consecutivo, tres motores de impuestos (incluido el espejo TS del POS) sincronizados "por convención" — deriva = facturas legalmente incorrectas | TSR-004 | **Crítica (legal)** |
| **R3** | El gateway de markets-api no valida `userId↔sub`; el RBAC nuevo confía en una validación que no existe | TSR-029 | **Crítica (seguridad)** |
| **R4** | Los servicios Python (sales/orders/data-api) no tienen checks de membresía; documentos fiscales y credenciales ATV expuestos | TSR-030, TSR-031 | **Crítica (seguridad)** |

---

## 6. Plan de QA sugerido (orden de prioridad)

1. **Round-trip de facturación** (§3.4): emitir FE/TE reales contra ATV staging, verificar XML,
   PDF, correo, y los botones de regenerar/reenviar (esperado: stubs — documentar el fallo con TSR-009).
2. **Matriz fiscal de variantes** (§3.19): un caso de prueba por tipo de impuesto (los 10 códigos),
   incluyendo: ISEBEC con CABYS `3401*` y `2202*`, IVACE con base manual inválida (< subtotal),
   IVARBU por factor, montos específicos por las DOS rutas (inline vs catálogo), impuesto asumido
   por fábrica (ISEC/IUC con y sin flag), cascada de 2+ descuentos combinando 01/02/03/99, y
   comparar **cada total del FE contra el total que persiste el BE** (detecta la deriva TSR-004).
   Documentar como faltantes esperados: exoneraciones (TSR-124) y otros cargos (TSR-125).
3. **CMS / Plantillas / Despliegues** (§3.14): ejercitar TODOS los endpoints por primera vez
   desde el POS; alta probabilidad de contratos rotos.
4. **Pedidos y confirmaciones** (§3.8–3.9): transiciones de estado, reprocesar, cross-docking —
   los 5 endpoints `TODO(verify-endpoint)` más críticos.
5. **Búsqueda compleja de documentos** (§3.4): filtros de fechas/tipos/montos contra el contrato WIP del sales-api.
6. **Catálogos y multi-moneda** (§3.20): tipo de cambio en carrito/checkout/recibo (CRC/USD/EUR);
   comportamiento con data-api caído; y el riesgo de cache de 7 días sin feed de invalidación.
7. **Modo inglés** (§4 TSR-119): regresión de documentos/filtros/modales en EN; los leaks conocidos ya fueron corregidos.
8. **RBAC** (§3.12): con un rol restringido (cajero), verificar el gating de los 133 elementos;
   repetir tras el flip a `enforce` (TSR-027, roadmap §7 paso 4).
9. **Cierre de caja** (§3.3): confirmar que NO existe en la UI (TSR-005) — no es un bug de QA, es faltante conocido.
10. **Multi-tab / carrito** (§4 TSR-122): dos tabs de documento en paralelo — documentar la mezcla de carrito.
11. **Venta offline** (§3.3 TSR-130): vender en modo avión, comprobar recibo “guardada sin conexión”,
    cerrar/abrir la app y reconectar con sesión activa; verificar una sola venta en BE, estado `synced`
    en IndexedDB, aislamiento por usuario e inventario sin descuento ante un rechazo permanente.
12. **Despliegue de sitio org E2E** (§3.14 TSR-129/TSR-118): registrar una org → aplicar plantilla →
    verificar `{subdomain}.stores.tsuru.jcampos.dev` vivo → verificar que carga DATOS (no solo el shell).

**Prerrequisitos de ambiente para QA:** cuenta de correo verificada en SES (sandbox — roadmap
§7 paso 2) o solicitar acceso de producción SES; usuario con rol admin y usuario con rol
cajero en una org de prueba; credenciales ATV de staging.
