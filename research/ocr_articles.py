#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from research.eda.ocr_runner import process_articles_source_file
from research.eda.parsers.yandex_ocr import YandexOcrClient

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Enrich existing article source with inline Yandex OCR")
    parser.add_argument(
        "--input-path",
        default="research/eda/outputs/articles_source.jsonl.gz",
        help="Path to existing articles_source JSONL/JSONL.GZ file",
    )
    parser.add_argument(
        "--output-path",
        default="research/eda/outputs/articles_source_ocr.jsonl.gz",
        help="Final enriched output path (.jsonl or .jsonl.gz)",
    )
    parser.add_argument(
        "--working-path",
        default="research/eda/outputs/articles_source_ocr.working.jsonl",
        help="Resume-safe plain JSONL checkpoint file used during OCR processing",
    )
    parser.add_argument(
        "--write-batch-size",
        type=int,
        default=20,
        help="How many enriched articles to flush to disk per batch",
    )
    parser.add_argument(
        "--ocr-max-images-per-article",
        type=int,
        default=0,
        help="Maximum number of inline images to OCR per article (0 = no limit)",
    )
    parser.add_argument(
        "--stats-path",
        default="research/eda/outputs/articles_source_ocr_stats.json",
        help="Where OCR runner stats will be written",
    )
    parser.add_argument(
        "--hide-progress",
        action="store_true",
        help="Disable tqdm progress bar",
    )
    return parser.parse_args()


def build_ocr_client_from_env() -> YandexOcrClient:
    api_key = os.getenv("YANDEX_OCR_API_KEY") or os.getenv("YANDEX_GPT_API_KEY")
    folder_id = os.getenv("YANDEX_OCR_FOLDER_ID") or os.getenv("YANDEX_GPT_FOLDER_ID")
    if not api_key:
        raise SystemExit("Missing YANDEX_OCR_API_KEY (or YANDEX_GPT_API_KEY) for OCR run")
    return YandexOcrClient(api_key=api_key, folder_id=folder_id)


def main() -> None:
    if load_dotenv is not None:
        load_dotenv()
    args = parse_args()

    client = build_ocr_client_from_env()
    stats = process_articles_source_file(
        input_path=Path(args.input_path),
        working_output_path=Path(args.working_path),
        final_output_path=Path(args.output_path),
        ocr_client=client,
        write_batch_size=args.write_batch_size,
        max_images_per_article=args.ocr_max_images_per_article,
        show_progress=not args.hide_progress,
    )

    stats_path = Path(args.stats_path)
    stats_path.parent.mkdir(parents=True, exist_ok=True)
    stats_path.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done. OCR-enriched articles written to: {args.output_path}")
    print(f"Stats written to: {args.stats_path}")


if __name__ == "__main__":
    main()

