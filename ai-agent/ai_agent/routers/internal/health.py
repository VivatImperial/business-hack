from __future__ import annotations

from fastapi import APIRouter

from ai_agent.config import Settings
from ai_agent.schemas.telemetry import HealthResponse


def build_health_router(settings: Settings, *, dialog_orchestrator_ready: bool) -> APIRouter:
    """Create the internal health router."""

    router = APIRouter(prefix="/api/v1/internal", tags=["internal-health"])

    @router.get("/health", response_model=HealthResponse)
    async def get_health() -> HealthResponse:
        return HealthResponse(
            status="healthy" if dialog_orchestrator_ready else "degraded",
            service=settings.service_name,
            checks={
                "api": True,
                "dialog_orchestrator": dialog_orchestrator_ready,
            },
        )

    return router
