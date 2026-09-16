#!/usr/bin/env python3
"""Contract tests for the generated administrator gateway allowlist."""
from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "admin-api" / "generate_admin_api.py"
SPEC = importlib.util.spec_from_file_location("generate_admin_api", MODULE_PATH)
assert SPEC and SPEC.loader
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class AdminApiGeneratorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.routes, cls.specs = generator.collect_routes()

    def test_management_allowlist_contains_only_admin_routes(self) -> None:
        management_paths = {
            path
            for path, methods in self.routes.items()
            if any(service == "platform-api" for service, _source in methods.values())
        }
        self.assertTrue(management_paths)
        self.assertTrue(all(path.startswith("/api/admin") for path in management_paths))

    def test_normal_management_gateway_contains_no_admin_routes(self) -> None:
        source = json.loads(
            (ROOT / "be/management-be/api-gateway/endpoints.json").read_text(encoding="utf-8")
        )
        rows = source if isinstance(source, list) else source.get("endpoints", [])
        self.assertFalse([row for row in rows if "/api/admin" in str(row)])

    def test_every_published_operation_requires_admin_cognito(self) -> None:
        template = generator.build_template(self.routes)
        paths = template["Resources"]["AdminApi"]["Properties"]["DefinitionBody"]["paths"]
        for path, path_item in paths.items():
            for method, operation in path_item.items():
                if method == "options":
                    continue
                with self.subTest(path=path, method=method):
                    self.assertEqual(operation["security"], [{"AdminCognitoAuthorizer": []}])

    def test_manifest_excludes_import_only_services_and_tracks_real_ids(self) -> None:
        manifest = generator.build_manifest(self.specs)
        services = {item["service"]: item for item in manifest["services"]}
        self.assertNotIn("consumer-cabys", services)
        self.assertEqual(len(services), 30)
        self.assertEqual(
            services["factory-tax-charges"]["update"]["identity_parameter"],
            "factory_tax_charge_id",
        )
        self.assertEqual(services["taxes"]["update"]["identity_parameter"], "tax_id")
        self.assertEqual(services["locations"]["update"]["identity_parameter"], "iso_code")


if __name__ == "__main__":
    unittest.main()
