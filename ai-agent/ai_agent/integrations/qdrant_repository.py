from __future__ import annotations

import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams


QDRANT_POINT_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "baltiyskiy-bereg-ai-agent")


class QdrantRepository:
    """Small repository wrapper around Qdrant collections used by ai-agent."""

    def __init__(
        self,
        *,
        client: QdrantClient | Any,
        ticket_collection: str = "ticket_cases",
        article_collection: str = "article_chunks",
    ) -> None:
        self.client = client
        self.ticket_collection = ticket_collection
        self.article_collection = article_collection

    def ensure_collections(self, vector_size: int) -> None:
        for collection_name in (self.ticket_collection, self.article_collection):
            if self._collection_exists(collection_name):
                continue
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
            )

    def upsert_ticket_cases(self, rows: list[dict[str, Any]]) -> None:
        self._upsert_rows(self.ticket_collection, rows)

    def upsert_article_chunks(self, rows: list[dict[str, Any]]) -> None:
        self._upsert_rows(self.article_collection, rows)

    def search_ticket_cases(self, query_vector: list[float], limit: int = 5, query_filter: Any | None = None):
        return self._query_collection(
            collection_name=self.ticket_collection,
            query_vector=query_vector,
            limit=limit,
            query_filter=query_filter,
        )

    def search_article_chunks(self, query_vector: list[float], limit: int = 5, query_filter: Any | None = None):
        return self._query_collection(
            collection_name=self.article_collection,
            query_vector=query_vector,
            limit=limit,
            query_filter=query_filter,
        )

    def _collection_exists(self, collection_name: str) -> bool:
        collection_exists = getattr(self.client, "collection_exists", None)
        if callable(collection_exists):
            return bool(collection_exists(collection_name))
        try:
            self.client.get_collection(collection_name=collection_name)
        except Exception:
            return False
        return True

    def _upsert_rows(self, collection_name: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        points = [
            PointStruct(
                id=self._to_qdrant_id(row["point_id"]),
                vector=row["vector"],
                payload={
                    **(row.get("payload") or {}),
                    "point_id": row["point_id"],
                },
            )
            for row in rows
        ]
        self.client.upsert(collection_name=collection_name, points=points)

    def _to_qdrant_id(self, point_id: str) -> str:
        return str(uuid.uuid5(QDRANT_POINT_NAMESPACE, point_id))

    def _query_collection(
        self,
        *,
        collection_name: str,
        query_vector: list[float],
        limit: int,
        query_filter: Any | None,
    ):
        query_points = getattr(self.client, "query_points", None)
        if callable(query_points):
            response = query_points(
                collection_name=collection_name,
                query=query_vector,
                limit=limit,
                query_filter=query_filter,
                with_payload=True,
                timeout=30,
            )
            return getattr(response, "points", response)

        return self.client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=limit,
            query_filter=query_filter,
        )
