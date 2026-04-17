from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from backend.app.db.models.entities import Message, Ticket, User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.schemas.client import (
    ClientRequestCreateRequest,
    ClientRequestMessageCreateRequest,
)


class ClientRequestsService:
    def __init__(self, repository: AdminRepository) -> None:
        self.repository = repository

    async def _reload_ticket(self, ticket: Ticket) -> Ticket:
        await self.repository.session.refresh(ticket, attribute_names=["messages"])
        return ticket

    async def create_request(
        self,
        *,
        current_user: User,
        payload: ClientRequestCreateRequest,
    ) -> Ticket:
        now = datetime.now(timezone.utc)
        ticket = Ticket(
            id=f"request-{uuid4().hex}",
            source_system=f"client_{payload.channel}",
            source_ticket_id=uuid4().hex,
            employee_login=current_user.login,
            requester_user_id=current_user.id,
            channel=payload.channel,
            scope="ticket",
            status="open",
            priority=payload.priority,
            category=payload.category,
            title=payload.title,
            description=payload.description,
            created_at=now,
            updated_at=now,
            closed_at=None,
            csat=None,
            assistant_resolved=False,
            rating_request_sent=False,
        )
        message = Message(
            id=f"message-{uuid4().hex}",
            ticket_id=ticket.id,
            source_system=f"client_{payload.channel}",
            source_message_id=uuid4().hex,
            role="user",
            author_login=current_user.login,
            text=payload.description,
            created_at=now,
            processed_at=now,
        )
        await self.repository.add_ticket(ticket)
        await self.repository.add_message(message)
        await self.repository.commit()
        return await self._reload_ticket(ticket)

    async def list_requests(
        self,
        *,
        current_user: User,
        channel: str | None,
    ) -> list[Ticket]:
        return await self.repository.list_user_tickets(
            requester_user_id=current_user.id,
            channel=channel,
        )

    async def get_request(
        self,
        *,
        current_user: User,
        request_id: str,
    ) -> Ticket:
        ticket = await self.repository.get_user_ticket(
            requester_user_id=current_user.id,
            ticket_id=request_id,
        )
        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Request not found.",
            )
        return ticket

    async def add_message(
        self,
        *,
        current_user: User,
        request_id: str,
        payload: ClientRequestMessageCreateRequest,
    ) -> Ticket:
        ticket = await self.get_request(current_user=current_user, request_id=request_id)
        if ticket.status == "closed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Request is already closed.",
            )

        now = datetime.now(timezone.utc)
        message = Message(
            id=f"message-{uuid4().hex}",
            ticket_id=ticket.id,
            source_system=f"client_{ticket.channel}",
            source_message_id=payload.source_message_id or uuid4().hex,
            role="user",
            author_login=current_user.login,
            text=payload.text,
            created_at=now,
            processed_at=now,
        )
        ticket.updated_at = now
        await self.repository.add_message(message)
        await self.repository.commit()
        return await self._reload_ticket(ticket)
