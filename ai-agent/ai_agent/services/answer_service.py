from __future__ import annotations

from typing import Any

from ai_agent.agents.support_agent.prompt_storage.abstain import ABSTAIN_PROMPT
from ai_agent.agents.support_agent.prompt_storage.create_ticket import CREATE_TICKET_PROMPT
from ai_agent.agents.support_agent.prompt_storage.resolve_issue import RESOLVE_ISSUE_PROMPT
from ai_agent.schemas.generation import Citation, TicketDraftSuggestion
from ai_agent.schemas.retrieval import RetrievalResult


class AnswerService:
    """Build assistant-facing messages, optionally via YandexGPT."""

    def __init__(self, *, generator_client: Any | None = None) -> None:
        self.generator_client = generator_client

    async def build_resolve_issue_answer(
        self,
        *,
        user_text: str,
        retrieval: RetrievalResult,
        tone_of_voice: str,
        history: list[Any] | None = None,
    ) -> str:
        if self.generator_client and self.generator_client.is_configured:
            context = self._build_context(retrieval)
            dialog_history = self._build_dialog_history(history)
            user_prompt = (
                f"Tone: {tone_of_voice}\n\n"
                + (f"Conversation history:\n{dialog_history}\n\n" if dialog_history else "")
                + f"Current user request:\n{user_text}\n\n"
                + f"Context:\n{context}"
            )
            response = await self.generator_client.generate(
                system_prompt=RESOLVE_ISSUE_PROMPT,
                user_prompt=user_prompt,
            )
            if response:
                return self._append_sources(response, retrieval)

        if retrieval.tickets:
            top_ticket = retrieval.tickets[0]
            resolution = top_ticket.payload.get("resolution_text") or "Надежного решения в исторических тикетах не найдено."
            return self._append_sources(f"По похожим кейсам попробуйте: {resolution}", retrieval)
        return "Надежного решения по найденному контексту нет."

    async def build_create_ticket_message(
        self,
        *,
        draft: TicketDraftSuggestion,
        tone_of_voice: str,
    ) -> str:
        if self.generator_client and self.generator_client.is_configured:
            user_prompt = (
                f"Тон ответа: {tone_of_voice}\n\n"
                f"Нормализованный запрос: {draft.normalized_request}\n"
                f"Service: {draft.suggested_service}\n"
                f"TaskType: {draft.suggested_task_type}\n"
                f"Priority: {draft.suggested_priority}\n"
                f"Evidence ticket ids: {draft.evidence_ticket_ids}"
            )
            response = await self.generator_client.generate(
                system_prompt=CREATE_TICKET_PROMPT,
                user_prompt=user_prompt,
            )
            if response:
                return response

        return (
            "Подготовил черновик заявки. "
            f"Формулировка: {draft.normalized_request}. "
            f"Рекомендуемые Service/TaskType/Priority: "
            f"{draft.suggested_service or 'н/д'} / "
            f"{draft.suggested_task_type or 'н/д'} / "
            f"{draft.suggested_priority or 'н/д'}."
        )

    def build_clarify_message(self, *, draft: TicketDraftSuggestion | None = None) -> str:
        if draft and draft.clarifying_questions:
            return draft.clarifying_questions[0]
        return "Уточните, пожалуйста, на каком устройстве и в какой системе возникает проблема."

    def build_escalation_message(self) -> str:
        return (
            f"{ABSTAIN_PROMPT.splitlines()[0]} "
            "Лучше оформить заявку или передать обращение специалисту."
        )

    def build_citations(self, retrieval: RetrievalResult) -> list[Citation]:
        citations: list[Citation] = []
        for hit in self._context_hits(retrieval):
            citations.append(
                Citation(
                    source_type=str(hit.payload.get("source_type") or "unknown"),
                    source_id=hit.point_id,
                    title=hit.payload.get("title")
                    or hit.payload.get("service")
                    or hit.payload.get("request_text")
                    or hit.point_id,
                    snippet=(
                        hit.payload.get("resolution_text")
                        or hit.payload.get("chunk_markdown")
                        or hit.payload.get("request_text")
                        or ""
                    )[:240]
                    or None,
                )
            )
        return citations

    def _build_context(self, retrieval: RetrievalResult) -> str:
        parts = []
        for index, hit in enumerate(self._context_hits(retrieval), start=1):
            text = hit.payload.get("resolution_text") or hit.payload.get("chunk_markdown") or hit.payload.get("request_text") or ""
            title = hit.payload.get("title") or hit.payload.get("service") or hit.point_id
            parts.append(f"[{index}] SOURCE: {title}\n{text}")
        return "\n\n".join(parts)

    def _build_dialog_history(self, history: list[Any] | None) -> str:
        if not history:
            return ""

        role_map = {
            "user": "User",
            "assistant": "Assistant",
            "system": "System",
        }
        lines: list[str] = []
        for item in history[-6:]:
            role_key = getattr(item, "role", None)
            if role_key is None and isinstance(item, dict):
                role_key = item.get("role")
            role = role_map.get(role_key, "System")

            content = getattr(item, "content", None)
            if content is None and isinstance(item, dict):
                content = item.get("content")
            if not content:
                continue

            normalized = str(content).strip()
            if normalized:
                lines.append(f"{role}: {normalized}")
        return "\n".join(lines)

    def _append_sources(self, answer: str, retrieval: RetrievalResult) -> str:
        citations = self.build_citations(retrieval)
        if not citations:
            return answer.strip()

        source_lines = ["", "**Источники:**"]
        for index, citation in enumerate(citations, start=1):
            title = citation.title or citation.source_id
            source_lines.append(f"[{index}] {title}")
        return "\n".join([answer.strip(), *source_lines]).strip()

    def _context_hits(self, retrieval: RetrievalResult):
        return [*retrieval.tickets[:3], *retrieval.articles[:3]]
