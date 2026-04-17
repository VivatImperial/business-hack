from fastapi import APIRouter

from backend.app.routers.admin.appeals import router as appeals_router
from backend.app.routers.admin.auth import router as auth_router
from backend.app.routers.admin.dashboard import router as dashboard_router
from backend.app.routers.admin.settings import router as settings_router

router = APIRouter(prefix="/admin")
router.include_router(auth_router)
router.include_router(dashboard_router)
router.include_router(appeals_router)
router.include_router(settings_router)
