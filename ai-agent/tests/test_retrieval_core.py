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
    def __init__(self, *, ticket_hits=None, article_hits=None) -> None:
        self.article_searches = 0
        self.ticket_hits = ticket_hits
        self.article_hits = article_hits

    def search_ticket_cases(self, query_vector, limit, query_filter=None):
        return self.ticket_hits if self.ticket_hits is not None else [
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
        return self.article_hits if self.article_hits is not None else [
            {
                "id": "article:5:0",
                "score": 0.51,
                "payload": {
                    "title": "VPN",
                    "chunk_markdown": "Проверьте профиль подключения и клиент VPN.",
                },
            }
        ]


class MultiQueryRepository:
    def __init__(self) -> None:
        self.ticket_calls = 0

    def search_ticket_cases(self, query_vector, limit, query_filter=None):
        self.ticket_calls += 1
        if self.ticket_calls == 1:
            return [
                {
                    "id": "ticket:11",
                    "score": 0.51,
                    "payload": {
                        "request_text": "Не работает VPN",
                        "resolution_text": "Перезапуск клиента.",
                        "resolution_quality": "strong",
                        "candidate_for_abstain": False,
                        "service": "Удаленный доступ / VPN",
                        "task_type": "Тип: Стандартный",
                        "domain_tags": ["vpn"],
                        "is_actionable": True,
                        "status": "Закрыта",
                    },
                }
            ]
        return [
            {
                "id": "ticket:11",
                "score": 0.56,
                "payload": {
                    "request_text": "Не работает VPN",
                    "resolution_text": "Перезапуск клиента.",
                    "resolution_quality": "strong",
                    "candidate_for_abstain": False,
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "domain_tags": ["vpn"],
                    "is_actionable": True,
                    "status": "Закрыта",
                },
            },
            {
                "id": "ticket:12",
                "score": 0.49,
                "payload": {
                    "request_text": "Проблема с удаленкой",
                    "resolution_text": "Проверка профиля.",
                    "resolution_quality": "weak",
                    "candidate_for_abstain": True,
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "domain_tags": ["vpn", "удаленка"],
                    "is_actionable": True,
                    "status": "Закрыта",
                },
            },
        ]

    def search_article_chunks(self, query_vector, limit, query_filter=None):
        return []


class RetrievalCoreTests(unittest.TestCase):
    def test_ticket_query_strips_ticket_creation_boilerplate(self) -> None:
        service = RetrievalService(repository=FakeRepository(), embedder=FakeEmbedder())

        query = service.build_ticket_query("Помоги оформить заявку на проблему с VPN на ноутбуке")

        self.assertNotIn("оформ", query)
        self.assertNotIn("заявк", query)
        self.assertIn("vpn", query)
        self.assertIn("ноутбук", query)

    def test_query_hints_expand_udalenka_to_remote_access_signals(self) -> None:
        service = RetrievalService(repository=FakeRepository(), embedder=FakeEmbedder())

        hints = service.extract_query_hints("Не подключается удаленка")

        self.assertIn("удаленка", hints)
        self.assertIn("vpn", hints)
        self.assertIn("удаленный доступ", hints)

    def test_ticket_search_runs_multiple_queries_and_merges_duplicates(self) -> None:
        repository = MultiQueryRepository()
        embedder = FakeEmbedder()
        service = RetrievalService(repository=repository, embedder=embedder)
        settings = AgentSettingsPayload(
            tone_of_voice="helpful",
            confidence_threshold=0.7,
            top_k=5,
            use_articles=True,
        )

        tickets = service.retrieve_ticket_candidates("Не работает VPN", settings=settings)

        self.assertEqual(repository.ticket_calls, 2)
        self.assertEqual([ticket.point_id for ticket in tickets], ["ticket:11", "ticket:12"])
        self.assertGreater(tickets[0].score, 0.56)

    def test_ticket_search_builds_hint_focused_subquery_for_short_domain_query(self) -> None:
        repository = MultiQueryRepository()
        embedder = FakeEmbedder()
        service = RetrievalService(repository=repository, embedder=embedder)
        settings = AgentSettingsPayload(
            tone_of_voice="helpful",
            confidence_threshold=0.7,
            top_k=5,
            use_articles=True,
        )

        service.retrieve_ticket_candidates("VPN удаленка", settings=settings)

        self.assertGreaterEqual(len(embedder.queries), 2)
        self.assertIn("vpn удаленка", embedder.queries[0])
        self.assertIn("vpn", embedder.queries[1])

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
        self.assertEqual(len(embedder.queries), 3)
        self.assertIn("не подключается удаленка", embedder.queries[0])
        self.assertIn("Удаленный доступ / VPN", embedder.queries[-1])
        self.assertIn("Тип: Стандартный", embedder.queries[-1])
        self.assertIn("vpn", embedder.queries[-1])

    def test_article_search_is_skipped_when_ticket_candidates_are_missing(self) -> None:
        repository = FakeRepository(ticket_hits=[], article_hits=[{"id": "article:9:0", "score": 0.9, "payload": {"title": "VPN"}}])
        embedder = FakeEmbedder()
        service = RetrievalService(repository=repository, embedder=embedder)
        settings = AgentSettingsPayload(
            tone_of_voice="helpful",
            confidence_threshold=0.7,
            top_k=5,
            use_articles=True,
        )

        result = service.retrieve("Не подключается удаленка", settings=settings)

        self.assertEqual(result.tickets, [])
        self.assertEqual(result.articles, [])
        self.assertFalse(result.used_articles)
        self.assertEqual(repository.article_searches, 0)
        self.assertEqual(len(embedder.queries), 2)

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

    def test_rerank_penalizes_generic_services_for_domain_specific_query(self) -> None:
        service = RerankService()
        tickets = [
            RetrievedDocument(
                point_id="ticket:generic",
                score=0.9,
                payload={
                    "resolution_quality": "strong",
                    "candidate_for_abstain": False,
                    "is_actionable": True,
                    "status": "Закрыта",
                    "service": "ПРОЧЕЕ",
                    "task_type": "Тип: Стандартный",
                    "domain_tags": [],
                    "request_text": "Сбой и ремонт ноутбука",
                    "resolution_text": "Отправить ноутбук в ремонт.",
                },
            ),
            RetrievedDocument(
                point_id="ticket:vpn",
                score=0.82,
                payload={
                    "resolution_quality": "strong",
                    "candidate_for_abstain": False,
                    "is_actionable": True,
                    "status": "Закрыта",
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "domain_tags": ["vpn", "удаленный доступ"],
                    "request_text": "Не подключается VPN",
                    "resolution_text": "Перезапустили VPN-клиент и обновили профиль.",
                },
            ),
        ]

        reranked = service.rerank_tickets(tickets, user_text="Проблема с VPN на ноутбуке", query_hints=["vpn"])

        self.assertEqual(reranked[0].point_id, "ticket:vpn")

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
                    score=0.66,
                    payload={
                        "resolution_quality": "strong",
                        "candidate_for_abstain": False,
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

    def test_create_ticket_clarifies_for_conflicting_ticket_match(self) -> None:
        gate = ConfidenceService()
        retrieval = RetrievalResult(
            tickets=[
                RetrievedDocument(
                    point_id="ticket:555",
                    score=0.91,
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

        decision = gate.decide(mode="create_ticket", retrieval=retrieval, threshold=0.7)

        self.assertEqual(decision, "clarify")


if __name__ == "__main__":
    unittest.main()
