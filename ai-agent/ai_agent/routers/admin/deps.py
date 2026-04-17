from __future__ import annotations

from fastapi import Header

from ai_agent.services.admin_service import AdminService


def build_require_admin(admin_service: AdminService):
    async def require_admin(authorization: str | None = Header(default=None)) -> None:
        admin_service.require_token(authorization)

    return require_admin
