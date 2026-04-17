from __future__ import annotations

import html
import re
from typing import Any


DATA_IMAGE_RE = re.compile(r"data:image/[^;]+;base64,[A-Za-z0-9+/=\s]+", re.IGNORECASE)
INLINE_IMAGE_TAG_RE = re.compile(r"<img\b[^>]*>", re.IGNORECASE | re.DOTALL)
INLINE_IMAGE_SRC_RE = re.compile(r'\bsrc=["\'](data:image/([^;]+);base64,([^"\']+))["\']', re.IGNORECASE | re.DOTALL)
INLINE_IMAGE_ALT_RE = re.compile(r'\balt=["\']([^"\']+)["\']', re.IGNORECASE | re.DOTALL)
PLACEHOLDER_RE = re.compile(r"\[\[(OCR_IMAGE_\d+)]]")
MEDIA_BLOCK_RE = re.compile(
    r"<(?:figure|picture|svg|canvas|video|audio|iframe|object|embed)\b.*?</(?:figure|picture|svg|canvas|video|audio|iframe|object|embed)>",
    re.IGNORECASE | re.DOTALL,
)
MEDIA_SELF_CLOSING_RE = re.compile(r"<(?:img|source|track)\b[^>]*>", re.IGNORECASE | re.DOTALL)
HTML_TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = WS_RE.sub(" ", value).strip()
    return value or None


def strip_non_text_media(raw_html: str | None) -> str:
    if not raw_html:
        return ""
    cleaned = DATA_IMAGE_RE.sub("", raw_html)
    cleaned = MEDIA_BLOCK_RE.sub("", cleaned)
    cleaned = MEDIA_SELF_CLOSING_RE.sub("", cleaned)
    return cleaned


def extract_inline_images(raw_html: str | None) -> dict[str, Any]:
    if not raw_html:
        return {"html_with_placeholders": "", "images": []}

    images: list[dict[str, Any]] = []

    def replace(match: re.Match[str]) -> str:
        tag = match.group(0)
        src_match = INLINE_IMAGE_SRC_RE.search(tag)
        if not src_match:
            return tag

        placeholder = f"OCR_IMAGE_{len(images)}"
        mime_subtype = src_match.group(2).strip().lower()
        content_base64 = re.sub(r"\s+", "", src_match.group(3))
        alt_match = INLINE_IMAGE_ALT_RE.search(tag)
        images.append(
            {
                "placeholder": placeholder,
                "token": f"[[{placeholder}]]",
                "mime_type": f"image/{mime_subtype}",
                "content_base64": content_base64,
                "alt": normalize_text(alt_match.group(1)) if alt_match else None,
            }
        )
        return f"[[{placeholder}]]"

    html_with_placeholders = INLINE_IMAGE_TAG_RE.sub(replace, raw_html)
    return {"html_with_placeholders": html_with_placeholders, "images": images}


def _convert_with_html_to_markdown(clean_html: str) -> str:
    try:
        from html_to_markdown import convert  # type: ignore
    except ModuleNotFoundError as exc:  # pragma: no cover - exercised via import patch in tests
        raise RuntimeError(
            "Missing required dependency 'html-to-markdown'. "
            "Install project dependencies before extracting article sources."
        ) from exc

    result = convert(clean_html)
    if isinstance(result, dict):
        markdown = result.get("content") or ""
    else:
        markdown = getattr(result, "content", None) or result
    return str(markdown)


def remove_ocr_placeholders(markdown: str | None) -> str:
    if not markdown:
        return ""
    cleaned = PLACEHOLDER_RE.sub("", markdown)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def html_to_markdown_lossy_safe(raw_html: str | None, preserve_placeholders: bool = False) -> str:
    clean_html = strip_non_text_media(raw_html)
    if not clean_html:
        return ""

    markdown = _convert_with_html_to_markdown(clean_html)

    markdown = DATA_IMAGE_RE.sub("", markdown)
    markdown = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    if not preserve_placeholders:
        markdown = remove_ocr_placeholders(markdown)
    return markdown.strip()


