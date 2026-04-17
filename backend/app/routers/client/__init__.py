from fastapi import APIRouter

from backend.app.routers.client.auth import router as auth_router
from backend.app.routers.client.requests import router as requests_router

router = APIRouter(prefix="/client")
router.include_router(auth_router)
router.include_router(requests_router)
