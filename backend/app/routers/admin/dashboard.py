from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from backend.app.helpers.dependencies import get_current_admin, get_dashboard_service
from backend.app.schemas.admin import DashboardSummaryResponse, MessagesTimeseriesResponse
from backend.app.services.dashboard import DashboardService

router = APIRouter(prefix="/dashboard")


@router.get("/summary", response_model=DashboardSummaryResponse)
async def summary(
    _: Annotated[object, Depends(get_current_admin)],
    period: str = Query(default="24h"),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DashboardSummaryResponse:
    return await dashboard_service.get_summary(period)


@router.get("/messages-timeseries", response_model=MessagesTimeseriesResponse)
async def messages_timeseries(
    _: Annotated[object, Depends(get_current_admin)],
    period: str = Query(default="24h"),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> MessagesTimeseriesResponse:
    return await dashboard_service.get_messages_timeseries(period)
