from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PeriodValue = Literal["1h", "6h", "24h", "7d", "30d", "90d"]
AppealScope = Literal["ticket", "assistant", "all"]
AppealStatusFilter = Literal["in_progress", "closed"]
AppealScopeValue = Literal["ticket", "assistant"]
AppealStatusValue = Literal["open", "in_progress", "closed"]
AppealPriorityValue = Literal["p1", "p2", "p3", "p4"]
HealthValue = Literal["healthy", "degraded", "down"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str


class AdminMeResponse(BaseModel):
    id: str
    login: str


class DashboardSummaryResponse(BaseModel):
    health: HealthValue
    open_appeals_count: int
    in_progress_appeals_count: int
    assistant_resolution_rate: float
    avg_resolution_minutes: float
    csat_avg: float | None


class MessagesTimeseriesPoint(BaseModel):
    ts: datetime
    messages_count: int


class MessagesTimeseriesResponse(BaseModel):
    period: PeriodValue
    total_messages: int
    points: list[MessagesTimeseriesPoint]


class AppealsListQuery(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    scope: AppealScope = "all"
    status: AppealStatusFilter | None = None


class AppealListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    employee_login: str
    scope: AppealScopeValue
    status: AppealStatusValue
    priority: AppealPriorityValue
    category: str
    processing_duration_minutes: int
    closed_at: datetime | None
    csat: float | None


class AppealsListResponse(BaseModel):
    items: list[AppealListItemResponse]


class AppealDetailResponse(AppealListItemResponse):
    created_at: datetime


class AppealStatusResponse(BaseModel):
    id: str
    status: Literal["in_progress"]


class AppealCloseResponse(BaseModel):
    id: str
    status: Literal["closed"]
    closed_at: datetime


class AppealRatingResponse(BaseModel):
    id: str
    rating_request_sent: bool


class AssistantSettingsResponse(BaseModel):
    tone_of_voice: str
    confidence_threshold: float
    top_k: int
    use_articles: bool


class AssistantSettingsUpdateRequest(BaseModel):
    tone_of_voice: str = Field(min_length=1)
    confidence_threshold: float = Field(ge=0.0, le=1.0)
    top_k: int = Field(ge=1)
    use_articles: bool

    @field_validator("tone_of_voice")
    @classmethod
    def normalize_tone_of_voice(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("tone_of_voice must not be blank")
        return normalized
