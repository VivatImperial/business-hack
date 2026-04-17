from __future__ import annotations

from datetime import date, datetime, time, timezone

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.models.entities import (
    AssistantSettings,
    Document,
    Message,
    Metric,
    Ticket,
    User,
)


class AdminRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_login(self, login: str) -> User | None:
        result = await self.session.execute(select(User).where(User.login == login))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_telegram_user_id(self, telegram_user_id: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.telegram_user_id == telegram_user_id)
        )
        return result.scalar_one_or_none()

    async def has_users(self) -> bool:
        result = await self.session.execute(select(User.id).limit(1))
        return result.scalar_one_or_none() is not None

    async def add_user(self, user: User) -> None:
        self.session.add(user)

    async def has_documents(self) -> bool:
        result = await self.session.execute(select(Document.id).limit(1))
        return result.scalar_one_or_none() is not None

    async def add_document(self, document: Document) -> None:
        self.session.add(document)

    async def get_document_by_source(
        self,
        *,
        source_system: str,
        source_document_id: str,
    ) -> Document | None:
        result = await self.session.execute(
            select(Document).where(
                Document.source_system == source_system,
                Document.source_document_id == source_document_id,
            )
        )
        return result.scalar_one_or_none()

    async def has_metrics(self) -> bool:
        result = await self.session.execute(select(Metric.id).limit(1))
        return result.scalar_one_or_none() is not None

    async def add_metric(self, metric: Metric) -> None:
        self.session.add(metric)

    async def has_tickets(self) -> bool:
        result = await self.session.execute(select(Ticket.id).limit(1))
        return result.scalar_one_or_none() is not None

    async def add_ticket(self, ticket: Ticket) -> None:
        self.session.add(ticket)

    async def get_ticket_by_source(
        self,
        *,
        source_system: str,
        source_ticket_id: str,
    ) -> Ticket | None:
        result = await self.session.execute(
            select(Ticket).where(
                Ticket.source_system == source_system,
                Ticket.source_ticket_id == source_ticket_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_message(self, message: Message) -> None:
        self.session.add(message)

    async def get_message_by_source(
        self,
        *,
        source_system: str,
        source_message_id: str,
    ) -> Message | None:
        result = await self.session.execute(
            select(Message).where(
                Message.source_system == source_system,
                Message.source_message_id == source_message_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_settings(self) -> AssistantSettings | None:
        result = await self.session.execute(
            select(AssistantSettings).where(AssistantSettings.id == 1)
        )
        return result.scalar_one_or_none()

    async def upsert_settings(
        self,
        *,
        tone_of_voice: str,
        confidence_threshold: float,
        top_k: int,
        use_articles: bool,
    ) -> AssistantSettings:
        settings = await self.get_settings()
        if settings is None:
            settings = AssistantSettings(
                id=1,
                tone_of_voice=tone_of_voice,
                confidence_threshold=confidence_threshold,
                top_k=top_k,
                use_articles=use_articles,
            )
            self.session.add(settings)
            return settings

        settings.tone_of_voice = tone_of_voice
        settings.confidence_threshold = confidence_threshold
        settings.top_k = top_k
        settings.use_articles = use_articles
        return settings

    async def list_metrics(self) -> list[Metric]:
        result = await self.session.execute(select(Metric).order_by(Metric.name.asc()))
        return list(result.scalars().all())

    async def list_tickets(
        self,
        *,
        scope: str | None = None,
        status: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[Ticket]:
        query: Select[tuple[Ticket]] = select(Ticket).order_by(Ticket.created_at.desc())

        if scope and scope != "all":
            query = query.where(Ticket.scope == scope)
        if status:
            query = query.where(Ticket.status == status)
        if date_from:
            start = datetime.combine(date_from, time.min, tzinfo=timezone.utc)
            query = query.where(Ticket.created_at >= start)
        if date_to:
            end = datetime.combine(date_to, time.max, tzinfo=timezone.utc)
            query = query.where(Ticket.created_at <= end)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_ticket(self, ticket_id: str) -> Ticket | None:
        result = await self.session.execute(select(Ticket).where(Ticket.id == ticket_id))
        return result.scalar_one_or_none()

    async def list_user_tickets(
        self,
        *,
        requester_user_id: str,
        channel: str | None = None,
    ) -> list[Ticket]:
        query: Select[tuple[Ticket]] = (
            select(Ticket)
            .where(Ticket.requester_user_id == requester_user_id)
            .order_by(Ticket.created_at.desc())
        )
        if channel:
            query = query.where(Ticket.channel == channel)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_user_ticket(
        self,
        *,
        requester_user_id: str,
        ticket_id: str,
    ) -> Ticket | None:
        result = await self.session.execute(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.requester_user_id == requester_user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_tickets_created_since(self, since: datetime) -> list[Ticket]:
        result = await self.session.execute(
            select(Ticket)
            .where(Ticket.created_at >= since)
            .order_by(Ticket.created_at.asc())
        )
        return list(result.scalars().all())

    async def list_closed_tickets_since(self, since: datetime) -> list[Ticket]:
        result = await self.session.execute(
            select(Ticket)
            .where(
                Ticket.status == "closed",
                Ticket.closed_at.is_not(None),
                Ticket.closed_at >= since,
            )
            .order_by(Ticket.closed_at.asc())
        )
        return list(result.scalars().all())

    async def list_messages_since(self, since: datetime) -> list[Message]:
        result = await self.session.execute(
            select(Message)
            .where(Message.processed_at >= since)
            .order_by(Message.processed_at.asc())
        )
        return list(result.scalars().all())

    async def commit(self) -> None:
        await self.session.commit()