def html_to_text_fallback(raw_html: str | None) -> str | None:
    clean_html = strip_non_text_media(raw_html)
    text = HTML_TAG_RE.sub(" ", clean_html)
    text = html.unescape(text)
    return normalize_text(text)


def insert_ocr_blocks_into_markdown(markdown_with_placeholders: str, ocr_blocks: list[dict[str, Any]] | None) -> str:
    markdown = markdown_with_placeholders
    placeholder_map = {item.get("placeholder"): item.get("markdown") or "" for item in (ocr_blocks or [])}

    def replace(match: re.Match[str]) -> str:
        placeholder = match.group(1)
        block = (placeholder_map.get(placeholder) or "").strip()
        if not block:
            return ""
        return f"\n\n{block}\n\n"

    markdown = PLACEHOLDER_RE.sub(replace, markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    return markdown.strip()


def build_article_source_doc(
    article: dict[str, Any],
    tags: list[str] | None = None,
    folder_path: str | None = None,
    ocr_blocks: list[dict[str, Any]] | None = None,
    ocr_requested: bool = False,
    ocr_attempted_count: int = 0,
    ocr_error_count: int = 0,
) -> dict[str, Any]:
    raw_html = article.get("Description") or ""
    extraction = extract_inline_images(raw_html)
    markdown_with_placeholders = html_to_markdown_lossy_safe(
        extraction["html_with_placeholders"],
        preserve_placeholders=True,
    )
    markdown = remove_ocr_placeholders(markdown_with_placeholders)
    markdown_with_ocr = insert_ocr_blocks_into_markdown(markdown_with_placeholders, ocr_blocks)

    effective_ocr_requested = ocr_requested or bool(ocr_blocks)
    effective_attempted_count = ocr_attempted_count or len(ocr_blocks or [])
    image_count = len(extraction["images"])
    applied_count = sum(1 for item in (ocr_blocks or []) if normalize_text(item.get("markdown")))
    if image_count == 0:
        ocr_status = "not_applicable"
    elif not effective_ocr_requested:
        ocr_status = "not_requested"
    elif applied_count == 0 and ocr_error_count > 0:
        ocr_status = "error"
    elif applied_count == 0:
        ocr_status = "empty"
    elif ocr_error_count > 0 or effective_attempted_count < image_count or applied_count < image_count:
        ocr_status = "partial"
    else:
        ocr_status = "applied"

    normalized_ocr_blocks = []
    for item in ocr_blocks or []:
        markdown_block = normalize_text(item.get("markdown"))
        if not markdown_block:
            continue
        normalized_ocr_blocks.append(
            {
                "placeholder": item.get("placeholder"),
                "markdown": item.get("markdown"),
                "mime_type": item.get("mime_type"),
                "alt": item.get("alt"),
            }
        )

    return {
        "id": article.get("Id"),
        "parent_id": article.get("ParentId"),
        "title": article.get("Name"),
        "is_published": bool(article.get("IsPublished")),
        "rating": article.get("Rating"),
        "created_at": article.get("CreateDate"),
        "updated_at": article.get("ChangeDate"),
        "published_at": article.get("PublishDate"),
        "folder_path": folder_path,
        "tags": tags or [],
        "raw_html": raw_html,
        "markdown": markdown,
        "markdown_with_ocr": markdown_with_ocr or markdown,
        "ocr_status": ocr_status,
        "ocr_blocks": normalized_ocr_blocks,
        "ocr_markdown": "\n\n".join(item["markdown"] for item in normalized_ocr_blocks),
        "image_stats": {
            "inline_image_count": image_count,
            "ocr_attempted_count": effective_attempted_count,
            "ocr_applied_count": applied_count,
            "ocr_error_count": ocr_error_count,
        },
        "text_fallback": html_to_text_fallback(raw_html),
    }

