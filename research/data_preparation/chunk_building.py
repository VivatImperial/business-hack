from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import re
from pathlib import Path
from typing import Any

from research.eda.parsers.tickets import ticket_doc_to_markdown


HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
REJECTION_RE = re.compile(
    r"(не актуаль|отменен|отмена|отказан|отказано|невозможн|доступ запрещен|закрываю|закрыта за давност|ошибки нет)",
    re.IGNORECASE,
)
ACTION_RE = re.compile(
    r"(настро|исправ|добав|обнов|перезап|перенастр|предостав|создан|включ|замен|установ|восстанов|очищ|перезагруз|доработ|передан|произведен|выполнен)",
    re.IGNORECASE,
)
DOMAIN_TAG_RULES = {
    "1с": "1с",
    "отчет": "отчет",
    "всд": "всд",
    "меркур": "меркурий",
    "принтер": "принтер",
    "удален": "удаленка",
    "vpn": "vpn",
    "доступ": "доступ",
    "почт": "почта",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Qdrant-ready chunks from EDA source datasets")
    parser.add_argument(
        "--source-dir",
        default="research/eda/outputs",
        help="Directory with tickets_source/articles_source outputs",
    )
    parser.add_argument(
        "--output-dir",
        default="research/data_preparation/outputs",
        help="Directory where Qdrant-ready chunks will be written",
    )
    parser.add_argument("--plain-jsonl", action="store_true", help="Write plain .jsonl instead of .jsonl.gz")
    parser.add_argument("--target-tokens", type=int, default=600, help="Target chunk size for article chunks")
    parser.add_argument("--hard-max-tokens", type=int, default=1100, help="Hard max chunk size for article chunks")
    return parser.parse_args()


def estimate_tokens(text: str | None) -> int:
    if not text:
        return 0
    return len(re.findall(r"\S+", text))


def open_jsonl_writer(path: Path, plain_jsonl: bool):
    if plain_jsonl:
        return path.open("w", encoding="utf-8"), path
    gz_path = path.with_suffix(path.suffix + ".gz")
    return gzip.open(gz_path, "wt", encoding="utf-8"), gz_path


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as f:  # type: ignore[arg-type]
        return [json.loads(line) for line in f]


def json_default(value: Any) -> Any:
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        return value.isoformat()
    return str(value)


def resolve_articles_source_path(source_dir: Path) -> Path:
    ocr_path = source_dir / "articles_source_ocr.jsonl.gz"
    if ocr_path.exists():
        return ocr_path
    return source_dir / "articles_source.jsonl.gz"


def _flatten_custom_fields(custom_fields: dict[str, Any]) -> str:
    lines = []
    for key, value in custom_fields.items():
        lines.append(f"{key}: {value}")
    return "\n".join(lines)


def _extract_domain_tags(text: str) -> list[str]:
    low = text.lower()
    tags = []
    for needle, tag in DOMAIN_TAG_RULES.items():
        if needle in low:
            tags.append(tag)
    return tags


def _looks_like_rejection(resolution_text: str | None, status: str | None) -> bool:
    text = f"{status or ''}\n{resolution_text or ''}".strip()
    if not text:
        return False
    return bool(REJECTION_RE.search(text))


def _is_actionable_resolution(resolution_text: str | None, resolution_source: str) -> bool:
    text = (resolution_text or "").strip()
    if not text:
        return False
    if resolution_source == "worklog":
        return True
    return bool(ACTION_RE.search(text))


def _resolution_quality(resolution_text: str | None, resolution_source: str) -> str:
    text = (resolution_text or "").strip()
    tokens = estimate_tokens(text)
    if resolution_source == "worklog" and tokens >= 3:
        return "strong"
    if resolution_source == "comment" and ACTION_RE.search(text) and tokens >= 6:
        return "strong"
    return "weak"


def build_ticket_case_point(doc: dict[str, Any]) -> dict[str, Any] | None:
    resolution_source = doc.get("resolution_source")
    if resolution_source not in {"worklog", "comment"}:
        return None

    meta = doc.get("meta") or {}
    custom_fields = doc.get("custom_fields") or {}
    request_text = doc.get("request_text") or ""
    resolution_text = doc.get("resolution_text") or ""

    if _looks_like_rejection(resolution_text, meta.get("status")):
        return None
    if not _is_actionable_resolution(resolution_text, resolution_source):
        return None

    resolution_quality = _resolution_quality(resolution_text, resolution_source)
    candidate_for_abstain = resolution_quality != "strong"
    grounding_markdown = ticket_doc_to_markdown(doc)

    embedding_parts = [
        "[REQUEST]",
        request_text,
        "",
        "[SERVICE]",
        meta.get("service") or "",
        "",
        "[TASK TYPE]",
        meta.get("task_type") or "",
    ]
    if custom_fields:
        embedding_parts.extend(["", "[KEY FIELDS]", _flatten_custom_fields(custom_fields)])
    embedding_text = "\n".join(part for part in embedding_parts if part is not None).strip()

    payload = {
        "source_type": "ticket",
        "chunk_kind": "case",
        "ticket_id": doc["ticket_id"],
        "request_text": request_text,
        "resolution_text": resolution_text,
        "resolution_source": resolution_source,
        "is_actionable": True,
        "resolution_quality": resolution_quality,
        "candidate_for_abstain": candidate_for_abstain,
        "service": meta.get("service"),
        "task_type": meta.get("task_type"),
        "status": meta.get("status"),
        "priority": meta.get("priority"),
        "created_at": meta.get("created_at"),
        "closed_at": meta.get("closed_at"),
        "custom_fields": custom_fields,
        "worklogs": doc.get("worklogs") or [],
        "domain_tags": _extract_domain_tags(f"{request_text}\n{resolution_text}\n{meta.get('service') or ''}\n{meta.get('task_type') or ''}"),
        "grounding_markdown": grounding_markdown,
    }
    return {
        "point_id": f"ticket:{doc['ticket_id']}",
        "embedding_text": embedding_text,
        "payload": payload,
    }


def _split_markdown_sections(markdown: str) -> list[tuple[list[str], str]]:
    lines = markdown.splitlines()
    sections: list[tuple[list[str], str]] = []
    heading_stack: list[str] = []
    current_path: list[str] = []
    current_lines: list[str] = []

    def flush() -> None:
        content = "\n".join(current_lines).strip()
        if content:
            sections.append((current_path.copy(), content))

    for line in lines:
        match = HEADING_RE.match(line.strip())
        if match:
            flush()
            level = len(match.group(1))
            title = match.group(2).strip()
            heading_stack[:] = heading_stack[: level - 1]
            heading_stack.append(title)
            current_path = heading_stack.copy()
            current_lines = []
        else:
            current_lines.append(line)

    flush()
    if not sections and markdown.strip():
        sections.append(([], markdown.strip()))
    return sections


def _split_section_blocks(section_markdown: str) -> list[str]:
    blocks = [block.strip() for block in re.split(r"\n\s*\n", section_markdown.strip()) if block.strip()]
    return blocks or [section_markdown.strip()]


def _split_words(block: str, max_tokens: int) -> list[str]:
    words = block.split()
    if not words:
        return []

    chunks: list[str] = []
    current_words: list[str] = []
    for word in words:
        candidate = " ".join(current_words + [word]).strip()
        if current_words and estimate_tokens(candidate) > max_tokens:
            chunks.append(" ".join(current_words).strip())
            current_words = [word]
        else:
            current_words.append(word)
    if current_words:
        chunks.append(" ".join(current_words).strip())
    return chunks


def _force_split_block(block: str, max_tokens: int) -> list[str]:
    if estimate_tokens(block) <= max_tokens:
        return [block]

    sentences = [item.strip() for item in re.split(r"(?<=[.!?])\s+", block) if item.strip()]
    if len(sentences) <= 1:
        return _split_words(block, max_tokens)

    chunks: list[str] = []
    current_sentences: list[str] = []
    for sentence in sentences:
        sentence_tokens = estimate_tokens(sentence)
        candidate = " ".join(current_sentences + [sentence]).strip()
        if current_sentences and estimate_tokens(candidate) > max_tokens:
            chunks.append(" ".join(current_sentences).strip())
            current_sentences = [sentence]
        elif sentence_tokens > max_tokens:
            chunks.extend(_split_words(sentence, max_tokens))
            current_sentences = []
        else:
            current_sentences.append(sentence)

    if current_sentences:
        chunks.append(" ".join(current_sentences).strip())
    return [chunk for chunk in chunks if chunk]


def _pack_blocks(blocks: list[str], heading_path: list[str], target_tokens: int, hard_max_tokens: int) -> list[str]:
    prefix = ""
    if heading_path:
        prefix = f"## {' / '.join(heading_path)}\n\n"

    whole_section = (prefix + "\n\n".join(blocks)).strip()
    if estimate_tokens(whole_section) <= hard_max_tokens:
        return [whole_section]

    prefix_tokens = estimate_tokens(prefix)
    max_block_tokens = max(hard_max_tokens - prefix_tokens, 1)
    expanded_blocks: list[str] = []
    for block in blocks:
        expanded_blocks.extend(_force_split_block(block, max_block_tokens))

    chunks: list[str] = []
    current_blocks: list[str] = []
    current_tokens = prefix_tokens

    for block in expanded_blocks:
        block_tokens = estimate_tokens(block)
        if not current_blocks:
            current_blocks = [block]
            current_tokens = prefix_tokens + block_tokens
            continue

        if current_tokens >= target_tokens:
            chunks.append((prefix + "\n\n".join(current_blocks)).strip())
            current_blocks = [block]
            current_tokens = prefix_tokens + block_tokens
            continue

        if current_tokens + block_tokens <= hard_max_tokens:
            current_blocks.append(block)
            current_tokens += block_tokens
            continue

        chunks.append((prefix + "\n\n".join(current_blocks)).strip())
        current_blocks = [block]
        current_tokens = prefix_tokens + block_tokens

    if current_blocks:
        chunks.append((prefix + "\n\n".join(current_blocks)).strip())
    return chunks


def build_article_retrieval_text(article_doc: dict[str, Any], heading_path: list[str], chunk_markdown: str) -> str:
    parts = [
        "[ARTICLE]",
        article_doc.get("title") or "",
        "",
        "[PATH]",
        article_doc.get("folder_path") or "",
        "",
        "[HEADINGS]",
        " / ".join(heading_path),
        "",
        "[CONTENT]",
        chunk_markdown,
    ]
    return "\n".join(parts).strip()


def chunk_article_source_doc(
    article_doc: dict[str, Any],
    target_tokens: int = 600,
    hard_max_tokens: int = 1100,
) -> list[dict[str, Any]]:
    markdown = (article_doc.get("markdown_with_ocr") or article_doc.get("markdown") or "").strip()
    if not markdown:
        return []

    sections = _split_markdown_sections(markdown)
    points: list[dict[str, Any]] = []
    chunk_index = 0
    for heading_path, section_markdown in sections:
        blocks = _split_section_blocks(section_markdown)
        packed = _pack_blocks(blocks, heading_path, target_tokens=target_tokens, hard_max_tokens=hard_max_tokens)
        for chunk_markdown in packed:
            chunk_id = f"article:{article_doc['id']}:{chunk_index}"
            payload = {
                "source_type": "article",
                "chunk_kind": "section",
                "article_id": article_doc["id"],
                "chunk_id": chunk_id,
                "chunk_index": chunk_index,
                "title": article_doc.get("title"),
                "folder_path": article_doc.get("folder_path"),
                "tags": article_doc.get("tags") or [],
                "heading_path": heading_path,
                "chunk_text": chunk_markdown,
                "chunk_markdown": chunk_markdown,
                "is_published": article_doc.get("is_published"),
                "rating": article_doc.get("rating"),
                "ocr_status": article_doc.get("ocr_status"),
                "created_at": article_doc.get("created_at"),
                "updated_at": article_doc.get("updated_at"),
                "published_at": article_doc.get("published_at"),
            }
            points.append(
                {
                    "point_id": chunk_id,
                    "embedding_text": build_article_retrieval_text(article_doc, heading_path, chunk_markdown),
                    "payload": payload,
                }
            )
            chunk_index += 1
    return points


def build_ticket_cases(source_dir: Path, output_dir: Path, plain_jsonl: bool) -> tuple[int, Path]:
    ticket_docs = read_jsonl(source_dir / "tickets_source.jsonl.gz")
    out, final_path = open_jsonl_writer(output_dir / "ticket_cases.jsonl", plain_jsonl)
    count = 0
    try:
        for doc in ticket_docs:
            point = build_ticket_case_point(doc)
            if point is None:
                continue
            out.write(json.dumps(point, ensure_ascii=False, default=json_default) + "\n")
            count += 1
    finally:
        out.close()
    return count, final_path


def build_article_chunks(
    source_dir: Path,
    output_dir: Path,
    plain_jsonl: bool,
    target_tokens: int,
    hard_max_tokens: int,
) -> tuple[int, Path, Path]:
    article_source_path = resolve_articles_source_path(source_dir)
    article_docs = read_jsonl(article_source_path)
    out, final_path = open_jsonl_writer(output_dir / "article_chunks.jsonl", plain_jsonl)
    count = 0
    try:
        for doc in article_docs:
            for point in chunk_article_source_doc(doc, target_tokens=target_tokens, hard_max_tokens=hard_max_tokens):
                out.write(json.dumps(point, ensure_ascii=False, default=json_default) + "\n")
                count += 1
    finally:
        out.close()
    return count, final_path, article_source_path


def main() -> None:
    args = parse_args()
    source_dir = Path(args.source_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    ticket_count, ticket_path = build_ticket_cases(source_dir, output_dir, args.plain_jsonl)
    article_count, article_path, article_source_path = build_article_chunks(
        source_dir,
        output_dir,
        args.plain_jsonl,
        target_tokens=args.target_tokens,
        hard_max_tokens=args.hard_max_tokens,
    )
    stats = {
        "generated_at": dt.datetime.now(dt.UTC).isoformat(),
        "ticket_cases": {"rows": ticket_count, "path": str(ticket_path)},
        "article_chunks": {"rows": article_count, "path": str(article_path), "source_path": str(article_source_path)},
    }
    (output_dir / "dataset_stats.json").write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done. Chunk stats written to: {output_dir / 'dataset_stats.json'}")


if __name__ == "__main__":
    main()

