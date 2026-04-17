from __future__ import annotations

from pydantic import BaseModel


class IndexingStats(BaseModel):
    """Summary of indexing activity."""

    ticket_cases: int = 0
    article_chunks: int = 0
