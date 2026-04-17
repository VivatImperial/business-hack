from __future__ import annotations

from backend.app.db.models.entities import AssistantSettings
from backend.app.db.repositories.admin import AdminRepository
from backend.app.schemas.admin import AssistantSettingsUpdateRequest


class SettingsService:
    def __init__(self, repository: AdminRepository) -> None:
        self.repository = repository

    async def get_settings(self) -> AssistantSettings:
        settings = await self.repository.get_settings()
        if settings is None:
            raise RuntimeError("Assistant settings are not initialized.")
        return settings

    async def update_settings(
        self,
        payload: AssistantSettingsUpdateRequest,
    ) -> AssistantSettings:
        settings = await self.repository.upsert_settings(
            tone_of_voice=payload.tone_of_voice,
            confidence_threshold=payload.confidence_threshold,
            top_k=payload.top_k,
            use_articles=payload.use_articles,
        )
        await self.repository.commit()
        return settings
