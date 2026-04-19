from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from backend.app.db.models.entities import Message, Ticket, User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.services.client_requests import ClientRequestsService
from backend.app.schemas.admin import (
    AppealConversationMessageItem,
    AppealMessageCreateRequest,
    AppealConversationResponse,
    AppealsListQuery,
)


def ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class AppealsService:
    def __init__(self, repository: AdminRepository) -> None:
        self.repository = repository

    async def list_appeals(self, query: AppealsListQuery) -> list[Ticket]:
        return await self.repository.list_tickets(
            scope=query.scope,
            status=query.status,
            date_from=query.date_from,
            date_to=query.date_to,
        )

    async def get_appeal(self, appeal_id: str) -> Ticket:
        ticket = await self.repository.get_ticket(appeal_id)
        if ticket is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appeal not found.")
        return ticket

    async def get_appeal_conversation(self, appeal_id: str) -> AppealConversationResponse:
        ticket = await self.get_appeal(appeal_id)
        ordered = sorted(
            ticket.messages,
            key=lambda m: (ensure_utc(m.created_at) or datetime.min.replace(tzinfo=timezone.utc), m.id),
        )
        return AppealConversationResponse(
            id=ticket.id,
            title=ticket.title,
            description=ticket.description,
            status=ticket.status,
            priority=ticket.priority,
            category=ticket.category,
            channel=ticket.channel,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            closed_at=ticket.closed_at,
            csat=ticket.csat,
            assistant_resolved=ticket.assistant_resolved,
            rating_request_sent=ticket.rating_request_sent,
            can_self_close=ClientRequestsService.can_self_close(ticket),
            awaiting_csat=ClientRequestsService.is_awaiting_csat(ticket),
            messages=[
                AppealConversationMessageItem(
                    id=m.id,
                    role=m.role,
                    author_login=m.author_login,
                    text=m.text,
                    created_at=m.created_at,
                )
                for m in ordered
            ],
        )

    async def add_admin_message(
        self,
        *,
        appeal_id: str,
        current_admin: User,
        payload: AppealMessageCreateRequest,
    ) -> AppealConversationResponse:
        ticket = await self.get_appeal(appeal_id)
        if ticket.status == "closed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Appeal is already closed.",
            )

        now = datetime.now(timezone.utc)
        message = Message(
            id=f"message-{uuid4().hex}",
            ticket_id=ticket.id,
            source_system="backend_admin",
            source_message_id=uuid4().hex,
            role="assistant",
            author_login=current_admin.login,
            text=payload.text,
            created_at=now,
            processed_at=now,
        )
        ticket.updated_at = now
        ticket.status = "in_progress"
        ticket.scope = "ticket"
        ticket.assistant_resolved = False
        ticket.taken_by_user_id = current_admin.id
        await self.repository.add_message(message)
        await self.repository.commit()
        await self.repository.session.refresh(ticket, attribute_names=["messages"])
        return await self.get_appeal_conversation(appeal_id)

    async def take_appeal(self, appeal_id: str, user_id: str) -> Ticket:
        ticket = await self.get_appeal(appeal_id)
        if ticket.status == "closed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Appeal is already closed.",
            )
        ticket.status = "in_progress"
        ticket.taken_by_user_id = user_id
        await self.repository.commit()
        return ticket

    async def close_appeal(self, appeal_id: str) -> Ticket:
        ticket = await self.get_appeal(appeal_id)
        if ticket.status != "closed":
            now = datetime.now(timezone.utc)
            ticket.status = "closed"
            ticket.closed_at = now
            ticket.updated_at = now
            ticket.rating_request_sent = True
            ticket.assistant_resolved = False
            message = Message(
                id=f"message-{uuid4().hex}",
                ticket_id=ticket.id,
                source_system="backend_admin",
                source_message_id=uuid4().hex,
                role="assistant",
                author_login="system",
                text="Заявка закрыта. Оцените, пожалуйста, качество решения по шкале от 1 до 5.",
                created_at=now,
                processed_at=now,
            )
            await self.repository.add_message(message)
            await self.repository.commit()
        return ticket

    async def send_rating_request(self, appeal_id: str) -> Ticket:
        ticket = await self.get_appeal(appeal_id)
        if ticket.status != "closed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating request can only be sent after appeal is closed.",
            )
        ticket.rating_request_sent = True
        await self.repository.commit()
        return ticket

    @staticmethod
    def processing_duration_minutes(ticket: Ticket) -> int:
        created_at = ensure_utc(ticket.created_at)
        end_time = ensure_utc(ticket.closed_at) or datetime.now(timezone.utc)
        return int((end_time - created_at).total_seconds() // 60)
