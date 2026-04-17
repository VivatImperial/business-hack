from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import httpx
from fastapi import HTTPException, status

from backend.app.db.models.entities import Message, Ticket, User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.services.ai_agent_service import AiAgentService
from backend.app.schemas.client import (
    ClientRequestCreateRequest,
    ClientRequestMessageCreateRequest,
)


class ClientRequestsService:
    def __init__(
        self,
        repository: AdminRepository,
        *,
        ai_agent_service: AiAgentService,
    ) -> None:
        self.repository = repository
        self.ai_agent_service = ai_agent_service

    async def _reload_ticket(self, ticket: Ticket) -> Ticket:
        await self.repository.session.refresh(ticket, attribute_names=["messages"])
        return ticket

    async def _build_ai_payload(
        self,
        *,
        ticket: Ticket,
        user_message: Message,
        history: list[Message],
    ) -> dict[str, object]:
        settings = await self.repository.get_settings()
        if settings is None:
            raise RuntimeError("Assistant settings are not initialized.")

        return {
            "appeal_id": ticket.id,
            "message_id": user_message.id,
            "employee_login": ticket.employee_login,
            "user_text": user_message.text,
            "history": [
                {
                    "role": message.role if message.role in {"user", "assistant", "system"} else "system",
                    "text": message.text,
                }
                for message in history
            ],
            "settings": {
                "tone_of_voice": settings.tone_of_voice,
                "confidence_threshold": settings.confidence_threshold,
                "top_k": settings.top_k,
                "use_articles": settings.use_articles,
            },
        }

    async def _respond_with_ai(
        self,
        *,
        ticket: Ticket,
        user_message: Message,
        history: list[Message],
    ) -> Message:
        now = datetime.now(timezone.utc)
        try:
            response = await self.ai_agent_service.respond(
                await self._build_ai_payload(
                    ticket=ticket,
                    user_message=user_message,
                    history=history,
                )
            )
            assistant_text = str(response.get("message") or "").strip()
            should_escalate = bool(response.get("should_escalate"))
            if not assistant_text:
                raise ValueError("Assistant response is empty.")
            ticket.assistant_resolved = not should_escalate
            ticket.scope = "ticket" if should_escalate else "assistant"
        except (httpx.HTTPError, ValueError, RuntimeError):
            assistant_text = (
                "Ассистент временно недоступен. Обращение сохранено, пожалуйста попробуйте "
                "написать еще раз чуть позже или дождитесь подключения оператора."
            )
            ticket.assistant_resolved = False
            ticket.scope = "ticket"

        assistant_message = Message(
            id=f"message-{uuid4().hex}",
            ticket_id=ticket.id,
            source_system="ai_agent",
            source_message_id=user_message.id,
            role="assistant",
            author_login="ai-agent",
            text=assistant_text,
            created_at=now,
            processed_at=now,
        )
        ticket.updated_at = now
        await self.repository.add_message(assistant_message)
        await self.repository.commit()
        return assistant_message

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
        await self._respond_with_ai(ticket=ticket, user_message=message, history=[message])
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
        await self._respond_with_ai(
            ticket=ticket,
            user_message=message,
            history=[*ticket.messages, message],
        )
        return await self._reload_ticket(ticket)
