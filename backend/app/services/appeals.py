from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from backend.app.db.models.entities import Ticket
from backend.app.db.repositories.admin import AdminRepository
from backend.app.schemas.admin import AppealsListQuery


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
            ticket.status = "closed"
            ticket.closed_at = datetime.now(timezone.utc)
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
