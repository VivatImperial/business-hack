from __future__ import annotations

import unittest

from ai_agent.services.ticket_draft_service import TicketDraftService


class TicketDraftServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = TicketDraftService()

    def test_build_draft_uses_top_ticket_signals_and_priority_mapping(self) -> None:
        top_tickets = [
            {
                "point_id": "ticket:42",
                "score": 0.92,
                "payload": {
                    "service": "Удаленный доступ / VPN",
                    "task_type": "Тип: Стандартный",
                    "priority": "Низкий",
                },
            }
        ]

        draft = self.service.build_draft(
            user_text="Не подключается удаленка на ноутбуке",
            top_tickets=top_tickets,
        )

        self.assertEqual(draft.normalized_request, "Не подключается удаленка на ноутбуке")
        self.assertEqual(draft.suggested_service, "Удаленный доступ / VPN")
        self.assertEqual(draft.suggested_task_type, "Тип: Стандартный")
        self.assertEqual(draft.suggested_priority, "p4")
        self.assertEqual(draft.evidence_ticket_ids, [42])


if __name__ == "__main__":
    unittest.main()
