from __future__ import annotations

import unittest

from ai_agent.schemas.inference import AgentRespondRequest, AgentSettingsPayload
from ai_agent.schemas.retrieval import RetrievalResult
from ai_agent.services.dialog_orchestrator import DialogOrchestrator


class FakeModeRouter:
    def route(self, user_text: str) -> str:
        return "create_ticket"


class FakeRetrievalService:
    def retrieve(self, user_text: str, *, settings: AgentSettingsPayload) -> RetrievalResult:
        return RetrievalResult(tickets=[], articles=[], used_articles=False)


class FakeRerankService:
    def rerank_tickets(self, tickets):
        return tickets


class FakeConfidenceService:
    def decide(self, *, mode: str, retrieval: RetrievalResult, threshold: float) -> str:
        return "clarify"

    def confidence(self, retrieval: RetrievalResult) -> float:
        return 0.2


class FakeAnswerService:
    async def build_create_ticket_message(self, *, draft, tone_of_voice: str) -> str:  # pragma: no cover - should not run
        return "draft"

    async def build_resolve_issue_answer(self, *, user_text: str, retrieval: RetrievalResult, tone_of_voice: str) -> str:
        return "resolve"

    def build_clarify_message(self) -> str:
        return "clarify-question"

    def build_escalation_message(self) -> str:
        return "escalate"

    def build_citations(self, retrieval: RetrievalResult):
        return []


class FakeTicketDraftService:
    def build_draft(self, *, user_text: str, top_tickets: list[dict]):
        raise AssertionError("Draft should not be built when decision is clarify.")


class DialogOrchestratorTests(unittest.IsolatedAsyncioTestCase):
    async def test_create_ticket_respects_clarify_decision(self) -> None:
        orchestrator = DialogOrchestrator(
            mode_router=FakeModeRouter(),
            retrieval_service=FakeRetrievalService(),
            rerank_service=FakeRerankService(),
            confidence_service=FakeConfidenceService(),
            answer_service=FakeAnswerService(),
            ticket_draft_service=FakeTicketDraftService(),
        )

        response = await orchestrator.respond(
            AgentRespondRequest(
                appeal_id="appeal-1",
                message_id="message-1",
                employee_login="ivanov",
                user_text="Помоги создать заявку на VPN",
                history=[],
                settings=AgentSettingsPayload(
                    tone_of_voice="helpful",
                    confidence_threshold=0.7,
                    top_k=5,
                    use_articles=True,
                ),
            )
        )

        self.assertEqual(response.mode, "create_ticket")
        self.assertEqual(response.decision, "clarify")
        self.assertEqual(response.assistant_message, "clarify-question")
        self.assertIsNone(response.suggested_ticket)


if __name__ == "__main__":
    unittest.main()
