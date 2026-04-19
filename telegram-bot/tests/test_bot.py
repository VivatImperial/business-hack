from __future__ import annotations

import asyncio
import unittest

from telegram_bot.bot import (
    _latest_turn_assistant_reply,
    _request_keyboard,
    _resolve_active_request,
)


class FakeBackend:
    def __init__(self, requests: dict[str, dict], items: list[dict]) -> None:
        self.requests = requests
        self.items = items

    async def get_request(self, *, token: str, request_id: str) -> dict:
        return self.requests[request_id]

    async def list_requests(self, *, token: str) -> list[dict]:
        return self.items


class DummyContext:
    def __init__(self) -> None:
        self.user_data: dict[str, str] = {}


class TelegramBotHelpersTests(unittest.TestCase):
    def test_latest_turn_assistant_reply_uses_last_message_only(self) -> None:
        reply = _latest_turn_assistant_reply(
            {
                "messages": [
                    {"role": "assistant", "text": "Проверьте VPN."},
                    {"role": "user", "text": "Спасибо"},
                ]
            }
        )
        self.assertIsNone(reply)

    def test_request_keyboard_includes_rating_buttons_for_pending_csat(self) -> None:
        keyboard = _request_keyboard(
            {
                "id": "request-1",
                "status": "closed",
                "awaiting_csat": True,
                "can_self_close": False,
            }
        )
        first_row = keyboard.inline_keyboard[0]
        self.assertEqual([button.text for button in first_row], ["1", "2", "3", "4", "5"])

    def test_resolve_active_request_prefers_explicit_user_selection(self) -> None:
        backend = FakeBackend(
            requests={
                "request-1": {"id": "request-1", "status": "in_progress"},
                "request-2": {"id": "request-2", "status": "open"},
            },
            items=[
                {"id": "request-2", "status": "open", "updated_at": "2026-04-18T11:00:00Z"},
                {"id": "request-1", "status": "in_progress", "updated_at": "2026-04-18T10:00:00Z"},
            ],
        )
        context = DummyContext()
        context.user_data["active_request_id"] = "request-1"

        request, ambiguous = asyncio.run(
            _resolve_active_request(backend=backend, token="token", context=context)
        )

        self.assertEqual(request["id"], "request-1")
        self.assertFalse(ambiguous)

    def test_resolve_active_request_marks_ambiguity_for_multiple_open_requests(self) -> None:
        backend = FakeBackend(
            requests={
                "request-1": {"id": "request-1", "status": "in_progress"},
                "request-2": {"id": "request-2", "status": "open"},
            },
            items=[
                {"id": "request-2", "status": "open", "updated_at": "2026-04-18T11:00:00Z"},
                {"id": "request-1", "status": "in_progress", "updated_at": "2026-04-18T10:00:00Z"},
            ],
        )
        context = DummyContext()

        request, ambiguous = asyncio.run(
            _resolve_active_request(backend=backend, token="token", context=context)
        )

        self.assertEqual(request["id"], "request-2")
        self.assertTrue(ambiguous)


if __name__ == "__main__":
    unittest.main()
