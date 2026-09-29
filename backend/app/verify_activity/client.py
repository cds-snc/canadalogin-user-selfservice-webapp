import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from httpx import AsyncClient

from app.config import Configuration

logger = logging.getLogger(__name__)


class IBMVerifyActivityClient:
    def __init__(self, http_client: AsyncClient, settings: Configuration):
        self.http_client = http_client
        self.settings = settings
        verify = settings.ibm_verify_config
        self.tenant_url = verify.IBM_VERIFY_TENANT_URL.rstrip("/")
        self.client_id = verify.IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID
        self.client_secret = verify.IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET

    async def _access_token(self) -> str:
        response = await self.http_client.post(
            f"{self.tenant_url}/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "openid",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        token = response.json().get("access_token")
        if not token:
            raise ValueError("IBM Verify token response did not contain access_token")
        return token

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        token = await self._access_token()
        response = await self.http_client.get(
            f"{self.tenant_url}{path}",
            params=dict(params) if params else None,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
        response.raise_for_status()
        return response.json()

    async def get_events(self, *, event_type: str, size: int = 1000) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        lookback_days = self.settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS
        from_time = datetime.now(timezone.utc) - timedelta(days=lookback_days)
        params: dict[str, Any] = {
            "event_type": event_type,
            "from": str(int(from_time.timestamp() * 1000)),
            "size": size,
            "sort_order": "desc",
        }
        seen_cursors: set[tuple[str, str]] = set()

        while True:
            payload = await self._get("/v1.0/events", params)
            page = payload.get("response", {}).get("events", payload)
            page_events = page.get("events", [])
            if isinstance(page_events, list):
                events.extend(event for event in page_events if isinstance(event, dict))

            cursor = page.get("search_after") or {}
            after_id = cursor.get("id")
            after_time = cursor.get("time")
            if not after_id or not after_time:
                break
            cursor_key = (str(after_id), str(after_time))
            if cursor_key in seen_cursors:
                logger.error("IBM Verify Events API returned a repeated pagination cursor")
                break
            seen_cursors.add(cursor_key)
            if not page_events:
                break
            params.update({"after_id": after_id, "after_time": after_time})

        return events

