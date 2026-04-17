from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from backend.app.helpers.dependencies import get_current_admin, get_settings_service
from backend.app.schemas.admin import AssistantSettingsResponse, AssistantSettingsUpdateRequest
from backend.app.services.settings import SettingsService

router = APIRouter(prefix="/settings", tags=["Admin Settings"])


@router.get(
    "",
    response_model=AssistantSettingsResponse,
    summary="Get assistant settings",
    description="Return the current assistant runtime settings used by the admin panel and backend orchestration.",
)
async def get_settings(
    _: Annotated[object, Depends(get_current_admin)],
    settings_service: SettingsService = Depends(get_settings_service),
) -> AssistantSettingsResponse:
    settings = await settings_service.get_settings()
    return AssistantSettingsResponse(
        tone_of_voice=settings.tone_of_voice,
        confidence_threshold=settings.confidence_threshold,
        top_k=settings.top_k,
        use_articles=settings.use_articles,
    )


@router.put(
    "",
    response_model=AssistantSettingsResponse,
    summary="Update assistant settings",
    description="Persist assistant runtime settings such as tone of voice, confidence threshold, and top-k retrieval.",
)
async def update_settings(
    payload: AssistantSettingsUpdateRequest,
    _: Annotated[object, Depends(get_current_admin)],
    settings_service: SettingsService = Depends(get_settings_service),
) -> AssistantSettingsResponse:
    settings = await settings_service.update_settings(payload)
    return AssistantSettingsResponse(
        tone_of_voice=settings.tone_of_voice,
        confidence_threshold=settings.confidence_threshold,
        top_k=settings.top_k,
        use_articles=settings.use_articles,
    )
