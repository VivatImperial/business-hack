import unittest
from unittest.mock import patch

from research.eda.parsers.articles import (
    build_article_source_doc,
    extract_inline_images,
    html_to_markdown_lossy_safe,
)
from research.eda.parsers.tickets import ticket_doc_to_markdown
from research.eda.parsers.yandex_ocr import (
    YandexOcrClient,
    extract_text_from_ocr_response,
    normalize_ocr_text_to_markdown,
)


class ArticleSourceTests(unittest.TestCase):
    def test_html_to_markdown_keeps_structure_and_drops_images(self):
        html = """
        <html>
          <body>
            <h1>Инструкция</h1>
            <p>Шаги настройки.</p>
            <ul><li>Первый шаг</li><li>Второй шаг</li></ul>
            <table>
              <tr><th>Параметр</th><th>Значение</th></tr>
              <tr><td>Логин</td><td>user</td></tr>
            </table>
            <p><img src="https://example.com/a.png" alt="pic"></p>
            <p><img src="data:image/png;base64,AAAA" alt="inline"></p>
          </body>
        </html>
        """

        markdown = html_to_markdown_lossy_safe(html)
        self.assertIn("Инструкция", markdown)
        self.assertIn("Первый шаг", markdown)
        self.assertIn("Логин", markdown)
        self.assertNotIn("data:image", markdown)
        self.assertNotIn("![]", markdown)
        self.assertNotIn("pic", markdown)

    def test_build_article_source_doc_keeps_raw_html_and_markdown(self):
        article = {
            "Id": 10,
            "ParentId": 1,
            "Name": "Доступ в VPN",
            "Description": "<h1>VPN</h1><p>Откройте клиент.</p>",
            "IsPublished": 1,
            "Rating": 5,
            "CreateDate": None,
            "ChangeDate": None,
            "PublishDate": None,
        }
        doc = build_article_source_doc(article, tags=["vpn", "remote"], folder_path="IT/Remote")
        self.assertEqual(doc["id"], 10)
        self.assertEqual(doc["title"], "Доступ в VPN")
        self.assertEqual(doc["tags"], ["vpn", "remote"])
        self.assertEqual(doc["folder_path"], "IT/Remote")
        self.assertIn("VPN", doc["markdown"])
        self.assertIn("<h1>VPN</h1>", doc["raw_html"])

    def test_extract_inline_images_returns_placeholders_in_order(self):
        html = (
            '<p>Шаг 1</p>'
            '<p><img src="data:image/png;base64,AAAA" alt="step1"></p>'
            '<p>Шаг 2</p>'
            '<p><img src="data:image/jpeg;base64,BBBB"></p>'
        )

        result = extract_inline_images(html)

        self.assertIn("OCR_IMAGE_0", result["html_with_placeholders"])
        self.assertIn("OCR_IMAGE_1", result["html_with_placeholders"])
        self.assertEqual(len(result["images"]), 2)
        self.assertEqual(result["images"][0]["mime_type"], "image/png")
        self.assertEqual(result["images"][1]["mime_type"], "image/jpeg")

    def test_build_article_source_doc_inserts_ocr_markdown_at_image_position(self):
        article = {
            "Id": 10,
            "ParentId": 1,
            "Name": "Доступ в VPN",
            "Description": (
                "<h1>VPN</h1>"
                "<p>Откройте клиент.</p>"
                '<p><img src="data:image/png;base64,AAAA" alt="screen"></p>'
                "<p>Нажмите подключить.</p>"
            ),
            "IsPublished": 1,
            "Rating": 5,
            "CreateDate": None,
            "ChangeDate": None,
            "PublishDate": None,
        }
        ocr_blocks = [{"placeholder": "OCR_IMAGE_0", "markdown": "> OCR image note\n> Кнопка: Подключить"}]

        doc = build_article_source_doc(article, tags=["vpn"], folder_path="IT/Remote", ocr_blocks=ocr_blocks)

        self.assertIn("Откройте клиент.", doc["markdown_with_ocr"])
        self.assertIn("> OCR image note", doc["markdown_with_ocr"])
        self.assertIn("Кнопка: Подключить", doc["markdown_with_ocr"])
        self.assertIn("Нажмите подключить.", doc["markdown_with_ocr"])
        self.assertEqual(doc["ocr_status"], "applied")

    def test_html_to_markdown_raises_clear_error_when_dependency_missing(self):
        real_import = __import__

        def raising_import(name, *args, **kwargs):
            if name == "html_to_markdown":
                raise ModuleNotFoundError("No module named 'html_to_markdown'")
            return real_import(name, *args, **kwargs)

        with patch("builtins.__import__", side_effect=raising_import):
            with self.assertRaisesRegex(RuntimeError, "html-to-markdown"):
                html_to_markdown_lossy_safe("<h1>Title</h1>")


