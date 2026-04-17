from __future__ import annotations

from fastapi import APIRouter, Depends

from ai_agent.routers.admin.deps import build_require_admin
from ai_agent.schemas.admin import DashboardSummaryResponse, MessagesTimeseriesResponse
from ai_agent.services.admin_service import AdminService


def build_admin_dashboard_router(admin_service: AdminService) -> APIRouter:
    router = APIRouter(prefix="/api/v1/admin/dashboard", tags=["admin-dashboard"])
    require_admin = build_require_admin(admin_service)

    @router.get("/summary", response_model=DashboardSummaryResponse, dependencies=[Depends(require_admin)])
    async def summary(period: str = "24h") -> DashboardSummaryResponse:
        return admin_service.get_dashboard_summary()

    @router.get(
        "/messages-timeseries",
        response_model=MessagesTimeseriesResponse,
        dependencies=[Depends(require_admin)],
    )
    async def messages_timeseries(period: str = "24h") -> MessagesTimeseriesResponse:
        return admin_service.get_messages_timeseries(period)

    return router
