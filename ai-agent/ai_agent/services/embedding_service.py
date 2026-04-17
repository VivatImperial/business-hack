from __future__ import annotations

import gzip
import json
import os
import re
import shutil
from pathlib import Path
from typing import Any, Iterator, Protocol

from tqdm import tqdm


MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"


class DocumentEmbedder(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...


def slugify_model_name(model_name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", model_name.lower()).strip("-")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as file_obj:  # type: ignore[arg-type]
        return [json.loads(line) for line in file_obj]


def iter_jsonl_batches(path: Path, batch_size: int) -> Iterator[list[dict[str, Any]]]:
    opener = gzip.open if path.suffix == ".gz" else open
    current_batch: list[dict[str, Any]] = []
    with opener(path, "rt", encoding="utf-8") as file_obj:  # type: ignore[arg-type]
        for line in file_obj:
            current_batch.append(json.loads(line))
            if len(current_batch) >= batch_size:
                yield current_batch
                current_batch = []
    if current_batch:
        yield current_batch


def read_processed_point_ids(working_output_path: Path) -> set[str]:
    if not working_output_path.exists():
        return set()
    with working_output_path.open("r", encoding="utf-8") as file_obj:
        return {str(json.loads(line)["point_id"]) for line in file_obj if line.strip()}


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


def build_output_paths(output_dir: Path, chunk_file: str, model_name: str) -> tuple[Path, Path]:
    model_slug = slugify_model_name(model_name)
    file_slug = chunk_file.replace(".jsonl.gz", "").replace(".jsonl", "")
    working_path = output_dir / f"{file_slug}.{model_slug}.working.jsonl"
    final_path = output_dir / f"{file_slug}.{model_slug}.jsonl.gz"
    return working_path, final_path


class QwenEmbeddingService:
    """Local embedding service backed by Qwen3 embedding model."""

    def __init__(
        self,
        *,
        model_name: str = MODEL_NAME,
        device: str = "auto",
        torch_dtype: str = "auto",
        max_length: int = 4096,
        embedding_dim: int = 0,
    ) -> None:
        import torch
        import torch.nn.functional as F
        from transformers import AutoModel, AutoTokenizer

        self.torch = torch
        self.F = F
        self.model_name = model_name
        self.device = self._resolve_device(device)
        self.max_length = max_length
        self.embedding_dim = embedding_dim if embedding_dim > 0 else None

        resolved_dtype = self._resolve_dtype(torch_dtype)
        model_kwargs: dict[str, Any] = {}
        if resolved_dtype is not None:
            model_kwargs["dtype"] = resolved_dtype

        self.tokenizer = AutoTokenizer.from_pretrained(model_name, padding_side="left")
        self.model = AutoModel.from_pretrained(model_name, **model_kwargs)
        self.model.to(self.device)
        self.model.eval()

    def _resolve_device(self, requested: str) -> str:
        if requested == "auto":
            if self.torch.cuda.is_available():
                return "cuda"
            if self.torch.backends.mps.is_available():
                return "mps"
            return "cpu"
        return requested

    def _resolve_dtype(self, requested: str):
        if requested == "auto":
            return self.torch.float32
        if requested == "float16":
            return self.torch.float16
        if requested == "float32":
            return self.torch.float32
        raise ValueError(f"Unsupported torch dtype: {requested}")

    def _last_token_pool(self, last_hidden_states, attention_mask):
        left_padding = bool((attention_mask[:, -1].sum() == attention_mask.shape[0]).item())
        if left_padding:
            return last_hidden_states[:, -1]
        sequence_lengths = attention_mask.sum(dim=1) - 1
        batch_size = last_hidden_states.shape[0]
        return last_hidden_states[self.torch.arange(batch_size, device=last_hidden_states.device), sequence_lengths]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        batch_dict = self.tokenizer(
            texts,
            padding="longest",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )
        batch_dict = {key: value.to(self.device) for key, value in batch_dict.items()}
        with self.torch.inference_mode():
            outputs = self.model(**batch_dict)
            embeddings = self._last_token_pool(outputs.last_hidden_state, batch_dict["attention_mask"])
            if self.embedding_dim is not None and self.embedding_dim < embeddings.shape[1]:
                embeddings = embeddings[:, : self.embedding_dim]
            embeddings = self.F.normalize(embeddings, p=2, dim=1)
        return embeddings.detach().cpu().tolist()


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

    with working_output_path.open("a" if working_output_path.exists() else "w", encoding="utf-8") as output_file:
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
                    append_jsonl_batch(output_file, rows_to_write)
                    processed_ids.update(str(item["point_id"]) for item in rows_to_write)
                    rows_to_write = []
                    stats["written_batches"] += 1

            flush_embeddings()
            if rows_to_write:
                append_jsonl_batch(output_file, rows_to_write)
                processed_ids.update(str(item["point_id"]) for item in rows_to_write)
                rows_to_write = []
                stats["written_batches"] += 1
        finally:
            progress.close()

    finalize_output(working_output_path, final_output_path)
    return stats
