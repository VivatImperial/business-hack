import unittest

from research.data_preparation.chunk_building import (
    build_ticket_case_point,
    chunk_article_source_doc,
    estimate_tokens,
)


class TicketCaseChunkTests(unittest.TestCase):
    def test_build_ticket_case_point_skips_unresolved_tickets(self):
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

    def test_build_ticket_case_point_skips_cancelled_comment_cases(self):
        doc = {
            "ticket_id": 250,
            "request_text": "Нет доступа к COM-порту онлайн-кассы",
            "resolution_text": "Отменена, так как меняется инфраструктура и способ подключения к БД.",
            "resolution_source": "comment",
            "meta": {
                "service": "Доступ: Установить (Настроить)",
                "task_type": "Тип: Стандартный",
                "status": "Отменена",
                "priority": "Низкий",
                "created_at": None,
                "closed_at": None,
            },
            "custom_fields": {},
            "worklogs": [],
            "raw": {
                "title": "Нет доступа к COM-порту",
                "description": "Порт недоступен",
                "comment": "Отменена, так как меняется инфраструктура и способ подключения к БД.",
            },
        }
        self.assertIsNone(build_ticket_case_point(doc))

    def test_build_ticket_case_point_skips_non_actionable_comment_cases(self):
        doc = {
            "ticket_id": 277,
            "request_text": "Настройка авторизации",
            "resolution_text": "Спасибо за оперативность!",
            "resolution_source": "comment",
            "meta": {
                "service": "Подключение к базе",
                "task_type": "Тип: 1С (Программисты)",
                "status": "Закрыта",
                "priority": "Низкий",
                "created_at": None,
                "closed_at": None,
            },
            "custom_fields": {},
            "worklogs": [],
            "raw": {
                "title": "Настройка авторизации",
                "description": "Нужно настроить авторизацию",
                "comment": "Спасибо за оперативность!",
            },
        }
        self.assertIsNone(build_ticket_case_point(doc))

    def test_build_ticket_case_point_creates_actionable_qdrant_record(self):
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
    def test_chunk_article_source_doc_prefers_markdown_with_ocr(self):
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

    def test_chunk_article_source_doc_keeps_short_section_whole(self):
        article = {
            "id": 80,
            "title": "Разрешить выход в Internet доменному пользователю",
            "folder_path": "SQUID",
            "tags": ["internet"],
            "is_published": True,
            "rating": 5,
            "markdown": (
                "# Доступ\n\n"
                "Для того чтобы разрешить доменному пользователю выходить в Интернет нужно добавить его "
                "в соответствующую группу в AD.\n\n"
                "**SQUID-INTERNET-STANDART** - стандартные права.\n\n"
                "**SQUID-INTERNET-FULL_ACCESS** - полные права.\n"
            ),
        }

        chunks = chunk_article_source_doc(article, target_tokens=10, hard_max_tokens=120)
        self.assertEqual(len(chunks), 1)
        self.assertIn("SQUID-INTERNET-FULL_ACCESS", chunks[0]["payload"]["chunk_markdown"])

    def test_chunk_article_source_doc_splits_by_headings_and_keeps_structure(self):
        article = {
            "id": 602,
            "title": "Настройка VPN",
            "folder_path": "IT/Remote Access",
            "tags": ["vpn"],
            "is_published": True,
            "rating": 5,
            "markdown": (
                "# Подключение\n\n"
                "Общий обзор.\n\n"
                "## Windows\n\n"
                "- Установите клиент\n"
                "- Введите логин\n\n"
                "| Параметр | Значение |\n"
                "| --- | --- |\n"
                "| Сервер | vpn.example |\n\n"
                "## macOS\n\n"
                "Откройте настройки VPN.\n"
            ),
        }

        chunks = chunk_article_source_doc(article, target_tokens=20, hard_max_tokens=60)
        self.assertGreaterEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["payload"]["source_type"], "article")
        self.assertIn("Настройка VPN", chunks[0]["embedding_text"])
        self.assertTrue(any("Windows" in " / ".join(chunk["payload"]["heading_path"]) for chunk in chunks))
        self.assertTrue(any("| Сервер | vpn.example |" in chunk["payload"]["chunk_markdown"] for chunk in chunks))

    def test_chunk_article_source_doc_force_splits_oversized_section(self):
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


if __name__ == "__main__":
    unittest.main()

