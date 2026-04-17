from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings for the ai-agent service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    service_name: str = "ai-agent"
    service_host: str = "0.0.0.0"
    service_port: int = 8080
    service_reload: bool = False
    enable_runtime_orchestrator: bool = Field(default=False, alias="AI_AGENT_ENABLE_ORCHESTRATOR")
    yandex_gpt_model: str = Field(default="yandexgpt/latest", alias="YANDEX_GPT_MODEL")
    yandex_gpt_api_key: str | None = Field(default=None, alias="YANDEX_GPT_API_KEY")
    yandex_gpt_folder_id: str | None = Field(default=None, alias="YANDEX_GPT_FOLDER_ID")
    yandex_gpt_base_url: str = Field(default="https://llm.api.cloud.yandex.net/v1", alias="YANDEX_GPT_BASE_URL")
    qdrant_url: str = Field(default="http://localhost:6333", alias="QDRANT_URL")
    embedding_model_name: str = Field(default="Qwen/Qwen3-Embedding-0.6B", alias="AI_AGENT_EMBEDDING_MODEL")
    embedding_device: str = Field(default="auto", alias="AI_AGENT_EMBEDDING_DEVICE")
    embedding_dim: int = Field(default=0, alias="AI_AGENT_EMBEDDING_DIM")
    embedding_max_length: int = Field(default=4096, alias="AI_AGENT_EMBEDDING_MAX_LENGTH")
    embedding_torch_dtype: str = Field(default="auto", alias="AI_AGENT_EMBEDDING_TORCH_DTYPE")
    database_url: str | None = Field(default=None, alias="AI_AGENT_DATABASE_URL")
    jwt_secret: str = Field(default="change-me", alias="AI_AGENT_JWT_SECRET")
    admin_login: str = Field(default="admin", alias="AI_AGENT_ADMIN_LOGIN")
    admin_email: str = Field(default="admin@example.com", alias="AI_AGENT_ADMIN_EMAIL")
    admin_password: str = Field(default="admin12345", alias="AI_AGENT_ADMIN_PASSWORD")
    default_top_k: int = 5


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
