from __future__ import annotations

import unittest
from unittest.mock import Mock

from ai_agent.integrations.qdrant_repository import QdrantRepository


class QdrantRepositoryTests(unittest.TestCase):
    def test_ensure_collections_creates_ticket_and_article_collections(self) -> None:
        client = Mock()
        client.collection_exists.side_effect = [False, False]
        repository = QdrantRepository(client=client)

        repository.ensure_collections(vector_size=1024)

        self.assertEqual(client.create_collection.call_count, 2)
        called_collections = [call.kwargs["collection_name"] for call in client.create_collection.call_args_list]
        self.assertEqual(called_collections, ["ticket_cases", "article_chunks"])

    def test_search_ticket_cases_uses_ticket_collection_name(self) -> None:
        client = Mock()
        client.query_points.return_value = type("Response", (), {"points": [{"id": "ticket:1"}]})()
        repository = QdrantRepository(client=client)

        results = repository.search_ticket_cases(query_vector=[0.1, 0.2], limit=3)

        self.assertEqual(results, [{"id": "ticket:1"}])
        self.assertEqual(client.query_points.call_args.kwargs["collection_name"], "ticket_cases")
        self.assertEqual(client.query_points.call_args.kwargs["limit"], 3)
        self.assertEqual(client.query_points.call_args.kwargs["timeout"], 30)


if __name__ == "__main__":
    unittest.main()
