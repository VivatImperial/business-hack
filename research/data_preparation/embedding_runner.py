from __future__ import annotations

import gzip
import json
import os
import shutil
from pathlib import Path
from typing import Any, Protocol

from tqdm import tqdm


class DocumentEmbedder(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as f:  # type: ignore[arg-type]
        return [json.loads(line) for line in f]


def read_processed_point_ids(working_output_path: Path) -> set[str]:
    if not working_output_path.exists():
        return set()
    with working_output_path.open("r", encoding="utf-8") as f:
        return {str(json.loads(line)["point_id"]) for line in f if line.strip()}


def append_jsonl_batch(output_file, batch: list[dict[str, Any]]) -> None:
    for row in batch:
        output_file.write(json.dumps(row, ensure_ascii=False) + "\n")
    output_file.flush()
    os.fsync(output_file.fileno())


def finalize_output(working_output_path: Path, final_output_path: Path) -> None:
    final_output_path.parent.mkdir(parents=True, exist_ok=True)
    if final_output_path.suffix == ".gz":
        with working_output_path.open("rb") as src, gzip.open(final_output_path, "wb") as dst:
            shutil.copyfileobj(src, dst)
        return
    shutil.copyfile(working_output_path, final_output_path)


def build_embedding_row(
    *,
    source_row: dict[str, Any],
    vector: list[float],
    embedding_model: str,
) -> dict[str, Any]:
    return {
        "point_id": source_row["point_id"],
        "vector": vector,
        "payload": source_row.get("payload") or {},
        "embedding_model": embedding_model,
        "embedding_dim": len(vector),
    }


def process_chunk_file(
    *,
    input_path: Path,
    working_output_path: Path,
    final_output_path: Path,
    embedder: DocumentEmbedder,
    embedding_model: str,
    embed_batch_size: int = 16,
    write_batch_size: int = 32,
    show_progress: bool = True,
) -> dict[str, Any]:
    source_rows = read_jsonl(input_path)
    processed_ids = read_processed_point_ids(working_output_path)
    working_output_path.parent.mkdir(parents=True, exist_ok=True)

    stats = {
        "input_path": str(input_path),
        "total_rows": len(source_rows),
        "processed": 0,
        "skipped_existing": 0,
        "written_batches": 0,
        "working_output_path": str(working_output_path),
        "final_output_path": str(final_output_path),
        "embedding_model": embedding_model,
    }

    pending_rows: list[dict[str, Any]] = []
    pending_texts: list[str] = []
    rows_to_write: list[dict[str, Any]] = []

    def flush_embeddings() -> None:
        nonlocal pending_rows, pending_texts, rows_to_write
        if not pending_rows:
            return
        vectors = embedder.embed_documents(pending_texts)
        rows_to_write.extend(
            build_embedding_row(source_row=row, vector=vector, embedding_model=embedding_model)
            for row, vector in zip(pending_rows, vectors, strict=True)
        )
        pending_rows = []
        pending_texts = []

    with working_output_path.open("a" if working_output_path.exists() else "w", encoding="utf-8") as out:
        progress = tqdm(
            total=len(source_rows),
            initial=min(len(processed_ids), len(source_rows)),
            disable=not show_progress,
            desc=input_path.stem,
            unit="chunk",
        )
        try:
            for row in source_rows:
                point_id = str(row["point_id"])
                if point_id in processed_ids:
                    stats["skipped_existing"] += 1
                    progress.update(1)
                    continue

                pending_rows.append(row)
                pending_texts.append(str(row.get("embedding_text") or ""))
                stats["processed"] += 1
                progress.update(1)

                if len(pending_rows) >= embed_batch_size:
                    flush_embeddings()

                if len(rows_to_write) >= write_batch_size:
                    append_jsonl_batch(out, rows_to_write)
                    processed_ids.update(str(item["point_id"]) for item in rows_to_write)
                    rows_to_write = []
                    stats["written_batches"] += 1

            flush_embeddings()
            if rows_to_write:
                append_jsonl_batch(out, rows_to_write)
                processed_ids.update(str(item["point_id"]) for item in rows_to_write)
                rows_to_write = []
                stats["written_batches"] += 1
        finally:
            progress.close()

    finalize_output(working_output_path, final_output_path)
    return stats

