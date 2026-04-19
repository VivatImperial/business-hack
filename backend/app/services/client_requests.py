from __future__ import annotations

from datetime import datetime, timezone
import json
import re
from uuid import uuid4

import httpx
from fastapi import HTTPException, status

from backend.app.db.models.entities import Message, Ticket, User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.services.ai_agent_service import AiAgentService
from backend.app.services.upload_storage import UploadStorageService
from backend.app.schemas.client import (
    ClientRequestCreateRequest,
    ClientRequestMessageCreateRequest,
)


class ClientRequestsService:
    RESOLVED_INTENT_RE = re.compile(
        r"\b("
        r"решен[аоы]?|"
        r"решилось|"
        r"помогл[оаи]?|"
        r"сработал[оаи]?|"
        r"заработал[оаи]?|"
        r"можно закрывать|"
        r"закрывайте|"
        r"все ок|"
        r"всё ок|"
        r"все работает|"
        r"всё работает"
        r")\b",
        re.IGNORECASE,
    )

    def __init__(
        self,
        repository: AdminRepository,
        *,
        ai_agent_service: AiAgentService,
        upload_storage: UploadStorageService,
    ) -> None:
        self.repository = repository
        self.ai_agent_service = ai_agent_service
        self.upload_storage = upload_storage

    async def _reload_ticket(self, ticket: Ticket) -> Ticket:
        await self.repository.session.refresh(ticket, attribute_names=["messages"])
        return ticket

    @classmethod
    def is_resolution_confirmation(cls, text: str) -> bool:
        normalized = text.strip().lower()
        if not normalized:
            return False
        return bool(cls.RESOLVED_INTENT_RE.search(normalized))

    @classmethod
    def is_awaiting_csat(cls, ticket: Ticket) -> bool:
        return ticket.status == "closed" and ticket.csat is None and ticket.rating_request_sent

    @classmethod
    def can_self_close(cls, ticket: Ticket) -> bool:
        if ticket.status == "closed" or cls.is_awaiting_csat(ticket):
            return False
        if not ticket.messages:
            return False

        last_message = ticket.messages[-1]
        if ticket.assistant_resolved and last_message.role == "assistant":
            return True

        if last_message.role == "user" and cls.is_resolution_confirmation(last_message.text):
            return ticket.assistant_resolved and any(
                message.role == "assistant" for message in ticket.messages[:-1]
            )
        return False

    @classmethod
    def build_request_state(cls, ticket: Ticket) -> dict[str, object]:
        return {
            "csat": ticket.csat,
            "assistant_resolved": ticket.assistant_resolved,
            "rating_request_sent": ticket.rating_request_sent,
            "can_self_close": cls.can_self_close(ticket),
            "awaiting_csat": cls.is_awaiting_csat(ticket),
        }

    @staticmethod
    def parse_citations(message: Message) -> list[dict[str, object]]:
        raw = (message.citations_json or "").strip()
        if not raw:
            return []
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return []
        if not isinstance(payload, list):
            return []
        return [item for item in payload if isinstance(item, dict)]

    @classmethod
    def serialize_message(cls, message: Message) -> dict[str, object]:
        return {
            "id": message.id,
            "role": message.role,
            "author_login": message.author_login,
            "text": message.text,
            "image_url": message.image_url,
            "image_name": message.image_name,
            "citations": cls.parse_citations(message),
            "created_at": message.created_at,
        }

    def _resolve_ocr_upload(self, upload_key: str | None) -> tuple[str | None, str | None]:
        if not upload_key:
            return None, None
        resolved = self.upload_storage.resolve_upload(upload_key)
        if resolved is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OCR image was not found. Please upload it again.",
            )
        return resolved

    def _decorate_operator_handoff(self, assistant_text: str, *, should_escalate: bool) -> str:
        normalized = assistant_text.strip()
        if not should_escalate:
            return normalized
        handoff = (
            "Передаю обращение оператору. Он подключится к этой переписке, "
            "увидит последние сообщения и продолжит разбор."
        )
        if not normalized:
            return handoff
        if "оператор" in normalized.lower() and "переписк" in normalized.lower():
            return normalized
        return f"{normalized}\n\n{handoff}"

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
            citations = response.get("citations") or []
            should_escalate = bool(response.get("should_escalate"))
            if not assistant_text:
                raise ValueError("Assistant response is empty.")
            assistant_text = self._decorate_operator_handoff(
                assistant_text,
                should_escalate=should_escalate,
            )
            ticket.assistant_resolved = not should_escalate
            ticket.scope = "ticket" if should_escalate else "assistant"
        except (httpx.HTTPError, ValueError, RuntimeError):
            assistant_text = (
                "Ассистент временно недоступен. Обращение сохранено, пожалуйста попробуйте "
                "написать еще раз чуть позже или дождитесь подключения оператора."
            )
            citations = []
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
            citations_json=json.dumps(citations, ensure_ascii=False) if citations else None,
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
        image_url, image_name = self._resolve_ocr_upload(payload.ocr_upload_key)
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
            image_url=image_url,
            image_name=image_name,
            created_at=now,
            processed_at=now,
        )
        await self.repository.add_ticket(ticket)
        await self.repository.add_message(message)
        await self.repository.commit()
        ticket = await self._reload_ticket(ticket)
        await self._respond_with_ai(ticket=ticket, user_message=message, history=ticket.messages)
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
        image_url, image_name = self._resolve_ocr_upload(payload.ocr_upload_key)
        message = Message(
            id=f"message-{uuid4().hex}",
            ticket_id=ticket.id,
            source_system=f"client_{ticket.channel}",
            source_message_id=payload.source_message_id or uuid4().hex,
            role="user",
            author_login=current_user.login,
            text=payload.text,
            image_url=image_url,
            image_name=image_name,
            created_at=now,
            processed_at=now,
        )
        ticket.updated_at = now
        await self.repository.add_message(message)
        await self.repository.commit()
        ticket = await self._reload_ticket(ticket)
        if self.can_self_close(ticket):
            return ticket
        await self._respond_with_ai(
            ticket=ticket,
            user_message=message,
            history=ticket.messages,
        )
        return await self._reload_ticket(ticket)

    async def close_request(
        self,
        *,
        current_user: User,
        request_id: str,
    ) -> Ticket:
        ticket = await self.get_request(current_user=current_user, request_id=request_id)
        if ticket.status == "closed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Request is already closed.",
            )
        if not self.can_self_close(ticket):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Request cannot be closed yet.",
            )

        now = datetime.now(timezone.utc)
        ticket.status = "closed"
        ticket.closed_at = now
        ticket.updated_at = now
        ticket.rating_request_sent = True
        await self.repository.commit()
        return await self._reload_ticket(ticket)

    async def submit_rating(
        self,
        *,
        current_user: User,
        request_id: str,
        score: int,
    ) -> Ticket:
        ticket = await self.get_request(current_user=current_user, request_id=request_id)
        if ticket.status != "closed":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Request must be closed before rating.",
            )
        if ticket.csat is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Rating was already submitted.",
            )

        ticket.csat = float(score)
        ticket.rating_request_sent = True
        ticket.updated_at = datetime.now(timezone.utc)
        await self.repository.commit()
        return await self._reload_ticket(ticket)
