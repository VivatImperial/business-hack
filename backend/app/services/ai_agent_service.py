from __future__ import annotations

from typing import Any

import httpx

from backend.app.schemas.ai_agent import (
    AiAgentHealthResponse,
    AiAgentRespondRequest,
    AiAgentRespondResponse,
)


class AiAgentService:
    def __init__(
        self,
        *,
        base_url: str,
        timeout_seconds: float = 30.0,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.client = client

    async def get_health(self) -> dict[str, Any]:
        response = await self._request("GET", "/api/v1/internal/health")
        return AiAgentHealthResponse.model_validate(response.json()).model_dump()

    async def respond(self, payload: dict[str, Any]) -> dict[str, Any]:
        request_payload = AiAgentRespondRequest.model_validate(payload)
        response = await self._request(
            "POST",
            "/api/v1/internal/agent/respond",
            json=request_payload.model_dump(mode="json"),
        )
        return AiAgentRespondResponse.model_validate(response.json()).model_dump()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
    ) -> httpx.Response:
        if self.client is not None:
            response = await self.client.request(method, path, json=json)
            response.raise_for_status()
            return response

        async with httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout_seconds,
        ) as client:
            response = await client.request(method, path, json=json)
            response.raise_for_status()
            return response
