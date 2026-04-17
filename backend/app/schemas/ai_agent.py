from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from backend.app.schemas.admin import AssistantSettingsResponse


class AiAgentHealthChecks(BaseModel):
    api: bool
    dialog_orchestrator: bool


class AiAgentHealthResponse(BaseModel):
    status: str
    service: str
    checks: AiAgentHealthChecks


class AiAgentRespondRequest(BaseModel):
    appeal_id: str
    message_id: str
    employee_login: str
    user_text: str
    history: list[dict[str, Any]]
    settings: AssistantSettingsResponse


class AiAgentRespondResponse(BaseModel):
    mode: str
    message: str
    citations: list[dict[str, Any]] = Field(default_factory=list)
    confidence: float
    should_escalate: bool
    ticket_draft: dict[str, Any] | None
