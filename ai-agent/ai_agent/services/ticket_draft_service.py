from __future__ import annotations

import re

from ai_agent.schemas.generation import TicketDraftSuggestion


PRIORITY_MAP = {
    "критичный": "p1",
    "высокий": "p2",
    "средний": "p3",
    "низкий": "p4",
}
GENERIC_SERVICE_RE = re.compile(r"(прочее|другие инциденты)", re.IGNORECASE)
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
        payload = self._aggregate_payload(user_text, top_tickets)
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

    def _aggregate_payload(self, user_text: str, top_tickets: list[dict]) -> dict:
        if not top_tickets:
            return {}

        service_hints = self._extract_hints(user_text)
        best_service = None
        best_service_score = float("-inf")
        best_task_type = None
        best_task_type_score = float("-inf")
        best_priority = None
        best_priority_score = float("-inf")

        for ticket in top_tickets:
            payload = ticket.get("payload") or {}
            base_score = float(ticket.get("score") or 0.0)
            service_score = base_score + self._service_bonus(payload, service_hints)
            task_type_score = base_score + self._text_bonus(str(payload.get("task_type") or ""), service_hints)
            priority_score = base_score + self._text_bonus(str(payload.get("service") or ""), service_hints)

            if service_score > best_service_score and payload.get("service"):
                best_service = payload.get("service")
                best_service_score = service_score
            if task_type_score > best_task_type_score and payload.get("task_type"):
                best_task_type = payload.get("task_type")
                best_task_type_score = task_type_score
            if priority_score > best_priority_score and payload.get("priority"):
                best_priority = payload.get("priority")
                best_priority_score = priority_score

        return {
            "service": best_service,
            "task_type": best_task_type,
            "priority": best_priority,
        }

    def _extract_hints(self, user_text: str) -> set[str]:
        lowered = user_text.lower()
        hints: set[str] = set()
        if "vpn" in lowered:
            hints.update({"vpn", "удаленный доступ"})
        if "удален" in lowered:
            hints.update({"удаленка", "удаленный доступ", "vpn"})
        if "1с" in lowered:
            hints.add("1с")
        if "отчет" in lowered:
            hints.add("отчет")
        return hints

    def _service_bonus(self, payload: dict, hints: set[str]) -> float:
        service = str(payload.get("service") or "")
        request_text = str(payload.get("request_text") or "")
        domain_tags = " ".join(payload.get("domain_tags") or [])
        combined = " ".join([service, request_text, domain_tags]).lower()

        bonus = self._text_bonus(combined, hints)
        if GENERIC_SERVICE_RE.search(service):
            bonus -= 0.35
        return bonus

    def _text_bonus(self, text: str, hints: set[str]) -> float:
        lowered = text.lower()
        return 0.2 * sum(1 for hint in hints if hint in lowered)
