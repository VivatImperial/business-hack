from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.app.helpers.dependencies import get_auth_service, get_current_admin
from backend.app.schemas.admin import AdminMeResponse, LoginRequest, TokenResponse
from backend.app.services.auth import AuthService

router = APIRouter(tags=["Admin Auth"])


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Login to admin panel",
    description="Authenticate an admin user and return a bearer token for protected endpoints.",
)
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    token = await auth_service.login_admin(payload.email, payload.password)
    return TokenResponse(access_token=token)


@router.get(
    "/me",
    response_model=AdminMeResponse,
    summary="Get current admin profile",
    description="Return the authenticated admin identity resolved from the bearer token.",
)
async def me(current_admin=Depends(get_current_admin)) -> AdminMeResponse:
    return AdminMeResponse(id=current_admin.id, login=current_admin.login)
