from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_agent.routers.admin.deps import build_require_admin
from ai_agent.schemas.admin import AdminLoginRequest, AdminLoginResponse, AdminMeResponse
from ai_agent.services.admin_service import AdminService


def build_admin_auth_router(admin_service: AdminService) -> APIRouter:
    router = APIRouter(prefix="/api/v1/admin", tags=["admin-auth"])
    require_admin = build_require_admin(admin_service)

    @router.post("/auth/login", response_model=AdminLoginResponse)
    async def login(payload: AdminLoginRequest) -> AdminLoginResponse:
        return AdminLoginResponse(
            access_token=admin_service.authenticate(payload.email, payload.password),
        )

    @router.get("/me", response_model=AdminMeResponse, dependencies=[Depends(require_admin)])
    async def me() -> AdminMeResponse:
        return admin_service.get_me()

    return router
