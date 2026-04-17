from __future__ import annotations

from contextlib import asynccontextmanager

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.db.models.entities import Base


class Database:
    def __init__(self, database_url: str) -> None:
        self.engine = create_async_engine(
            database_url,
            pool_pre_ping=True,
        )
        self.session_factory = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
            autoflush=False,
            class_=AsyncSession,
        )

    async def create_schema(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def ping(self) -> bool:
        async with self.engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True

    async def ensure_schema_ready(self) -> None:
        async with self.engine.connect() as connection:
            required_tables = {"users", "tickets", "messages", "documents", "assistant_settings"}
            existing_tables = set(
                await connection.run_sync(lambda sync_conn: inspect(sync_conn).get_table_names())
            )
            missing_tables = sorted(required_tables - existing_tables)
            if missing_tables:
                raise RuntimeError(
                    "Backend schema is not ready. Missing tables: " + ", ".join(missing_tables)
                )

    @asynccontextmanager
    async def session(self) -> AsyncSession:
        async with self.session_factory() as session:
            yield session

    async def dispose(self) -> None:
        await self.engine.dispose()
