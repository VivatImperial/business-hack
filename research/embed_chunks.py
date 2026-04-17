#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from research.data_preparation.embedding_runner import process_chunk_file


MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"


def slugify_model_name(model_name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", model_name.lower()).strip("-")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Embed chunk files with Qwen3 embeddings")
    parser.add_argument(
        "--source-dir",
        default="research/data_preparation/outputs",
        help="Directory containing chunk files such as ticket_cases.jsonl.gz and article_chunks.jsonl.gz",
    )
    parser.add_argument(
        "--output-dir",
        default="research/data_preparation/outputs/embeddings",
        help="Directory where embedding artifacts will be written",
    )
    parser.add_argument(
        "--chunk-files",
        nargs="+",
        default=["ticket_cases.jsonl.gz", "article_chunks.jsonl.gz"],
        help="Chunk files relative to --source-dir",
    )
    parser.add_argument("--model-name", default=MODEL_NAME, help="Embedding model name")
    parser.add_argument(
        "--device",
        default="auto",
        choices=["auto", "mps", "cpu"],
        help="Embedding device; auto prefers MPS on macOS",
    )
    parser.add_argument(
        "--torch-dtype",
        default="auto",
        choices=["auto", "float32", "float16"],
        help="Torch dtype for model weights",
    )
    parser.add_argument("--max-length", type=int, default=4096, help="Tokenizer max_length")
    parser.add_argument("--embedding-dim", type=int, default=0, help="Optional output dimension; 0 keeps full size")
    parser.add_argument("--embed-batch-size", type=int, default=4, help="How many texts to embed per forward pass")
    parser.add_argument("--write-batch-size", type=int, default=32, help="How many embedded rows to flush per batch")
    parser.add_argument("--hide-progress", action="store_true", help="Disable tqdm progress bars")
    return parser.parse_args()


class Qwen3Embedder:
    def __init__(
        self,
        *,
        model_name: str,
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

def build_output_paths(output_dir: Path, chunk_file: str, model_name: str) -> tuple[Path, Path]:
    model_slug = slugify_model_name(model_name)
    file_slug = chunk_file.replace(".jsonl.gz", "").replace(".jsonl", "")
    working_path = output_dir / f"{file_slug}.{model_slug}.working.jsonl"
    final_path = output_dir / f"{file_slug}.{model_slug}.jsonl.gz"
    return working_path, final_path


def main() -> None:
    args = parse_args()
    source_dir = Path(args.source_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    embedder = Qwen3Embedder(
        model_name=args.model_name,
        device=args.device,
        torch_dtype=args.torch_dtype,
        max_length=args.max_length,
        embedding_dim=args.embedding_dim,
    )

    stats: dict[str, Any] = {
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "model_name": args.model_name,
        "device": embedder.device,
        "torch_dtype": args.torch_dtype,
        "files": [],
    }
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
        stats["files"].append(file_stats)

    stats_path = output_dir / "dataset_stats.json"
    stats_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done. Embedding stats written to: {stats_path}")


if __name__ == "__main__":
    main()

