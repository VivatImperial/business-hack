from __future__ import annotations

from dataclasses import dataclass, field

import httpx


class BackendClientError(RuntimeError):
    pass


@dataclass(slots=True)
class BackendClient:
    base_url: str
    bot_token: str
    timeout_seconds: float
    _client: httpx.AsyncClient = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=self.base_url.rstrip("/"),
            timeout=self.timeout_seconds,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        headers: dict[str, str] | None = None,
        json: dict[str, object] | None = None,
        expected_statuses: set[int] | None = None,
    ) -> httpx.Response:
        response = await self._client.request(method, path, headers=headers, json=json)
        if expected_statuses and response.status_code in expected_statuses:
            return response
        if response.is_error:
            detail = self._extract_detail(response)
            raise BackendClientError(detail or f"Backend returned HTTP {response.status_code}.")
        return response

    @staticmethod
    def _extract_detail(response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            return response.text.strip()
        detail = payload.get("detail")
        if isinstance(detail, str):
            return detail
        return response.text.strip()

    async def register(
        self,
        *,
        email: str,
        login: str,
        password: str,
        telegram_user_id: str,
        telegram_username: str | None,
    ) -> str:
        response = await self._request(
            "POST",
            "/api/v1/client/auth/register",
            json={
                "email": email,
                "login": login,
                "password": password,
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username,
            },
        )
        return response.json()["access_token"]

    async def login(
        self,
        *,
        email: str,
        password: str,
        telegram_user_id: str,
        telegram_username: str | None,
    ) -> str:
        response = await self._request(
            "POST",
            "/api/v1/client/auth/login",
            json={
                "email": email,
                "password": password,
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username,
            },
        )
        return response.json()["access_token"]

    async def telegram_login(self, *, telegram_user_id: str, telegram_username: str | None) -> str | None:
        response = await self._request(
            "POST",
            "/api/v1/client/auth/telegram/login",
            headers={"X-Telegram-Bot-Token": self.bot_token},
            json={
                "telegram_user_id": telegram_user_id,
                "telegram_username": telegram_username,
            },
            expected_statuses={200, 401},
        )
        if response.status_code == 401:
            return None
        return response.json()["access_token"]

    async def get_me(self, token: str) -> dict[str, object]:
        response = await self._request(
            "GET",
            "/api/v1/client/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        return response.json()

    async def create_request(self, *, token: str, title: str, description: str) -> dict[str, object]:
        response = await self._request(
            "POST",
            "/api/v1/client/requests",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": title,
                "description": description,
                "channel": "telegram",
            },
        )
        return response.json()

    async def list_requests(self, *, token: str) -> list[dict[str, object]]:
        response = await self._request(
            "GET",
            "/api/v1/client/requests?channel=telegram",
            headers={"Authorization": f"Bearer {token}"},
        )
        return response.json()["items"]

    async def get_request(self, *, token: str, request_id: str) -> dict[str, object]:
        response = await self._request(
            "GET",
            f"/api/v1/client/requests/{request_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        return response.json()

    async def add_message(
        self,
        *,
        token: str,
        request_id: str,
        text: str,
        source_message_id: str | None = None,
    ) -> dict[str, object]:
        response = await self._request(
            "POST",
            f"/api/v1/client/requests/{request_id}/messages",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "text": text,
                "source_message_id": source_message_id,
            },
        )
        return response.json()

    async def close_request(self, *, token: str, request_id: str) -> dict[str, object]:
        response = await self._request(
            "POST",
            f"/api/v1/client/requests/{request_id}/close",
            headers={"Authorization": f"Bearer {token}"},
        )
        return response.json()

    async def submit_rating(
        self,
        *,
        token: str,
        request_id: str,
        score: int,
    ) -> dict[str, object]:
        response = await self._request(
            "POST",
            f"/api/v1/client/requests/{request_id}/rating",
            headers={"Authorization": f"Bearer {token}"},
            json={"score": score},
        )
        return response.json()
