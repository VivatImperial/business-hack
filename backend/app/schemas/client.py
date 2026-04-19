from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

ClientChannel = Literal["web", "telegram"]
ClientRequestStatus = Literal["open", "in_progress", "closed"]
ClientRequestPriority = Literal["p1", "p2", "p3", "p4"]


class ClientLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    telegram_user_id: str | None = None
    telegram_username: str | None = None


class ClientRegisterRequest(ClientLoginRequest):
    login: str = Field(min_length=3, max_length=64)

    @field_validator("login")
    @classmethod
    def normalize_login(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("login must not be blank")
        return normalized


class ClientTokenResponse(BaseModel):
    access_token: str


class TelegramLoginRequest(BaseModel):
    telegram_user_id: str = Field(min_length=1, max_length=64)
    telegram_username: str | None = Field(default=None, max_length=255)


class ClientMeResponse(BaseModel):
    id: str
    login: str
    email: EmailStr
    telegram_user_id: str | None
    telegram_username: str | None


class ClientRequestCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    category: str = Field(default="general", min_length=1, max_length=255)
    priority: ClientRequestPriority = "p3"
    channel: ClientChannel = "web"

    @field_validator("title", "description", "category")
    @classmethod
    def strip_required_fields(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("value must not be blank")
        return normalized


class ClientRequestMessageCreateRequest(BaseModel):
    text: str = Field(min_length=1)
    source_message_id: str | None = Field(default=None, max_length=128)

    @field_validator("text")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("text must not be blank")
        return normalized


class ClientRequestCloseResponse(BaseModel):
    id: str
    status: Literal["closed"]
    closed_at: datetime
    rating_request_sent: bool


class ClientRequestRatingCreateRequest(BaseModel):
    score: int = Field(ge=1, le=5)


class ClientRequestRatingResponse(BaseModel):
    id: str
    csat: float


class ClientOcrResponse(BaseModel):
    text: str
    mime_type: str
    file_name: str | None = None


class ClientRequestQuery(BaseModel):
    channel: ClientChannel | None = None


class ClientRequestMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    author_login: str | None
    text: str
    created_at: datetime


class ClientRequestListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str | None
    description: str | None
    status: ClientRequestStatus
    priority: ClientRequestPriority
    category: str
    channel: ClientChannel
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None
    csat: float | None = None
    assistant_resolved: bool = False
    rating_request_sent: bool = False
    can_self_close: bool = False
    awaiting_csat: bool = False


class ClientRequestDetailResponse(ClientRequestListItemResponse):
    messages: list[ClientRequestMessageResponse]


class ClientRequestsListResponse(BaseModel):
    items: list[ClientRequestListItemResponse]
