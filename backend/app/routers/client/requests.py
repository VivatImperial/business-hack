from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from backend.app.db.models.entities import Ticket, User
from backend.app.helpers.dependencies import (
    get_admin_repository,
    get_ai_agent_service,
    get_current_user,
    get_settings,
    get_upload_storage_service,
    get_yandex_ocr_service,
)
from backend.app.schemas.client import (
    ClientChannel,
    ClientOcrResponse,
    ClientRequestCreateRequest,
    ClientRequestCloseResponse,
    ClientRequestDetailResponse,
    ClientRequestListItemResponse,
    ClientRequestMessageCreateRequest,
    ClientRequestRatingCreateRequest,
    ClientRequestRatingResponse,
    ClientRequestsListResponse,
)
from backend.app.config import Settings
from backend.app.services.ai_agent_service import AiAgentService
from backend.app.services.client_requests import ClientRequestsService
from backend.app.services.upload_storage import UploadStorageService
from backend.app.services.yandex_ocr_service import YandexOcrService

router = APIRouter(tags=["Client Requests"])


def get_client_requests_service(
    repository=Depends(get_admin_repository),
    ai_agent_service: AiAgentService = Depends(get_ai_agent_service),
    upload_storage: UploadStorageService = Depends(get_upload_storage_service),
) -> ClientRequestsService:
    return ClientRequestsService(
        repository,
        ai_agent_service=ai_agent_service,
        upload_storage=upload_storage,
    )


def serialize_request(ticket: Ticket) -> ClientRequestDetailResponse:
    state = ClientRequestsService.build_request_state(ticket)
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
        **state,
        messages=[ClientRequestsService.serialize_message(message) for message in ticket.messages],
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
            **ClientRequestsService.build_request_state(ticket),
        )
        for ticket in tickets
    ]
    return ClientRequestsListResponse(items=items)


@router.post(
    "/ocr",
    response_model=ClientOcrResponse,
    summary="Recognize text from image",
    description="Run Yandex Vision OCR for a pasted or uploaded client image and return extracted text.",
)
async def recognize_text(
    image: UploadFile = File(...),
    _: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    ocr_service: YandexOcrService = Depends(get_yandex_ocr_service),
    upload_storage: UploadStorageService = Depends(get_upload_storage_service),
) -> ClientOcrResponse:
    if not ocr_service.is_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR service is not configured.",
        )

    content_type = (image.content_type or "").strip().lower()
    if content_type not in {"image/png", "image/jpeg", "image/jpg", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type.",
        )

    payload = await image.read()
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image is empty.",
        )
    if len(payload) > settings.yandex_ocr_max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large.",
        )

    try:
        text = await ocr_service.recognize_text(file_bytes=payload, mime_type=content_type)
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="OCR request timed out.",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OCR request failed.",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="OCR did not recognize any text.",
        )

    upload_key, image_url, image_name = upload_storage.save_ocr_image(
        file_bytes=payload,
        mime_type=content_type,
        file_name=image.filename,
    )
    return ClientOcrResponse(
        text=text,
        mime_type=content_type,
        file_name=image_name,
        upload_key=upload_key,
        image_url=image_url,
    )


@router.post(
    "/requests/{request_id}/close",
    response_model=ClientRequestCloseResponse,
    summary="Close client request",
    description="Close an authenticated client request when the issue is confirmed as resolved.",
)
async def close_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    service: ClientRequestsService = Depends(get_client_requests_service),
) -> ClientRequestCloseResponse:
    ticket = await service.close_request(current_user=current_user, request_id=request_id)
    return ClientRequestCloseResponse(
        id=ticket.id,
        status="closed",
        closed_at=ticket.closed_at,
        rating_request_sent=ticket.rating_request_sent,
    )


@router.post(
    "/requests/{request_id}/rating",
    response_model=ClientRequestRatingResponse,
    summary="Submit client request rating",
    description="Submit a 1-5 CSAT score for a closed client request.",
)
async def submit_rating(
    request_id: str,
    payload: ClientRequestRatingCreateRequest,
    current_user: User = Depends(get_current_user),
    service: ClientRequestsService = Depends(get_client_requests_service),
) -> ClientRequestRatingResponse:
    ticket = await service.submit_rating(
        current_user=current_user,
        request_id=request_id,
        score=payload.score,
    )
    return ClientRequestRatingResponse(id=ticket.id, csat=ticket.csat)


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
