from __future__ import annotations

import json
import unittest
from pathlib import Path

from ai_agent.schemas.inference import AgentRespondRequest, AgentSettingsPayload
from ai_agent.services.answer_service import AnswerService
from ai_agent.services.confidence_service import ConfidenceService
from ai_agent.services.dialog_orchestrator import DialogOrchestrator
from ai_agent.services.mode_router import ModeRouter
from ai_agent.services.rerank_service import RerankService
from ai_agent.services.retrieval_service import RetrievalService
from ai_agent.services.ticket_draft_service import TicketDraftService


class FakeEmbedder:
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]


class FixtureRepository:
    def __init__(self, *, ticket_hits=None, ticket_hits_sequence=None, article_hits=None, article_hits_sequence=None) -> None:
        self.ticket_hits = ticket_hits
        self.ticket_hits_sequence = list(ticket_hits_sequence or [])
        self.article_hits = article_hits
        self.article_hits_sequence = list(article_hits_sequence or [])

    def search_ticket_cases(self, query_vector, limit, query_filter=None):
        if self.ticket_hits_sequence:
            return self.ticket_hits_sequence.pop(0)
        return self.ticket_hits

    def search_article_chunks(self, query_vector, limit, query_filter=None):
        if self.article_hits_sequence:
            return self.article_hits_sequence.pop(0)
        return self.article_hits


class RagEvalTests(unittest.IsolatedAsyncioTestCase):
    async def test_eval_cases_have_expected_ticket_ids_and_decisions(self) -> None:
        fixture_path = Path(__file__).resolve().parent / "fixtures" / "rag_eval_cases.json"
        self.assertTrue(fixture_path.exists())
        cases = json.loads(fixture_path.read_text(encoding="utf-8"))

        for case in cases:
            orchestrator = DialogOrchestrator(
                mode_router=ModeRouter(),
                retrieval_service=RetrievalService(
                    repository=FixtureRepository(
                        ticket_hits=case.get("ticket_hits"),
                        ticket_hits_sequence=case.get("ticket_hits_sequence"),
                        article_hits=case.get("article_hits"),
                        article_hits_sequence=case.get("article_hits_sequence"),
                    ),
                    embedder=FakeEmbedder(),
                ),
                rerank_service=RerankService(),
                confidence_service=ConfidenceService(),
                answer_service=AnswerService(),
                ticket_draft_service=TicketDraftService(),
            )

            response = await orchestrator.respond(
                AgentRespondRequest(
                    appeal_id="appeal-1",
                    message_id="message-1",
                    employee_login="ivanov",
                    user_text=case["query"],
                    history=[],
                    settings=AgentSettingsPayload(**case["settings"]),
                )
            )

            self.assertEqual(response.mode, case["expected_mode"], case["name"])
            self.assertEqual(response.decision, case["expected_decision"], case["name"])
            self.assertEqual(response.top_ticket_ids, case["expected_top_ticket_ids"], case["name"])
            self.assertEqual(response.should_escalate, case["expected_should_escalate"], case["name"])
            if "expected_used_articles" in case:
                self.assertEqual(response.used_articles, case["expected_used_articles"], case["name"])
            if "expected_missing_fields" in case:
                self.assertIsNotNone(response.suggested_ticket, case["name"])
                self.assertEqual(response.suggested_ticket.missing_fields, case["expected_missing_fields"], case["name"])
            if "expected_suggested_service" in case:
                self.assertIsNotNone(response.suggested_ticket, case["name"])
                self.assertEqual(response.suggested_ticket.suggested_service, case["expected_suggested_service"], case["name"])


if __name__ == "__main__":
    unittest.main()
