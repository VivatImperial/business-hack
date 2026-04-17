from __future__ import annotations

import asyncio
import unittest

import httpx
from fastapi import FastAPI

from backend.app.services.ai_agent_service import AiAgentService


class AiAgentServiceTests(unittest.TestCase):
    def test_ai_agent_service_checks_health_and_requests_response(self) -> None:
        app = FastAPI()

        @app.get("/api/v1/internal/health")
        async def health() -> dict[str, object]:
            return {
                "status": "healthy",
                "service": "ai-agent",
                "checks": {"api": True, "dialog_orchestrator": True},
            }

        @app.post("/api/v1/internal/agent/respond")
        async def respond() -> dict[str, object]:
            return {
                "mode": "answer",
                "message": "Проверьте UniVPN.",
                "citations": [],
                "confidence": 0.91,
                "should_escalate": False,
                "ticket_draft": None,
            }

        async def scenario() -> None:
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://test-ai-agent",
            ) as client:
                service = AiAgentService(client=client, base_url="http://test-ai-agent")
                health_payload = await service.get_health()
                response_payload = await service.respond(
                    {
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
                    }
                )

                self.assertEqual(health_payload["status"], "healthy")
                self.assertEqual(response_payload["mode"], "answer")
                self.assertEqual(response_payload["message"], "Проверьте UniVPN.")

        asyncio.run(scenario())


if __name__ == "__main__":
    unittest.main()
