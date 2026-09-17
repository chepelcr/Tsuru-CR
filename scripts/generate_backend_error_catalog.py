#!/usr/bin/env python3
"""Generate the checked-in backend service/error catalog from source enums."""

from __future__ import annotations

import ast
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_OUT = ROOT / "be/support-be/app/seeds/backend-error-catalog.json"
DOC_OUT = ROOT / "docs/backend-error-catalog.md"

COMMON = [
    ("COMMON_400", "BAD_REQUEST", "La solicitud no es válida.", 400),
    ("COMMON_401", "UNAUTHORIZED", "Autenticación requerida.", 401),
    ("COMMON_403", "FORBIDDEN", "No tiene permisos para esta operación.", 403),
    ("COMMON_404", "NOT_FOUND", "El recurso solicitado no existe.", 404),
    ("COMMON_409", "CONFLICT", "La solicitud entra en conflicto con el estado actual.", 409),
    ("COMMON_422", "VALIDATION_ERROR", "La solicitud contiene datos inválidos.", 422),
    ("COMMON_429", "TOO_MANY_REQUESTS", "Se excedió el límite de solicitudes.", 429),
    ("COMMON_500", "INTERNAL_ERROR", "Ocurrió un error interno.", 500),
    ("COMMON_502", "BAD_GATEWAY", "Un servicio dependiente devolvió un error.", 502),
    ("COMMON_503", "SERVICE_UNAVAILABLE", "El servicio no está disponible.", 503),
]


def status_for(name: str) -> int:
    upper = name.upper()
    if "UNAUTHORIZED" in upper or "AUTHENTICATION_NOT_FOUND" in upper:
        return 401
    if "FORBIDDEN" in upper or "DENIED" in upper:
        return 403
    if "NOT_FOUND" in upper:
        return 404
    if "FOUND" in upper or "ALREADY" in upper or "CONFLICT" in upper:
        return 409
    if "UNAVAILABLE" in upper or "NOT_AVAILABLE" in upper:
        return 503
    if "SUBMISSION" in upper or "GATEWAY" in upper:
        return 502
    if any(word in upper for word in ("INVALID", "VALIDATION", "FORMAT", "REQUEST", "STATUS", "EXPIRED")):
        return 422
    return 500


def enum_rows(path: Path) -> list[tuple[str, str, str]]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    rows: list[tuple[str, str, str]] = []
    for node in tree.body:
        if not isinstance(node, ast.ClassDef) or node.name not in {"ExceptionCodes", "SalesErrorCodes", "StoreErrorCodes"}:
            continue
        for child in node.body:
            if not isinstance(child, ast.Assign) or len(child.targets) != 1 or not isinstance(child.targets[0], ast.Name):
                continue
            try:
                value = ast.literal_eval(child.value)
            except (ValueError, TypeError):
                continue
            if isinstance(value, tuple) and len(value) >= 2:
                rows.append((child.targets[0].id, str(value[0]), str(value[1])))
    return rows


def service(code: str, repository: str) -> dict[str, object]:
    return {"code": code, "displayName": code.replace("-", " ").title(), "repository": repository, "isActive": True}


services: dict[str, dict[str, object]] = {"common": service("common", "platform")}
errors: list[dict[str, object]] = []


def add_error(service_code: str, enum_name: str, code: str, message: str, status: int, source: str) -> None:
    if enum_name == "SUCCESS":
        return
    key = (service_code, code)
    if any((row["service"], row["code"]) == key for row in errors):
        return
    errors.append({
        "service": service_code,
        "code": code,
        "enumName": enum_name,
        "catalogMessage": message,
        "httpStatus": status,
        "source": source,
        "isActive": True,
    })


for code, name, message, status in COMMON:
    add_error("common", name, code, message, status, "common contract")

# Every deployable data Lambda has an explicit service_code matching its folder.
for directory in sorted((ROOT / "be/data-be/app").iterdir()):
    if directory.is_dir():
        services[directory.name] = service(directory.name, "data-be")

for path in sorted((ROOT / "be/data-be").glob("**/enums/exception_codes.py")):
    parts = path.relative_to(ROOT / "be/data-be").parts
    if parts[0] == "app":
        service_code = parts[1]
    elif "economic_activities" in parts:
        service_code = "economic-activities"
    elif "regimes" in parts:
        service_code = "regimes"
    else:
        continue
    for enum_name, code, message in enum_rows(path):
        add_error(service_code, enum_name, code, message, status_for(enum_name), str(path.relative_to(ROOT)))

sales_services = [
    "api-key-management", "document-notification", "document-pdf-generator",
    "document-validator", "hacienda-history", "infrastructure-service-provider",
    "organization-configurations", "registered-organizations", "sales-api", "user-notifications",
]
for code in sales_services:
    services[code] = service(code, "sales-be")

for path in sorted((ROOT / "be/sales-be/app").glob("*/src/enums/exception_codes.py")):
    service_code = path.parts[-4]
    for enum_name, code, message in enum_rows(path):
        add_error(service_code, enum_name, code, message, status_for(enum_name), str(path.relative_to(ROOT)))

