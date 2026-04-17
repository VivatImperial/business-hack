from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status

from backend.app.db.session import Database
from backend.app.db.repositories.admin import AdminRepository
from backend.app.services.ai_agent_service import AiAgentService
from backend.app.schemas.admin import (
    DashboardSummaryResponse,
    MessagesTimeseriesPoint,
    MessagesTimeseriesResponse,
    PeriodValue,
)

PERIOD_TO_DELTA: dict[PeriodValue, timedelta] = {
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
    "90d": timedelta(days=90),
}

PERIOD_TO_BUCKET: dict[PeriodValue, timedelta] = {
    "1h": timedelta(minutes=10),
    "6h": timedelta(hours=1),
    "24h": timedelta(hours=6),
    "7d": timedelta(days=1),
    "30d": timedelta(days=5),
    "90d": timedelta(days=15),
}


def ensure_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class DashboardService:
    def __init__(
        self,
        repository: AdminRepository,
        *,
        database: Database,
        ai_agent_service: AiAgentService,
    ) -> None:
        self.repository = repository
        self.database = database
        self.ai_agent_service = ai_agent_service

    @staticmethod
    def parse_period(period: str) -> PeriodValue:
        if period not in PERIOD_TO_DELTA:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid period.",
            )
        return period  # type: ignore[return-value]

    async def get_summary(self, period: str) -> DashboardSummaryResponse:
        period_value = self.parse_period(period)
        since = datetime.now(timezone.utc) - PERIOD_TO_DELTA[period_value]

        database_healthy = await self._is_database_healthy()
        ai_agent_healthy = await self._is_ai_agent_healthy()
        healthy_checks_count = sum((database_healthy, ai_agent_healthy))
        total_checks_count = 2

        if total_checks_count == 0 or healthy_checks_count == 0:
            health = "down"
        elif healthy_checks_count == total_checks_count:
            health = "healthy"
        else:
            health = "degraded"

        recent_tickets = await self.repository.list_tickets_created_since(since)
        open_appeals_count = sum(1 for ticket in recent_tickets if ticket.status == "open")
        in_progress_appeals_count = sum(
            1 for ticket in recent_tickets if ticket.status == "in_progress"
        )

        closed_tickets = await self.repository.list_closed_tickets_since(since)
        closed_appeals_count = len(closed_tickets)
        assistant_closed_count = sum(1 for ticket in closed_tickets if ticket.assistant_resolved)

        if closed_appeals_count:
            resolution_minutes = [
                (ensure_utc(ticket.closed_at) - ensure_utc(ticket.created_at)).total_seconds() / 60
                for ticket in closed_tickets
                if ticket.closed_at is not None
            ]
            avg_resolution_minutes = sum(resolution_minutes) / closed_appeals_count
            assistant_resolution_rate = assistant_closed_count / closed_appeals_count
        else:
            avg_resolution_minutes = 0.0
            assistant_resolution_rate = 0.0

        rated_scores = [ticket.csat for ticket in closed_tickets if ticket.csat is not None]
        csat_avg = sum(rated_scores) / len(rated_scores) if rated_scores else None

        return DashboardSummaryResponse(
            health=health,
            open_appeals_count=open_appeals_count,
            in_progress_appeals_count=in_progress_appeals_count,
            assistant_resolution_rate=assistant_resolution_rate,
            avg_resolution_minutes=avg_resolution_minutes,
            csat_avg=csat_avg,
        )

    async def _is_database_healthy(self) -> bool:
        try:
            return await self.database.ping()
        except Exception:
            return False

    async def _is_ai_agent_healthy(self) -> bool:
        try:
            payload = await self.ai_agent_service.get_health()
        except (httpx.HTTPError, ValueError):
            return False
        checks = payload.get("checks", {})
        return bool(checks.get("api")) and bool(checks.get("dialog_orchestrator"))

    async def get_messages_timeseries(self, period: str) -> MessagesTimeseriesResponse:
        period_value = self.parse_period(period)
        since = datetime.now(timezone.utc) - PERIOD_TO_DELTA[period_value]
        bucket_size = PERIOD_TO_BUCKET[period_value]
        messages = await self.repository.list_messages_since(since)

        bucketed_counts: dict[datetime, int] = defaultdict(int)
        for message in messages:
            processed_at = ensure_utc(message.processed_at)
            delta = processed_at - since
            bucket_index = int(delta.total_seconds() // bucket_size.total_seconds())
            bucket_start = since + bucket_size * bucket_index
            bucketed_counts[bucket_start] += 1

        points = [
            MessagesTimeseriesPoint(ts=timestamp, messages_count=count)
            for timestamp, count in sorted(bucketed_counts.items(), key=lambda item: item[0])
        ]

        return MessagesTimeseriesResponse(
            period=period_value,
            total_messages=sum(point.messages_count for point in points),
            points=points,
        )
