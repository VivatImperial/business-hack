from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import Settings
from backend.app.db.migrations import apply_migrations
from backend.app.db.repositories.admin import AdminRepository
from backend.app.db.session import Database
from backend.app.routers.admin import router as admin_router
from backend.app.services.bootstrap import initialize_state

OPENAPI_TAGS = [
    {
        "name": "Admin Auth",
        "description": "Authentication endpoints for the admin panel.",
    },
    {
        "name": "Admin Dashboard",
        "description": "Dashboard metrics and charts for the admin panel.",
    },
    {
        "name": "Admin Appeals",
        "description": "Appeal queue management endpoints for support operators.",
    },
    {
        "name": "Admin Settings",
        "description": "Assistant runtime settings managed from the admin panel.",
    },
]


async def _initialize_database(database: Database, settings: Settings) -> None:
    if settings.run_migrations_on_startup:
        apply_migrations(settings.database_url)
    await database.ensure_schema_ready()
    async with database.session() as session:
        repository = AdminRepository(session)
        await initialize_state(repository, settings)


def create_app(*, initialize_runtime: bool = True) -> FastAPI:
    settings = Settings()
    database = Database(settings.database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        if initialize_runtime:
            await _initialize_database(database, settings)
        yield
        await database.dispose()

    app = FastAPI(
        title="Baltiyskiy Bereg Backend API",
        version="1.0.0",
        description=(
            "Admin API for the Baltiyskiy Bereg service-desk assistant. "
            "Use it for admin authentication, dashboard analytics, appeals management, "
            "and assistant settings."
        ),
        openapi_tags=OPENAPI_TAGS,
        lifespan=lifespan if initialize_runtime else None,
    )
    app.state.settings = settings
    app.state.database = database
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    if initialize_runtime:
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            asyncio.run(_initialize_database(database, settings))

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"detail": "Invalid request.", "errors": exc.errors()},
        )

    app.include_router(admin_router, prefix=settings.api_v1_prefix)
    return app
