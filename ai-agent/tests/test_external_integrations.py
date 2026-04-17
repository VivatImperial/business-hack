from __future__ import annotations

import unittest
from unittest.mock import Mock

from ai_agent.integrations.qdrant_repository import QdrantRepository
from ai_agent.integrations.yandex_gpt_client import YandexGptClient
from ai_agent.services.retrieval_service import RetrievalService


class FakeEmbedder:
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]


class ExternalIntegrationTests(unittest.TestCase):
    def test_qdrant_repository_preserves_original_point_id_in_payload(self) -> None:
        client = Mock()
        repository = QdrantRepository(client=client)

        repository.upsert_ticket_cases(
            [
                {
                    "point_id": "ticket:219",
                    "vector": [0.1, 0.2],
                    "payload": {"ticket_id": 219},
                }
            ]
        )

        point = client.upsert.call_args.kwargs["points"][0]
        self.assertNotEqual(point.id, "ticket:219")
        self.assertEqual(point.payload["point_id"], "ticket:219")

    def test_retrieval_service_prefers_payload_point_id_over_qdrant_uuid(self) -> None:
        repository = Mock()
        repository.search_ticket_cases.return_value = [
            {
                "id": "2d1d0fd7-52b5-4f0d-b07a-04f2ba8d25fd",
                "score": 0.9,
                "payload": {
                    "point_id": "ticket:219",
                    "service": "VPN",
                    "resolution_quality": "strong",
                },
            }
        ]
        repository.search_article_chunks.return_value = []

        service = RetrievalService(repository=repository, embedder=FakeEmbedder())
        tickets = service.retrieve_ticket_candidates("Не работает VPN", settings=type("S", (), {"top_k": 5})())

        self.assertEqual(tickets[0].point_id, "ticket:219")

    def test_yandex_client_builds_full_model_uri_from_folder_and_model(self) -> None:
        client = YandexGptClient(
            api_key="test-key",
            folder_id="b1g-test-folder",
            model_name="yandexgpt/latest",
        )

        self.assertEqual(
            client._resolve_model_name(),
            "gpt://b1g-test-folder/yandexgpt/latest",
        )

    def test_yandex_client_requires_real_folder_id_for_native_endpoint(self) -> None:
        client = YandexGptClient(
            api_key="test-key",
            folder_id="your-folder-id",
            model_name="yandexgpt/latest",
        )

        with self.assertRaises(RuntimeError):
            client._resolve_model_name()


if __name__ == "__main__":
    unittest.main()
