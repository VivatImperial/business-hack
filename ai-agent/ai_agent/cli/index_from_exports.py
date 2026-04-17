from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

from qdrant_client import QdrantClient

from ai_agent.config import get_settings
from ai_agent.integrations.qdrant_repository import QdrantRepository
from ai_agent.services.embedding_service import (
    QwenEmbeddingService,
    build_output_paths,
    iter_jsonl_batches,
    process_chunk_file,
)


REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_SOURCE_DIR = REPO_ROOT / "research" / "data_preparation" / "outputs"
DEFAULT_OUTPUT_DIR = DEFAULT_SOURCE_DIR / "embeddings"


def parse_args() -> argparse.Namespace:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Index prepared chunk files into Qdrant using local Qwen embeddings")
    parser.add_argument("--source-dir", default=str(DEFAULT_SOURCE_DIR))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument(
        "--chunk-files",
        nargs="+",
        default=["ticket_cases.jsonl.gz", "article_chunks.jsonl.gz"],
    )
    parser.add_argument("--model-name", default=settings.embedding_model_name)
    parser.add_argument("--device", default=settings.embedding_device, choices=["auto", "cuda", "mps", "cpu"])
    parser.add_argument("--torch-dtype", default=settings.embedding_torch_dtype, choices=["auto", "float32", "float16"])
    parser.add_argument("--max-length", type=int, default=settings.embedding_max_length)
    parser.add_argument("--embedding-dim", type=int, default=settings.embedding_dim)
    parser.add_argument("--embed-batch-size", type=int, default=4)
    parser.add_argument("--write-batch-size", type=int, default=32)
    parser.add_argument("--qdrant-url", default=settings.qdrant_url)
    parser.add_argument("--hide-progress", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_dir = Path(args.source_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    embedder = QwenEmbeddingService(
        model_name=args.model_name,
        device=args.device,
        torch_dtype=args.torch_dtype,
        max_length=args.max_length,
        embedding_dim=args.embedding_dim,
    )
    repository = QdrantRepository(client=QdrantClient(url=args.qdrant_url))

    stats: dict[str, object] = {
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "model_name": args.model_name,
        "files": [],
    }
    collections_ready = False
    for chunk_file in args.chunk_files:
        input_path = source_dir / chunk_file
        working_path, final_path = build_output_paths(output_dir, chunk_file, args.model_name)
        file_stats = process_chunk_file(
            input_path=input_path,
            working_output_path=working_path,
            final_output_path=final_path,
            embedder=embedder,
            embedding_model=args.model_name,
            embed_batch_size=args.embed_batch_size,
            write_batch_size=args.write_batch_size,
            show_progress=not args.hide_progress,
        )
        rows_uploaded = 0
        for batch in iter_jsonl_batches(final_path, args.write_batch_size):
            if batch and not collections_ready:
                repository.ensure_collections(vector_size=len(batch[0]["vector"]))
                collections_ready = True
            if "ticket_cases" in chunk_file:
                repository.upsert_ticket_cases(batch)
            else:
                repository.upsert_article_chunks(batch)
            rows_uploaded += len(batch)
        file_stats["rows_uploaded"] = rows_uploaded
        stats["files"].append(file_stats)

    stats_path = output_dir / "index_stats.json"
    stats_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done. Index stats written to: {stats_path}")


if __name__ == "__main__":
    main()
