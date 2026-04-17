from __future__ import annotations

from ai_agent.schemas.generation import TicketDraftSuggestion


PRIORITY_MAP = {
    "критичный": "p1",
    "высокий": "p2",
    "средний": "p3",
    "низкий": "p4",
}


class TicketDraftService:
    """Build a lightweight ticket draft from retrieved historical cases."""

    def build_draft(self, *, user_text: str, top_tickets: list[dict]) -> TicketDraftSuggestion:
        normalized_request = " ".join((user_text or "").split())
        top_ticket = top_tickets[0] if top_tickets else {}
        payload = top_ticket.get("payload") or {}

        return TicketDraftSuggestion(
            normalized_request=normalized_request,
            suggested_service=payload.get("service"),
            suggested_task_type=payload.get("task_type"),
            suggested_priority=self._normalize_priority(payload.get("priority")),
            evidence_ticket_ids=self._extract_ticket_ids(top_tickets),
        )

    def _normalize_priority(self, value: str | None) -> str | None:
        if not value:
            return None
        lowered = value.strip().lower()
        for key, normalized in PRIORITY_MAP.items():
            if key in lowered:
                return normalized
        if lowered in {"p1", "p2", "p3", "p4"}:
            return lowered
        return None

    def _extract_ticket_ids(self, top_tickets: list[dict]) -> list[int]:
        ticket_ids: list[int] = []
        for item in top_tickets:
            point_id = str(item.get("point_id") or item.get("id") or "")
            if point_id.startswith("ticket:"):
                _, raw_id = point_id.split(":", 1)
                if raw_id.isdigit():
                    ticket_ids.append(int(raw_id))
        return ticket_ids
