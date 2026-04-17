from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    """A single message from the backend-provided appeal history."""

    role: Literal["user", "assistant", "system"]
    content: str


class AgentSettingsPayload(BaseModel):
    """Runtime settings provided by the backend orchestrator."""

    tone_of_voice: str
    confidence_threshold: float = Field(ge=0.0, le=1.0)
    top_k: int = Field(ge=1, le=20)
    use_articles: bool = True


class AgentRespondRequest(BaseModel):
    """Internal request from backend to the ai-agent service."""

    appeal_id: str
    message_id: str
    employee_login: str | None = None
    user_text: str
    history: list[HistoryMessage]
    settings: AgentSettingsPayload
