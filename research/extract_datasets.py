#!/usr/bin/env python3
"""
Build source-layer datasets from MSSQL `service_desk_tdbb`.

Outputs (gzipped JSONL by default):
- tickets_source.jsonl.gz
- articles_source.jsonl.gz
- lookups.json
- dataset_stats.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import decimal
import gzip
import json
import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import pymssql  # pyright: ignore[reportMissingImports]

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from research.eda.parsers.articles import build_article_source_doc, extract_inline_images
from research.eda.parsers.tickets import (
    build_rag_ticket_doc,
    clean_rich_text,
    extract_ru_from_xml,
    parse_ticket_to_rag_doc,
    row_to_dict,
)
from research.eda.parsers.yandex_ocr import YandexOcrClient

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build research source datasets from MSSQL service desk DB")
    parser.add_argument("--host", default=os.getenv("MSSQL_HOST", "localhost"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MSSQL_PORT", "1433")))
    parser.add_argument("--user", default=os.getenv("MSSQL_USER", "SA"))
    parser.add_argument("--password", default=os.getenv("MSSQL_SA_PASSWORD"))
    parser.add_argument("--database", default=os.getenv("MSSQL_DATABASE", "service_desk_tdbb"))
    parser.add_argument(
        "--output-dir",
        default="research/eda/outputs",
        help="Where extracted source datasets will be stored",
    )
    parser.add_argument(
        "--plain-jsonl",
        action="store_true",
        help="Write plain .jsonl files instead of .jsonl.gz",
    )
    parser.add_argument(
        "--ocr-articles",
        action="store_true",
        help="Run Yandex Vision OCR for inline KB article images and insert OCR markdown inline",
    )
    parser.add_argument(
        "--ocr-max-images-per-article",
        type=int,
        default=0,
        help="Maximum number of inline images to OCR per article (0 = no limit)",
    )
    return parser.parse_args()


def json_default(value: Any) -> Any:
    if isinstance(value, (dt.datetime, dt.date)):
        return value.isoformat()
    if isinstance(value, dt.time):
        return value.isoformat()
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def open_jsonl_writer(path: Path, plain_jsonl: bool):
    if plain_jsonl:
        return path.open("w", encoding="utf-8"), path
    gz_path = path.with_suffix(path.suffix + ".gz")
    return gzip.open(gz_path, "wt", encoding="utf-8"), gz_path


def resolve_ocr_client(args: argparse.Namespace) -> YandexOcrClient | None:
    if not args.ocr_articles:
        return None

    api_key = os.getenv("YANDEX_OCR_API_KEY") or os.getenv("YANDEX_GPT_API_KEY")
    folder_id = os.getenv("YANDEX_OCR_FOLDER_ID") or os.getenv("YANDEX_GPT_FOLDER_ID")
    if not api_key:
        raise SystemExit("OCR requested but missing YANDEX_OCR_API_KEY (or YANDEX_GPT_API_KEY)")
    return YandexOcrClient(api_key=api_key, folder_id=folder_id)


def export_lookups(conn: pymssql.Connection, output_dir: Path) -> Path:
    lookups: dict[str, list[dict[str, Any]]] = {}
    lookup_queries = {
        "service": "SELECT Id, CAST(NameXml AS nvarchar(max)) AS NameXml FROM dbo.Service",
        "status": "SELECT Id, CAST(NameXml AS nvarchar(max)) AS NameXml, IsFinal, IsInitial FROM dbo.Status",
        "task_type": "SELECT Id, CAST(NameXml AS nvarchar(max)) AS NameXml FROM dbo.TaskType",
        "priority": "SELECT Id, CAST(NameXml AS nvarchar(max)) AS NameXml FROM dbo.Priority",
    }
    for key, query in lookup_queries.items():
        with conn.cursor() as cursor:
            cursor.execute(query)
            cols = [d[0] for d in cursor.description]
            items: list[dict[str, Any]] = []
            for row in cursor.fetchall():
                item = row_to_dict(cols, row)
                item["NameRu"] = extract_ru_from_xml(item.get("NameXml"))
                items.append(item)
            lookups[key] = items

    out_path = output_dir / "lookups.json"
    out_path.write_text(json.dumps(lookups, ensure_ascii=False, indent=2, default=json_default), encoding="utf-8")
    return out_path


def load_worklogs_by_task(conn: pymssql.Connection) -> dict[int, list[dict[str, Any]]]:
    result: dict[int, list[dict[str, Any]]] = defaultdict(list)
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT TaskId, [Date], Minutes, Comments
            FROM dbo.TaskExpenses
            ORDER BY TaskId, [Date], Id
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            item = row_to_dict(cols, row)
            result[item["TaskId"]].append(item)
    return result


def load_custom_fields_by_task(conn: pymssql.Connection) -> dict[int, list[dict[str, Any]]]:
    result: dict[int, list[dict[str, Any]]] = defaultdict(list)
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
            ORDER BY v.EntityId, v.FieldId, v.Id
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            item = row_to_dict(cols, row)
            item["FieldNameRu"] = extract_ru_from_xml(item.get("FieldNameXml"))
            item["ComboboxNameRu"] = extract_ru_from_xml(item.get("ComboboxNameXml"))
            item["ValueClean"] = clean_rich_text(item.get("Value"))
            result[item["TaskId"]].append(item)
    return result


def export_tickets_source(conn: pymssql.Connection, output_dir: Path, plain_jsonl: bool) -> tuple[int, Path]:
    worklogs_by_task = load_worklogs_by_task(conn)
    custom_fields_by_task = load_custom_fields_by_task(conn)

    query = """
        SELECT
            t.Id,
            t.Name,
            t.Description,
            t.Comment,
            t.Created,
            t.Closed,
            CAST(s.NameXml AS nvarchar(max)) AS ServiceNameXml,
            CAST(st.NameXml AS nvarchar(max)) AS StatusNameXml,
            CAST(tt.NameXml AS nvarchar(max)) AS TaskTypeNameXml,
            CAST(p.NameXml AS nvarchar(max)) AS PriorityNameXml
        FROM dbo.Task t
        LEFT JOIN dbo.Service s ON s.Id = t.ServiceId
        LEFT JOIN dbo.Status st ON st.Id = t.StatusId
        LEFT JOIN dbo.TaskType tt ON tt.Id = t.TypeId
        LEFT JOIN dbo.Priority p ON p.Id = t.PriorityId
        ORDER BY t.Id
    """
    out, final_path = open_jsonl_writer(output_dir / "tickets_source.jsonl", plain_jsonl)
    count = 0
    try:
        with conn.cursor() as cursor:
            cursor.execute(query)
            cols = [desc[0] for desc in cursor.description]
            while True:
                rows = cursor.fetchmany(2000)
                if not rows:
                    break
                for row in rows:
                    task = row_to_dict(cols, row)
                    task["ServiceNameRu"] = extract_ru_from_xml(task.get("ServiceNameXml"))
                    task["StatusNameRu"] = extract_ru_from_xml(task.get("StatusNameXml"))
                    task["TaskTypeNameRu"] = extract_ru_from_xml(task.get("TaskTypeNameXml"))
                    task["PriorityNameRu"] = extract_ru_from_xml(task.get("PriorityNameXml"))
                    task["DescriptionClean"] = clean_rich_text(task.get("Description"))
                    doc = build_rag_ticket_doc(
                        task,
                        worklogs_by_task.get(task["Id"], []),
                        custom_fields_by_task.get(task["Id"], []),
                    )
                    out.write(json.dumps(doc, ensure_ascii=False, default=json_default) + "\n")
                    count += 1
    finally:
        out.close()
    return count, final_path


def load_kb_tags_by_document(conn: pymssql.Connection) -> dict[int, list[str]]:
    result: dict[int, list[str]] = defaultdict(list)
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT dt.DocumentId, CAST(t.ValueXml AS nvarchar(max)) AS TagValueXml
            FROM dbo.KBDocumentTag dt
            JOIN dbo.KBTag t ON t.Id = dt.TagId
            ORDER BY dt.DocumentId, dt.Id
            """
        )
        cols = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            item = row_to_dict(cols, row)
            value = extract_ru_from_xml(item.get("TagValueXml"))
            if value and value not in result[item["DocumentId"]]:
                result[item["DocumentId"]].append(value)
    return result


