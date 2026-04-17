import unittest

from research.eda.parsers import tickets as ed


class TicketParserTests(unittest.TestCase):
    def test_resolution_uses_worklog_first(self):
        task = {
            "Id": 31929,
            "Name": "Ошибка при увольнении",
            "Description": "Не получается провести увольнение",
            "Comment": 'Заявка автоматически переведена в статус "Закрыта" по истечении 16 часов 0 минут',
            "ServiceNameRu": "Целевые: ЗУП (Корпоративная)",
            "TaskTypeNameRu": "Тип: 1С (Программисты)",
            "StatusNameRu": "Закрыта",
            "Created": None,
            "Closed": None,
        }
        worklogs = [
            {"Comments": "анализ ошибки, изменение начисления", "Date": None, "Minutes": 15},
            {"Comments": "проверка результата", "Date": None, "Minutes": 5},
        ]
        custom_fields = []

        doc = ed.build_rag_ticket_doc(task, worklogs, custom_fields)
        self.assertEqual(doc["resolution_source"], "worklog")
        self.assertIn("анализ ошибки", doc["resolution_text"])
        self.assertIn("проверка результата", doc["resolution_text"])

    def test_resolution_falls_back_to_comment(self):
        task = {
            "Id": 1662,
            "Name": "Настройка статусов SD",
            "Description": "Сделать доступными статусы",
            "Comment": "В исполнении отказано: функционал закрыт.",
            "ServiceNameRu": "Архив: Настройка",
            "TaskTypeNameRu": "Тип: Стандартный",
            "StatusNameRu": "Закрыта",
            "Created": None,
            "Closed": None,
        }
        doc = ed.build_rag_ticket_doc(task, [], [])
        self.assertEqual(doc["resolution_source"], "comment")
        self.assertEqual(doc["resolution_text"], "В исполнении отказано: функционал закрыт.")

    def test_resolution_none_when_only_auto_close_comment(self):
        task = {
            "Id": 38665,
            "Name": "Жалоба",
            "Description": "Проблема по продукту",
            "Comment": 'Заявка автоматически переведена в статус "Закрыта" по истечении 720 часов 0 минут',
            "ServiceNameRu": "Жалоба",
            "TaskTypeNameRu": "Тип: Контроль качества",
            "StatusNameRu": "Закрыта",
            "Created": None,
            "Closed": None,
        }
        doc = ed.build_rag_ticket_doc(task, [], [])
        self.assertEqual(doc["resolution_source"], "none")
        self.assertIsNone(doc["resolution_text"])

    def test_request_text_includes_meaningful_custom_fields(self):
        task = {
            "Id": 38665,
            "Name": "Сельдь в солевой заливке",
            "Description": "мутный рассол",
            "Comment": "",
            "ServiceNameRu": "Жалоба",
            "TaskTypeNameRu": "Тип: Контроль качества",
            "StatusNameRu": "Закрыта",
            "Created": None,
            "Closed": None,
        }
        custom_fields = [
            {"FieldNameRu": "Тип обращения", "ValueClean": "Жалоба", "ComboboxNameRu": "Жалоба"},
            {"FieldNameRu": "Наименование продукции", "ValueClean": "Сельдь в солевой заливке", "ComboboxNameRu": None},
            {"FieldNameRu": "Контакты", "ValueClean": "...", "ComboboxNameRu": None},
        ]
        doc = ed.build_rag_ticket_doc(task, [], custom_fields)
        self.assertIn("Сельдь в солевой заливке", doc["request_text"])
        self.assertIn("Тип обращения: Жалоба", doc["request_text"])
        self.assertNotIn("Контакты", doc["request_text"])


if __name__ == "__main__":
    unittest.main()

