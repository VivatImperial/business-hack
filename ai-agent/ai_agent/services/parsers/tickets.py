from __future__ import annotations

import html
import re
from typing import Any

import pymssql  # pyright: ignore[reportMissingImports]


DATA_IMAGE_RE = re.compile(r"data:image/[^;]+;base64,[A-Za-z0-9+/=\s]+", re.IGNORECASE)
HTML_TAG_RE = re.compile(r"<[^>]+>")
RU_XML_RE = re.compile(r"<Ru>(.*?)</Ru>", re.IGNORECASE | re.DOTALL)
WS_RE = re.compile(r"\s+")
AUTO_CLOSE_RE = re.compile(r"автоматически\s+переведена\s+в\s+статус", re.IGNORECASE)
MEANINGLESS_VALUE_RE = re.compile(r"^\.*$")
REQUEST_CUSTOM_FIELDS = {
    "Тип обращения",
    "Наименование продукции",
    "Торговая марка",
    "Производственная площадка",
    "Производственная площадка ",
    "Смена",
    "Контакты",
    "Обращение от",
}


def extract_ru_from_xml(xml_text: str | None) -> str | None:
    if not xml_text:
        return None
    match = RU_XML_RE.search(xml_text)
    if not match:
        return None
    return normalize_text(html.unescape(match.group(1)))


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = WS_RE.sub(" ", value).strip()
    return value or None


def clean_rich_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = DATA_IMAGE_RE.sub(" ", value)
    text = HTML_TAG_RE.sub(" ", text)
    text = html.unescape(text)
    return normalize_text(text)


def row_to_dict(columns: list[str], row: tuple[Any, ...]) -> dict[str, Any]:
    return {columns[i]: row[i] for i in range(len(columns))}


def is_auto_close_comment(value: str | None) -> bool:
    if not value:
        return False
    return bool(AUTO_CLOSE_RE.search(value))


def is_meaningful_value(value: str | None) -> bool:
    if not value:
        return False
    normalized = normalize_text(value)
    if not normalized:
        return False
    if MEANINGLESS_VALUE_RE.match(normalized):
        return False
    return True


def select_custom_field_value(field: dict[str, Any]) -> str | None:
    combo = normalize_text(field.get("ComboboxNameRu"))
    value = normalize_text(field.get("ValueClean") or field.get("Value"))
    if is_meaningful_value(combo):
        return combo
    if is_meaningful_value(value):
        return value
    return None


def build_request_text(task: dict[str, Any], custom_fields: list[dict[str, Any]]) -> str | None:
    parts: list[str] = []
    if is_meaningful_value(task.get("Name")):
        parts.append(normalize_text(task.get("Name")) or "")
    if is_meaningful_value(task.get("DescriptionClean")):
        parts.append(normalize_text(task.get("DescriptionClean")) or "")
    elif is_meaningful_value(task.get("Description")):
        parts.append(clean_rich_text(task.get("Description")) or "")

    seen_pairs: set[tuple[str, str]] = set()
    for field in custom_fields:
        field_name = normalize_text(field.get("FieldNameRu"))
        if not field_name or field_name not in REQUEST_CUSTOM_FIELDS:
            continue
        field_value = select_custom_field_value(field)
        if not field_value:
            continue
        pair = (field_name, field_value)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        parts.append(f"{field_name}: {field_value}")

    return normalize_text("\n".join(parts))


def build_resolution_text(task: dict[str, Any], worklogs: list[dict[str, Any]]) -> tuple[str | None, str]:
    worklog_parts: list[str] = []
    for item in worklogs:
        text = clean_rich_text(item.get("Comments") or item.get("CommentsClean"))
        if not is_meaningful_value(text):
            continue
        worklog_parts.append(text or "")
    if worklog_parts:
        return "\n".join(worklog_parts), "worklog"

    comment = clean_rich_text(task.get("Comment"))
    if is_meaningful_value(comment) and not is_auto_close_comment(comment):
        return comment, "comment"
    return None, "none"


def build_custom_fields_map(custom_fields: list[dict[str, Any]]) -> dict[str, str | list[str]]:
    aggregated: dict[str, list[str]] = {}
    for field in custom_fields:
        field_name = normalize_text(field.get("FieldNameRu"))
        field_value = select_custom_field_value(field)
        if not field_name or not field_value:
            continue
        aggregated.setdefault(field_name, [])
        if field_value not in aggregated[field_name]:
            aggregated[field_name].append(field_value)

    result: dict[str, str | list[str]] = {}
    for field_name, values in aggregated.items():
        result[field_name] = values[0] if len(values) == 1 else values
    return result


