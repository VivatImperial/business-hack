from __future__ import annotations

import asyncio
import os
import unittest

from fastapi.testclient import TestClient

from backend.app import create_app
from backend.app.helpers.dependencies import get_ai_agent_service
from tests.backend.support import BackendDatabaseTestCase


class FakeAiAgentService:
    async def respond(self, payload: dict[str, object]) -> dict[str, object]:
        return {
            "mode": "resolve_issue",
            "message": f"AI: {payload['user_text']}",
            "citations": [],
            "confidence": 0.91,
            "should_escalate": False,
            "ticket_draft": None,
        }


class ClientApiTests(BackendDatabaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        os.environ["BACKEND_TELEGRAM_BOT_TOKEN"] = "telegram-test-token"
        self.app = create_app()
        self.app.dependency_overrides[get_ai_agent_service] = lambda: FakeAiAgentService()
        self.client = TestClient(self.app)

    def tearDown(self) -> None:
        self.client.close()
        self.app.dependency_overrides.clear()
        asyncio.run(self.app.state.database.dispose())
        super().tearDown()

    def _register_user(
        self,
        *,
        login: str,
        email: str,
        password: str = "password123",
        telegram_user_id: str | None = None,
        telegram_username: str | None = None,
    ) -> str:
        response = self.client.post(
            "/api/v1/client/auth/register",
            json={
                "login": login,
                "email": email,
                "password": password,
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username,
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["access_token"]

    def test_register_me_and_request_flow(self) -> None:
        access_token = self._register_user(login="client", email="client@example.com")
        headers = {"Authorization": f"Bearer {access_token}"}

        me_response = self.client.get("/api/v1/client/me", headers=headers)
        self.assertEqual(me_response.status_code, 200, me_response.text)
        self.assertEqual(me_response.json()["email"], "client@example.com")
        self.assertIsNone(me_response.json()["telegram_user_id"])

        create_response = self.client.post(
            "/api/v1/client/requests",
            headers=headers,
            json={
                "title": "Нужен доступ",
                "description": "Нужен доступ к VPN",
                "category": "access",
                "priority": "p2",
                "channel": "telegram",
            },
        )
        self.assertEqual(create_response.status_code, 200, create_response.text)
        request_id = create_response.json()["id"]
        self.assertEqual(create_response.json()["channel"], "telegram")
        self.assertEqual(len(create_response.json()["messages"]), 2)
        self.assertEqual(create_response.json()["messages"][-1]["role"], "assistant")
        self.assertEqual(create_response.json()["messages"][-1]["text"], "AI: Нужен доступ к VPN")

        list_response = self.client.get(
            "/api/v1/client/requests",
            headers=headers,
            params={"channel": "telegram"},
        )
        self.assertEqual(list_response.status_code, 200, list_response.text)
        self.assertEqual([item["id"] for item in list_response.json()["items"]], [request_id])

        message_response = self.client.post(
            f"/api/v1/client/requests/{request_id}/messages",
            headers=headers,
            json={"text": "И еще нужен доступ к почте"},
        )
        self.assertEqual(message_response.status_code, 200, message_response.text)
        self.assertEqual(len(message_response.json()["messages"]), 4)
        self.assertEqual(message_response.json()["messages"][-1]["role"], "assistant")
        self.assertEqual(
            message_response.json()["messages"][-1]["text"],
            "AI: И еще нужен доступ к почте",
        )

    def test_login_can_link_telegram_and_telegram_auth_can_reuse_account(self) -> None:
        self._register_user(login="linked", email="linked@example.com")

        login_response = self.client.post(
            "/api/v1/client/auth/login",
            json={
                "email": "linked@example.com",
                "password": "password123",
                "telegram_user_id": "321",
                "telegram_username": "linked_user",
            },
        )
        self.assertEqual(login_response.status_code, 200, login_response.text)

        telegram_response = self.client.post(
            "/api/v1/client/auth/telegram/login",
            headers={"X-Telegram-Bot-Token": "telegram-test-token"},
            json={
                "telegram_user_id": "321",
                "telegram_username": "linked_user",
            },
        )
        self.assertEqual(telegram_response.status_code, 200, telegram_response.text)

        me_response = self.client.get(
            "/api/v1/client/me",
            headers={"Authorization": f"Bearer {telegram_response.json()['access_token']}"},
        )
        self.assertEqual(me_response.status_code, 200, me_response.text)
        self.assertEqual(me_response.json()["telegram_user_id"], "321")

    def test_request_detail_is_scoped_to_owner(self) -> None:
        owner_token = self._register_user(login="owner", email="owner@example.com")
        outsider_token = self._register_user(login="outsider", email="outsider@example.com")

        create_response = self.client.post(
            "/api/v1/client/requests",
            headers={"Authorization": f"Bearer {owner_token}"},
            json={
                "title": "Проблема",
                "description": "Не открывается система",
                "channel": "web",
            },
        )
        self.assertEqual(create_response.status_code, 200, create_response.text)
        request_id = create_response.json()["id"]

        response = self.client.get(
            f"/api/v1/client/requests/{request_id}",
            headers={"Authorization": f"Bearer {outsider_token}"},
        )
        self.assertEqual(response.status_code, 404, response.text)
        self.assertEqual(response.json(), {"detail": "Request not found."})


if __name__ == "__main__":
    unittest.main()
