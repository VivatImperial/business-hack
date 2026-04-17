from __future__ import annotations

from typing import Any

import httpx


class YandexGptClient:
    """Thin OpenAI-compatible client for YandexGPT latest."""

    def __init__(
        self,
        *,
        api_key: str | None,
        model_name: str,
        base_url: str = "https://llm.api.cloud.yandex.net/v1",
        folder_id: str | None = None,
        timeout_seconds: int = 60,
    ) -> None:
        self.api_key = api_key
        self.model_name = model_name
        self.base_url = base_url.rstrip("/")
        self.folder_id = folder_id
        self.timeout_seconds = timeout_seconds

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.model_name)

    def _is_openai_compatible_mode(self) -> bool:
        return self.base_url.endswith("/v1") and not self.base_url.endswith("/foundationModels/v1")

    def _resolve_model_name(self) -> str:
        if self._is_openai_compatible_mode():
            return self.model_name
        if self.model_name.startswith("gpt://"):
            return self.model_name
        if not self.folder_id or self.folder_id == "your-folder-id":
            raise RuntimeError("YANDEX_GPT_FOLDER_ID must be set to call the native YandexGPT API.")
        return f"gpt://{self.folder_id}/{self.model_name.lstrip('/')}"

    async def generate(self, *, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        if not self.is_configured:
            raise RuntimeError("YandexGPT client is not configured.")

        headers = {
            "Authorization": f"Api-Key {self.api_key}",
            "Content-Type": "application/json",
        }
        if (
            not self._is_openai_compatible_mode()
            and self.folder_id
            and self.folder_id != "your-folder-id"
        ):
            headers["x-folder-id"] = self.folder_id

        payload: dict[str, Any] = {
            "model": self._resolve_model_name(),
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            body = response.json()

        choices = body.get("choices") or []
        if not choices:
            return ""
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            text_parts = [str(item.get("text") or "") for item in content if isinstance(item, dict)]
            return "\n".join(part for part in text_parts if part).strip()
        return ""
