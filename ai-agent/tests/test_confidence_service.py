from __future__ import annotations

import unittest

from ai_agent.schemas.retrieval import RetrievalResult, RetrievedDocument
from ai_agent.services.confidence_service import ConfidenceService


def make_ticket(score: float, **payload) -> RetrievedDocument:
    return RetrievedDocument(
        point_id="ticket:1",
        score=score,
        payload=payload or {"status": "resolved", "resolution_text": "Проверьте VPN"},
    )


class ConfidenceServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.service = ConfidenceService()

    def test_resolve_issue_answers_for_mid_confidence_ticket(self) -> None:
        retrieval = RetrievalResult(tickets=[make_ticket(0.58)])

        decision = self.service.decide(mode="resolve_issue", retrieval=retrieval, threshold=0.7)

        self.assertEqual(decision, "answer")

    def test_conflicting_ticket_prefers_clarify_over_escalate(self) -> None:
        retrieval = RetrievalResult(
            tickets=[
                make_ticket(
                    0.81,
                    status="отказано",
                    resolution_text="Доступ запрещен",
                    is_actionable=True,
                )
            ]
        )

        decision = self.service.decide(mode="resolve_issue", retrieval=retrieval, threshold=0.55)

        self.assertEqual(decision, "clarify")


if __name__ == "__main__":
    unittest.main()
