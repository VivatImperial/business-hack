from __future__ import annotations

import unittest
from unittest.mock import patch

from ai_agent.config import Settings


class SettingsTests(unittest.TestCase):
    def test_settings_use_safe_local_qdrant_default(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            settings = Settings(_env_file=None)

        self.assertEqual(settings.qdrant_url, "http://localhost:6333")
        self.assertEqual(settings.yandex_gpt_model, "yandexgpt/latest")


if __name__ == "__main__":
    unittest.main()
