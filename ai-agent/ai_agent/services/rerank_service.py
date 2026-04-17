from __future__ import annotations

import re

from ai_agent.schemas.retrieval import RetrievedDocument


REJECTION_RE = re.compile(
    r"(не актуаль|отменен|отмена|отказан|отказано|невозможн|доступ запрещен|ошибки нет)",
    re.IGNORECASE,
)
TOKEN_RE = re.compile(r"[\w-]+", re.UNICODE)
STOPWORDS = {
    "не",
    "и",
    "в",
    "на",
    "по",
    "с",
    "для",
    "как",
    "что",
    "это",
    "при",
    "тип",
}


class RerankService:
    """KISS reranking layer for ticket candidates."""

    def rerank_tickets(
        self,
        tickets: list[RetrievedDocument],
        *,
        user_text: str = "",
        query_hints: list[str] | None = None,
    ) -> list[RetrievedDocument]:
        resolved_hints = query_hints or []
        reranked: list[RetrievedDocument] = []
        for item in tickets:
            reranked.append(item.model_copy(update={"score": self._score(item, user_text=user_text, query_hints=resolved_hints)}))
        return sorted(reranked, key=lambda item: item.score, reverse=True)

    def _score(self, item: RetrievedDocument, *, user_text: str, query_hints: list[str]) -> float:
        payload = item.payload
        score = float(item.score)

        if payload.get("resolution_quality") == "strong":
            score += 0.2
        else:
            score -= 0.05

        if payload.get("candidate_for_abstain"):
            score -= 0.2

        if not bool(payload.get("is_actionable", True)):
            score -= 0.35

        if self._looks_like_rejection(payload):
            score -= 1.0

        score += 0.1 * self._domain_overlap(query_hints, payload)
        score += 0.04 * self._text_overlap(user_text, payload)

        resolution_text = str(payload.get("resolution_text") or "")
        if len(resolution_text.split()) >= 6:
            score += 0.05

        return score

    def _looks_like_rejection(self, payload: dict) -> bool:
        text = "\n".join(
            [
                str(payload.get("status") or ""),
                str(payload.get("resolution_text") or ""),
            ]
        )
        return bool(REJECTION_RE.search(text))

    def _domain_overlap(self, query_hints: list[str], payload: dict) -> int:
        domain_tags = {str(item).lower() for item in (payload.get("domain_tags") or [])}
        return len(domain_tags.intersection({hint.lower() for hint in query_hints}))

    def _text_overlap(self, user_text: str, payload: dict) -> int:
        query_tokens = self._tokenize(user_text)
        payload_text = " ".join(
            [
                str(payload.get("service") or ""),
                str(payload.get("task_type") or ""),
                str(payload.get("request_text") or ""),
            ]
        )
        payload_tokens = self._tokenize(payload_text)
        return len(query_tokens.intersection(payload_tokens))

    def _tokenize(self, text: str) -> set[str]:
        return {
            token.lower()
            for token in TOKEN_RE.findall(text)
            if token and token.lower() not in STOPWORDS and len(token) > 2
        }
