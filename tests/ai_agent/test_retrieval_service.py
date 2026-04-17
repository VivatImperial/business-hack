from __future__ import annotations

import unittest

from ai_agent.schemas.inference import AgentSettingsPayload
from ai_agent.services.retrieval_service import RetrievalService


class FakeEmbedder:
    def __init__(self) -> None:
        self.queries: list[str] = []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self.queries.extend(texts)
        return [[0.1, 0.2] for _ in texts]


class FakeRepository:
    def __init__(self, ticket_hits, article_hits) -> None:
        self.ticket_hits = ticket_hits
        self.article_hits = article_hits
        self.article_searches = 0

    def search_ticket_cases(self, query_vector, limit, query_filter=None):
        return self.ticket_hits

    def search_article_chunks(self, query_vector, limit, query_filter=None):
        self.article_searches += 1
        return self.article_hits


class RetrievalServiceTests(unittest.TestCase):
    def test_retrieve_uses_article_enrichment_for_weak_ticket_case(self) -> None:
        repository = FakeRepository(
            ticket_hits=[
                {
                    "id": "ticket:1",
                    "score": 0.62,
                    "payload": {
                        "resolution_quality": "weak",
                        "candidate_for_abstain": True,
                    },
                }
            ],
            article_hits=[{"id": "article:1:0", "score": 0.55, "payload": {"title": "VPN"}}],
        )
        service = RetrievalService(repository=repository, embedder=FakeEmbedder())
        settings = AgentSettingsPayload(
            tone_of_voice="helpful",
            confidence_threshold=0.7,
            top_k=5,
            use_articles=True,
        )

        result = service.retrieve("Не работает VPN", settings=settings)

        self.assertEqual(len(result.tickets), 1)
        self.assertEqual(len(result.articles), 1)
        self.assertTrue(result.used_articles)
        self.assertEqual(repository.article_searches, 1)


if __name__ == "__main__":
    unittest.main()
