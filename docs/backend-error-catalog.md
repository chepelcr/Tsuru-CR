# Backend error catalog

> Generated from the current service error enums. Do not hand-edit the tables below; run `python3 scripts/generate_backend_error_catalog.py`.

Every backend error response uses `message` as a stable code. The admin control plane resolves human copy by `(service, message)` through `GET /api/admin/error-catalog`. `COMMON_*` codes fall back to the `common` service. Legacy numeric codes are service-scoped and are not globally unique.

## Common response DTO

```json
{"timestamp":"2026-09-16T12:00:00Z","status":404,"error":"Not Found","message":"COMMON_404","service":"store-api","path":"/api/orders/123","details":[{"path":"body.email","type":"invalid_format"}]}
```

## Backend services

| Service code | Repository |
|---|---|
| `api-key-management` | `sales-be` |
| `codes` | `data-be` |
| `common` | `platform` |
| `consumer-cabys` | `data-be` |
| `consumer-exchange-rate` | `data-be` |
| `consumer-exemptions` | `data-be` |
| `consumer-identifications` | `data-be` |
| `customer-types` | `data-be` |
| `discount-types` | `data-be` |
| `document-notification` | `sales-be` |
| `document-pdf-generator` | `sales-be` |
| `document-validator` | `sales-be` |
| `document-versions` | `data-be` |
| `documents` | `data-be` |
| `economic-activities` | `data-be` |
| `exemptions` | `data-be` |
| `exemptions-issuing-institutions` | `data-be` |
| `factory-tax-charges` | `data-be` |
| `hacienda-history` | `sales-be` |
| `identifications` | `data-be` |
| `infrastructure-service-provider` | `sales-be` |
| `lambda-authorizer` | `sales-be` |
| `locations` | `data-be` |
| `measurement-units` | `data-be` |
| `national-taxpayer-companies` | `data-be` |
| `national-taxpayer-special-fields` | `data-be` |
| `notification-codes` | `data-be` |
| `organization-configurations` | `sales-be` |
| `other-charges` | `data-be` |
| `payments` | `data-be` |
| `pharmaceutical-forms` | `data-be` |
| `platform-api` | `management-be` |
| `product-types` | `data-be` |
| `reference-codes` | `data-be` |
| `references` | `data-be` |
| `regimes` | `data-be` |
| `registered-organizations` | `sales-be` |
| `sale-conditions` | `data-be` |
| `sales-api` | `sales-be` |
| `store-api` | `store-be` |
| `support-api` | `support-be` |
| `tax-amounts` | `data-be` |
| `tax-conditions` | `data-be` |
| `tax-factors` | `data-be` |
| `tax-rate-codes` | `data-be` |
| `tax-rates` | `data-be` |
| `taxes` | `data-be` |
| `transactions` | `data-be` |
| `user-notifications` | `sales-be` |

## Current enum catalog

