from __future__ import annotations

from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import Settings
from backend.app.db.session import Database
from backend.app.db.models.entities import User
from backend.app.db.repositories.admin import AdminRepository
from backend.app.services.appeals import AppealsService
from backend.app.services.ai_agent_service import AiAgentService
from backend.app.services.auth import AuthService
from backend.app.services.dashboard import DashboardService
from backend.app.services.settings import SettingsService
from backend.app.services.yandex_ocr_service import YandexOcrService

security = HTTPBearer(auto_error=False)


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_database(request: Request) -> Database:
    return request.app.state.database


async def get_session(request: Request) -> AsyncGenerator[AsyncSession, None]:
    async with request.app.state.database.session() as session:
        yield session


def get_admin_repository(session: AsyncSession = Depends(get_session)) -> AdminRepository:
    return AdminRepository(session)


def get_auth_service(
    repository: AdminRepository = Depends(get_admin_repository),
    settings: Settings = Depends(get_settings),
) -> AuthService:
    return AuthService(repository, settings)


def get_settings_service(
    repository: AdminRepository = Depends(get_admin_repository),
) -> SettingsService:
    return SettingsService(repository)


def get_appeals_service(
    repository: AdminRepository = Depends(get_admin_repository),
) -> AppealsService:
    return AppealsService(repository)


def get_ai_agent_service(
    settings: Settings = Depends(get_settings),
) -> AiAgentService:
    return AiAgentService(
        base_url=settings.ai_agent_base_url,
        timeout_seconds=settings.ai_agent_timeout_seconds,
    )


def get_yandex_ocr_service(
    settings: Settings = Depends(get_settings),
) -> YandexOcrService:
    return YandexOcrService(
        api_key=settings.yandex_ocr_api_key or settings.yandex_gpt_api_key,
        folder_id=settings.yandex_ocr_folder_id or settings.yandex_gpt_folder_id,
        url=settings.yandex_ocr_url,
        timeout_seconds=settings.yandex_ocr_timeout_seconds,
    )


def get_dashboard_service(
    repository: AdminRepository = Depends(get_admin_repository),
    database: Database = Depends(get_database),
    ai_agent_service: AiAgentService = Depends(get_ai_agent_service),
) -> DashboardService:
    return DashboardService(
        repository,
        database=database,
        ai_agent_service=ai_agent_service,
    )


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    return await auth_service.get_current_admin(credentials.credentials)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    return await auth_service.get_current_user(credentials.credentials)
