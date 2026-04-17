from __future__ import annotations

import unittest

from ai_agent.services.ticket_draft_service import TicketDraftService


class CreateTicketFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = TicketDraftService()

    def test_build_draft_marks_missing_fields_and_limits_questions(self) -> None:
        draft = self.service.build_draft(
            user_text="Нужно оформить заявку на проблему с VPN",
            top_tickets=[],
        )

        self.assertEqual(draft.normalized_request, "Нужно оформить заявку на проблему с VPN")
        self.assertIn("device", draft.missing_fields)
        self.assertLessEqual(len(draft.clarifying_questions), 2)
        self.assertTrue(all(question.endswith("?") for question in draft.clarifying_questions))

    def test_build_draft_uses_top_ticket_signals_for_classifier_hints(self) -> None:
        draft = self.service.build_draft(
            user_text="Не подключается удаленка на ноутбуке",
            top_tickets=[
                {
                    "point_id": "ticket:42",
                    "score": 0.92,
                    "payload": {
                        "service": "Удаленный доступ / VPN",
                        "task_type": "Тип: Стандартный",
                        "priority": "Низкий",
                    },
                }
            ],
        )

        self.assertEqual(draft.suggested_service, "Удаленный доступ / VPN")
        self.assertEqual(draft.suggested_task_type, "Тип: Стандартный")
        self.assertEqual(draft.suggested_priority, "p4")
        self.assertEqual(draft.evidence_ticket_ids, [42])
        self.assertIsNotNone(draft.evidence_summary)


if __name__ == "__main__":
    unittest.main()
