from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.app.config import Settings
from backend.app.db.migrations import apply_migrations
from backend.app.db.repositories.admin import AdminRepository
from backend.app.db.session import Database
from backend.app.routers.admin import router as admin_router
from backend.app.services.bootstrap import initialize_state


async def _initialize_database(database: Database, settings: Settings) -> None:
    if settings.run_migrations_on_startup:
        apply_migrations(settings.database_url)
    await database.ensure_schema_ready()
    async with database.session() as session:
        repository = AdminRepository(session)
        await initialize_state(repository, settings)


def create_app() -> FastAPI:
    settings = Settings()
    database = Database(settings.database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await _initialize_database(database, settings)
        yield
        await database.dispose()

    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.state.settings = settings
    app.state.database = database

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
