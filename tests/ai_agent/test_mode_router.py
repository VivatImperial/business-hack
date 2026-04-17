from __future__ import annotations

import unittest

from ai_agent.services.mode_router import ModeRouter


class ModeRouterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.router = ModeRouter()

    def test_route_returns_create_ticket_for_ticket_creation_intent(self) -> None:
        mode = self.router.route("Помоги создать заявку на проблему с VPN")

        self.assertEqual(mode, "create_ticket")

    def test_route_returns_resolve_issue_for_support_question(self) -> None:
        mode = self.router.route("Не работает VPN на ноутбуке")

        self.assertEqual(mode, "resolve_issue")


if __name__ == "__main__":
    unittest.main()
