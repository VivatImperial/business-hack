from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
RESEARCH_SCRIPT = REPO_ROOT / "research" / "extract_datasets.py"
INDEX_SCRIPT = "ai_agent.cli.index_from_exports"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract source datasets from MSSQL and index them into Qdrant")
    parser.add_argument("--ocr-articles", action="store_true")
    parser.add_argument("--source-dir", default=str(REPO_ROOT / "research" / "eda" / "outputs"))
    parser.add_argument("--output-dir", default=str(REPO_ROOT / "research" / "data_preparation" / "outputs" / "embeddings"))
    parser.add_argument("--qdrant-url", default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    extract_command = [sys.executable, str(RESEARCH_SCRIPT)]
    if args.ocr_articles:
        extract_command.append("--ocr-articles")
    subprocess.run(extract_command, cwd=REPO_ROOT, check=True)

    index_command = [
        sys.executable,
        "-m",
        INDEX_SCRIPT,
        "--source-dir",
        str(REPO_ROOT / "research" / "data_preparation" / "outputs"),
        "--output-dir",
        args.output_dir,
    ]
    if args.qdrant_url:
        index_command.extend(["--qdrant-url", args.qdrant_url])
    subprocess.run(index_command, cwd=REPO_ROOT / "ai-agent", check=True)


if __name__ == "__main__":
    main()