def build_normalized_worklogs(worklogs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in worklogs:
        comment = clean_rich_text(item.get("Comments") or item.get("CommentsClean"))
        if not is_meaningful_value(comment):
            continue
        normalized.append(
            {
                "date": item.get("Date"),
                "minutes": item.get("Minutes"),
                "comment": comment,
            }
        )
    return normalized


def build_rag_ticket_doc(
    task: dict[str, Any],
    worklogs: list[dict[str, Any]],
    custom_fields: list[dict[str, Any]],
) -> dict[str, Any]:
    request_text = build_request_text(task, custom_fields)
    resolution_text, resolution_source = build_resolution_text(task, worklogs)
    return {
        "ticket_id": task.get("Id"),
        "request_text": request_text,
        "resolution_text": resolution_text,
        "resolution_source": resolution_source,
        "meta": {
            "service": task.get("ServiceNameRu"),
            "task_type": task.get("TaskTypeNameRu"),
            "status": task.get("StatusNameRu"),
            "priority": task.get("PriorityNameRu"),
            "created_at": task.get("Created"),
            "closed_at": task.get("Closed"),
        },
        "custom_fields": build_custom_fields_map(custom_fields),
        "worklogs": build_normalized_worklogs(worklogs),
        "raw": {
            "title": task.get("Name"),
            "description": clean_rich_text(task.get("Description")),
            "comment": clean_rich_text(task.get("Comment")),
        },
    }


def ticket_doc_to_markdown(doc: dict[str, Any]) -> str:
    lines = [f"# Ticket {doc['ticket_id']}"]
    request_text = doc.get("request_text") or "_No request text_"
    resolution_text = doc.get("resolution_text") or "_No resolution found_"

    lines.extend(["", "## Request", "", request_text, "", "## Resolution", "", resolution_text, "", "## Meta", ""])

    meta = doc.get("meta") or {}
    for key in ("service", "task_type", "status", "priority", "created_at", "closed_at"):
        value = meta.get(key)
        if value is not None:
            lines.append(f"- **{key}**: {value}")

    custom_fields = doc.get("custom_fields") or {}
    if custom_fields:
        lines.extend(["", "## Custom Fields", ""])
        for key, value in custom_fields.items():
            lines.append(f"- **{key}**: {value}")

    worklogs = doc.get("worklogs") or []
    if worklogs:
        lines.extend(["", "## Worklogs", ""])
        for item in worklogs:
            date = item.get("date")
            minutes = item.get("minutes")
            prefix = []
            if date is not None:
                prefix.append(str(date))
            if minutes is not None:
                prefix.append(f"{minutes}m")
            label = " | ".join(prefix)
            if label:
                lines.append(f"- {label}: {item['comment']}")
            else:
                lines.append(f"- {item['comment']}")

    return "\n".join(lines).strip() + "\n"


def parse_ticket_to_rag_doc(conn: pymssql.Connection, ticket_id: int) -> dict[str, Any] | None:
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                t.Id,
                t.Name,
                t.Description,
                t.Comment,
                t.Created,
                t.Closed,
                CAST(s.NameXml AS nvarchar(max)) AS ServiceNameXml,
                CAST(tt.NameXml AS nvarchar(max)) AS TaskTypeNameXml,
                CAST(st.NameXml AS nvarchar(max)) AS StatusNameXml,
                CAST(p.NameXml AS nvarchar(max)) AS PriorityNameXml
            FROM dbo.Task t
            LEFT JOIN dbo.Service s ON s.Id = t.ServiceId
            LEFT JOIN dbo.TaskType tt ON tt.Id = t.TypeId
            LEFT JOIN dbo.Status st ON st.Id = t.StatusId
            LEFT JOIN dbo.Priority p ON p.Id = t.PriorityId
            WHERE t.Id = %s
            """,
            (ticket_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        task_cols = [desc[0] for desc in cursor.description]
        task = row_to_dict(task_cols, row)
        task["ServiceNameRu"] = extract_ru_from_xml(task.get("ServiceNameXml"))
        task["TaskTypeNameRu"] = extract_ru_from_xml(task.get("TaskTypeNameXml"))
        task["StatusNameRu"] = extract_ru_from_xml(task.get("StatusNameXml"))
        task["PriorityNameRu"] = extract_ru_from_xml(task.get("PriorityNameXml"))
        task["DescriptionClean"] = clean_rich_text(task.get("Description"))

    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT TaskId, [Date], Minutes, Comments
            FROM dbo.TaskExpenses
            WHERE TaskId = %s
            ORDER BY [Date], Id
            """,
            (ticket_id,),
        )
        worklog_cols = [desc[0] for desc in cursor.description]
        worklogs = [row_to_dict(worklog_cols, row) for row in cursor.fetchall()]

    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                v.EntityId AS TaskId,
                v.FieldId,
                CAST(f.NameXml AS nvarchar(max)) AS FieldNameXml,
                v.Value,
                v.ComboboxId,
                CAST(c.NameXml AS nvarchar(max)) AS ComboboxNameXml
            FROM dbo.TaskFieldValues v
            LEFT JOIN dbo.TaskTypeField f ON f.Id = v.FieldId
            LEFT JOIN dbo.TaskTypeComboBox c ON c.Id = v.ComboboxId
            WHERE v.EntityId = %s
            """,
            (ticket_id,),
        )
        field_cols = [desc[0] for desc in cursor.description]
        custom_fields = []
        for row in cursor.fetchall():
            item = row_to_dict(field_cols, row)
            item["FieldNameRu"] = extract_ru_from_xml(item.get("FieldNameXml"))
            item["ComboboxNameRu"] = extract_ru_from_xml(item.get("ComboboxNameXml"))
            item["ValueClean"] = clean_rich_text(item.get("Value"))
            custom_fields.append(item)

    return build_rag_ticket_doc(task, worklogs, custom_fields)
