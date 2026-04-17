from __future__ import annotations

import re
from typing import Any

from ai_agent.schemas.inference import AgentSettingsPayload
from ai_agent.schemas.retrieval import RetrievedDocument, RetrievalResult


DOMAIN_HINT_RULES = {
    "1с": "1с",
    "отчет": "отчет",
    "всд": "всд",
    "меркур": "меркурий",
    "принтер": "принтер",
    "удален": "удаленка",
    "vpn": "vpn",
    "доступ": "доступ",
    "почт": "почта",
}
QUERY_FILLER_RE = re.compile(
    r"\b(помоги(те)?|подскажи(те)?|пожалуйста|нужно|надо|хочу|можешь|мне|оформить|создать|завести|заявку|тикет)\b",
    re.IGNORECASE,
)
WS_RE = re.compile(r"\s+")


class RetrievalService:
    """Ticket-first retrieval over Qdrant collections."""

    def __init__(self, *, repository: Any, embedder: Any) -> None:
        self.repository = repository
        self.embedder = embedder

    def retrieve(self, user_text: str, *, settings: AgentSettingsPayload) -> RetrievalResult:
        normalized_query = self.build_ticket_query(user_text)
        query_hints = self.extract_query_hints(user_text)
        normalized_tickets = self.retrieve_ticket_candidates(user_text, settings=settings)

        used_articles = False
        normalized_articles: list[RetrievedDocument] = []
        if settings.use_articles and self._should_enrich_with_articles(normalized_tickets):
            top_ticket = normalized_tickets[0] if normalized_tickets else None
            normalized_articles = self.retrieve_article_candidates(
                user_text=user_text,
                normalized_query=normalized_query,
                query_hints=query_hints,
                top_ticket=top_ticket,
                settings=settings,
            )
            used_articles = bool(normalized_articles)

        return RetrievalResult(
            tickets=normalized_tickets,
            articles=normalized_articles,
            used_articles=used_articles,
        )

    def retrieve_ticket_candidates(
        self,
        user_text: str,
        *,
        settings: AgentSettingsPayload,
    ) -> list[RetrievedDocument]:
        ticket_queries = self.build_ticket_queries(user_text)
        merged_hits: dict[str, RetrievedDocument] = {}
        for index, ticket_query in enumerate(ticket_queries):
            query_vector = self.embedder.embed_documents([ticket_query])[0]
            ticket_hits = self.repository.search_ticket_cases(query_vector=query_vector, limit=settings.top_k)
            weight = max(0.95, 1.0 - index * 0.05)
            for hit in ticket_hits:
                normalized = self._normalize_hit(hit)
                weighted_score = normalized.score * weight
                existing = merged_hits.get(normalized.point_id)
                if existing is None:
                    merged_hits[normalized.point_id] = normalized.model_copy(update={"score": weighted_score})
                    continue
                merged_hits[normalized.point_id] = existing.model_copy(
                    update={
                        "score": max(existing.score, weighted_score) + 0.03,
                    }
                )
        return sorted(merged_hits.values(), key=lambda item: item.score, reverse=True)

    def build_ticket_queries(self, user_text: str) -> list[str]:
        normalized_query = self.build_ticket_query(user_text)
        query_hints = self.extract_query_hints(user_text)
        queries: list[str] = [normalized_query]

        raw_query = user_text.strip()
        if raw_query and raw_query.lower() != normalized_query:
            queries.append(raw_query)

        if query_hints:
            hint_query = " ".join(dict.fromkeys(query_hints))
            if hint_query and hint_query not in queries:
                queries.append(hint_query)

        return queries[:2]

    def retrieve_article_candidates(
        self,
        *,
        user_text: str,
        normalized_query: str,
        query_hints: list[str],
        top_ticket: RetrievedDocument | None,
        settings: AgentSettingsPayload,
    ) -> list[RetrievedDocument]:
        article_query = self.build_article_query(
            user_text=user_text,
            normalized_query=normalized_query,
            query_hints=query_hints,
            top_ticket=top_ticket,
        )
        query_vector = self.embedder.embed_documents([article_query])[0]
        article_hits = self.repository.search_article_chunks(query_vector=query_vector, limit=settings.top_k)
        return [self._normalize_hit(hit) for hit in article_hits]

    def build_ticket_query(self, user_text: str) -> str:
        lowered = QUERY_FILLER_RE.sub(" ", user_text.lower())
        lowered = re.sub(r"[^\w\s/-]", " ", lowered)
        lowered = WS_RE.sub(" ", lowered).strip()
        return lowered or user_text.strip().lower()

    def build_article_query(
        self,
        *,
        user_text: str,
        normalized_query: str,
        query_hints: list[str],
        top_ticket: RetrievedDocument | None,
    ) -> str:
        parts = [normalized_query]
        if top_ticket is not None:
            payload = top_ticket.payload
            parts.extend(
                [
                    str(payload.get("request_text") or ""),
                    str(payload.get("service") or ""),
                    str(payload.get("task_type") or ""),
                    " ".join(payload.get("domain_tags") or []),
                ]
            )
        if query_hints:
            parts.append(" ".join(query_hints))
        parts.append(user_text.strip())
        return "\n".join(part for part in parts if part).strip()

    def extract_query_hints(self, user_text: str) -> list[str]:
        lowered = user_text.lower()
        hints: list[str] = []
        for needle, normalized in DOMAIN_HINT_RULES.items():
            if needle in lowered and normalized not in hints:
                hints.append(normalized)
        if "удаленка" in hints:
            if "vpn" not in hints:
                hints.append("vpn")
            if "удаленный доступ" not in hints:
                hints.append("удаленный доступ")
        return hints

    def _normalize_hit(self, hit: Any) -> RetrievedDocument:
        payload = getattr(hit, "payload", None) or hit.get("payload") or {}
        point_id = payload.get("point_id") or getattr(hit, "id", None) or hit.get("id") or hit.get("point_id")
        score = getattr(hit, "score", None)
        if score is None:
            score = hit.get("score", 0.0)
        return RetrievedDocument(point_id=str(point_id), score=float(score), payload=payload)

    def _should_enrich_with_articles(self, tickets: list[RetrievedDocument]) -> bool:
        if not tickets:
            return False
        top_ticket = tickets[0]
        resolution_quality = str(top_ticket.payload.get("resolution_quality") or "")
        candidate_for_abstain = bool(top_ticket.payload.get("candidate_for_abstain"))
        return resolution_quality != "strong" or candidate_for_abstain
