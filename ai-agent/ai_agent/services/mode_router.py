from __future__ import annotations

import re


CREATE_TICKET_RE = re.compile(
    r"(созд(ай|ать)|оформ(и|ить)|завест(и|ь)|состав(ь|ить).*(заявк|тикет)|нужн[ао].*(заявк|тикет))",
    re.IGNORECASE,
)


class ModeRouter:
    """Route incoming user text to the correct assistant mode."""

    def route(self, user_text: str) -> str:
        if CREATE_TICKET_RE.search(user_text or ""):
            return "create_ticket"
        return "resolve_issue"
