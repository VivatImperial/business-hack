from __future__ import annotations

import os
import unittest

from fastapi.testclient import TestClient

from backend.app import create_app
from backend.app.db.migrations import apply_migrations
from tests.backend.support import BackendDatabaseTestCase


class AdminApiTests(BackendDatabaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client = TestClient(create_app())

    def tearDown(self) -> None:
        super().tearDown()

    def _auth_headers(self) -> dict[str, str]:
        response = self.client.post(
            "/api/v1/admin/auth/login",
            json={
                "email": "admin@example.com",
                "password": "admin12345",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    def test_login_rejects_unknown_credentials(self) -> None:
        response = self.client.post(
            "/api/v1/admin/auth/login",
            json={
                "email": "unknown@example.com",
                "password": "wrong-password",
            },
        )

        self.assertEqual(response.status_code, 401, response.text)
        self.assertEqual(response.json(), {"detail": "Invalid email or password."})

    def test_me_requires_bearer_token(self) -> None:
        response = self.client.get("/api/v1/admin/me")

        self.assertEqual(response.status_code, 401, response.text)

    def test_login_returns_token_and_me_returns_current_admin(self) -> None:
        login_response = self.client.post(
            "/api/v1/admin/auth/login",
            json={
                "email": "admin@example.com",
                "password": "admin12345",
            },
        )

        self.assertEqual(login_response.status_code, 200, login_response.text)
        self.assertIn("access_token", login_response.json())

        me_response = self.client.get("/api/v1/admin/me", headers=self._auth_headers())

        self.assertEqual(me_response.status_code, 200, me_response.text)
        self.assertEqual(
            me_response.json(),
            {
                "id": "admin-user",
                "login": "admin",
            },
        )

    def test_dashboard_summary_matches_seeded_metrics(self) -> None:
        response = self.client.get(
            "/api/v1/admin/dashboard/summary",
            headers=self._auth_headers(),
            params={"period": "24h"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(
            response.json(),
            {
                "health": "degraded",
                "open_appeals_count": 1,
                "in_progress_appeals_count": 1,
                "assistant_resolution_rate": 0.5,
                "avg_resolution_minutes": 90.0,
                "csat_avg": 4.5,
            },
        )

    def test_messages_timeseries_returns_aggregated_points(self) -> None:
        response = self.client.get(
            "/api/v1/admin/dashboard/messages-timeseries",
            headers=self._auth_headers(),
            params={"period": "24h"},
        )

        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["period"], "24h")
        self.assertEqual(payload["total_messages"], 4)
        self.assertGreaterEqual(len(payload["points"]), 1)
        self.assertEqual(
            sum(point["messages_count"] for point in payload["points"]),
            payload["total_messages"],
        )
        self.assertTrue(all("ts" in point for point in payload["points"]))

    def test_appeals_list_supports_scope_and_status_filters(self) -> None:
        assistant_response = self.client.get(
            "/api/v1/admin/appeals",
            headers=self._auth_headers(),
            params={"scope": "assistant"},
        )
        in_progress_response = self.client.get(
            "/api/v1/admin/appeals",
            headers=self._auth_headers(),
            params={"status": "in_progress"},
        )

        self.assertEqual(assistant_response.status_code, 200, assistant_response.text)
        self.assertEqual(in_progress_response.status_code, 200, in_progress_response.text)
        self.assertEqual(len(assistant_response.json()["items"]), 2)
        self.assertEqual(
            [item["id"] for item in in_progress_response.json()["items"]],
            ["appeal-2"],
        )

    def test_appeal_detail_take_close_and_rating_request_flow(self) -> None:
        detail_response = self.client.get(
            "/api/v1/admin/appeals/appeal-1",
            headers=self._auth_headers(),
        )
        take_response = self.client.post(
            "/api/v1/admin/appeals/appeal-1/take",
            headers=self._auth_headers(),
        )
        close_response = self.client.post(
            "/api/v1/admin/appeals/appeal-1/close",
            headers=self._auth_headers(),
        )
        rating_response = self.client.post(
            "/api/v1/admin/appeals/appeal-1/rating-request",
            headers=self._auth_headers(),
        )

        self.assertEqual(detail_response.status_code, 200, detail_response.text)
        self.assertEqual(detail_response.json()["status"], "open")
        self.assertEqual(take_response.status_code, 200, take_response.text)
        self.assertEqual(
            take_response.json(),
            {
                "id": "appeal-1",
                "status": "in_progress",
            },
        )
        self.assertEqual(close_response.status_code, 200, close_response.text)
        self.assertEqual(close_response.json()["id"], "appeal-1")
        self.assertEqual(close_response.json()["status"], "closed")
        self.assertIsNotNone(close_response.json()["closed_at"])
        self.assertEqual(rating_response.status_code, 200, rating_response.text)
        self.assertEqual(
            rating_response.json(),
            {
                "id": "appeal-1",
                "rating_request_sent": True,
            },
        )

    def test_settings_can_be_read_and_updated(self) -> None:
        get_response = self.client.get(
            "/api/v1/admin/settings",
            headers=self._auth_headers(),
        )
        put_response = self.client.put(
            "/api/v1/admin/settings",
            headers=self._auth_headers(),
            json={
                "tone_of_voice": "formal",
                "confidence_threshold": 0.82,
                "top_k": 7,
                "use_articles": False,
            },
        )

        self.assertEqual(get_response.status_code, 200, get_response.text)
        self.assertEqual(
            get_response.json(),
            {
                "tone_of_voice": "helpful",
                "confidence_threshold": 0.7,
                "top_k": 5,
                "use_articles": True,
            },
        )
        self.assertEqual(put_response.status_code, 200, put_response.text)
        self.assertEqual(
            put_response.json(),
            {
                "tone_of_voice": "formal",
                "confidence_threshold": 0.82,
                "top_k": 7,
                "use_articles": False,
            },
        )


if __name__ == "__main__":
    unittest.main()
