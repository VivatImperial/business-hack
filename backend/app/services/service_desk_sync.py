from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from backend.app.db.models.entities import Document, Message, Ticket
from backend.app.db.repositories.admin import AdminRepository


@dataclass(slots=True)
class ServiceDeskMessageProjection:
    source_message_id: str
    role: str
    text: str
    created_at: datetime
    author_login: str | None = None


@dataclass(slots=True)
class ServiceDeskTicketProjection:
    source_ticket_id: str
    employee_login: str
    scope: str
    status: str
    priority: str
    category: str
    title: str | None
    description: str | None
    created_at: datetime
    closed_at: datetime | None
    csat: float | None
    assistant_resolved: bool
    messages: list[ServiceDeskMessageProjection] = field(default_factory=list)


@dataclass(slots=True)
class ServiceDeskDocumentProjection:
    source_document_id: str
    title: str
    content: str
    is_published: bool
    rating: float | None
    updated_at: datetime


class ServiceDeskSyncService:
    def __init__(self, repository: AdminRepository) -> None:
        self.repository = repository

    async def sync_ticket_projection(self, projection: ServiceDeskTicketProjection) -> Ticket:
        ticket = await self.repository.get_ticket_by_source(
            source_system="mssql",
            source_ticket_id=projection.source_ticket_id,
        )
        if ticket is None:
            ticket = Ticket(
                id=f"mssql-ticket-{projection.source_ticket_id}",
                source_system="mssql",
                source_ticket_id=projection.source_ticket_id,
                employee_login=projection.employee_login,
                scope=projection.scope,
                status=projection.status,
                priority=projection.priority,
                category=projection.category,
                title=projection.title,
                description=projection.description,
                created_at=projection.created_at,
                closed_at=projection.closed_at,
                csat=projection.csat,
                assistant_resolved=projection.assistant_resolved,
                rating_request_sent=False,
                last_synced_at=projection.created_at,
            )
            await self.repository.add_ticket(ticket)
        else:
            ticket.employee_login = projection.employee_login
            ticket.scope = projection.scope
            ticket.status = projection.status
            ticket.priority = projection.priority
            ticket.category = projection.category
            ticket.title = projection.title
            ticket.description = projection.description
            ticket.created_at = projection.created_at
            ticket.closed_at = projection.closed_at
            ticket.csat = projection.csat
            ticket.assistant_resolved = projection.assistant_resolved
            ticket.last_synced_at = projection.created_at

        for message_projection in projection.messages:
            await self.sync_message_projection(ticket.id, message_projection)

        await self.repository.commit()
        return ticket

    async def sync_message_projection(
        self,
        ticket_id: str,
        projection: ServiceDeskMessageProjection,
    ) -> Message:
        message = await self.repository.get_message_by_source(
            source_system="mssql",
            source_message_id=projection.source_message_id,
        )
        if message is None:
            message = Message(
                id=f"mssql-message-{projection.source_message_id}",
                ticket_id=ticket_id,
                source_system="mssql",
                source_message_id=projection.source_message_id,
                role=projection.role,
                author_login=projection.author_login,
                text=projection.text,
                created_at=projection.created_at,
                processed_at=projection.created_at,
                last_synced_at=projection.created_at,
            )
            await self.repository.add_message(message)
            return message

        message.ticket_id = ticket_id
        message.role = projection.role
        message.author_login = projection.author_login
        message.text = projection.text
        message.created_at = projection.created_at
        message.processed_at = projection.created_at
        message.last_synced_at = projection.created_at
        return message

    async def sync_document_projection(
        self,
        projection: ServiceDeskDocumentProjection,
    ) -> Document:
        document = await self.repository.get_document_by_source(
            source_system="mssql",
            source_document_id=projection.source_document_id,
        )
        if document is None:
            document = Document(
                id=f"mssql-document-{projection.source_document_id}",
                source_system="mssql",
                source_document_id=projection.source_document_id,
                title=projection.title,
                source="mssql",
                content=projection.content,
                is_published=projection.is_published,
                rating=projection.rating,
                last_synced_at=projection.updated_at,
            )
            await self.repository.add_document(document)
        else:
            document.title = projection.title
            document.content = projection.content
            document.is_published = projection.is_published
            document.rating = projection.rating
            document.last_synced_at = projection.updated_at

        await self.repository.commit()
        return document
