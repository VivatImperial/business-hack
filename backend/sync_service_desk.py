from __future__ import annotations

import asyncio

from backend.app.config import Settings
from backend.app.db.migrations import apply_migrations
from backend.app.db.repositories.admin import AdminRepository
from backend.app.db.session import Database
from backend.app.services.bootstrap import bootstrap_system_state
from backend.app.services.service_desk_reader import ServiceDeskMssqlReader
from backend.app.services.service_desk_sync import ServiceDeskSyncService


async def sync_once(settings: Settings) -> None:
    database = Database(settings.database_url)
    await database.ensure_schema_ready()
    async with database.session() as session:
        repository = AdminRepository(session)
        await bootstrap_system_state(repository, settings)
        sync_service = ServiceDeskSyncService(repository)
        reader = ServiceDeskMssqlReader(settings)

        for projection in reader.fetch_ticket_projections(settings.mssql_sync_batch_size):
            await sync_service.sync_ticket_projection(projection)

        for projection in reader.fetch_document_projections(settings.mssql_sync_batch_size):
            await sync_service.sync_document_projection(projection)

    await database.dispose()


def main() -> None:
    settings = Settings()
    apply_migrations(settings.database_url)
    asyncio.run(sync_once(settings))


if __name__ == "__main__":
    main()
