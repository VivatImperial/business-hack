from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="BACKEND_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "backend"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://backend:backend@localhost:5432/baltiyskiy_bereg"
    run_migrations_on_startup: bool = False
    enable_dev_seed: bool = False
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720

    admin_login: str = "admin"
    admin_email: str = "admin@example.com"
    admin_password: str = "admin12345"

    default_tone_of_voice: str = "helpful"
    default_confidence_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    default_top_k: int = Field(default=5, ge=1)
    default_use_articles: bool = True

    ai_agent_base_url: str = "http://ai-agent:8090"
    ai_agent_timeout_seconds: float = Field(default=30.0, gt=0.0)

    mssql_host: str = Field(default="mssql", validation_alias="MSSQL_HOST")
    mssql_port: int = Field(default=1433, validation_alias="MSSQL_PORT")
    mssql_database: str = Field(default="service_desk_tdbb", validation_alias="MSSQL_DATABASE")
    mssql_user: str = Field(default="SA", validation_alias="MSSQL_USER")
    mssql_password: str = Field(
        default="YourStrong!Pass123",
        validation_alias="MSSQL_SA_PASSWORD",
    )
    mssql_sync_enabled: bool = False
    mssql_sync_batch_size: int = Field(default=100, ge=1, le=5000)
