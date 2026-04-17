from __future__ import annotations

import re

from ai_agent.schemas.retrieval import RetrievalResult


REJECTION_RE = re.compile(
    r"(не актуаль|отменен|отмена|отказан|отказано|невозможн|доступ запрещен|ошибки нет)",
    re.IGNORECASE,
)


class ConfidenceService:
    """Decide whether the agent can answer, should clarify, or escalate."""

    def decide(self, *, mode: str, retrieval: RetrievalResult, threshold: float) -> str:
        if mode == "create_ticket":
            return "answer" if retrieval.tickets else "clarify"

        if not retrieval.tickets:
            return "escalate"

        top_ticket = retrieval.tickets[0]
        if self._is_conflicting(top_ticket.payload):
            return "escalate"

        if top_ticket.score >= threshold and not bool(top_ticket.payload.get("candidate_for_abstain")):
            return "answer"

        if retrieval.articles and top_ticket.score >= max(0.45, threshold - 0.15):
            return "answer"

        if top_ticket.score >= max(0.35, threshold - 0.2):
            return "clarify"
        return "escalate"

    def confidence(self, retrieval: RetrievalResult) -> float:
        if not retrieval.tickets:
            return 0.0
        return min(1.0, max(0.0, retrieval.tickets[0].score))

    def _is_conflicting(self, payload: dict) -> bool:
        if not bool(payload.get("is_actionable", True)):
            return True
        text = "\n".join(
            [
                str(payload.get("status") or ""),
                str(payload.get("resolution_text") or ""),
            ]
        )
        return bool(REJECTION_RE.search(text))
