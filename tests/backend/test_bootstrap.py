from __future__ import annotations

import asyncio
import unittest

from sqlalchemy import select

from backend.app.config import Settings
from backend.app.db.models.entities import AssistantSettings, Document, Message, Metric, Ticket, User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.db.session import Database
from backend.app.db.migrations import apply_migrations
from backend.app.services.bootstrap import bootstrap_system_state
from tests.backend.support import BackendDatabaseTestCase


class BootstrapTests(BackendDatabaseTestCase):
    def test_bootstrap_system_state_only_creates_admin_and_settings(self) -> None:
        apply_migrations(self.database_url)

        async def scenario() -> None:
            database = Database(self.database_url)
            async with database.session() as session:
                repository = AdminRepository(session)
                settings = Settings(_env_file=None)
                await bootstrap_system_state(repository, settings)
                await repository.commit()

                self.assertEqual((await session.execute(select(User))).scalars().all().__len__(), 1)
                self.assertEqual(
                    (await session.execute(select(AssistantSettings))).scalars().all().__len__(),
                    1,
                )
                self.assertEqual((await session.execute(select(Ticket))).scalars().all().__len__(), 0)
                self.assertEqual((await session.execute(select(Message))).scalars().all().__len__(), 0)
                self.assertEqual((await session.execute(select(Document))).scalars().all().__len__(), 0)
                self.assertEqual((await session.execute(select(Metric))).scalars().all().__len__(), 0)

            await database.dispose()

        asyncio.run(scenario())


if __name__ == "__main__":
    unittest.main()
