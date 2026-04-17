from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str


class AdminMeResponse(BaseModel):
    id: str
    login: str


class DashboardSummaryResponse(BaseModel):
    health: Literal["healthy", "degraded", "down"]
    open_appeals_count: int
    in_progress_appeals_count: int
    assistant_resolution_rate: float
    avg_resolution_minutes: float
    csat_avg: float | None


class MessageTimeseriesPoint(BaseModel):
    ts: dt.datetime
    messages_count: int


class MessagesTimeseriesResponse(BaseModel):
    period: str
    total_messages: int
    points: list[MessageTimeseriesPoint]


class AppealListItem(BaseModel):
    id: str
    employee_login: str
    scope: Literal["ticket", "assistant"]
    status: Literal["open", "in_progress", "closed"]
    priority: str
    category: str
    processing_duration_minutes: int
    closed_at: dt.datetime | None
    csat: float | None


class AppealsListResponse(BaseModel):
    items: list[AppealListItem]


class AppealDetailResponse(BaseModel):
    id: str
    employee_login: str
    scope: Literal["ticket", "assistant"]
    status: Literal["open", "in_progress", "closed"]
    priority: str
    category: str
    created_at: dt.datetime
    closed_at: dt.datetime | None
    processing_duration_minutes: int
    csat: float | None


class AppealStatusResponse(BaseModel):
    id: str
    status: Literal["in_progress", "closed"]
    closed_at: dt.datetime | None = None


class RatingRequestResponse(BaseModel):
    id: str
    rating_request_sent: bool


class AdminSettingsPayload(BaseModel):
    tone_of_voice: str
    confidence_threshold: float = Field(ge=0.0, le=1.0)
    top_k: int = Field(ge=1)
    use_articles: bool
