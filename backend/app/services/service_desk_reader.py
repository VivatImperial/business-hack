from __future__ import annotations

from datetime import datetime, timezone

import pymssql

from backend.app.config import Settings
from backend.app.services.service_desk_sync import (
    ServiceDeskDocumentProjection,
    ServiceDeskMessageProjection,
    ServiceDeskTicketProjection,
)


def ensure_utc(value: datetime | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class ServiceDeskMssqlReader:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def fetch_ticket_projections(self, limit: int | None = None) -> list[ServiceDeskTicketProjection]:
        query = """
        SELECT TOP (%s)
            CAST(t.Id AS VARCHAR(128)) AS task_id,
            COALESCE(NULLIF(t.CreatorLogin, ''), 'unknown') AS employee_login,
            'ticket' AS scope,
            CASE
                WHEN t.StatusId IS NULL THEN 'open'
                ELSE 'open'
            END AS status,
            'p3' AS priority,
            COALESCE(NULLIF(t.Name, ''), 'uncategorized') AS category,
            t.Name AS title,
            t.Description AS description,
            t.CreatedDate AS created_at,
            t.ClosedDate AS closed_at,
            NULL AS csat,
            CAST(0 AS BIT) AS assistant_resolved
        FROM service_desk_tdbb.dbo.Task t
        ORDER BY t.CreatedDate DESC
        """
        rows = self._fetch_rows(query, (limit or self.settings.mssql_sync_batch_size,))
        return [self.build_ticket_projection(row) for row in rows]

    def fetch_document_projections(
        self,
        limit: int | None = None,
    ) -> list[ServiceDeskDocumentProjection]:
        query = """
        SELECT TOP (%s)
            CAST(k.Id AS VARCHAR(128)) AS document_id,
            k.Name AS title,
            k.Description AS content,
            k.IsPublished AS is_published,
            k.Rating AS rating,
            COALESCE(k.ModifiedDate, k.CreatedDate) AS updated_at
        FROM service_desk_tdbb.dbo.KBDocument k
        ORDER BY COALESCE(k.ModifiedDate, k.CreatedDate) DESC
        """
        rows = self._fetch_rows(query, (limit or self.settings.mssql_sync_batch_size,))
        return [self.build_document_projection(row) for row in rows]

    def _fetch_rows(self, query: str, params: tuple[object, ...]) -> list[dict[str, object]]:
        connection = pymssql.connect(
            server=self.settings.mssql_host,
            port=self.settings.mssql_port,
            user=self.settings.mssql_user,
            password=self.settings.mssql_password,
            database=self.settings.mssql_database,
            as_dict=True,
            timeout=10,
            login_timeout=10,
        )
        try:
            with connection.cursor(as_dict=True) as cursor:
                cursor.execute(query, params)
                return list(cursor.fetchall())
        finally:
            connection.close()

    @staticmethod
    def build_ticket_projection(row: dict[str, object]) -> ServiceDeskTicketProjection:
        raw_messages = row.get("messages", [])
        message_projections = [
            ServiceDeskMessageProjection(
                source_message_id=str(message["message_id"]),
                role=str(message.get("role", "user")),
                author_login=message.get("author_login"),
                text=str(message.get("text", "")),
                created_at=ensure_utc(message.get("created_at")),
            )
            for message in raw_messages
        ]
        return ServiceDeskTicketProjection(
            source_ticket_id=str(row["task_id"]),
            employee_login=str(row["employee_login"]),
            scope=str(row.get("scope", "ticket")),
            status=str(row.get("status", "open")),
            priority=str(row.get("priority", "p3")),
            category=str(row.get("category", "uncategorized")),
            title=(str(row["title"]) if row.get("title") is not None else None),
            description=(str(row["description"]) if row.get("description") is not None else None),
            created_at=ensure_utc(row.get("created_at")),
            closed_at=(
                ensure_utc(row.get("closed_at")) if row.get("closed_at") is not None else None
            ),
            csat=(float(row["csat"]) if row.get("csat") is not None else None),
            assistant_resolved=bool(row.get("assistant_resolved", False)),
            messages=message_projections,
        )

    @staticmethod
    def build_document_projection(row: dict[str, object]) -> ServiceDeskDocumentProjection:
        return ServiceDeskDocumentProjection(
            source_document_id=str(row["document_id"]),
            title=str(row["title"]),
            content=str(row["content"]),
            is_published=bool(row.get("is_published", True)),
            rating=(float(row["rating"]) if row.get("rating") is not None else None),
            updated_at=ensure_utc(row.get("updated_at")),
        )
