from __future__ import annotations

import argparse

from qdrant_client import QdrantClient

from ai_agent.config import get_settings
from ai_agent.integrations.qdrant_repository import QdrantRepository


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Recreate Qdrant collections for ai-agent")
    parser.add_argument("--qdrant-url", default=get_settings().qdrant_url)
    parser.add_argument("--vector-size", type=int, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    client = QdrantClient(url=args.qdrant_url)
    repository = QdrantRepository(client=client)

    for collection_name in (repository.ticket_collection, repository.article_collection):
        try:
            client.delete_collection(collection_name=collection_name)
        except Exception:
            pass

    repository.ensure_collections(vector_size=args.vector_size)
    print("Collections recreated.")


if __name__ == "__main__":
    main()
