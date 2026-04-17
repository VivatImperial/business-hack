from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status

from backend.app.config import Settings
from backend.app.db.models.entities import User
from backend.app.helpers.dependencies import get_auth_service, get_current_user, get_settings
from backend.app.schemas.client import (
    ClientLoginRequest,
    ClientMeResponse,
    ClientRegisterRequest,
    ClientTokenResponse,
    TelegramLoginRequest,
)
from backend.app.services.auth import AuthService

router = APIRouter(tags=["Client Auth"])


@router.post(
    "/auth/register",
    response_model=ClientTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register client user",
    description="Create a client account for the public request flow and return a bearer token.",
)
async def register(
    payload: ClientRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ClientTokenResponse:
    user = await auth_service.register(
        login=payload.login,
        email=payload.email,
        password=payload.password,
        telegram_user_id=payload.telegram_user_id,
        telegram_username=payload.telegram_username,
    )
    return ClientTokenResponse(access_token=auth_service.create_access_token(user))


@router.post(
    "/auth/login",
    response_model=ClientTokenResponse,
    summary="Login client user",
    description="Authenticate a client user and optionally link the current Telegram account.",
)
async def login(
    payload: ClientLoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> ClientTokenResponse:
    token = await auth_service.login(payload.email, payload.password)
    if payload.telegram_user_id:
        user = await auth_service.get_current_user(token)
        await auth_service.link_telegram_account(
            user=user,
            telegram_user_id=payload.telegram_user_id,
            telegram_username=payload.telegram_username,
        )
        token = auth_service.create_access_token(user)
    return ClientTokenResponse(access_token=token)


@router.post(
    "/auth/telegram/login",
    response_model=ClientTokenResponse,
    summary="Login client user through Telegram",
    description="Issue a client JWT for a Telegram user already linked to a backend account.",
)
async def telegram_login(
    payload: TelegramLoginRequest,
    settings: Settings = Depends(get_settings),
    auth_service: AuthService = Depends(get_auth_service),
    x_telegram_bot_token: str | None = Header(default=None),
) -> ClientTokenResponse:
    if not settings.telegram_bot_token or x_telegram_bot_token != settings.telegram_bot_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram bot is not authorized.",
        )

    token = await auth_service.login_telegram_user(
        telegram_user_id=payload.telegram_user_id,
        telegram_username=payload.telegram_username,
    )
    return ClientTokenResponse(access_token=token)


@router.get(
    "/me",
    response_model=ClientMeResponse,
    summary="Get current client profile",
    description="Return the authenticated client profile resolved from the bearer token.",
)
async def me(current_user: User = Depends(get_current_user)) -> ClientMeResponse:
    return ClientMeResponse(
        id=current_user.id,
        login=current_user.login,
        email=current_user.email,
        telegram_user_id=current_user.telegram_user_id,
        telegram_username=current_user.telegram_username,
    )
