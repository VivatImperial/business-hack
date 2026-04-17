from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class HistoryMessage(BaseModel):
    """A single message from the backend-provided appeal history."""

    role: Literal["user", "assistant", "system"]
    content: str

    @model_validator(mode="before")
    @classmethod
    def normalize_message_payload(cls, value):
        if isinstance(value, dict) and "content" not in value and "text" in value:
            return {**value, "content": value["text"]}
        return value


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
    employee_login: str
    user_text: str
    history: list[HistoryMessage]
    settings: AgentSettingsPayload
