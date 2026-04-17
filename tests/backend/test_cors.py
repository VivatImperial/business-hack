from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from backend.app import create_app


class CorsTests(unittest.TestCase):
    def test_preflight_allows_localhost_origin(self) -> None:
        client = TestClient(create_app(initialize_runtime=False))

        response = client.options(
            "/api/v1/admin/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:3000",
        )
        self.assertIn("POST", response.headers.get("access-control-allow-methods", ""))


if __name__ == "__main__":
    unittest.main()
