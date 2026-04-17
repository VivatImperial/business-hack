from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Basic service health response for backend orchestration."""

    status: Literal["healthy", "degraded", "down"]
    service: str
    checks: dict[str, bool]
