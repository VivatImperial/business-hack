from __future__ import annotations

import os
import tempfile
import unittest

from backend.app.db.migrations import apply_migrations


class BackendDatabaseTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.previous_env = os.environ.copy()
        self.database_url = f"sqlite+aiosqlite:///{self.temp_dir.name}/backend-test.db"
        os.environ["BACKEND_DATABASE_URL"] = self.database_url
        os.environ["BACKEND_JWT_SECRET"] = "test-secret"
        os.environ["BACKEND_ADMIN_LOGIN"] = "admin"
        os.environ["BACKEND_ADMIN_EMAIL"] = "admin@example.com"
        os.environ["BACKEND_ADMIN_PASSWORD"] = "admin12345"
        os.environ["BACKEND_ENABLE_DEV_SEED"] = "true"
        os.environ["BACKEND_RUN_MIGRATIONS_ON_STARTUP"] = "false"
        apply_migrations(self.database_url)

    def tearDown(self) -> None:
        os.environ.clear()
        os.environ.update(self.previous_env)
        self.temp_dir.cleanup()
