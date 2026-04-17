from __future__ import annotations

import unittest

from ai_agent.schemas.inference import AgentSettingsPayload
from ai_agent.schemas.retrieval import RetrievedDocument, RetrievalResult
from ai_agent.services.confidence_service import ConfidenceService
from ai_agent.services.rerank_service import RerankService
from ai_agent.services.retrieval_service import RetrievalService


class FakeEmbedder:
    def __init__(self) -> None:
        self.queries: list[str] = []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.queries.extend(texts)
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeRepository:
    def __init__(self) -> None:
        self.article_searches = 0

    def search_ticket_cases(self, query_vector, limit, query_filter=None):
        return [
            {
                "id": "ticket:10",
                "score": 0.58,
                "payload": {
                    "request_text": "Не подключается удаленка через VPN",
                    "resolution_text": "Перезапустили клиент.",
                    "resolution_quality": "weak",
                    "candidate_for_abstain": True,
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "domain_tags": ["vpn", "удаленка"],
                    "is_actionable": True,
                    "status": "Закрыта",
                },
            }
        ]

    def search_article_chunks(self, query_vector, limit, query_filter=None):
        self.article_searches += 1
        return [
            {
                "id": "article:5:0",
                "score": 0.51,
                "payload": {
                    "title": "VPN",
                    "chunk_markdown": "Проверьте профиль подключения и клиент VPN.",
                },
            }
        ]


class RetrievalCoreTests(unittest.TestCase):
    def test_article_search_uses_enriched_query_when_ticket_is_weak(self) -> None:
        repository = FakeRepository()
        embedder = FakeEmbedder()
        service = RetrievalService(repository=repository, embedder=embedder)
        settings = AgentSettingsPayload(
            tone_of_voice="helpful",
            confidence_threshold=0.7,
            top_k=5,
            use_articles=True,
        )

        result = service.retrieve("Не подключается удаленка", settings=settings)

        self.assertEqual(len(result.tickets), 1)
        self.assertEqual(len(result.articles), 1)
        self.assertEqual(repository.article_searches, 1)
        self.assertEqual(len(embedder.queries), 2)
        self.assertIn("не подключается удаленка", embedder.queries[0])
        self.assertIn("Удаленный доступ / VPN", embedder.queries[1])
        self.assertIn("Тип: Стандартный", embedder.queries[1])
        self.assertIn("vpn", embedder.queries[1])

    def test_rerank_demotes_rejection_like_candidates(self) -> None:
        service = RerankService()
        tickets = [
            RetrievedDocument(
                point_id="ticket:1",
                score=0.92,
                payload={
                    "resolution_quality": "strong",
                    "candidate_for_abstain": False,
                    "is_actionable": True,
                    "status": "Отменена",
                    "domain_tags": ["vpn"],
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "resolution_text": "Отменена по причине смены инфраструктуры.",
                },
            ),
            RetrievedDocument(
                point_id="ticket:2",
                score=0.74,
                payload={
                    "resolution_quality": "strong",
                    "candidate_for_abstain": False,
                    "is_actionable": True,
                    "status": "Закрыта",
                    "domain_tags": ["vpn"],
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "resolution_text": "Перезапустили VPN-клиент и переподключили профиль.",
                },
            ),
        ]

        reranked = service.rerank_tickets(tickets, user_text="Не работает VPN", query_hints=["vpn"])

        self.assertEqual(reranked[0].point_id, "ticket:2")
        self.assertGreater(reranked[0].score, reranked[1].score)

    def test_confidence_gate_escalates_when_top_ticket_is_conflicting(self) -> None:
        gate = ConfidenceService()
        retrieval = RetrievalResult(
            tickets=[
                RetrievedDocument(
                    point_id="ticket:404",
                    score=0.88,
                    payload={
                        "resolution_quality": "strong",
                        "candidate_for_abstain": False,
                        "is_actionable": False,
                        "status": "Отменена",
                        "resolution_text": "Отменена, решение не применялось.",
                    },
                )
            ],
            articles=[],
            used_articles=False,
        )

        decision = gate.decide(mode="resolve_issue", retrieval=retrieval, threshold=0.7)

        self.assertEqual(decision, "escalate")

    def test_confidence_gate_can_answer_with_article_support(self) -> None:
        gate = ConfidenceService()
        retrieval = RetrievalResult(
            tickets=[
                RetrievedDocument(
                    point_id="ticket:200",
                    score=0.6,
                    payload={
                        "resolution_quality": "weak",
                        "candidate_for_abstain": True,
                        "is_actionable": True,
                        "status": "Закрыта",
                        "resolution_text": "Проверьте подключение.",
                    },
                )
            ],
            articles=[
                RetrievedDocument(
                    point_id="article:1:0",
                    score=0.55,
                    payload={"title": "VPN"},
                )
            ],
            used_articles=True,
        )

        decision = gate.decide(mode="resolve_issue", retrieval=retrieval, threshold=0.7)

        self.assertEqual(decision, "answer")


if __name__ == "__main__":
    unittest.main()
