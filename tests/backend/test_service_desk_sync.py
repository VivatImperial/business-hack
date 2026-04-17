from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import unittest

from sqlalchemy import select

from backend.app.db.models.entities import Document, Message, Ticket
from backend.app.db.repositories.admin import AdminRepository
from backend.app.db.session import Database
from backend.app.services.service_desk_reader import ServiceDeskMssqlReader
from backend.app.services.service_desk_sync import (
    ServiceDeskDocumentProjection,
    ServiceDeskMessageProjection,
    ServiceDeskSyncService,
    ServiceDeskTicketProjection,
)
from tests.backend.support import BackendDatabaseTestCase


class ServiceDeskSyncTests(BackendDatabaseTestCase):
    def test_reader_maps_mssql_rows_into_projection_models(self) -> None:
        now = datetime.now(timezone.utc)
        projection = ServiceDeskMssqlReader.build_ticket_projection(
            {
                "task_id": "42",
                "employee_login": "ivanov",
                "status": "open",
                "priority": "p2",
                "category": "remote-access",
                "title": "VPN issue",
                "description": "Не подключается удаленка",
                "created_at": now,
                "closed_at": None,
                "messages": [
                    {
                        "message_id": "m-1",
                        "role": "user",
                        "author_login": "ivanov",
                        "text": "Не подключается удаленка",
                        "created_at": now,
                    }
                ],
            }
        )
        document = ServiceDeskMssqlReader.build_document_projection(
            {
                "document_id": "kb-1",
                "title": "VPN troubleshooting",
                "content": "Проверьте UniVPN",
                "is_published": True,
                "rating": 4.8,
                "updated_at": now,
            }
        )

        self.assertEqual(projection.source_ticket_id, "42")
        self.assertEqual(projection.employee_login, "ivanov")
        self.assertEqual(projection.messages[0].source_message_id, "m-1")
        self.assertEqual(document.source_document_id, "kb-1")
        self.assertTrue(document.is_published)

    def test_sync_service_upserts_ticket_messages_and_document(self) -> None:
        async def scenario() -> None:
            database = Database(self.database_url)
            async with database.session() as session:
                repository = AdminRepository(session)
                sync_service = ServiceDeskSyncService(repository)
                now = datetime.now(timezone.utc)

                await sync_service.sync_ticket_projection(
                    ServiceDeskTicketProjection(
                        source_ticket_id="42",
                        employee_login="ivanov",
                        scope="ticket",
                        status="open",
                        priority="p2",
                        category="remote-access",
                        title="VPN issue",
                        description="Не подключается удаленка",
                        created_at=now,
                        closed_at=None,
                        csat=None,
                        assistant_resolved=False,
                        messages=[
                            ServiceDeskMessageProjection(
                                source_message_id="m-1",
                                role="user",
                                author_login="ivanov",
                                text="Не подключается удаленка",
                                created_at=now,
                            )
                        ],
                    )
                )
                await sync_service.sync_document_projection(
                    ServiceDeskDocumentProjection(
                        source_document_id="kb-1",
                        title="VPN troubleshooting",
                        content="Проверьте UniVPN",
                        is_published=True,
                        rating=4.8,
                        updated_at=now,
                    )
                )

                tickets = (await session.execute(select(Ticket))).scalars().all()
                messages = (await session.execute(select(Message))).scalars().all()
                documents = (await session.execute(select(Document))).scalars().all()

                self.assertEqual(len(tickets), 1)
                self.assertEqual(tickets[0].source_system, "mssql")
                self.assertEqual(tickets[0].source_ticket_id, "42")
                self.assertEqual(len(messages), 1)
                self.assertEqual(messages[0].source_system, "mssql")
                self.assertEqual(messages[0].source_message_id, "m-1")
                self.assertEqual(len(documents), 1)
                self.assertEqual(documents[0].source_document_id, "kb-1")

            await database.dispose()

        asyncio.run(scenario())


if __name__ == "__main__":
    unittest.main()
