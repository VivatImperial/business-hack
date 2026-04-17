from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from backend.app import create_app
from backend.export_openapi import write_openapi_schema


class OpenApiTests(unittest.TestCase):
    def test_openapi_schema_is_available_without_runtime_initialization(self) -> None:
        app = create_app(initialize_runtime=False)

        schema = app.openapi()

        self.assertEqual(schema["openapi"], "3.1.0")
        self.assertEqual(schema["info"]["title"], "Baltiyskiy Bereg Backend API")
        self.assertIn("/api/v1/admin/auth/login", schema["paths"])
        self.assertIn("/api/v1/admin/dashboard/summary", schema["paths"])
        self.assertIn("/api/v1/admin/appeals", schema["paths"])
        self.assertIn("/api/v1/admin/settings", schema["paths"])

    def test_export_openapi_writes_backend_schema(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "openapi.json"

            written_path = write_openapi_schema(output_path)
            schema = json.loads(written_path.read_text(encoding="utf-8"))

        self.assertEqual(written_path, output_path)
        self.assertEqual(schema["info"]["title"], "Baltiyskiy Bereg Backend API")
        self.assertIn("/api/v1/admin/auth/login", schema["paths"])


if __name__ == "__main__":
    unittest.main()
