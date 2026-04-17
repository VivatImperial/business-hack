from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from backend.app.helpers.dependencies import get_appeals_service, get_current_admin
from backend.app.schemas.admin import (
    AppealCloseResponse,
    AppealDetailResponse,
    AppealListItemResponse,
    AppealRatingResponse,
    AppealsListQuery,
    AppealsListResponse,
    AppealStatusResponse,
)
from backend.app.services.appeals import AppealsService

router = APIRouter(prefix="/appeals", tags=["Admin Appeals"])


def _serialize_appeal(
    appeals_service: AppealsService,
    ticket,
) -> AppealListItemResponse:
    return AppealListItemResponse(
        id=ticket.id,
        employee_login=ticket.employee_login,
        scope=ticket.scope,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        processing_duration_minutes=appeals_service.processing_duration_minutes(ticket),
        closed_at=ticket.closed_at,
        csat=ticket.csat,
    )


@router.get(
    "",
    response_model=AppealsListResponse,
    summary="List appeals",
    description="Return appeals filtered by date range, scope, and status for the admin queue.",
)
async def list_appeals(
    _: Annotated[object, Depends(get_current_admin)],
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    scope: str = Query(default="all"),
    status: str | None = Query(default=None),
    appeals_service: AppealsService = Depends(get_appeals_service),
) -> AppealsListResponse:
    query = AppealsListQuery(date_from=date_from, date_to=date_to, scope=scope, status=status)
    tickets = await appeals_service.list_appeals(query)
    return AppealsListResponse(items=[_serialize_appeal(appeals_service, ticket) for ticket in tickets])


@router.get(
    "/{appeal_id}",
    response_model=AppealDetailResponse,
    summary="Get appeal details",
    description="Return a single appeal with its current status and timestamps.",
)
async def get_appeal(
    appeal_id: str,
    _: Annotated[object, Depends(get_current_admin)],
    appeals_service: AppealsService = Depends(get_appeals_service),
) -> AppealDetailResponse:
    ticket = await appeals_service.get_appeal(appeal_id)
    base = _serialize_appeal(appeals_service, ticket)
    return AppealDetailResponse(**base.model_dump(), created_at=ticket.created_at)


@router.post(
    "/{appeal_id}/take",
    response_model=AppealStatusResponse,
    summary="Take appeal into work",
    description="Assign the appeal to the current admin and move it into in-progress state.",
)
async def take_appeal(
    appeal_id: str,
    current_admin=Depends(get_current_admin),
    appeals_service: AppealsService = Depends(get_appeals_service),
) -> AppealStatusResponse:
    ticket = await appeals_service.take_appeal(appeal_id, current_admin.id)
    return AppealStatusResponse(id=ticket.id, status="in_progress")


@router.post(
    "/{appeal_id}/close",
    response_model=AppealCloseResponse,
    summary="Close appeal",
    description="Mark the appeal as closed and return its closure timestamp.",
)
async def close_appeal(
    appeal_id: str,
    _: Annotated[object, Depends(get_current_admin)],
    appeals_service: AppealsService = Depends(get_appeals_service),
) -> AppealCloseResponse:
    ticket = await appeals_service.close_appeal(appeal_id)
    return AppealCloseResponse(id=ticket.id, status="closed", closed_at=ticket.closed_at)


@router.post(
    "/{appeal_id}/rating-request",
    response_model=AppealRatingResponse,
    summary="Send rating request",
    description="Mark that the appeal customer satisfaction request has been sent.",
)
async def send_rating_request(
    appeal_id: str,
    _: Annotated[object, Depends(get_current_admin)],
    appeals_service: AppealsService = Depends(get_appeals_service),
) -> AppealRatingResponse:
    ticket = await appeals_service.send_rating_request(appeal_id)
    return AppealRatingResponse(id=ticket.id, rating_request_sent=ticket.rating_request_sent)
