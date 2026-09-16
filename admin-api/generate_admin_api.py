#!/usr/bin/env python3
"""Generate the manually deployed Tsuru admin API and dashboard data manifest.

The gateway is an explicit allowlist assembled from backend OpenAPI sources:
* management-be: only /api/admin/**
* data-be: all catalog reads and mutations except health/cache endpoints

The normal management gateway excludes /api/admin, and the normal data gateway
is GET-only. This generated gateway is therefore the only public edge that can
reach platform-admin routes and data-catalog mutations.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
ADMIN_DIR = ROOT / "admin-api"
MANAGEMENT_SPEC = ROOT / "be/management-be/swagger/jmarkets.json"
DATA_SWAGGER_DIR = ROOT / "be/data-be/swagger"
MANIFEST_PATH = ROOT / "fe/dashboard/src/generated/admin-data-catalogs.json"
HTTP_METHODS = ("get", "post", "put", "patch", "delete")
SKIP_DATA_PREFIXES = ("/health", "/cache", "/common-data-api")
CORS_HEADERS = "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With"


class Sub(str):
    pass


class Ref(str):
    pass


class GetAtt(str):
    pass


def _scalar(tag):
    def represent(dumper, value):
        return dumper.represent_scalar(tag, str(value))
    return represent


yaml.add_representer(Sub, _scalar("!Sub"))
yaml.add_representer(Ref, _scalar("!Ref"))
yaml.add_representer(GetAtt, _scalar("!GetAtt"))


def load_json(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(f"Missing OpenAPI source: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def lambda_name(service: str) -> str:
    if service == "platform-api":
        return "tsuru-${Environment}-api-handler"
    return f"tsuru-${{Environment}}-hacienda-{service}-lambda"


def integration(service: str) -> dict:
    function = lambda_name(service)
    return {
        "httpMethod": "POST",
        "uri": Sub(
            "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/"
            f"arn:aws:lambda:${{AWS::Region}}:${{AWS::AccountId}}:function:{function}/invocations"
        ),
        "passthroughBehavior": "when_no_match",
        "contentHandling": "CONVERT_TO_TEXT",
        "type": "aws_proxy",
    }


def clean_parameters(operation: dict) -> list[dict]:
    result = []
    for parameter in operation.get("parameters", []):
        if parameter.get("in") not in ("path", "query"):
            continue
        schema = parameter.get("schema") or {}
        item = {
            "name": parameter["name"],
            "in": parameter["in"],
            "required": bool(parameter.get("required", False)),
            "schema": {"type": schema.get("type", "string")},
        }
        if schema.get("enum"):
            item["schema"]["enum"] = schema["enum"]
        result.append(item)
    return result


def operation(service: str, method: str, path: str, source: dict) -> dict:
    result = {
        "operationId": f"admin_{service.replace('-', '_')}_{source.get('operationId', method)}",
        "summary": source.get("summary") or f"{method.upper()} {path}",
        "responses": {
            "200": {"description": "OK"},
            "201": {"description": "Created"},
            "400": {"description": "Bad Request"},
            "401": {"description": "Unauthorized"},
            "403": {"description": "Forbidden"},
            "404": {"description": "Not Found"},
        },
        "security": [{"AdminCognitoAuthorizer": []}],
        "x-amazon-apigateway-integration": integration(service),
    }
    parameters = clean_parameters(source)
    if parameters:
        result["parameters"] = parameters
    if method in ("post", "put", "patch"):
        result["requestBody"] = {
            "required": bool(source.get("requestBody", {}).get("required", True)),
            "content": {"application/json": {"schema": {"type": "object"}}},
        }
    return result


def options(methods: list[str]) -> dict:
    allow = ",".join(sorted({method.upper() for method in methods} | {"OPTIONS"}))
    return {
        "responses": {"200": {"description": "CORS OK"}},
        "x-amazon-apigateway-integration": {
            "type": "mock",
            "requestTemplates": {"application/json": '{"statusCode": 200}'},
            "responses": {"default": {
                "statusCode": "200",
                "responseParameters": {
                    "method.response.header.Access-Control-Allow-Headers": f"'{CORS_HEADERS}'",
                    "method.response.header.Access-Control-Allow-Methods": f"'{allow}'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'",
                },
            }},
        },
    }


def collect_routes() -> tuple[dict, dict[str, dict]]:
    routes: dict[str, dict[str, tuple[str, dict]]] = {}
    specs: dict[str, dict] = {}

    management = load_json(MANAGEMENT_SPEC)
    specs["platform-api"] = management
    for path, item in management.get("paths", {}).items():
        if not path.startswith("/api/admin"):
            continue
        for method in HTTP_METHODS:
            if method in item:
                routes.setdefault(path, {})[method] = ("platform-api", item[method])

    for spec_path in sorted(DATA_SWAGGER_DIR.glob("*.json")):
        service = spec_path.stem
        spec = load_json(spec_path)
        specs[service] = spec
        for path, item in spec.get("paths", {}).items():
            if path.startswith(SKIP_DATA_PREFIXES):
                continue
            for method in HTTP_METHODS:
                if method not in item:
                    continue
                if method in routes.setdefault(path, {}):
                    owner = routes[path][method][0]
                    raise SystemExit(f"Route collision: {method.upper()} {path}: {owner} and {service}")
                routes[path][method] = (service, item[method])
    return routes, specs


def gateway_response() -> dict:
    return {
        "responseParameters": {
            "gatewayresponse.header.Access-Control-Allow-Headers": f"'{CORS_HEADERS}'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,POST,PUT,PATCH,DELETE,OPTIONS'",
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        },
    }


def logical_name(service: str) -> str:
    return "LambdaPermission" + "".join(part.capitalize() for part in re.split(r"[^A-Za-z0-9]", service) if part)


def build_template(routes: dict) -> dict:
    paths = {}
    services = set()
    for path, methods in sorted(routes.items()):
        path_item = {}
        for method, (service, source) in sorted(methods.items()):
            services.add(service)
            path_item[method] = operation(service, method, path, source)
        path_item["options"] = options(list(methods))
        paths[path] = path_item

    definition = {
        "openapi": "3.0.1",
        "info": {
            "title": Sub("tsuru-${Environment}-admin-api"),
            "description": "Dedicated Tsuru platform-administration API.",
            "version": "1.0.0",
        },
        "servers": [{"url": Sub("https://${DomainName}")}],
        "components": {"securitySchemes": {"AdminCognitoAuthorizer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "x-amazon-apigateway-authtype": "cognito_user_pools",
            "x-amazon-apigateway-authorizer": {
                "type": "cognito_user_pools",
                "providerARNs": [{"Fn::ImportValue": Sub("tsuru-${Environment}-admin-cognito-user-pool-arn")}],
            },
        }}},
        "x-amazon-apigateway-gateway-responses": {
            kind: gateway_response()
            for kind in ("DEFAULT_4XX", "DEFAULT_5XX", "UNAUTHORIZED", "ACCESS_DENIED")
        },
        "paths": paths,
    }
    resources = {
        "AdminApiLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": Sub("/aws/apigateway/tsuru-${Environment}-admin-api"),
                "RetentionInDays": 14,
            },
        },
        "AdminApiGatewayAccount": {
            "Type": "AWS::ApiGateway::Account",
            "Properties": {
                "CloudWatchRoleArn": {
                    "Fn::ImportValue": Sub("tsuru-${Environment}-apigateway-cloudwatch-role-arn")
                },
            },
        },
        "AdminApi": {
            "Type": "AWS::Serverless::Api",
            "DependsOn": "AdminApiGatewayAccount",
            "Properties": {
                "Name": Sub("tsuru-${Environment}-admin-api"),
                "StageName": Ref("Environment"),
                "EndpointConfiguration": "REGIONAL",
                "DisableExecuteApiEndpoint": True,
                "AccessLogSetting": {
                    "DestinationArn": GetAtt("AdminApiLogGroup.Arn"),
                    "Format": (
                        "$context.requestId $context.requestTime $context.httpMethod "
                        "$context.resourcePath $context.status $context.responseLength "
                        "$context.error.message"
                    ),
                },
                "MethodSettings": [{
                    "ResourcePath": "/*",
                    "HttpMethod": "*",
                    "LoggingLevel": "INFO",
                    "DataTraceEnabled": False,
                    "MetricsEnabled": True,
                }],
                "Variables": {
                    "AdminUserPoolId": {"Fn::ImportValue": Sub("tsuru-${Environment}-admin-cognito-user-pool-id")},
                    "AdminUserPoolClientId": {"Fn::ImportValue": Sub("tsuru-${Environment}-admin-cognito-client-id")},
                },
                "DefinitionBody": definition,
            },
        },
        "AdminApiCertificate": {
            "Type": "AWS::CertificateManager::Certificate",
            "DependsOn": "AdminApiCaaRecord",
            "Properties": {
                "DomainName": Ref("DomainName"),
                "ValidationMethod": "DNS",
                "DomainValidationOptions": [{"DomainName": Ref("DomainName"), "HostedZoneId": Ref("HostedZoneId")}],
            },
        },
        "AdminApiCaaRecord": {
            "Type": "AWS::Route53::RecordSet",
            "Properties": {
                "HostedZoneId": Ref("HostedZoneId"),
                "Name": Ref("DomainName"),
                "Type": "CAA",
                "TTL": 300,
                "ResourceRecords": [
                    '0 issue "amazon.com"',
                    '0 issue "amazonaws.com"',
                    '0 issue "amazontrust.com"',
                    '0 issue "awstrust.com"',
                ],
            },
        },
        "AdminApiDomainName": {
            "Type": "AWS::ApiGateway::DomainName",
            "Properties": {
                "DomainName": Ref("DomainName"),
                "RegionalCertificateArn": Ref("AdminApiCertificate"),
                "EndpointConfiguration": {"Types": ["REGIONAL"]},
                "SecurityPolicy": "TLS_1_2",
            },
        },
        "AdminApiBasePathMapping": {
            "Type": "AWS::ApiGateway::BasePathMapping",
            "DependsOn": "AdminApiStage",
            "Properties": {
                "DomainName": Ref("AdminApiDomainName"),
                "RestApiId": Ref("AdminApi"),
                "Stage": Ref("Environment"),
            },
        },
        "AdminApiDnsRecord": {
            "Type": "AWS::Route53::RecordSet",
            "Properties": {
                "HostedZoneId": Ref("HostedZoneId"),
                "Name": Ref("DomainName"),
                "Type": "A",
                "AliasTarget": {
                    "DNSName": GetAtt("AdminApiDomainName.RegionalDomainName"),
                    "HostedZoneId": GetAtt("AdminApiDomainName.RegionalHostedZoneId"),
                },
            },
        },
    }
    for service in sorted(services):
        resources[logical_name(service)] = {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": Sub(lambda_name(service)),
                "Action": "lambda:InvokeFunction",
                "Principal": "apigateway.amazonaws.com",
                "SourceArn": Sub("arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${AdminApi}/*"),
            },
        }
    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Transform": "AWS::Serverless-2016-10-31",
        "Description": "Generated Tsuru admin API. Deploy manually from the root repository.",
        "Parameters": {
            "Environment": {"Type": "String", "Default": "dev", "AllowedValues": ["dev", "stag", "prod"]},
            "HostedZoneId": {"Type": "String"},
            "DomainName": {"Type": "String", "Default": "admin-api.tsuru.jcampos.dev"},
        },
        "Resources": resources,
        "Outputs": {
            "ApiId": {"Value": Ref("AdminApi")},
            "ApiEndpoint": {"Value": Sub("https://${DomainName}")},
        },
    }


def dereference_schema(spec: dict, schema: dict | None) -> dict:
    if not schema:
        return {}
    if "$ref" in schema:
        name = schema["$ref"].split("/")[-1]
        return dereference_schema(spec, spec.get("components", {}).get("schemas", {}).get(name, {}))
    merged = dict(schema)
    for item in schema.get("allOf", []):
        resolved = dereference_schema(spec, item)
        merged.setdefault("properties", {}).update(resolved.get("properties", {}))
        merged["required"] = sorted(set(merged.get("required", [])) | set(resolved.get("required", [])))
    return merged


def body_fields(spec: dict, operation_source: dict) -> list[dict]:
    schema = operation_source.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema")
    resolved = dereference_schema(spec, schema)
    required = set(resolved.get("required", []))
    fields = []
    for name, source in resolved.get("properties", {}).items():
        field_schema = dereference_schema(spec, source)
        field = {
            "name": name,
            "type": field_schema.get("type", "string"),
            "required": name in required,
        }
        for key in ("description", "format", "default", "enum"):
            if key in field_schema:
                field[key] = field_schema[key]
        fields.append(field)
    return fields


def manifest_operation(spec: dict, method: str, path: str, source: dict) -> dict:
    path_parameters = [
        p["name"] for p in source.get("parameters", []) if p.get("in") == "path"
    ]
    result = {
        "method": method.upper(),
        "path": path,
        "summary": source.get("summary", ""),
        "identity_parameter": (
            path_parameters[-1]
            if method in ("put", "patch", "delete") and path_parameters
            else None
        ),
        "parameters": [{
            "name": p["name"],
            "in": p.get("in", "query"),
            "required": bool(p.get("required", False)),
            "type": (p.get("schema") or {}).get("type", "string"),
            "description": p.get("description", ""),
        } for p in source.get("parameters", []) if p.get("in") in ("path", "query")],
    }
    if method in ("post", "put", "patch"):
        result["fields"] = body_fields(spec, source)
    return result


def select_operation(spec: dict, method: str, predicate=None, list_mode=False):
    candidates = []
    for path, item in spec.get("paths", {}).items():
        if path.startswith(SKIP_DATA_PREFIXES) or method not in item:
            continue
        if predicate and not predicate(path):
            continue
        source = item[method]
        score = 0
        if list_mode:
            score += 20 if path.endswith("/all") else 0
            score += 8 if "{id}" not in path else 0
            score -= sum(1 for p in source.get("parameters", []) if p.get("required") and p.get("in") == "query")
        candidates.append((score, path, source))
    if not candidates:
        return None
    _, path, source = sorted(candidates, key=lambda row: (-row[0], row[1]))[0]
    return manifest_operation(spec, method, path, source)


def build_manifest(specs: dict[str, dict]) -> dict:
    services = []
    for service, spec in sorted(specs.items()):
        if service == "platform-api":
            continue
        # File-import operations are intentionally left on the protected admin
        # gateway but are not presented as a generic JSON "create" form.
        create = select_operation(spec, "post", lambda path: not path.rstrip("/").endswith("/import"))
        update = select_operation(spec, "put", lambda path: "{" in path)
        status = select_operation(spec, "patch", lambda path: "{" in path)
        delete = select_operation(spec, "delete", lambda path: "{" in path)
        if not any((create, update, status, delete)):
            continue
        entry = {
            "service": service,
            "label": spec.get("info", {}).get("title", service.replace("-", " ").title()),
            "description": spec.get("info", {}).get("description", ""),
            "list": select_operation(spec, "get", list_mode=True),
            "create": create,
            "update": update,
            "status": status,
            "delete": delete,
        }
        services.append(entry)
    return {"services": services}


def main() -> None:
    routes, specs = collect_routes()
    template = build_template(routes)
    template_path = ADMIN_DIR / "template.yml"
    template_path.write_text(yaml.dump(template, sort_keys=False, allow_unicode=True), encoding="utf-8")

    manifest = build_manifest(specs)
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    (ADMIN_DIR / "data-catalogs.json").write_text(manifest_json, encoding="utf-8")
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(manifest_json, encoding="utf-8")

    operations = sum(len(methods) for methods in routes.values())
    print(f"Generated {template_path.relative_to(ROOT)}: {len(routes)} paths / {operations} operations")
    print(f"Generated data manifest: {len(manifest['services'])} editable services")


if __name__ == "__main__":
    main()