def export_articles_source(
    conn: pymssql.Connection,
    output_dir: Path,
    plain_jsonl: bool,
    *,
    ocr_client: YandexOcrClient | None = None,
    ocr_max_images_per_article: int = 0,
) -> tuple[int, Path, dict[str, Any]]:
    tags_by_doc = load_kb_tags_by_document(conn)
    query = """
        SELECT
            d.Id,
            d.ParentId,
            d.Name,
            d.Description,
            d.IsPublished,
            d.Rating,
            d.CreateDate,
            d.ChangeDate,
            d.PublishDate,
            f.Path AS FolderIdPath,
            CAST(f.NameXml AS nvarchar(max)) AS FolderNameXml
        FROM dbo.KBDocument d
        LEFT JOIN dbo.KBFolder f ON f.Id = d.ParentId
        ORDER BY d.Id
    """
    out, final_path = open_jsonl_writer(output_dir / "articles_source.jsonl", plain_jsonl)
    count = 0
    ocr_stats = {
        "enabled": ocr_client is not None,
        "articles_with_inline_images": 0,
        "articles_with_ocr_applied": 0,
        "images_detected": 0,
        "images_attempted": 0,
        "images_applied": 0,
        "images_failed": 0,
    }
    try:
        with conn.cursor() as cursor:
            cursor.execute(query)
            cols = [desc[0] for desc in cursor.description]
            while True:
                rows = cursor.fetchmany(500)
                if not rows:
                    break
                for row in rows:
                    article = row_to_dict(cols, row)
                    folder_name = extract_ru_from_xml(article.get("FolderNameXml"))
                    ocr_requested = ocr_client is not None
                    extracted = extract_inline_images(article.get("Description") or "")
                    image_count = len(extracted["images"])
                    if image_count:
                        ocr_stats["articles_with_inline_images"] += 1
                        ocr_stats["images_detected"] += image_count

                    ocr_attempted_count = 0
                    ocr_error_count = 0
                    ocr_blocks: list[dict[str, Any]] = []
                    if ocr_client is not None and image_count:
                        selected_images = extracted["images"]
                        if ocr_max_images_per_article > 0:
                            selected_images = selected_images[:ocr_max_images_per_article]
                        ocr_attempted_count = len(selected_images)
                        ocr_stats["images_attempted"] += ocr_attempted_count

                        for image in selected_images:
                            try:
                                recognized = ocr_client.recognize_markdown(
                                    image["content_base64"],
                                    image["mime_type"],
                                )
                            except Exception:
                                ocr_error_count += 1
                                ocr_stats["images_failed"] += 1
                                continue

                            if recognized["markdown"]:
                                ocr_blocks.append(
                                    {
                                        "placeholder": image["placeholder"],
                                        "markdown": recognized["markdown"],
                                        "mime_type": image["mime_type"],
                                        "alt": image.get("alt"),
                                    }
                                )
                                ocr_stats["images_applied"] += 1

                    doc = build_article_source_doc(
                        article,
                        tags=tags_by_doc.get(article["Id"], []),
                        folder_path=folder_name,
                        ocr_blocks=ocr_blocks,
                        ocr_requested=ocr_requested,
                        ocr_attempted_count=ocr_attempted_count,
                        ocr_error_count=ocr_error_count,
                    )
                    if doc.get("ocr_status") in {"applied", "partial"}:
                        ocr_stats["articles_with_ocr_applied"] += 1
                    doc["folder_id_path"] = article.get("FolderIdPath")
                    out.write(json.dumps(doc, ensure_ascii=False, default=json_default) + "\n")
                    count += 1
    finally:
        out.close()
    return count, final_path, ocr_stats