sales_shared = ROOT / "be/sales-be/shared/jbiller_common/enums/error_codes.py"
sales_targets = {
    "SALE_NOT_FOUND": ["sales-api", "document-validator"],
    "SALE_NOT_DRAFT": ["sales-api"],
    "XML_GENERATION_FAILED": ["sales-api"],
    "INVALID_VALIDATION_ACTION": ["sales-api", "document-validator"],
    "HACIENDA_NOTIFICATION": ["document-notification"],
    "INFRASTRUCTURE_PROVISIONING": ["infrastructure-service-provider"],
    "CERT_NOT_ISSUED": ["infrastructure-service-provider"],
    "ORG_CONFIG_NOT_FOUND": ["sales-api", "document-validator", "document-notification"],
}
for enum_name, code, message in enum_rows(sales_shared):
    targets = sales_targets.get(enum_name, ["sales-api", "document-validator", "document-pdf-generator", "hacienda-history"])
    for target in targets:
        add_error(target, enum_name, code, message, status_for(enum_name), str(sales_shared.relative_to(ROOT)))

services["store-api"] = service("store-api", "store-be")
for enum_name, code, message in enum_rows(ROOT / "be/store-be/app/error_contract.py"):
    if not code.startswith("COMMON_"):
        add_error("store-api", enum_name, code, message, status_for(enum_name), "be/store-be/app/error_contract.py")

services["platform-api"] = service("platform-api", "management-be")
platform_rows = [
    ("ORGANIZATION_NOT_FOUND", "No se encontró la organización.", 404),
    ("PLATFORM_ADMIN_REQUIRED", "Se requieren permisos de administración de plataforma.", 403),
    ("ORGANIZATION_MEMBERSHIP_REQUIRED", "Se requiere pertenecer a la organización.", 403),
]
for code, message, status in platform_rows:
    add_error("platform-api", code, code, message, status, "be/management-be/src/errors/ErrorContract.ts")

services["support-api"] = service("support-api", "support-be")
support_rows = [
    ("SUPPORT_TICKET_NOT_FOUND", "No se encontró el ticket de soporte.", 404),
    ("SUPPORT_TICKET_CLOSED", "El ticket de soporte está cerrado.", 409),
    ("SUPPORT_EVIDENCE_TYPE_INVALID", "La evidencia debe ser una imagen JPG, PNG, WebP o GIF.", 422),
    ("SUPPORT_EVIDENCE_SIZE_INVALID", "La imagen de evidencia debe pesar entre 1 byte y 5 MB.", 422),
    ("SUPPORT_EVIDENCE_LIMIT_REACHED", "El ticket ya tiene el máximo de cinco imágenes.", 409),
    ("SUPPORT_EVIDENCE_NOT_FOUND", "No se encontró la evidencia solicitada.", 404),
    ("SUPPORT_EVIDENCE_UPLOAD_INVALID", "La evidencia cargada no coincide con la solicitud autorizada.", 422),
]
for code, message, status in support_rows:
    add_error("support-api", code, code, message, status, "be/support-be/app/exceptions/platform_exception.py")

payload = {
    "generatedFrom": "repository error enums; regenerate with python3 scripts/generate_backend_error_catalog.py",
    "services": sorted(services.values(), key=lambda row: str(row["code"])),
    "errors": sorted(errors, key=lambda row: (str(row["service"]), str(row["code"]))),
}
JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
JSON_OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

lines = [
    "# Backend error catalog",
    "",
    "> Generated from the current service error enums. Do not hand-edit the tables below; run `python3 scripts/generate_backend_error_catalog.py`.",
    "",
    "Every backend error response uses `message` as a stable code. The admin control plane resolves human copy by `(service, message)` through `GET /api/admin/error-catalog`. `COMMON_*` codes fall back to the `common` service. Legacy numeric codes are service-scoped and are not globally unique.",
    "",
    "## Common response DTO",
    "",
    "```json",
    '{"timestamp":"2026-09-16T12:00:00Z","status":404,"error":"Not Found","message":"COMMON_404","service":"store-api","path":"/api/orders/123","details":[{"path":"body.email","type":"invalid_format"}]}',
    "```",
    "",
    "## Backend services",
    "",
    "| Service code | Repository |",
    "|---|---|",
]
for row in payload["services"]:
    lines.append(f'| `{row["code"]}` | `{row["repository"]}` |')
lines.extend(["", "## Current enum catalog", "", "| Service | Code (`message`) | Enum member | HTTP status | Catalog message | Source |", "|---|---|---|---:|---|---|"])
for row in payload["errors"]:
    message = str(row["catalogMessage"]).replace("|", "\\|").replace("\n", " ")
    lines.append(f'| `{row["service"]}` | `{row["code"]}` | `{row["enumName"]}` | {row["httpStatus"]} | {message} | `{row["source"]}` |')
lines.extend([
    "",
    "## Operational rules",
    "",
    "- Domain exceptions receive an enum member containing both `code` and catalog copy; the wire sends only the code.",
    "- Framework validation, HTTP exceptions, and unhandled exceptions are converted to the same DTO.",
    "- Internal exception text and stack traces are logged and reported to support, but never returned in the HTTP body.",
    "- The catalog seed is committed at `be/support-be/app/seeds/backend-error-catalog.json` and upserted with `python -m app.scripts.seed_error_catalog` after the support-be migration.",
    "- HTTP statuses for legacy enums that do not declare a status are inferred from their enum name during generation; migrate those call sites to enum-backed common exceptions when touched.",
])
DOC_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {DOC_OUT.relative_to(ROOT)} ({len(errors)} errors) and {JSON_OUT.relative_to(ROOT)} ({len(services)} services)")
