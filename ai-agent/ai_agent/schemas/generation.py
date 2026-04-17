from __future__ import annotations

import datetime as dt
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class Citation(BaseModel):
    """A single citation used in the assistant response."""

    source_type: str
    source_id: str
    title: str | None = None
    snippet: str | None = None


class TicketDraftSuggestion(BaseModel):
    """Suggested draft for creating a service-desk ticket."""

    normalized_request: str
    missing_fields: list[str] = Field(default_factory=list)
    clarifying_questions: list[str] = Field(default_factory=list)
    suggested_service: str | None = None
    suggested_task_type: str | None = None
    suggested_priority: str | None = None
    evidence_ticket_ids: list[int] = Field(default_factory=list)
    evidence_summary: str | None = None


class AgentRespondResponse(BaseModel):
    """Structured response returned from ai-agent to backend."""

    mode: Literal["resolve_issue", "create_ticket"]
    decision: Literal["answer", "clarify", "escalate"]
    assistant_message: str
    message: str | None = None
    citations: list[Citation] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    should_escalate: bool | None = None
    ticket_draft: dict[str, Any] | None = None
    used_articles: bool = False
    top_ticket_ids: list[str] = Field(default_factory=list)
    suggested_ticket: TicketDraftSuggestion | None = None
    retrieval_stats: dict[str, int] = Field(default_factory=dict)
    resolved_by: Literal["assistant", "human"] = "assistant"
    processed_at: dt.datetime

    @model_validator(mode="after")
    def populate_backend_contract(self) -> "AgentRespondResponse":
        if self.message is None:
            self.message = self.assistant_message
        if self.should_escalate is None:
            self.should_escalate = self.decision == "escalate"
        if self.ticket_draft is None and self.suggested_ticket is not None:
            self.ticket_draft = self.suggested_ticket.model_dump(mode="json")
        return self
