from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_agent.routers.admin.deps import build_require_admin
from ai_agent.schemas.admin import AdminSettingsPayload
from ai_agent.services.admin_service import AdminService


def build_admin_settings_router(admin_service: AdminService) -> APIRouter:
    router = APIRouter(prefix="/api/v1/admin/settings", tags=["admin-settings"])
    require_admin = build_require_admin(admin_service)

    @router.get("", response_model=AdminSettingsPayload, dependencies=[Depends(require_admin)])
    async def get_settings() -> AdminSettingsPayload:
        return admin_service.get_settings()

    @router.put("", response_model=AdminSettingsPayload, dependencies=[Depends(require_admin)])
    async def update_settings(payload: AdminSettingsPayload) -> AdminSettingsPayload:
        return admin_service.update_settings(payload)

    return router
