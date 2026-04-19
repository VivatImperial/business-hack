from __future__ import annotations

from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ]
    )
    run_migrations_on_startup: bool = False
    enable_dev_seed: bool = False
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 720

    admin_login: str = "admin"
    admin_email: str = "admin@example.com"
    admin_password: str = "admin12345"
    telegram_bot_token: str | None = None

    default_tone_of_voice: str = "helpful"
    default_confidence_threshold: float = Field(default=0.55, ge=0.0, le=1.0)
    default_top_k: int = Field(default=7, ge=1)
    default_use_articles: bool = True

    ai_agent_base_url: str = "http://ai-agent:8090"
    ai_agent_timeout_seconds: float = Field(default=30.0, gt=0.0)
    yandex_ocr_api_key: str | None = Field(default=None, validation_alias="YANDEX_OCR_API_KEY")
    yandex_ocr_folder_id: str | None = Field(default=None, validation_alias="YANDEX_OCR_FOLDER_ID")
    yandex_gpt_api_key: str | None = Field(default=None, validation_alias="YANDEX_GPT_API_KEY")
    yandex_gpt_folder_id: str | None = Field(default=None, validation_alias="YANDEX_GPT_FOLDER_ID")
    yandex_ocr_url: str = Field(
        default="https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze",
        validation_alias="YANDEX_OCR_URL",
    )
    yandex_ocr_timeout_seconds: float = Field(default=30.0, gt=0.0)
    yandex_ocr_max_upload_bytes: int = Field(default=8 * 1024 * 1024, ge=1024)
    uploads_dir: str = Field(default="backend_uploads", validation_alias="BACKEND_UPLOADS_DIR")

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

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value
