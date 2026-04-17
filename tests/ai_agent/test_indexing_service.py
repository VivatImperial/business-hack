from __future__ import annotations

import gzip
import json
import tempfile
import unittest
from pathlib import Path

from ai_agent.services.indexing_service import (
    build_article_chunks,
    build_ticket_case_point,
    chunk_article_source_doc,
    estimate_tokens,
)


class TicketCaseChunkTests(unittest.TestCase):
    def test_build_ticket_case_point_skips_unresolved_tickets(self) -> None:
        doc = {
            "ticket_id": 1,
            "request_text": "Не работает VPN",
            "resolution_text": None,
            "resolution_source": "none",
            "meta": {},
            "custom_fields": {},
            "worklogs": [],
            "raw": {},
        }

        self.assertIsNone(build_ticket_case_point(doc))

    def test_build_ticket_case_point_creates_actionable_qdrant_record(self) -> None:
        doc = {
            "ticket_id": 31929,
            "request_text": "Ошибка при увольнении\nНе получается провести увольнение.",
            "resolution_text": "анализ ошибки, изменение начисления",
            "resolution_source": "worklog",
            "meta": {
                "service": "Целевые: ЗУП (Корпоративная)",
                "task_type": "Тип: 1С (Программисты)",
                "status": "Закрыта",
                "priority": "Низкий",
                "created_at": None,
                "closed_at": None,
            },
            "custom_fields": {"Размер": "L"},
            "worklogs": [{"date": None, "minutes": 15, "comment": "анализ ошибки"}],
            "raw": {
                "title": "Ошибка при увольнении",
                "description": "Не получается провести увольнение.",
                "comment": None,
            },
        }

        point = build_ticket_case_point(doc)

        self.assertEqual(point["point_id"], "ticket:31929")
        self.assertEqual(point["payload"]["chunk_kind"], "case")
        self.assertTrue(point["payload"]["is_actionable"])
        self.assertEqual(point["payload"]["resolution_quality"], "strong")
        self.assertFalse(point["payload"]["candidate_for_abstain"])
        self.assertIn("Ошибка при увольнении", point["embedding_text"])
        self.assertIn("Целевые: ЗУП", point["embedding_text"])
        self.assertNotIn("анализ ошибки", point["embedding_text"])
        self.assertIn("## Resolution", point["payload"]["grounding_markdown"])


class ArticleChunkTests(unittest.TestCase):
    def test_chunk_article_source_doc_prefers_markdown_with_ocr(self) -> None:
        article = {
            "id": 81,
            "title": "VPN with OCR",
            "folder_path": "IT/Remote Access",
            "tags": ["vpn"],
            "is_published": True,
            "rating": 5,
            "markdown": "# VPN\n\nОткройте клиент.",
            "markdown_with_ocr": "# VPN\n\nОткройте клиент.\n\n> OCR image note\n> Кнопка: Подключить",
        }

        chunks = chunk_article_source_doc(article, target_tokens=50, hard_max_tokens=120)

        self.assertEqual(len(chunks), 1)
        self.assertIn("Кнопка: Подключить", chunks[0]["payload"]["chunk_markdown"])

    def test_chunk_article_source_doc_force_splits_oversized_section(self) -> None:
        sentence = "Сначала откройте клиент VPN и проверьте профиль подключения."
        article = {
            "id": 603,
            "title": "Длинная инструкция VPN",
            "folder_path": "IT/Remote Access",
            "tags": ["vpn"],
            "is_published": True,
            "rating": 5,
            "markdown": "# Инструкция\n\n" + " ".join([sentence] * 20),
        }

        chunks = chunk_article_source_doc(article, target_tokens=35, hard_max_tokens=45)

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(estimate_tokens(chunk["payload"]["chunk_markdown"]) <= 45 for chunk in chunks))

    def test_build_article_chunks_prefers_ocr_source_when_present(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            source_dir = Path(tmpdir) / "source"
            output_dir = Path(tmpdir) / "output"
            source_dir.mkdir()
            output_dir.mkdir()

            base_article = {
                "id": 81,
                "title": "VPN with OCR",
                "folder_path": "IT/Remote Access",
                "tags": ["vpn"],
                "is_published": True,
                "rating": 5,
                "ocr_status": "not_applicable",
            }

            with gzip.open(source_dir / "articles_source.jsonl.gz", "wt", encoding="utf-8") as file_obj:
                file_obj.write(
                    json.dumps(
                        {
                            **base_article,
                            "markdown": "# VPN\n\nОбычная версия без OCR.",
                            "markdown_with_ocr": "# VPN\n\nОбычная версия без OCR.",
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )

            with gzip.open(source_dir / "articles_source_ocr.jsonl.gz", "wt", encoding="utf-8") as file_obj:
                file_obj.write(
                    json.dumps(
                        {
                            **base_article,
                            "markdown": "# VPN\n\nОбычная версия без OCR.",
                            "markdown_with_ocr": "# VPN\n\n> OCR image note\n> Кнопка: Подключить",
                            "ocr_status": "applied",
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )

            count, output_path, source_path = build_article_chunks(
                source_dir=source_dir,
                output_dir=output_dir,
                plain_jsonl=False,
                target_tokens=50,
                hard_max_tokens=120,
            )

            self.assertEqual(count, 1)
            self.assertEqual(source_path, source_dir / "articles_source_ocr.jsonl.gz")
            with gzip.open(output_path, "rt", encoding="utf-8") as file_obj:
                row = json.loads(file_obj.readline())
            self.assertEqual(row["payload"]["ocr_status"], "applied")
            self.assertIn("Кнопка: Подключить", row["payload"]["chunk_markdown"])


if __name__ == "__main__":
    unittest.main()
