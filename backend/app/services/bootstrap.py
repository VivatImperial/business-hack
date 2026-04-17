from __future__ import annotations

from datetime import datetime, timedelta, timezone

from backend.app.config import Settings
from backend.app.db.models.entities import Document, Message, Ticket, User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.services.auth import AuthService


async def bootstrap_system_state(repository: AdminRepository, settings: Settings) -> None:
    if not await repository.has_users():
        await repository.add_user(
            User(
                id="admin-user",
                login=settings.admin_login,
                email=settings.admin_email,
                password_hash=AuthService.hash_password(settings.admin_password),
                is_admin=True,
            )
        )

    stored_settings = await repository.get_settings()
    if stored_settings is None:
        await repository.upsert_settings(
            tone_of_voice=settings.default_tone_of_voice,
            confidence_threshold=settings.default_confidence_threshold,
            top_k=settings.default_top_k,
            use_articles=settings.default_use_articles,
        )

    await repository.commit()


async def seed_development_state(repository: AdminRepository) -> None:
    if not await repository.has_documents():
        await repository.add_document(
            Document(
                id="doc-1",
                source_system="demo",
                source_document_id="kb-demo-1",
                title="VPN troubleshooting",
                source="kb",
                content="Проверьте UniVPN и 2MFA Контур.Коннект.",
                is_published=True,
            )
        )

    if not await repository.has_tickets():
        now = datetime.now(timezone.utc)
        tickets = [
            Ticket(
                id="appeal-1",
                source_system="demo",
                source_ticket_id="ticket-demo-1",
                employee_login="ivanov",
                channel="web",
                scope="assistant",
                status="open",
                priority="p2",
                category="remote-access",
                title="Не подключается удаленка",
                created_at=now - timedelta(hours=2),
                closed_at=None,
                csat=None,
                assistant_resolved=False,
                rating_request_sent=False,
            ),
            Ticket(
                id="appeal-2",
                source_system="demo",
                source_ticket_id="ticket-demo-2",
                employee_login="petrova",
                channel="web",
                scope="assistant",
                status="in_progress",
                priority="p3",
                category="1c-report",
                title="Неправильный отчет в 1С",
                created_at=now - timedelta(hours=5),
                closed_at=None,
                csat=None,
                assistant_resolved=False,
                rating_request_sent=False,
            ),
            Ticket(
                id="appeal-3",
                source_system="demo",
                source_ticket_id="ticket-demo-3",
                employee_login="sidorov",
                channel="web",
                scope="ticket",
                status="closed",
                priority="p2",
                category="mail",
                title="Проблема с почтой",
                created_at=now - timedelta(hours=10),
                closed_at=now - timedelta(hours=9),
                csat=4.0,
                assistant_resolved=True,
                rating_request_sent=True,
            ),
            Ticket(
                id="appeal-4",
                source_system="demo",
                source_ticket_id="ticket-demo-4",
                employee_login="smirnova",
                channel="web",
                scope="ticket",
                status="closed",
                priority="p4",
                category="erp",
                title="Ошибка ERP отчета",
                created_at=now - timedelta(hours=8),
                closed_at=now - timedelta(hours=6),
                csat=5.0,
                assistant_resolved=False,
                rating_request_sent=False,
            ),
        ]
        for ticket in tickets:
            await repository.add_ticket(ticket)

        messages = [
            Message(
                id="message-1",
                ticket_id="appeal-1",
                source_system="demo",
                source_message_id="message-demo-1",
                role="user",
                author_login="ivanov",
                text="Не подключается удаленка",
                processed_at=now - timedelta(hours=2),
            ),
            Message(
                id="message-2",
                ticket_id="appeal-2",
                source_system="demo",
                source_message_id="message-demo-2",
                role="assistant",
                text="Проверьте период и список контрагентов",
                processed_at=now - timedelta(hours=5),
            ),
            Message(
                id="message-3",
                ticket_id="appeal-3",
                source_system="demo",
                source_message_id="message-demo-3",
                role="assistant",
                text="Почтовый ящик разблокирован",
                processed_at=now - timedelta(hours=9, minutes=30),
            ),
            Message(
                id="message-4",
                ticket_id="appeal-4",
                source_system="demo",
                source_message_id="message-demo-4",
                role="user",
                author_login="smirnova",
                text="Отчет в ERP неверный",
                processed_at=now - timedelta(hours=7, minutes=30),
            ),
        ]
        for message in messages:
            await repository.add_message(message)

    await repository.commit()


async def initialize_state(repository: AdminRepository, settings: Settings) -> None:
    await bootstrap_system_state(repository, settings)
    if settings.enable_dev_seed:
        await seed_development_state(repository)
