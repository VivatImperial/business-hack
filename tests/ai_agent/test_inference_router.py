from __future__ import annotations

import datetime as dt
import unittest

from fastapi.testclient import TestClient

from ai_agent.app import create_app


class FakeDialogOrchestrator:
    async def respond(self, request):
        return {
            "mode": "resolve_issue",
            "decision": "answer",
            "assistant_message": f"Проверьте решение для: {request.user_text}",
            "citations": [
                {
                    "source_type": "ticket",
                    "source_id": "ticket:1",
                    "title": "VPN",
                    "snippet": "Перезапустите клиент.",
                }
            ],
            "confidence": 0.91,
            "used_articles": False,
            "top_ticket_ids": ["ticket:1"],
            "suggested_ticket": None,
            "retrieval_stats": {
                "ticket_hits": 1,
                "article_hits": 0,
            },
            "resolved_by": "assistant",
            "processed_at": dt.datetime(2026, 4, 17, 12, 0, 0, tzinfo=dt.UTC).isoformat(),
        }


class InferenceRouterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(create_app())

    def test_health_endpoint_reports_basic_service_state(self) -> None:
        response = self.client.get("/api/v1/internal/health")

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(
            response.json(),
            {
                "status": "degraded",
                "service": "ai-agent",
                "checks": {
                    "api": True,
                    "dialog_orchestrator": False,
                },
            },
        )

    def test_respond_endpoint_returns_bootstrap_stub_until_orchestrator_added(self) -> None:
        response = self.client.post(
            "/api/v1/internal/agent/respond",
            json={
                "appeal_id": "appeal-1",
                "message_id": "message-1",
                "employee_login": "ivanov",
                "user_text": "Не подключается удаленка",
                "history": [],
                "settings": {
                    "tone_of_voice": "helpful",
                    "confidence_threshold": 0.7,
                    "top_k": 5,
                    "use_articles": True,
                },
            },
        )

        self.assertEqual(response.status_code, 501, response.text)
        self.assertEqual(
            response.json(),
            {"detail": "Dialog orchestrator is not configured yet."},
        )

    def test_respond_endpoint_uses_configured_dialog_orchestrator(self) -> None:
        client = TestClient(create_app(dialog_orchestrator=FakeDialogOrchestrator()))

        response = client.post(
            "/api/v1/internal/agent/respond",
            json={
                "appeal_id": "appeal-1",
                "message_id": "message-1",
                "employee_login": "ivanov",
                "user_text": "Не подключается удаленка",
                "history": [],
                "settings": {
                    "tone_of_voice": "helpful",
                    "confidence_threshold": 0.7,
                    "top_k": 5,
                    "use_articles": True,
                },
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["mode"], "resolve_issue")
        self.assertEqual(response.json()["decision"], "answer")
        self.assertEqual(response.json()["top_ticket_ids"], ["ticket:1"])
        self.assertEqual(response.json()["resolved_by"], "assistant")


if __name__ == "__main__":
    unittest.main()
