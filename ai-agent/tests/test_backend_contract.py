from __future__ import annotations

import datetime as dt
import unittest

from pydantic import BaseModel, Field
from fastapi.testclient import TestClient

from ai_agent.app import create_app


class BackendCompatibleRespondResponse(BaseModel):
    mode: str
    message: str
    citations: list[dict] = Field(default_factory=list)
    confidence: float
    should_escalate: bool
    ticket_draft: dict | None


class FakeDialogOrchestrator:
    async def respond(self, request):
        return {
            "mode": "resolve_issue",
            "decision": "answer",
            "assistant_message": f"Проверьте UniVPN для {request.employee_login}.",
            "citations": [],
            "confidence": 0.91,
            "used_articles": False,
            "top_ticket_ids": ["ticket:1"],
            "suggested_ticket": None,
            "retrieval_stats": {"ticket_hits": 1, "article_hits": 0},
            "resolved_by": "assistant",
            "processed_at": dt.datetime(2026, 4, 17, 12, 0, 0, tzinfo=dt.UTC).isoformat(),
        }


class BackendContractTests(unittest.TestCase):
    def test_response_matches_backend_schema(self) -> None:
        client = TestClient(create_app(dialog_orchestrator=FakeDialogOrchestrator()))

        response = client.post(
            "/api/v1/internal/agent/respond",
            json={
                "appeal_id": "appeal-1",
                "message_id": "message-1",
                "employee_login": "ivanov",
                "user_text": "Не подключается удаленка",
                "history": [{"role": "user", "content": "Не подключается удаленка"}],
                "settings": {
                    "tone_of_voice": "helpful",
                    "confidence_threshold": 0.7,
                    "top_k": 5,
                    "use_articles": True,
                },
            },
        )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertIn("message", payload)
        self.assertIn("should_escalate", payload)
        self.assertIn("ticket_draft", payload)
        validated = BackendCompatibleRespondResponse.model_validate(payload)
        self.assertEqual(validated.message, "Проверьте UniVPN для ivanov.")
        self.assertFalse(validated.should_escalate)

    def test_request_accepts_backend_style_history_messages_with_text_field(self) -> None:
        client = TestClient(create_app(dialog_orchestrator=FakeDialogOrchestrator()))

        response = client.post(
            "/api/v1/internal/agent/respond",
            json={
                "appeal_id": "appeal-1",
                "message_id": "message-1",
                "employee_login": "ivanov",
                "user_text": "Не подключается удаленка",
                "history": [{"role": "user", "text": "Не подключается удаленка"}],
                "settings": {
                    "tone_of_voice": "helpful",
                    "confidence_threshold": 0.7,
                    "top_k": 5,
                    "use_articles": True,
                },
            },
        )

        self.assertEqual(response.status_code, 200, response.text)


if __name__ == "__main__":
    unittest.main()