class YandexOcrTests(unittest.TestCase):
    def test_normalize_ocr_text_to_markdown_wraps_meaningful_lines(self):
        markdown = normalize_ocr_text_to_markdown("Настройки подключения VPN\nКнопка: Подключить")
        self.assertIn("> OCR image note", markdown)
        self.assertIn("> Настройки подключения VPN", markdown)
        self.assertIn("> Кнопка: Подключить", markdown)

    def test_extract_text_from_ocr_response_handles_batch_analyze_shape(self):
        payload = {
            "results": [
                {
                    "results": [
                        [
                            {
                                "textDetection": {
                                    "pages": [
                                        {
                                            "blocks": [
                                                {
                                                    "lines": [
                                                        {
                                                            "words": [
                                                                {"text": "Настройки"},
                                                                {"text": "VPN"},
                                                            ]
                                                        },
                                                        {
                                                            "words": [
                                                                {"text": "Кнопка"},
                                                                {"text": "Подключить"},
                                                            ]
                                                        },
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    ]
                }
            ]
        }

        text = extract_text_from_ocr_response(payload)
        self.assertIn("Настройки VPN", text)
        self.assertIn("Кнопка Подключить", text)

    def test_extract_text_from_ocr_response_handles_real_batch_analyze_shape(self):
        payload = {
            "results": [
                {
                    "results": [
                        {
                            "textDetection": {
                                "pages": [
                                    {
                                        "blocks": [
                                            {
                                                "lines": [
                                                    {"words": [{"text": "Скумбрия"}, {"text": "365"}, {"text": "ДНЕЙ"}]},
                                                    {"words": [{"text": "Вес"}, {"text": "нетто"}]},
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }

        text = extract_text_from_ocr_response(payload)
        self.assertIn("Скумбрия 365 ДНЕЙ", text)
        self.assertIn("Вес нетто", text)

    def test_yandex_ocr_client_requires_api_key(self):
        with self.assertRaisesRegex(ValueError, "api_key"):
            YandexOcrClient(api_key="", folder_id=None)


class TicketMarkdownTests(unittest.TestCase):
    def test_ticket_doc_to_markdown_formats_request_and_resolution(self):
        doc = {
            "ticket_id": 31929,
            "request_text": "Ошибка при увольнении\nНе получается провести увольнение.",
            "resolution_text": "анализ ошибки, изменение начисления",
            "resolution_source": "worklog",
            "meta": {
                "service": "Целевые: ЗУП (Корпоративная)",
                "task_type": "Тип: 1С (Программисты)",
                "status": "Закрыта",
                "created_at": None,
                "closed_at": None,
            },
            "custom_fields": {"Размер": "L"},
        }

        markdown = ticket_doc_to_markdown(doc)
        self.assertIn("# Ticket 31929", markdown)
        self.assertIn("## Request", markdown)
        self.assertIn("Ошибка при увольнении", markdown)
        self.assertIn("## Resolution", markdown)
        self.assertIn("анализ ошибки", markdown)
        self.assertIn("## Meta", markdown)
        self.assertIn("## Custom Fields", markdown)


if __name__ == "__main__":
    unittest.main()

