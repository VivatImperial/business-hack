from __future__ import annotations

from typing import Any

import requests


YANDEX_OCR_URL = "https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze"


def normalize_ocr_text_to_markdown(text: str | None) -> str:
    if not text:
        return ""

    lines = []
    seen: set[str] = set()
    for raw_line in text.splitlines():
        line = " ".join(raw_line.split()).strip()
        if len(line) < 2:
            continue
        if line in seen:
            continue
        seen.add(line)
        lines.append(line)

    if not lines:
        return ""

    block = ["> OCR image note"]
    block.extend(f"> {line}" for line in lines)
    return "\n".join(block)


def _extract_text_from_words(words: list[dict[str, Any]]) -> str:
    return " ".join(str(item.get("text") or "").strip() for item in words if str(item.get("text") or "").strip()).strip()


def extract_text_from_ocr_response(payload: dict[str, Any]) -> str:
    results = payload.get("results") if isinstance(payload, dict) else None
    if isinstance(results, list):
        batch_lines: list[str] = []
        for result_item in results:
            if not isinstance(result_item, dict):
                continue
            nested_results = result_item.get("results")
            if not isinstance(nested_results, list):
                continue
            for feature_group in nested_results:
                feature_results = feature_group if isinstance(feature_group, list) else [feature_group]
                for feature_result in feature_results:
                    if not isinstance(feature_result, dict):
                        continue
                    text_detection = feature_result.get("textDetection")
                    if not isinstance(text_detection, dict):
                        continue
                    pages = text_detection.get("pages")
                    if not isinstance(pages, list):
                        continue
                    for page in pages:
                        if not isinstance(page, dict):
                            continue
                        blocks = page.get("blocks")
                        if not isinstance(blocks, list):
                            continue
                        for block in blocks:
                            if not isinstance(block, dict):
                                continue
                            lines = block.get("lines")
                            if not isinstance(lines, list):
                                continue
                            for line in lines:
                                if not isinstance(line, dict):
                                    continue
                                if isinstance(line.get("text"), str) and line["text"].strip():
                                    batch_lines.append(line["text"].strip())
                                    continue
                                words = line.get("words")
                                if isinstance(words, list):
                                    line_text = _extract_text_from_words(words)
                                    if line_text:
                                        batch_lines.append(line_text)
        if batch_lines:
            return "\n".join(batch_lines).strip()

    result = payload.get("result") if isinstance(payload, dict) else None
    if isinstance(result, dict):
        direct_text = result.get("text")
        if isinstance(direct_text, str) and direct_text.strip():
            return direct_text.strip()

        alternatives = result.get("alternatives")
        if isinstance(alternatives, list):
            for item in alternatives:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str) and text.strip():
                        return text.strip()

        text_annotation = result.get("textAnnotation")
        if isinstance(text_annotation, dict):
            full_text = text_annotation.get("fullText") or text_annotation.get("text")
            if isinstance(full_text, str) and full_text.strip():
                return full_text.strip()

            pages = text_annotation.get("pages")
            if isinstance(pages, list):
                page_lines: list[str] = []
                for page in pages:
                    if not isinstance(page, dict):
                        continue
                    blocks = page.get("blocks")
                    if not isinstance(blocks, list):
                        continue
                    for block in blocks:
                        if not isinstance(block, dict):
                            continue
                        lines = block.get("lines")
                        if not isinstance(lines, list):
                            continue
                        for line in lines:
                            if not isinstance(line, dict):
                                continue
                            line_text = ""
                            if isinstance(line.get("text"), str):
                                line_text = line["text"].strip()
                            elif isinstance(line.get("words"), list):
                                line_text = _extract_text_from_words(line["words"])
                            if line_text:
                                page_lines.append(line_text)
                if page_lines:
                    return "\n".join(page_lines).strip()
    return ""


class YandexOcrClient:
    def __init__(
        self,
        api_key: str,
        folder_id: str | None,
        *,
        url: str = YANDEX_OCR_URL,
        timeout_seconds: int = 60,
    ) -> None:
        if not api_key:
            raise ValueError("api_key is required")
        self.api_key = api_key
        self.folder_id = folder_id
        self.url = url
        self.timeout_seconds = timeout_seconds

    def recognize_markdown(
        self,
        content_base64: str,
        mime_type: str,
        *,
        language_codes: list[str] | None = None,
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
        }
        if self.folder_id and self.folder_id != "your-folder-id":
            headers["x-folder-id"] = self.folder_id

        response = requests.post(
            self.url,
            headers=headers,
            json={
                "analyze_specs": [
                    {
                        "content": content_base64,
                        "features": [
                            {
                                "type": "TEXT_DETECTION",
                                "text_detection_config": {
                                    "language_codes": language_codes or ["ru", "en"],
                                },
                            }
                        ],
                    }
                ]
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        text = extract_text_from_ocr_response(payload)
        return {
            "text": text,
            "markdown": normalize_ocr_text_to_markdown(text),
            "raw_response": payload,
        }
