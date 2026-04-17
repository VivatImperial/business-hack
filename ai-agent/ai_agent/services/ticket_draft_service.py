from __future__ import annotations

import re

from ai_agent.schemas.generation import TicketDraftSuggestion


PRIORITY_MAP = {
    "критичный": "p1",
    "высокий": "p2",
    "средний": "p3",
    "низкий": "p4",
}
DEVICE_RE = re.compile(
    r"(ноутбук|компьютер|пк|pc|macbook|mac|телефон|смартфон|iphone|android|планшет)",
    re.IGNORECASE,
)
SYSTEM_RE = re.compile(
    r"(vpn|удаленк|1с|erp|почт|outlook|принтер|доступ|меркур|всд|отчет)",
    re.IGNORECASE,
)
QUESTION_BY_FIELD = {
    "device": "На каком устройстве возникает проблема?",
    "system": "В какой системе или приложении возникает проблема?",
}


class TicketDraftService:
    """Build a lightweight ticket draft from retrieved historical cases."""

    def build_draft(self, *, user_text: str, top_tickets: list[dict]) -> TicketDraftSuggestion:
        normalized_request = " ".join((user_text or "").split())
        top_ticket = top_tickets[0] if top_tickets else {}
        payload = top_ticket.get("payload") or {}
        missing_fields = self._detect_missing_fields(normalized_request, payload)
        clarifying_questions = [QUESTION_BY_FIELD[field] for field in missing_fields[:2]]
        evidence_ticket_ids = self._extract_ticket_ids(top_tickets)

        return TicketDraftSuggestion(
            normalized_request=normalized_request,
            missing_fields=missing_fields,
            clarifying_questions=clarifying_questions,
            suggested_service=payload.get("service"),
            suggested_task_type=payload.get("task_type"),
            suggested_priority=self._normalize_priority(payload.get("priority")),
            evidence_ticket_ids=evidence_ticket_ids,
            evidence_summary=self._build_evidence_summary(payload, evidence_ticket_ids),
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

    def _detect_missing_fields(self, normalized_request: str, payload: dict) -> list[str]:
        missing_fields: list[str] = []
        service_text = " ".join(
            [
                normalized_request,
                str(payload.get("service") or ""),
                str(payload.get("task_type") or ""),
            ]
        )
        if not DEVICE_RE.search(normalized_request):
            missing_fields.append("device")
        if not SYSTEM_RE.search(service_text):
            missing_fields.append("system")
        return missing_fields

    def _build_evidence_summary(self, payload: dict, evidence_ticket_ids: list[int]) -> str | None:
        if not evidence_ticket_ids:
            return None
        service = payload.get("service") or "похожих исторических кейсов"
        return f"Рекомендации опираются на похожие кейсы ({', '.join(map(str, evidence_ticket_ids))}) в домене: {service}."
