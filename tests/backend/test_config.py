from __future__ import annotations

import unittest
from unittest.mock import patch

from backend.app.config import Settings


class SettingsTests(unittest.TestCase):
    def test_settings_default_to_postgres_and_production_safe_flags(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            settings = Settings(_env_file=None)

        self.assertEqual(
            settings.database_url,
            "postgresql+asyncpg://backend:backend@localhost:5432/baltiyskiy_bereg",
        )
        self.assertFalse(settings.enable_dev_seed)
        self.assertFalse(settings.run_migrations_on_startup)
        self.assertEqual(settings.ai_agent_base_url, "http://ai-agent:8090")
        self.assertIn("http://localhost:3000", settings.cors_origins)
        self.assertIn("http://localhost:5173", settings.cors_origins)

    def test_settings_parse_cors_origins_from_csv(self) -> None:
        with patch.dict(
            "os.environ",
            {"BACKEND_CORS_ORIGINS": "http://localhost:3000, https://bereg.website"},
            clear=True,
        ):
            settings = Settings(_env_file=None)

        self.assertEqual(
            settings.cors_origins,
            ["http://localhost:3000", "https://bereg.website"],
        )


if __name__ == "__main__":
    unittest.main()