| Service | Code (`message`) | Enum member | HTTP status | Catalog message | Source |
|---|---|---|---:|---|---|
| `codes` | `001` | `CODE_TYPE_FOUND` | 409 | El tipo de codigo ya se encuentra previamente registrado | `be/data-be/app/codes/src/enums/exception_codes.py` |
| `codes` | `002` | `CODE_TYPE_NOT_FOUND` | 404 | El tipo de codigo no se encuentra registrado | `be/data-be/app/codes/src/enums/exception_codes.py` |
| `codes` | `003` | `CODE_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de codigo | `be/data-be/app/codes/src/enums/exception_codes.py` |
| `codes` | `201` | `CODE_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/codes/src/enums/exception_codes.py` |
| `codes` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/codes/src/enums/exception_codes.py` |
| `common` | `COMMON_400` | `BAD_REQUEST` | 400 | La solicitud no es válida. | `common contract` |
| `common` | `COMMON_401` | `UNAUTHORIZED` | 401 | Autenticación requerida. | `common contract` |
| `common` | `COMMON_403` | `FORBIDDEN` | 403 | No tiene permisos para esta operación. | `common contract` |
| `common` | `COMMON_404` | `NOT_FOUND` | 404 | El recurso solicitado no existe. | `common contract` |
| `common` | `COMMON_409` | `CONFLICT` | 409 | La solicitud entra en conflicto con el estado actual. | `common contract` |
| `common` | `COMMON_422` | `VALIDATION_ERROR` | 422 | La solicitud contiene datos inválidos. | `common contract` |
| `common` | `COMMON_429` | `TOO_MANY_REQUESTS` | 429 | Se excedió el límite de solicitudes. | `common contract` |
| `common` | `COMMON_500` | `INTERNAL_ERROR` | 500 | Ocurrió un error interno. | `common contract` |
| `common` | `COMMON_502` | `BAD_GATEWAY` | 502 | Un servicio dependiente devolvió un error. | `common contract` |
| `common` | `COMMON_503` | `SERVICE_UNAVAILABLE` | 503 | El servicio no está disponible. | `common contract` |
| `customer-types` | `001` | `CUSTOMER_TYPE_FOUND` | 409 | El tipo de cliente ya se encuentra previamente registrado | `be/data-be/app/customer-types/src/enums/exception_codes.py` |
| `customer-types` | `002` | `CUSTOMER_TYPE_NOT_FOUND` | 404 | El tipo de cliente no se encuentra registrado | `be/data-be/app/customer-types/src/enums/exception_codes.py` |
| `customer-types` | `003` | `CUSTOMER_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de cliente | `be/data-be/app/customer-types/src/enums/exception_codes.py` |
| `customer-types` | `201` | `CUSTOMER_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/customer-types/src/enums/exception_codes.py` |
| `customer-types` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/customer-types/src/enums/exception_codes.py` |
| `discount-types` | `001` | `DISCOUNT_TYPE_FOUND` | 409 | El tipo de descuento ya se encuentra previamente registrado | `be/data-be/app/discount-types/src/enums/exception_codes.py` |
| `discount-types` | `002` | `DISCOUNT_TYPE_NOT_FOUND` | 404 | El tipo de descuento no se encuentra registrado | `be/data-be/app/discount-types/src/enums/exception_codes.py` |
| `discount-types` | `003` | `DISCOUNT_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de descuento | `be/data-be/app/discount-types/src/enums/exception_codes.py` |
| `discount-types` | `004` | `DISCOUNT_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/discount-types/src/enums/exception_codes.py` |
| `discount-types` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/discount-types/src/enums/exception_codes.py` |
| `document-notification` | `HACIENDA_NOTIFICATION` | `HACIENDA_NOTIFICATION` | 500 | No se pudo enviar la notificación del documento. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-notification` | `ORG_CONFIG_NOT_FOUND` | `ORG_CONFIG_NOT_FOUND` | 404 | No se encontró la configuración de la organización. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-pdf-generator` | `HACIENDA_AUTH_UNAVAILABLE` | `HACIENDA_AUTH_UNAVAILABLE` | 503 | La autenticación de Hacienda no está disponible. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-pdf-generator` | `HACIENDA_CERT_EXPIRED` | `HACIENDA_CERT_EXPIRED` | 422 | El certificado de Hacienda está vencido. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-pdf-generator` | `HACIENDA_NOT_AVAILABLE` | `HACIENDA_NOT_AVAILABLE` | 503 | Hacienda no está disponible temporalmente. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-pdf-generator` | `HACIENDA_SIGNING` | `HACIENDA_SIGNING` | 500 | No se pudo firmar el documento electrónico. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-pdf-generator` | `HACIENDA_SUBMISSION` | `HACIENDA_SUBMISSION` | 502 | No se pudo enviar el documento a Hacienda. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-pdf-generator` | `HACIENDA_VALIDATION` | `HACIENDA_VALIDATION` | 422 | Hacienda rechazó la estructura o reglas del documento. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `HACIENDA_AUTH_UNAVAILABLE` | `HACIENDA_AUTH_UNAVAILABLE` | 503 | La autenticación de Hacienda no está disponible. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `HACIENDA_CERT_EXPIRED` | `HACIENDA_CERT_EXPIRED` | 422 | El certificado de Hacienda está vencido. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `HACIENDA_NOT_AVAILABLE` | `HACIENDA_NOT_AVAILABLE` | 503 | Hacienda no está disponible temporalmente. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `HACIENDA_SIGNING` | `HACIENDA_SIGNING` | 500 | No se pudo firmar el documento electrónico. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `HACIENDA_SUBMISSION` | `HACIENDA_SUBMISSION` | 502 | No se pudo enviar el documento a Hacienda. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `HACIENDA_VALIDATION` | `HACIENDA_VALIDATION` | 422 | Hacienda rechazó la estructura o reglas del documento. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `INVALID_VALIDATION_ACTION` | `INVALID_VALIDATION_ACTION` | 422 | La transición de validación no es válida. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `ORG_CONFIG_NOT_FOUND` | `ORG_CONFIG_NOT_FOUND` | 404 | No se encontró la configuración de la organización. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-validator` | `SALE_NOT_FOUND` | `SALE_NOT_FOUND` | 404 | No se encontró la venta solicitada. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `document-versions` | `001` | `DOCUMENT_VERSION_FOUND` | 409 | La version de documento ya se encuentra previamente registrada | `be/data-be/app/document-versions/src/enums/exception_codes.py` |
| `document-versions` | `002` | `DOCUMENT_VERSION_NOT_FOUND` | 404 | La version de documento no se encuentra registrada | `be/data-be/app/document-versions/src/enums/exception_codes.py` |
| `document-versions` | `003` | `DOCUMENT_VERSION_REQUEST` | 422 | Se ha presentado un error en la solicitud de la version de documento | `be/data-be/app/document-versions/src/enums/exception_codes.py` |
| `document-versions` | `004` | `DOCUMENT_VERSION_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/document-versions/src/enums/exception_codes.py` |
| `document-versions` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/document-versions/src/enums/exception_codes.py` |
| `documents` | `001` | `DOCUMENT_TYPE_FOUND` | 409 | El tipo de documento ya se encuentra previamente registrado | `be/data-be/app/documents/src/enums/exception_codes.py` |
| `documents` | `002` | `DOCUMENT_TYPE_NOT_FOUND` | 404 | El tipo de documento no se encuentra registrado | `be/data-be/app/documents/src/enums/exception_codes.py` |
| `documents` | `003` | `DOCUMENT_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de documento | `be/data-be/app/documents/src/enums/exception_codes.py` |
| `documents` | `201` | `DOCUMENT_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/documents/src/enums/exception_codes.py` |
| `documents` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/documents/src/enums/exception_codes.py` |
| `economic-activities` | `001` | `ECONOMIC_ACTIVITY_FOUND` | 409 | La actividad economica ya se encuentra previamente registrada | `be/data-be/shared/jmarkets_common/economic_activities/enums/exception_codes.py` |
| `economic-activities` | `002` | `ECONOMIC_ACTIVITY_NOT_FOUND` | 404 | La actividad economica no se encuentra registrada | `be/data-be/shared/jmarkets_common/economic_activities/enums/exception_codes.py` |
| `economic-activities` | `003` | `ECONOMIC_ACTIVITY_REQUEST` | 422 | Se ha presentado un error en la solicitud de la actividad economica | `be/data-be/shared/jmarkets_common/economic_activities/enums/exception_codes.py` |
| `economic-activities` | `004` | `ECONOMIC_ACTIVITY_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/shared/jmarkets_common/economic_activities/enums/exception_codes.py` |
| `economic-activities` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/shared/jmarkets_common/economic_activities/enums/exception_codes.py` |
| `exemptions` | `001` | `EXEMPTION_FOUND` | 409 | La exoneracion ya se encuentra previamente registrada | `be/data-be/app/exemptions/src/enums/exception_codes.py` |
| `exemptions` | `002` | `EXEMPTION_NOT_FOUND` | 404 | La exoneracion no se encuentra registrada | `be/data-be/app/exemptions/src/enums/exception_codes.py` |
| `exemptions` | `003` | `EXEMPTION_REQUEST` | 422 | Se ha presentado un error en la solicitud de la exoneracion | `be/data-be/app/exemptions/src/enums/exception_codes.py` |
| `exemptions` | `004` | `EXEMPTION_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/exemptions/src/enums/exception_codes.py` |
| `exemptions` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/exemptions/src/enums/exception_codes.py` |
| `exemptions-issuing-institutions` | `001` | `EXEMPTION_ISSUING_INSTITUTION_FOUND` | 409 | La institucion emisora de exoneracion ya se encuentra previamente registrada | `be/data-be/app/exemptions-issuing-institutions/src/enums/exception_codes.py` |
| `exemptions-issuing-institutions` | `002` | `EXEMPTION_ISSUING_INSTITUTION_NOT_FOUND` | 404 | La institucion emisora de exoneracion no se encuentra registrada | `be/data-be/app/exemptions-issuing-institutions/src/enums/exception_codes.py` |
| `exemptions-issuing-institutions` | `003` | `EXEMPTION_ISSUING_INSTITUTION_REQUEST` | 422 | Se ha presentado un error en la solicitud de la institucion emisora de exoneracion | `be/data-be/app/exemptions-issuing-institutions/src/enums/exception_codes.py` |
| `exemptions-issuing-institutions` | `004` | `EXEMPTION_ISSUING_INSTITUTION_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/exemptions-issuing-institutions/src/enums/exception_codes.py` |
| `exemptions-issuing-institutions` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/exemptions-issuing-institutions/src/enums/exception_codes.py` |
| `factory-tax-charges` | `001` | `FACTORY_TAX_CHARGE_FOUND` | 409 | El cargo de impuesto de fabrica ya se encuentra previamente registrado | `be/data-be/app/factory-tax-charges/src/enums/exception_codes.py` |
| `factory-tax-charges` | `002` | `FACTORY_TAX_CHARGE_NOT_FOUND` | 404 | El cargo de impuesto de fabrica no se encuentra registrado | `be/data-be/app/factory-tax-charges/src/enums/exception_codes.py` |
| `factory-tax-charges` | `003` | `FACTORY_TAX_CHARGE_REQUEST` | 422 | Se ha presentado un error en la solicitud del cargo de impuesto de fabrica | `be/data-be/app/factory-tax-charges/src/enums/exception_codes.py` |
| `factory-tax-charges` | `004` | `FACTORY_TAX_CHARGE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/factory-tax-charges/src/enums/exception_codes.py` |
| `factory-tax-charges` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/factory-tax-charges/src/enums/exception_codes.py` |
| `hacienda-history` | `HACIENDA_AUTH_UNAVAILABLE` | `HACIENDA_AUTH_UNAVAILABLE` | 503 | La autenticación de Hacienda no está disponible. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `hacienda-history` | `HACIENDA_CERT_EXPIRED` | `HACIENDA_CERT_EXPIRED` | 422 | El certificado de Hacienda está vencido. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `hacienda-history` | `HACIENDA_NOT_AVAILABLE` | `HACIENDA_NOT_AVAILABLE` | 503 | Hacienda no está disponible temporalmente. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `hacienda-history` | `HACIENDA_SIGNING` | `HACIENDA_SIGNING` | 500 | No se pudo firmar el documento electrónico. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `hacienda-history` | `HACIENDA_SUBMISSION` | `HACIENDA_SUBMISSION` | 502 | No se pudo enviar el documento a Hacienda. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `hacienda-history` | `HACIENDA_VALIDATION` | `HACIENDA_VALIDATION` | 422 | Hacienda rechazó la estructura o reglas del documento. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `identifications` | `001` | `IDENTIFICATION_TYPE_FOUND` | 409 | El tipo de identificacion ya se encuentra previamente registrado | `be/data-be/app/identifications/src/enums/exception_codes.py` |
| `identifications` | `002` | `IDENTIFICATION_TYPE_NOT_FOUND` | 404 | El tipo de identificacion no se encuentra registrado | `be/data-be/app/identifications/src/enums/exception_codes.py` |
| `identifications` | `003` | `IDENTIFICATION_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de identificacion | `be/data-be/app/identifications/src/enums/exception_codes.py` |
| `identifications` | `201` | `IDENTIFICATION_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/identifications/src/enums/exception_codes.py` |
| `identifications` | `202` | `IDENTIFICATION_TYPE_REMOVED` | 500 | El tipo de identificacion ha sido eliminado | `be/data-be/app/identifications/src/enums/exception_codes.py` |
| `identifications` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/identifications/src/enums/exception_codes.py` |
| `infrastructure-service-provider` | `CERT_NOT_ISSUED` | `CERT_NOT_ISSUED` | 500 | El certificado todavía no ha sido emitido. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `infrastructure-service-provider` | `INFRASTRUCTURE_PROVISIONING` | `INFRASTRUCTURE_PROVISIONING` | 500 | No se pudo aprovisionar la infraestructura. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `locations` | `001` | `COUNTRY_FOUND` | 409 | El país ya se encuentra previamente registrado | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `002` | `COUNTRY_NOT_FOUND` | 404 | El país no se encuentra registrado | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `003` | `COUNTRY_REQUEST_ERROR` | 422 | Se ha presentado un error en la solicitud del país | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `010` | `LOCATION_FOUND` | 409 | La ubicación ya se encuentra previamente registrada | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `011` | `LOCATION_NOT_FOUND` | 404 | La ubicación no se encuentra registrada | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `012` | `LOCATION_REQUEST_ERROR` | 422 | Se ha presentado un error en la solicitud de la ubicación | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `013` | `IMPORT_ERROR` | 500 | Se ha presentado un error al importar las ubicaciones | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `201` | `INVALID_STATUS` | 422 | Código de estado inválido | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `locations` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/locations/src/enums/exception_codes.py` |
| `measurement-units` | `001` | `MEASUREMENT_UNIT_FOUND` | 409 | La unidad de medida ya se encuentra previamente registrada | `be/data-be/app/measurement-units/src/enums/exception_codes.py` |
| `measurement-units` | `002` | `MEASUREMENT_UNIT_NOT_FOUND` | 404 | La unidad de medida no se encuentra registrada | `be/data-be/app/measurement-units/src/enums/exception_codes.py` |
| `measurement-units` | `003` | `MEASUREMENT_UNIT_REQUEST` | 422 | Se ha presentado un error en la solicitud de la unidad de medida | `be/data-be/app/measurement-units/src/enums/exception_codes.py` |
| `measurement-units` | `004` | `MEASUREMENT_UNIT_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/measurement-units/src/enums/exception_codes.py` |
| `measurement-units` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/measurement-units/src/enums/exception_codes.py` |
| `national-taxpayer-companies` | `001` | `NATIONAL_TAXPAYER_COMPANY_FOUND` | 409 | El contribuyente nacional empresa ya se encuentra previamente registrado | `be/data-be/app/national-taxpayer-companies/src/enums/exception_codes.py` |
| `national-taxpayer-companies` | `002` | `NATIONAL_TAXPAYER_COMPANY_NOT_FOUND` | 404 | El contribuyente nacional empresa no se encuentra registrado | `be/data-be/app/national-taxpayer-companies/src/enums/exception_codes.py` |
| `national-taxpayer-companies` | `003` | `NATIONAL_TAXPAYER_COMPANY_REQUEST` | 422 | Se ha presentado un error en la solicitud del contribuyente nacional empresa | `be/data-be/app/national-taxpayer-companies/src/enums/exception_codes.py` |
| `national-taxpayer-companies` | `004` | `NATIONAL_TAXPAYER_COMPANY_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/national-taxpayer-companies/src/enums/exception_codes.py` |
| `national-taxpayer-companies` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/national-taxpayer-companies/src/enums/exception_codes.py` |
| `national-taxpayer-special-fields` | `001` | `NATIONAL_TAXPAYER_SPECIAL_FIELD_FOUND` | 409 | El campo especial de contribuyente ya se encuentra previamente registrado | `be/data-be/app/national-taxpayer-special-fields/src/enums/exception_codes.py` |
| `national-taxpayer-special-fields` | `002` | `NATIONAL_TAXPAYER_SPECIAL_FIELD_NOT_FOUND` | 404 | El campo especial de contribuyente no se encuentra registrado | `be/data-be/app/national-taxpayer-special-fields/src/enums/exception_codes.py` |
| `national-taxpayer-special-fields` | `003` | `NATIONAL_TAXPAYER_SPECIAL_FIELD_REQUEST` | 422 | Se ha presentado un error en la solicitud del campo especial de contribuyente | `be/data-be/app/national-taxpayer-special-fields/src/enums/exception_codes.py` |
| `national-taxpayer-special-fields` | `004` | `NATIONAL_TAXPAYER_SPECIAL_FIELD_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/national-taxpayer-special-fields/src/enums/exception_codes.py` |
| `national-taxpayer-special-fields` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/national-taxpayer-special-fields/src/enums/exception_codes.py` |
| `notification-codes` | `001` | `NOTIFICATION_CODE_FOUND` | 409 | El codigo de notificacion ya se encuentra previamente registrado | `be/data-be/app/notification-codes/src/enums/exception_codes.py` |
| `notification-codes` | `002` | `NOTIFICATION_CODE_NOT_FOUND` | 404 | El codigo de notificacion no se encuentra registrado | `be/data-be/app/notification-codes/src/enums/exception_codes.py` |
| `notification-codes` | `003` | `NOTIFICATION_CODE_REQUEST` | 422 | Se ha presentado un error en la solicitud del codigo de notificacion | `be/data-be/app/notification-codes/src/enums/exception_codes.py` |
| `notification-codes` | `004` | `NOTIFICATION_CODE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/notification-codes/src/enums/exception_codes.py` |
| `notification-codes` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/notification-codes/src/enums/exception_codes.py` |
| `organization-configurations` | `001` | `HACIENDA_AUTHENTICATION_NOT_AVAILABLE` | 503 | El servicio de autenticacion del Ministerio de Hacienda no se encuentra disponible. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `002` | `AUTHENTICATION_NOT_FOUND` | 401 | La autenticacion no es valida. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `003` | `ORGANIZATION_NOT_FOUND` | 404 | El contribuyente no se encuentra registrado. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `004` | `CERTIFICATE_NOT_FOUND` | 404 | El certificado no ha sido encontrado. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `005` | `CERTIFICATE_PIN_ERROR` | 500 | El pin del certificado proporcionado no es correcto. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `006` | `ORGANIZATION_NOT_AVAILABLE` | 503 | El contribuyente no se encuentra disponible. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `007` | `SECRETS_ERROR` | 500 | No se ha encontrado el secret consultado. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `008` | `ENCRYPT_ERROR` | 500 | Se ha generado un error en la encriptacion. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `009` | `CERTIFICATE_NOT_VALID` | 500 | El certificado proporcionado no es valido. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `010` | `ORGANIZATION_REMOVED` | 500 | El contribuyente fue eliminado | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `011` | `SERIALIZATION_ERROR` | 500 | Se produjo un error al decodificar la respuesta | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `012` | `CACHE_NOT_FOUND` | 404 | La cache no se encuentra disponible. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `013` | `AWS_APP_CONFIG_ERROR` | 500 | Error al obtener las configuraciones de la aplicacion. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `014` | `EMAIL_ALREADY_EXISTS` | 409 | El email ya existe. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `015` | `USERNAME_FORMAT_ERROR` | 422 | El formato del username no es correcto. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `016` | `CREDENTIALS_VALIDATION_ERROR` | 422 | Las credenciales no son validas. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `017` | `DOMAIN_USERNAME_ERROR` | 500 | El dominio del username no es correcto. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `018` | `EMAIL_FORMAT_ERROR` | 422 | El formato del email no es correcto. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `019` | `EMAIL_DOMAIN_ERROR` | 500 | El dominio del email no es correcto. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `020` | `EMAIL_FIELD_ERROR` | 500 | El campo email no puede estar vacio. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `021` | `CALLBACK_URL_ERROR` | 500 | La URL de callback no puede estar vacio. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `022` | `NOTIFICATION_SENT_DOCUMENTS_ERROR` | 500 | El campo notifySentDocuments no puede ser nulo. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `023` | `NOTIFICATION_PROCESSING_DOCUMENTS_ERROR` | 500 | El campo notifyProcessingDocuments no puede ser nulo. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `organization-configurations` | `024` | `NOTIFICATION_RECEIVED_DOCUMENTS_ERROR` | 500 | El campo notifyReceivedDocuments no puede ser nulo. | `be/sales-be/app/organization-configurations/src/enums/exception_codes.py` |
| `other-charges` | `001` | `OTHER_CHARGE_FOUND` | 409 | El otro cargo ya se encuentra previamente registrado | `be/data-be/app/other-charges/src/enums/exception_codes.py` |
| `other-charges` | `002` | `OTHER_CHARGE_NOT_FOUND` | 404 | El otro cargo no se encuentra registrado | `be/data-be/app/other-charges/src/enums/exception_codes.py` |
| `other-charges` | `003` | `OTHER_CHARGE_REQUEST` | 422 | Se ha presentado un error en la solicitud del otro cargo | `be/data-be/app/other-charges/src/enums/exception_codes.py` |
| `other-charges` | `004` | `OTHER_CHARGE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/other-charges/src/enums/exception_codes.py` |
| `other-charges` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/other-charges/src/enums/exception_codes.py` |
| `payments` | `001` | `PAYMENT_TYPE_FOUND` | 409 | El tipo de pago ya se encuentra previamente registrado | `be/data-be/app/payments/src/enums/exception_codes.py` |
| `payments` | `002` | `PAYMENT_TYPE_NOT_FOUND` | 404 | El tipo de pago no se encuentra registrado | `be/data-be/app/payments/src/enums/exception_codes.py` |
| `payments` | `003` | `PAYMENT_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de pago | `be/data-be/app/payments/src/enums/exception_codes.py` |
| `payments` | `201` | `PAYMENT_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/payments/src/enums/exception_codes.py` |
| `payments` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/payments/src/enums/exception_codes.py` |
| `pharmaceutical-forms` | `001` | `PHARMACEUTICAL_FORM_FOUND` | 409 | La forma farmaceutica ya se encuentra previamente registrada | `be/data-be/app/pharmaceutical-forms/src/enums/exception_codes.py` |
| `pharmaceutical-forms` | `002` | `PHARMACEUTICAL_FORM_NOT_FOUND` | 404 | La forma farmaceutica no se encuentra registrada | `be/data-be/app/pharmaceutical-forms/src/enums/exception_codes.py` |
| `pharmaceutical-forms` | `003` | `PHARMACEUTICAL_FORM_REQUEST` | 422 | Se ha presentado un error en la solicitud de la forma farmaceutica | `be/data-be/app/pharmaceutical-forms/src/enums/exception_codes.py` |
| `pharmaceutical-forms` | `004` | `PHARMACEUTICAL_FORM_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/pharmaceutical-forms/src/enums/exception_codes.py` |
| `pharmaceutical-forms` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/pharmaceutical-forms/src/enums/exception_codes.py` |
| `platform-api` | `ORGANIZATION_MEMBERSHIP_REQUIRED` | `ORGANIZATION_MEMBERSHIP_REQUIRED` | 403 | Se requiere pertenecer a la organización. | `be/management-be/src/errors/ErrorContract.ts` |
| `platform-api` | `ORGANIZATION_NOT_FOUND` | `ORGANIZATION_NOT_FOUND` | 404 | No se encontró la organización. | `be/management-be/src/errors/ErrorContract.ts` |
| `platform-api` | `PLATFORM_ADMIN_REQUIRED` | `PLATFORM_ADMIN_REQUIRED` | 403 | Se requieren permisos de administración de plataforma. | `be/management-be/src/errors/ErrorContract.ts` |
| `product-types` | `001` | `PRODUCT_TYPE_FOUND` | 409 | El tipo de producto ya se encuentra previamente registrado | `be/data-be/app/product-types/src/enums/exception_codes.py` |
| `product-types` | `002` | `PRODUCT_TYPE_NOT_FOUND` | 404 | El tipo de producto no se encuentra registrado | `be/data-be/app/product-types/src/enums/exception_codes.py` |
| `product-types` | `003` | `PRODUCT_TYPE_REQUEST` | 422 | Se ha presentado un error en la solicitud del tipo de producto | `be/data-be/app/product-types/src/enums/exception_codes.py` |
| `product-types` | `201` | `PRODUCT_TYPE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/product-types/src/enums/exception_codes.py` |
| `product-types` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/product-types/src/enums/exception_codes.py` |
| `reference-codes` | `001` | `REFERENCE_CODE_FOUND` | 409 | El codigo de referencia ya se encuentra previamente registrado | `be/data-be/app/reference-codes/src/enums/exception_codes.py` |
| `reference-codes` | `002` | `REFERENCE_CODE_NOT_FOUND` | 404 | El codigo de referencia no se encuentra registrado | `be/data-be/app/reference-codes/src/enums/exception_codes.py` |
| `reference-codes` | `003` | `REFERENCE_CODE_REQUEST` | 422 | Se ha presentado un error en la solicitud del codigo de referencia | `be/data-be/app/reference-codes/src/enums/exception_codes.py` |
| `reference-codes` | `004` | `REFERENCE_CODE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/reference-codes/src/enums/exception_codes.py` |
| `reference-codes` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/reference-codes/src/enums/exception_codes.py` |
| `references` | `001` | `REFERENCE_FOUND` | 409 | La referencia ya se encuentra previamente registrada | `be/data-be/app/references/src/enums/exception_codes.py` |
| `references` | `002` | `REFERENCE_NOT_FOUND` | 404 | La referencia no se encuentra registrada | `be/data-be/app/references/src/enums/exception_codes.py` |
| `references` | `003` | `REFERENCE_REQUEST` | 422 | Se ha presentado un error en la solicitud de la referencia | `be/data-be/app/references/src/enums/exception_codes.py` |
| `references` | `004` | `REFERENCE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/references/src/enums/exception_codes.py` |
| `references` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/references/src/enums/exception_codes.py` |
| `regimes` | `001` | `REGIME_FOUND` | 409 | El regimen ya se encuentra previamente registrado | `be/data-be/shared/jmarkets_common/regimes/enums/exception_codes.py` |
| `regimes` | `002` | `REGIME_NOT_FOUND` | 404 | El regimen no se encuentra registrado | `be/data-be/shared/jmarkets_common/regimes/enums/exception_codes.py` |
| `regimes` | `003` | `REGIME_REQUEST` | 422 | Se ha presentado un error en la solicitud del regimen | `be/data-be/shared/jmarkets_common/regimes/enums/exception_codes.py` |
| `regimes` | `004` | `REGIME_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/shared/jmarkets_common/regimes/enums/exception_codes.py` |
| `regimes` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/shared/jmarkets_common/regimes/enums/exception_codes.py` |
| `registered-organizations` | `003` | `ORGANIZATION_NOT_FOUND` | 404 | La organización no se encuentra registrada. | `be/sales-be/app/registered-organizations/src/enums/exception_codes.py` |
| `registered-organizations` | `050` | `REGISTERED_ORG_NOT_FOUND` | 404 | La información fiscal no ha sido configurada. | `be/sales-be/app/registered-organizations/src/enums/exception_codes.py` |
| `registered-organizations` | `051` | `IDENTIFICATION_FORMAT_INVALID` | 422 | El número de identificación no corresponde con el tipo seleccionado. | `be/sales-be/app/registered-organizations/src/enums/exception_codes.py` |
| `registered-organizations` | `099` | `DATABASE_ERROR` | 500 | Se produjo un error en la base de datos. | `be/sales-be/app/registered-organizations/src/enums/exception_codes.py` |
| `sale-conditions` | `001` | `SALE_CONDITION_FOUND` | 409 | La condicion de venta ya se encuentra previamente registrada | `be/data-be/app/sale-conditions/src/enums/exception_codes.py` |
| `sale-conditions` | `002` | `SALE_CONDITION_NOT_FOUND` | 404 | La condicion de venta no se encuentra registrada | `be/data-be/app/sale-conditions/src/enums/exception_codes.py` |
| `sale-conditions` | `003` | `SALE_CONDITION_REQUEST` | 422 | Se ha presentado un error en la solicitud de la condicion de venta | `be/data-be/app/sale-conditions/src/enums/exception_codes.py` |
| `sale-conditions` | `004` | `SALE_CONDITION_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/sale-conditions/src/enums/exception_codes.py` |
| `sale-conditions` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/sale-conditions/src/enums/exception_codes.py` |
| `sales-api` | `HACIENDA_AUTH_UNAVAILABLE` | `HACIENDA_AUTH_UNAVAILABLE` | 503 | La autenticación de Hacienda no está disponible. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `HACIENDA_CERT_EXPIRED` | `HACIENDA_CERT_EXPIRED` | 422 | El certificado de Hacienda está vencido. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `HACIENDA_NOT_AVAILABLE` | `HACIENDA_NOT_AVAILABLE` | 503 | Hacienda no está disponible temporalmente. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `HACIENDA_SIGNING` | `HACIENDA_SIGNING` | 500 | No se pudo firmar el documento electrónico. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `HACIENDA_SUBMISSION` | `HACIENDA_SUBMISSION` | 502 | No se pudo enviar el documento a Hacienda. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `HACIENDA_VALIDATION` | `HACIENDA_VALIDATION` | 422 | Hacienda rechazó la estructura o reglas del documento. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `INVALID_VALIDATION_ACTION` | `INVALID_VALIDATION_ACTION` | 422 | La transición de validación no es válida. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `ORG_CONFIG_NOT_FOUND` | `ORG_CONFIG_NOT_FOUND` | 404 | No se encontró la configuración de la organización. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `SALE_NOT_DRAFT` | `SALE_NOT_DRAFT` | 500 | La venta ya no es un borrador. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `SALE_NOT_FOUND` | `SALE_NOT_FOUND` | 404 | No se encontró la venta solicitada. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `sales-api` | `XML_GENERATION_FAILED` | `XML_GENERATION_FAILED` | 500 | No se pudo generar el XML de la venta. | `be/sales-be/shared/jbiller_common/enums/error_codes.py` |
| `store-api` | `API_NOT_AVAILABLE` | `API_NOT_AVAILABLE` | 503 | Un servicio dependiente no está disponible. | `be/store-be/app/error_contract.py` |
| `store-api` | `EXCEL_PARSE_ERROR` | `EXCEL_PARSE_ERROR` | 500 | No se pudo procesar el archivo de Excel. | `be/store-be/app/error_contract.py` |
| `store-api` | `ORGANIZATION_NOT_FOUND` | `ORGANIZATION_NOT_FOUND` | 404 | No se encontró la organización. | `be/store-be/app/error_contract.py` |
| `support-api` | `SUPPORT_EVIDENCE_LIMIT_REACHED` | `SUPPORT_EVIDENCE_LIMIT_REACHED` | 409 | El ticket ya tiene el máximo de cinco imágenes. | `be/support-be/app/exceptions/platform_exception.py` |
| `support-api` | `SUPPORT_EVIDENCE_NOT_FOUND` | `SUPPORT_EVIDENCE_NOT_FOUND` | 404 | No se encontró la evidencia solicitada. | `be/support-be/app/exceptions/platform_exception.py` |
| `support-api` | `SUPPORT_EVIDENCE_SIZE_INVALID` | `SUPPORT_EVIDENCE_SIZE_INVALID` | 422 | La imagen de evidencia debe pesar entre 1 byte y 5 MB. | `be/support-be/app/exceptions/platform_exception.py` |
| `support-api` | `SUPPORT_EVIDENCE_TYPE_INVALID` | `SUPPORT_EVIDENCE_TYPE_INVALID` | 422 | La evidencia debe ser una imagen JPG, PNG, WebP o GIF. | `be/support-be/app/exceptions/platform_exception.py` |
| `support-api` | `SUPPORT_EVIDENCE_UPLOAD_INVALID` | `SUPPORT_EVIDENCE_UPLOAD_INVALID` | 422 | La evidencia cargada no coincide con la solicitud autorizada. | `be/support-be/app/exceptions/platform_exception.py` |
| `support-api` | `SUPPORT_TICKET_CLOSED` | `SUPPORT_TICKET_CLOSED` | 409 | El ticket de soporte está cerrado. | `be/support-be/app/exceptions/platform_exception.py` |
| `support-api` | `SUPPORT_TICKET_NOT_FOUND` | `SUPPORT_TICKET_NOT_FOUND` | 404 | No se encontró el ticket de soporte. | `be/support-be/app/exceptions/platform_exception.py` |
| `tax-amounts` | `001` | `TAX_AMOUNT_FOUND` | 409 | El monto de impuesto ya se encuentra previamente registrado | `be/data-be/app/tax-amounts/src/enums/exception_codes.py` |
| `tax-amounts` | `002` | `TAX_AMOUNT_NOT_FOUND` | 404 | El monto de impuesto no se encuentra registrado | `be/data-be/app/tax-amounts/src/enums/exception_codes.py` |
| `tax-amounts` | `003` | `TAX_AMOUNT_REQUEST` | 422 | Se ha presentado un error en la solicitud del monto de impuesto | `be/data-be/app/tax-amounts/src/enums/exception_codes.py` |
| `tax-amounts` | `004` | `TAX_AMOUNT_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/tax-amounts/src/enums/exception_codes.py` |
| `tax-amounts` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/tax-amounts/src/enums/exception_codes.py` |
| `tax-conditions` | `001` | `TAX_CONDITION_FOUND` | 409 | La condicion de impuesto ya se encuentra previamente registrada | `be/data-be/app/tax-conditions/src/enums/exception_codes.py` |
| `tax-conditions` | `002` | `TAX_CONDITION_NOT_FOUND` | 404 | La condicion de impuesto no se encuentra registrada | `be/data-be/app/tax-conditions/src/enums/exception_codes.py` |
| `tax-conditions` | `003` | `TAX_CONDITION_REQUEST` | 422 | Se ha presentado un error en la solicitud de la condicion de impuesto | `be/data-be/app/tax-conditions/src/enums/exception_codes.py` |
| `tax-conditions` | `004` | `TAX_CONDITION_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/tax-conditions/src/enums/exception_codes.py` |
| `tax-conditions` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/tax-conditions/src/enums/exception_codes.py` |
| `tax-factors` | `001` | `TAX_FACTOR_FOUND` | 409 | El factor de impuesto ya se encuentra previamente registrado | `be/data-be/app/tax-factors/src/enums/exception_codes.py` |
| `tax-factors` | `002` | `TAX_FACTOR_NOT_FOUND` | 404 | El factor de impuesto no se encuentra registrado | `be/data-be/app/tax-factors/src/enums/exception_codes.py` |
| `tax-factors` | `003` | `TAX_FACTOR_REQUEST` | 422 | Se ha presentado un error en la solicitud del factor de impuesto | `be/data-be/app/tax-factors/src/enums/exception_codes.py` |
| `tax-factors` | `004` | `TAX_FACTOR_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/tax-factors/src/enums/exception_codes.py` |
| `tax-factors` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/tax-factors/src/enums/exception_codes.py` |
| `tax-rate-codes` | `001` | `TAX_RATE_CODE_FOUND` | 409 | El codigo de tarifa de impuesto ya se encuentra previamente registrado | `be/data-be/app/tax-rate-codes/src/enums/exception_codes.py` |
| `tax-rate-codes` | `002` | `TAX_RATE_CODE_NOT_FOUND` | 404 | El codigo de tarifa de impuesto no se encuentra registrado | `be/data-be/app/tax-rate-codes/src/enums/exception_codes.py` |
| `tax-rate-codes` | `003` | `TAX_RATE_CODE_REQUEST` | 422 | Se ha presentado un error en la solicitud del codigo de tarifa de impuesto | `be/data-be/app/tax-rate-codes/src/enums/exception_codes.py` |
| `tax-rate-codes` | `004` | `TAX_RATE_CODE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/tax-rate-codes/src/enums/exception_codes.py` |
| `tax-rate-codes` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/tax-rate-codes/src/enums/exception_codes.py` |
| `tax-rates` | `001` | `TAX_RATE_FOUND` | 409 | La tarifa de impuesto ya se encuentra previamente registrada | `be/data-be/app/tax-rates/src/enums/exception_codes.py` |
| `tax-rates` | `002` | `TAX_RATE_NOT_FOUND` | 404 | La tarifa de impuesto no se encuentra registrada | `be/data-be/app/tax-rates/src/enums/exception_codes.py` |
| `tax-rates` | `003` | `TAX_RATE_REQUEST` | 422 | Se ha presentado un error en la solicitud de la tarifa de impuesto | `be/data-be/app/tax-rates/src/enums/exception_codes.py` |
| `tax-rates` | `004` | `TAX_RATE_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/tax-rates/src/enums/exception_codes.py` |
| `tax-rates` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/tax-rates/src/enums/exception_codes.py` |
| `taxes` | `001` | `TAX_FOUND` | 409 | El impuesto ya se encuentra previamente registrado | `be/data-be/app/taxes/src/enums/exception_codes.py` |
| `taxes` | `002` | `TAX_NOT_FOUND` | 404 | El impuesto no se encuentra registrado | `be/data-be/app/taxes/src/enums/exception_codes.py` |
| `taxes` | `003` | `TAX_REQUEST` | 422 | Se ha presentado un error en la solicitud del impuesto | `be/data-be/app/taxes/src/enums/exception_codes.py` |
| `taxes` | `201` | `TAX_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/taxes/src/enums/exception_codes.py` |
| `taxes` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/taxes/src/enums/exception_codes.py` |
| `transactions` | `001` | `TRANSACTION_FOUND` | 409 | La transaccion ya se encuentra previamente registrada | `be/data-be/app/transactions/src/enums/exception_codes.py` |
| `transactions` | `002` | `TRANSACTION_NOT_FOUND` | 404 | La transaccion no se encuentra registrada | `be/data-be/app/transactions/src/enums/exception_codes.py` |
| `transactions` | `003` | `TRANSACTION_REQUEST` | 422 | Se ha presentado un error en la solicitud de la transaccion | `be/data-be/app/transactions/src/enums/exception_codes.py` |
| `transactions` | `004` | `TRANSACTION_INVALID_STATUS` | 422 | Codigo de estado invalido | `be/data-be/app/transactions/src/enums/exception_codes.py` |
| `transactions` | `404` | `NOT_FOUND` | 404 | Not Found | `be/data-be/app/transactions/src/enums/exception_codes.py` |

## Operational rules

- Domain exceptions receive an enum member containing both `code` and catalog copy; the wire sends only the code.
- Framework validation, HTTP exceptions, and unhandled exceptions are converted to the same DTO.
- Internal exception text and stack traces are logged and reported to support, but never returned in the HTTP body.
- The catalog seed is committed at `be/support-be/app/seeds/backend-error-catalog.json` and upserted with `python -m app.scripts.seed_error_catalog` after the support-be migration.
- HTTP statuses for legacy enums that do not declare a status are inferred from their enum name during generation; migrate those call sites to enum-backed common exceptions when touched.
