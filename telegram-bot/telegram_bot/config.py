from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    telegram_bot_token: str = Field(validation_alias="TELEGRAM_BOT_TOKEN")
    backend_base_url: str = Field(default="http://backend:8000", validation_alias="BACKEND_BASE_URL")
    backend_bot_token: str | None = Field(
        default=None,
        validation_alias="BACKEND_TELEGRAM_BOT_TOKEN",
    )
    request_timeout_seconds: float = Field(default=20.0, validation_alias="TELEGRAM_BOT_TIMEOUT_SECONDS")

    @property
    def effective_backend_bot_token(self) -> str:
        return self.backend_bot_token or self.telegram_bot_token