def main() -> None:
    if load_dotenv is not None:
        load_dotenv()
    args = parse_args()

    if not args.password:
        raise SystemExit("MSSQL_SA_PASSWORD is required (pass --password or set in .env)")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    ocr_client = resolve_ocr_client(args)

    conn = pymssql.connect(
        server=f"{args.host}:{args.port}",
        user=args.user,
        password=args.password,
        database=args.database,
        charset="UTF-8",
        as_dict=False,
    )

    stats: dict[str, Any] = {
        "database": args.database,
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
    }

    try:
        lookups_path = export_lookups(conn, output_dir)
        stats["lookups"] = {"path": str(lookups_path)}

        ticket_count, ticket_path = export_tickets_source(conn, output_dir, args.plain_jsonl)
        stats["tickets_source"] = {"rows": ticket_count, "path": str(ticket_path)}

        article_count, article_path, article_ocr_stats = export_articles_source(
            conn,
            output_dir,
            args.plain_jsonl,
            ocr_client=ocr_client,
            ocr_max_images_per_article=args.ocr_max_images_per_article,
        )
        stats["articles_source"] = {
            "rows": article_count,
            "path": str(article_path),
            "ocr": article_ocr_stats,
        }

        stats_path = output_dir / "dataset_stats.json"
        stats_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Done. Dataset stats written to: {stats_path}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()

