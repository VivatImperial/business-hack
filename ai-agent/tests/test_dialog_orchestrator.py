from __future__ import annotations

import unittest

from ai_agent.schemas.generation import TicketDraftSuggestion
from ai_agent.schemas.inference import AgentRespondRequest, AgentSettingsPayload
from ai_agent.schemas.retrieval import RetrievalResult
from ai_agent.services.dialog_orchestrator import DialogOrchestrator


class FakeModeRouter:
    def __init__(self, mode: str = "create_ticket") -> None:
        self.mode = mode

    def route(self, user_text: str) -> str:
        return self.mode


class FakeRetrievalService:
    def retrieve(self, user_text: str, *, settings: AgentSettingsPayload) -> RetrievalResult:
        return RetrievalResult(tickets=[], articles=[], used_articles=False)


class FakeRerankService:
    def rerank_tickets(self, tickets):
        return tickets


class FakeConfidenceService:
    def __init__(self, *, decision: str = "clarify") -> None:
        self._decision = decision

    def decide(self, *, mode: str, retrieval: RetrievalResult, threshold: float) -> str:
        return self._decision

    def confidence(self, retrieval: RetrievalResult) -> float:
        return 0.2


class FakeAnswerService:
    def __init__(self, *, resolve_answer: str = "resolve", create_ticket_answer: str = "draft") -> None:
        self.resolve_answer = resolve_answer
        self.create_ticket_answer = create_ticket_answer

    async def build_create_ticket_message(self, *, draft, tone_of_voice: str) -> str:
        return self.create_ticket_answer

    async def build_resolve_issue_answer(self, *, user_text: str, retrieval: RetrievalResult, tone_of_voice: str) -> str:
        return self.resolve_answer

    def build_clarify_message(self, *, draft: TicketDraftSuggestion | None = None) -> str:
        if draft and draft.clarifying_questions:
            return draft.clarifying_questions[0]
        return "clarify-question"

    def build_escalation_message(self) -> str:
        return "escalate"

    def build_citations(self, retrieval: RetrievalResult):
        return []


class FakeTicketDraftService:
    def build_draft(self, *, user_text: str, top_tickets: list[dict]):
        return TicketDraftSuggestion(
            normalized_request=user_text,
            missing_fields=["device"],
            clarifying_questions=["На каком устройстве возникает проблема?"],
            suggested_service=None,
            suggested_task_type=None,
            suggested_priority=None,
            evidence_ticket_ids=[],
            evidence_summary=None,
        )


class FakeCompleteTicketDraftService:
    def build_draft(self, *, user_text: str, top_tickets: list[dict]):
        return TicketDraftSuggestion(
            normalized_request=user_text,
            missing_fields=[],
            clarifying_questions=[],
            suggested_service="Удаленный доступ / VPN",
            suggested_task_type="Тип: Стандартный",
            suggested_priority="p4",
            evidence_ticket_ids=[1],
            evidence_summary="evidence",
        )


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
        self.assertEqual(response.assistant_message, "На каком устройстве возникает проблема?")
        self.assertIsNotNone(response.suggested_ticket)
        self.assertEqual(response.suggested_ticket.missing_fields, ["device"])
        self.assertEqual(response.ticket_draft["clarifying_questions"], ["На каком устройстве возникает проблема?"])

    async def test_resolve_issue_escalates_when_llm_returns_abstain_message(self) -> None:
        orchestrator = DialogOrchestrator(
            mode_router=FakeModeRouter(mode="resolve_issue"),
            retrieval_service=FakeRetrievalService(),
            rerank_service=FakeRerankService(),
            confidence_service=FakeConfidenceService(decision="answer"),
            answer_service=FakeAnswerService(
                resolve_answer="В предоставленном контексте нет информации для надежного решения проблемы."
            ),
            ticket_draft_service=FakeTicketDraftService(),
        )

        response = await orchestrator.respond(
            AgentRespondRequest(
                appeal_id="appeal-2",
                message_id="message-2",
                employee_login="ivanov",
                user_text="Не подключается удаленка",
                history=[],
                settings=AgentSettingsPayload(
                    tone_of_voice="helpful",
                    confidence_threshold=0.7,
                    top_k=5,
                    use_articles=True,
                ),
            )
        )

        self.assertEqual(response.mode, "resolve_issue")
        self.assertEqual(response.decision, "escalate")
        self.assertTrue(response.should_escalate)
        self.assertLess(response.confidence, 0.3)

    async def test_resolve_issue_switches_to_clarify_when_llm_asks_for_more_details(self) -> None:
        orchestrator = DialogOrchestrator(
            mode_router=FakeModeRouter(mode="resolve_issue"),
            retrieval_service=FakeRetrievalService(),
            rerank_service=FakeRerankService(),
            confidence_service=FakeConfidenceService(decision="answer"),
            answer_service=FakeAnswerService(
                resolve_answer="В предоставленном контексте недостаточно информации. Пожалуйста, уточните, на каком устройстве возникает проблема."
            ),
            ticket_draft_service=FakeTicketDraftService(),
        )

        response = await orchestrator.respond(
            AgentRespondRequest(
                appeal_id="appeal-3",
                message_id="message-3",
                employee_login="ivanov",
                user_text="Не подключается удаленка",
                history=[],
                settings=AgentSettingsPayload(
                    tone_of_voice="helpful",
                    confidence_threshold=0.7,
                    top_k=5,
                    use_articles=True,
                ),
            )
        )

        self.assertEqual(response.mode, "resolve_issue")
        self.assertEqual(response.decision, "clarify")
        self.assertFalse(response.should_escalate)
        self.assertLess(response.confidence, 0.3)

    async def test_create_ticket_switches_to_clarify_and_limits_questions_from_llm_output(self) -> None:
        orchestrator = DialogOrchestrator(
            mode_router=FakeModeRouter(mode="create_ticket"),
            retrieval_service=FakeRetrievalService(),
            rerank_service=FakeRerankService(),
            confidence_service=FakeConfidenceService(decision="answer"),
            answer_service=FakeAnswerService(
                create_ticket_answer=(
                    "Проблема: VPN на ноутбуке.\n"
                    "1. Какая ошибка появляется?\n"
                    "2. Перезапускали ли VPN-клиент?\n"
                    "3. Используете ли вы корпоративный VPN?\n"
                )
            ),
            ticket_draft_service=FakeCompleteTicketDraftService(),
        )

        response = await orchestrator.respond(
            AgentRespondRequest(
                appeal_id="appeal-4",
                message_id="message-4",
                employee_login="ivanov",
                user_text="Помоги оформить заявку на проблему с VPN на ноутбуке",
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
        self.assertIn("1. Какая ошибка появляется?", response.assistant_message)
        self.assertIn("2. Перезапускали ли VPN-клиент?", response.assistant_message)
        self.assertNotIn("3. Используете ли вы корпоративный VPN?", response.assistant_message)


if __name__ == "__main__":
    unittest.main()
