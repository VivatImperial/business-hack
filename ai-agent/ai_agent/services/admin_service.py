from __future__ import annotations

import datetime as dt
import hashlib
from copy import deepcopy
from typing import Any

from fastapi import HTTPException, status

from ai_agent.config import Settings
from ai_agent.schemas.admin import (
    AdminMeResponse,
    AdminSettingsPayload,
    AppealDetailResponse,
    AppealListItem,
    AppealStatusResponse,
    AppealsListResponse,
    DashboardSummaryResponse,
    MessageTimeseriesPoint,
    MessagesTimeseriesResponse,
    RatingRequestResponse,
)


def _minutes_between(start: dt.datetime, end: dt.datetime) -> int:
    return int((end - start).total_seconds() // 60)


class AdminService:
    """Simple seeded admin layer used by the ai-agent demo service."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.user = {
            "id": "admin-user",
            "login": settings.admin_login,
            "email": settings.admin_email,
            "password": settings.admin_password,
        }
        self._admin_settings = {
            "tone_of_voice": "helpful",
            "confidence_threshold": 0.7,
            "top_k": 5,
            "use_articles": True,
        }
        self._seed_state()

    def authenticate(self, email: str, password: str) -> str:
        if email != self.user["email"] or password != self.user["password"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        return self._build_token(email)

    def require_token(self, authorization: str | None) -> None:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
        token = authorization.split(" ", 1)[1]
        if token != self._build_token(self.user["email"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    def get_me(self) -> AdminMeResponse:
        return AdminMeResponse(id=self.user["id"], login=self.user["login"])

    def get_dashboard_summary(self) -> DashboardSummaryResponse:
        closed_appeals = [item for item in self._appeals.values() if item["status"] == "closed"]
        assistant_closed = [item for item in closed_appeals if item["resolved_by"] == "assistant"]
        csat_scores = [item["csat"] for item in closed_appeals if item["csat"] is not None]
        resolution_minutes = [item["resolution_minutes"] for item in closed_appeals]

        return DashboardSummaryResponse(
            health="degraded",
            open_appeals_count=sum(1 for item in self._appeals.values() if item["status"] == "open"),
            in_progress_appeals_count=sum(1 for item in self._appeals.values() if item["status"] == "in_progress"),
            assistant_resolution_rate=(len(assistant_closed) / len(closed_appeals)) if closed_appeals else 0.0,
            avg_resolution_minutes=(sum(resolution_minutes) / len(resolution_minutes)) if resolution_minutes else 0.0,
            csat_avg=(sum(csat_scores) / len(csat_scores)) if csat_scores else None,
        )

    def get_messages_timeseries(self, period: str) -> MessagesTimeseriesResponse:
        points = [
            MessageTimeseriesPoint(ts=item["processed_at"], messages_count=1)
            for item in self._messages
        ]
        return MessagesTimeseriesResponse(
            period=period,
            total_messages=len(self._messages),
            points=points,
        )

    def list_appeals(self, *, scope: str | None = None, status_value: str | None = None) -> AppealsListResponse:
        items = list(self._appeals.values())
        if scope and scope != "all":
            items = [item for item in items if item["scope"] == scope]
        if status_value:
            items = [item for item in items if item["status"] == status_value]
        return AppealsListResponse(items=[self._to_list_item(item) for item in items])

    def get_appeal(self, appeal_id: str) -> AppealDetailResponse:
        item = self._appeals.get(appeal_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appeal not found.")
        return self._to_detail_item(item)

    def take_appeal(self, appeal_id: str) -> AppealStatusResponse:
        item = self._get_mutable_appeal(appeal_id)
        if item["status"] == "closed":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Appeal already closed.")
        item["status"] = "in_progress"
        return AppealStatusResponse(id=appeal_id, status="in_progress")

    def close_appeal(self, appeal_id: str) -> AppealStatusResponse:
        item = self._get_mutable_appeal(appeal_id)
        now = dt.datetime.now(dt.UTC)
        item["status"] = "closed"
        item["closed_at"] = now
        item["resolution_minutes"] = _minutes_between(item["created_at"], now)
        item["resolved_by"] = "assistant"
        return AppealStatusResponse(id=appeal_id, status="closed", closed_at=now)

    def request_rating(self, appeal_id: str) -> RatingRequestResponse:
        item = self._get_mutable_appeal(appeal_id)
        if item["status"] != "closed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating request can only be sent for closed appeals.",
            )
        item["rating_request_sent"] = True
        return RatingRequestResponse(id=appeal_id, rating_request_sent=True)

    def get_settings(self) -> AdminSettingsPayload:
        return AdminSettingsPayload(**self._admin_settings)

    def update_settings(self, payload: AdminSettingsPayload) -> AdminSettingsPayload:
        self._admin_settings = payload.model_dump()
        return AdminSettingsPayload(**self._admin_settings)

    def _build_token(self, email: str) -> str:
        data = f"{self.settings.jwt_secret}:{email}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()

    def _seed_state(self) -> None:
        now = dt.datetime.now(dt.UTC)
        self._appeals: dict[str, dict[str, Any]] = {
            "appeal-1": {
                "id": "appeal-1",
                "employee_login": "ivanov",
                "scope": "assistant",
                "status": "open",
                "priority": "p3",
                "category": "VPN",
                "created_at": now - dt.timedelta(minutes=45),
                "closed_at": None,
                "csat": None,
                "resolution_minutes": None,
                "resolved_by": None,
                "rating_request_sent": False,
            },
            "appeal-2": {
                "id": "appeal-2",
                "employee_login": "petrova",
                "scope": "assistant",
                "status": "in_progress",
                "priority": "p2",
                "category": "1C",
                "created_at": now - dt.timedelta(minutes=30),
                "closed_at": None,
                "csat": None,
                "resolution_minutes": None,
                "resolved_by": None,
                "rating_request_sent": False,
            },
            "appeal-3": {
                "id": "appeal-3",
                "employee_login": "sidorov",
                "scope": "ticket",
                "status": "closed",
                "priority": "p2",
                "category": "1C",
                "created_at": now - dt.timedelta(hours=3),
                "closed_at": now - dt.timedelta(hours=2),
                "csat": 4.0,
                "resolution_minutes": 60,
                "resolved_by": "assistant",
                "rating_request_sent": True,
            },
            "appeal-4": {
                "id": "appeal-4",
                "employee_login": "smirnova",
                "scope": "ticket",
                "status": "closed",
                "priority": "p4",
                "category": "Почта",
                "created_at": now - dt.timedelta(hours=5),
                "closed_at": now - dt.timedelta(hours=3),
                "csat": 5.0,
                "resolution_minutes": 120,
                "resolved_by": "human",
                "rating_request_sent": False,
            },
        }
        self._messages = [
            {"processed_at": now - dt.timedelta(hours=4)},
            {"processed_at": now - dt.timedelta(hours=3)},
            {"processed_at": now - dt.timedelta(hours=2)},
            {"processed_at": now - dt.timedelta(hours=1)},
        ]

    def _get_mutable_appeal(self, appeal_id: str) -> dict[str, Any]:
        item = self._appeals.get(appeal_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appeal not found.")
        return item

    def _to_list_item(self, item: dict[str, Any]) -> AppealListItem:
        return AppealListItem(
            id=item["id"],
            employee_login=item["employee_login"],
            scope=item["scope"],
            status=item["status"],
            priority=item["priority"],
            category=item["category"],
            processing_duration_minutes=self._processing_duration_minutes(item),
            closed_at=item["closed_at"],
            csat=item["csat"],
        )

    def _to_detail_item(self, item: dict[str, Any]) -> AppealDetailResponse:
        return AppealDetailResponse(
            id=item["id"],
            employee_login=item["employee_login"],
            scope=item["scope"],
            status=item["status"],
            priority=item["priority"],
            category=item["category"],
            created_at=item["created_at"],
            closed_at=item["closed_at"],
            processing_duration_minutes=self._processing_duration_minutes(item),
            csat=item["csat"],
        )

    def _processing_duration_minutes(self, item: dict[str, Any]) -> int:
        if item["status"] == "closed" and item["closed_at"] is not None:
            return int(item["resolution_minutes"] or _minutes_between(item["created_at"], item["closed_at"]))
        return _minutes_between(item["created_at"], dt.datetime.now(dt.UTC))
