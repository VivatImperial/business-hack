from __future__ import annotations

import unittest

from ai_agent.agents.support_agent.prompt_storage.create_ticket import CREATE_TICKET_PROMPT
from ai_agent.agents.support_agent.prompt_storage.resolve_issue import RESOLVE_ISSUE_PROMPT
from ai_agent.schemas.retrieval import RetrievedDocument, RetrievalResult
from ai_agent.services.answer_service import AnswerService


class PromptContractTests(unittest.TestCase):
    def test_resolve_issue_prompt_requires_grounding_and_citations(self) -> None:
        self.assertIn("только по предоставленному контексту", RESOLVE_ISSUE_PROMPT.lower())
        self.assertIn("не выдумывай", RESOLVE_ISSUE_PROMPT.lower())
        self.assertIn("ссылки на источники", RESOLVE_ISSUE_PROMPT.lower())

    def test_create_ticket_prompt_requires_recommendation_not_truth(self) -> None:
        lowered = CREATE_TICKET_PROMPT.lower()
        self.assertIn("как рекомендации", lowered)
        self.assertIn("1-2 уточняющих вопроса", lowered)
        self.assertIn("черновик заявки", lowered)

    def test_answer_service_context_contains_numbered_sources(self) -> None:
        retrieval = RetrievalResult(
            tickets=[
                RetrievedDocument(
                    point_id="ticket:1",
                    score=0.9,
                    payload={
                        "service": "Удаленный доступ / VPN",
                        "resolution_text": "Перезапустите VPN-клиент.",
                    },
                )
            ],
            articles=[
                RetrievedDocument(
                    point_id="article:1:0",
                    score=0.7,
                    payload={
                        "title": "VPN",
                        "chunk_markdown": "Проверьте профиль подключения.",
                    },
                )
            ],
            used_articles=True,
        )

        context = AnswerService()._build_context(retrieval)

        self.assertIn("[1] SOURCE:", context)
        self.assertIn("[2] SOURCE:", context)
        self.assertIn("Удаленный доступ / VPN", context)
        self.assertIn("VPN", context)

    def test_answer_service_appends_human_readable_sources(self) -> None:
        retrieval = RetrievalResult(
            tickets=[
                RetrievedDocument(
                    point_id="ticket:1",
                    score=0.9,
                    payload={
                        "service": "Удаленный доступ / VPN",
                        "resolution_text": "Перезапустите VPN-клиент.",
                    },
                )
            ],
            articles=[],
            used_articles=False,
        )

        answer = AnswerService()._append_sources("Сначала перезапустите VPN-клиент. [1]", retrieval)

        self.assertIn("**Источники:**", answer)
        self.assertIn("[1] Удаленный доступ / VPN", answer)


if __name__ == "__main__":
    unittest.main()
