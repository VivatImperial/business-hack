from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_agent.routers.admin.deps import build_require_admin
from ai_agent.schemas.admin import (
    AppealDetailResponse,
    AppealStatusResponse,
    AppealsListResponse,
    RatingRequestResponse,
)
from ai_agent.services.admin_service import AdminService


def build_admin_appeals_router(admin_service: AdminService) -> APIRouter:
    router = APIRouter(prefix="/api/v1/admin/appeals", tags=["admin-appeals"])
    require_admin = build_require_admin(admin_service)

    @router.get("", response_model=AppealsListResponse, dependencies=[Depends(require_admin)])
    async def list_appeals(scope: str = "all", status: str | None = None) -> AppealsListResponse:
        return admin_service.list_appeals(scope=scope, status_value=status)

    @router.get("/{appeal_id}", response_model=AppealDetailResponse, dependencies=[Depends(require_admin)])
    async def get_appeal(appeal_id: str) -> AppealDetailResponse:
        return admin_service.get_appeal(appeal_id)

    @router.post("/{appeal_id}/take", response_model=AppealStatusResponse, dependencies=[Depends(require_admin)])
    async def take_appeal(appeal_id: str) -> AppealStatusResponse:
        return admin_service.take_appeal(appeal_id)

    @router.post("/{appeal_id}/close", response_model=AppealStatusResponse, dependencies=[Depends(require_admin)])
    async def close_appeal(appeal_id: str) -> AppealStatusResponse:
        return admin_service.close_appeal(appeal_id)

    @router.post(
        "/{appeal_id}/rating-request",
        response_model=RatingRequestResponse,
        dependencies=[Depends(require_admin)],
    )
    async def rating_request(appeal_id: str) -> RatingRequestResponse:
        return admin_service.request_rating(appeal_id)

    return router
