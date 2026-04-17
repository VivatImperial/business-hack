from __future__ import annotations

import gzip
import json
import os
import shutil
from pathlib import Path
from typing import Any

from tqdm import tqdm

from research.eda.parsers.articles import build_article_source_doc, extract_inline_images
from research.eda.parsers.yandex_ocr import YandexOcrClient


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as f:  # type: ignore[arg-type]
        return [json.loads(line) for line in f]


def read_processed_article_ids(working_output_path: Path) -> set[int]:
    if not working_output_path.exists():
        return set()
    with working_output_path.open("r", encoding="utf-8") as f:
        return {int(json.loads(line)["id"]) for line in f if line.strip()}


def append_jsonl_batch(output_file, batch: list[dict[str, Any]]) -> None:
    for row in batch:
        output_file.write(json.dumps(row, ensure_ascii=False) + "\n")
    output_file.flush()
    os.fsync(output_file.fileno())


def source_doc_to_article_row(source_row: dict[str, Any]) -> dict[str, Any]:
    return {
        "Id": source_row.get("id"),
        "ParentId": source_row.get("parent_id"),
        "Name": source_row.get("title"),
        "Description": source_row.get("raw_html"),
        "IsPublished": source_row.get("is_published"),
        "Rating": source_row.get("rating"),
        "CreateDate": source_row.get("created_at"),
        "ChangeDate": source_row.get("updated_at"),
        "PublishDate": source_row.get("published_at"),
    }


def enrich_article_source_row(
    source_row: dict[str, Any],
    ocr_client: YandexOcrClient,
    *,
    max_images_per_article: int = 0,
) -> dict[str, Any]:
    extracted = extract_inline_images(source_row.get("raw_html") or "")
    images = extracted["images"]
    if max_images_per_article > 0:
        images = images[:max_images_per_article]

    ocr_blocks: list[dict[str, Any]] = []
    ocr_error_count = 0
    for image in images:
        try:
            recognized = ocr_client.recognize_markdown(image["content_base64"], image["mime_type"])
        except Exception:
            ocr_error_count += 1
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

    doc = build_article_source_doc(
        source_doc_to_article_row(source_row),
        tags=source_row.get("tags") or [],
        folder_path=source_row.get("folder_path"),
        ocr_blocks=ocr_blocks,
        ocr_requested=True,
        ocr_attempted_count=len(images),
        ocr_error_count=ocr_error_count,
    )
    if "folder_id_path" in source_row:
        doc["folder_id_path"] = source_row.get("folder_id_path")
    return doc


def finalize_ocr_output(working_output_path: Path, final_output_path: Path) -> None:
    if final_output_path.suffix == ".gz":
        with working_output_path.open("rb") as src, gzip.open(final_output_path, "wb") as dst:
            shutil.copyfileobj(src, dst)
        return
    shutil.copyfile(working_output_path, final_output_path)


def process_articles_source_file(
    *,
    input_path: Path,
    working_output_path: Path,
    final_output_path: Path,
    ocr_client: YandexOcrClient,
    write_batch_size: int = 20,
    max_images_per_article: int = 0,
    show_progress: bool = True,
) -> dict[str, Any]:
    source_rows = read_jsonl(input_path)
    processed_ids = read_processed_article_ids(working_output_path)

    stats = {
        "total_articles": len(source_rows),
        "processed": 0,
        "skipped_existing": 0,
        "written_batches": 0,
        "output_path": str(final_output_path),
        "working_output_path": str(working_output_path),
    }

    working_output_path.parent.mkdir(parents=True, exist_ok=True)
    batch: list[dict[str, Any]] = []
    mode = "a" if working_output_path.exists() else "w"
    with working_output_path.open(mode, encoding="utf-8") as out:
        progress = tqdm(
            total=len(source_rows),
            initial=min(len(processed_ids), len(source_rows)),
            disable=not show_progress,
            desc="OCR articles",
            unit="article",
        )
        try:
            for source_row in source_rows:
                article_id = int(source_row["id"])
                if article_id in processed_ids:
                    stats["skipped_existing"] += 1
                    progress.update(1)
                    continue

                batch.append(
                    enrich_article_source_row(
                        source_row,
                        ocr_client,
                        max_images_per_article=max_images_per_article,
                    )
                )
                processed_ids.add(article_id)
                stats["processed"] += 1
                progress.update(1)

                if len(batch) >= write_batch_size:
                    append_jsonl_batch(out, batch)
                    batch = []
                    stats["written_batches"] += 1
        finally:
            progress.close()

        if batch:
            append_jsonl_batch(out, batch)
            stats["written_batches"] += 1

    finalize_ocr_output(working_output_path, final_output_path)
    return stats

