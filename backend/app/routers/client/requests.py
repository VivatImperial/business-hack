from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from backend.app.db.models.entities import Ticket, User
from backend.app.helpers.dependencies import (
    get_admin_repository,
    get_ai_agent_service,
    get_current_user,
)
from backend.app.schemas.client import (
    ClientChannel,
    ClientRequestCreateRequest,
    ClientRequestDetailResponse,
    ClientRequestListItemResponse,
    ClientRequestMessageCreateRequest,
    ClientRequestsListResponse,
)
from backend.app.services.ai_agent_service import AiAgentService
from backend.app.services.client_requests import ClientRequestsService

router = APIRouter(tags=["Client Requests"])


def get_client_requests_service(
    repository=Depends(get_admin_repository),
    ai_agent_service: AiAgentService = Depends(get_ai_agent_service),
) -> ClientRequestsService:
    return ClientRequestsService(repository, ai_agent_service=ai_agent_service)


def serialize_request(ticket: Ticket) -> ClientRequestDetailResponse:
    return ClientRequestDetailResponse(
        id=ticket.id,
        title=ticket.title,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        category=ticket.category,
        channel=ticket.channel,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        closed_at=ticket.closed_at,
        messages=[
            {
                "id": message.id,
                "role": message.role,
                "author_login": message.author_login,
                "text": message.text,
                "created_at": message.created_at,
            }
            for message in ticket.messages
        ],
    )


@router.post(
    "/requests",
    response_model=ClientRequestDetailResponse,
    summary="Create client request",
    description="Create a new client request with the selected source channel.",
)
async def create_request(
    payload: ClientRequestCreateRequest,
    current_user: User = Depends(get_current_user),
    service: ClientRequestsService = Depends(get_client_requests_service),
) -> ClientRequestDetailResponse:
    ticket = await service.create_request(current_user=current_user, payload=payload)
    return serialize_request(ticket)


@router.get(
    "/requests",
    response_model=ClientRequestsListResponse,
    summary="List client requests",
    description="List requests created by the authenticated client, optionally filtered by channel.",
)
async def list_requests(
    channel: ClientChannel | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    service: ClientRequestsService = Depends(get_client_requests_service),
) -> ClientRequestsListResponse:
    tickets = await service.list_requests(current_user=current_user, channel=channel)
    items = [
        ClientRequestListItemResponse(
            id=ticket.id,
            title=ticket.title,
            description=ticket.description,
            status=ticket.status,
            priority=ticket.priority,
            category=ticket.category,
            channel=ticket.channel,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            closed_at=ticket.closed_at,
        )
        for ticket in tickets
    ]
    return ClientRequestsListResponse(items=items)


@router.get(
    "/requests/{request_id}",
    response_model=ClientRequestDetailResponse,
    summary="Get client request details",
    description="Return one authenticated client request together with its message timeline.",
)
async def get_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    service: ClientRequestsService = Depends(get_client_requests_service),
) -> ClientRequestDetailResponse:
    ticket = await service.get_request(current_user=current_user, request_id=request_id)
    return serialize_request(ticket)


@router.post(
    "/requests/{request_id}/messages",
    response_model=ClientRequestDetailResponse,
    summary="Add message to client request",
    description="Append a new client message to an existing request owned by the authenticated user.",
)
async def add_message(
    request_id: str,
    payload: ClientRequestMessageCreateRequest,
    current_user: User = Depends(get_current_user),
    service: ClientRequestsService = Depends(get_client_requests_service),
) -> ClientRequestDetailResponse:
    ticket = await service.add_message(
        current_user=current_user,
        request_id=request_id,
        payload=payload,
    )
    return serialize_request(ticket)
