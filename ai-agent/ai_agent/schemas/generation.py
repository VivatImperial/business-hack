from __future__ import annotations

import datetime as dt
from typing import Literal

from pydantic import BaseModel, Field


class Citation(BaseModel):
    """A single citation used in the assistant response."""

    source_type: str
    source_id: str
    title: str | None = None
    snippet: str | None = None


class TicketDraftSuggestion(BaseModel):
    """Suggested draft for creating a service-desk ticket."""

    normalized_request: str
    suggested_service: str | None = None
    suggested_task_type: str | None = None
    suggested_priority: str | None = None
    evidence_ticket_ids: list[int] = Field(default_factory=list)


class AgentRespondResponse(BaseModel):
    """Structured response returned from ai-agent to backend."""

    mode: Literal["resolve_issue", "create_ticket"]
    decision: Literal["answer", "clarify", "escalate"]
    assistant_message: str
    citations: list[Citation] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    used_articles: bool = False
    top_ticket_ids: list[str] = Field(default_factory=list)
    suggested_ticket: TicketDraftSuggestion | None = None
    retrieval_stats: dict[str, int] = Field(default_factory=dict)
    resolved_by: Literal["assistant", "human"] = "assistant"
    processed_at: dt.datetime
