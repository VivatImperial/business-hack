from __future__ import annotations

from pydantic import BaseModel, Field


class RetrievedDocument(BaseModel):
    """Normalized retrieval hit returned from vector search."""

    point_id: str
    score: float
    payload: dict


class RetrievalResult(BaseModel):
    """Combined retrieval result for ticket-first RAG."""

    tickets: list[RetrievedDocument] = Field(default_factory=list)
    articles: list[RetrievedDocument] = Field(default_factory=list)
    used_articles: bool = False
