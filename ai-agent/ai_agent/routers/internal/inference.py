from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from ai_agent.schemas.generation import AgentRespondResponse
from ai_agent.schemas.inference import AgentRespondRequest


def build_inference_router(*, dialog_orchestrator: Any | None) -> APIRouter:
    """Create the internal inference router."""

    router = APIRouter(prefix="/api/v1/internal/agent", tags=["internal-inference"])

    @router.post("/respond", response_model=AgentRespondResponse)
    async def respond(request: AgentRespondRequest) -> AgentRespondResponse:
        if dialog_orchestrator is None:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Dialog orchestrator is not configured yet.",
            )
        return await dialog_orchestrator.respond(request)

    return router
