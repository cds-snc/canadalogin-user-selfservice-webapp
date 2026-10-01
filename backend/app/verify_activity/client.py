import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from httpx import AsyncClient

from app.config import Configuration
from app.utils.access_token import get_admin_token

logger = logging.getLogger(__name__)


class IBMVerifyActivityClient:
    def __init__(self, http_client: AsyncClient, settings: Configuration):
        self.http_client = http_client
        self.settings = settings
        verify = settings.ibm_verify_config
        self.activity_client_id = verify.IBM_VERIFY_ACTIVITY_CLIENT_ID
        self.activity_client_secret = verify.IBM_VERIFY_ACTIVITY_CLIENT_SECRET
        if not self.activity_client_id or not self.activity_client_secret:
            raise ValueError("Both IBM Verify activity credentials must be configured")

    async def _get(
        self, endpoint: str, token: str, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        response = await self.http_client.get(
            endpoint,
            params=dict(params) if params else None,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
        response.raise_for_status()
        return response.json()

    async def get_events(
        self,
        *,
        event_type: str,
        user_id: str,
        user_id_field: str,
        size: int = 1000,
    ) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        lookback_days = (
            self.settings.ibm_verify_config.IBM_VERIFY_ACTIVITY_LOOKBACK_DAYS
        )
        from_time = datetime.now(timezone.utc) - timedelta(days=lookback_days)
        token = await get_admin_token(
            self.http_client,
            verify_config=self.settings.ibm_verify_config,
            client_id=self.activity_client_id,
            client_secret=self.activity_client_secret,
        )
        params: dict[str, Any] = {
            "event_type": event_type,
            "filter_key": user_id_field,
            "filter_value": f'"{user_id}"',
            "from": str(int(from_time.timestamp() * 1000)),
            "size": size,
            "sort_order": "desc",
        }
        seen_cursors: set[tuple[str, str]] = set()

        while True:
            payload = await self._get(
                self.settings.events_api_endpoint,
                token,
                params,
            )
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
                logger.error(
                    "IBM Verify Events API returned a repeated pagination cursor"
                )
                break
            seen_cursors.add(cursor_key)
            if not page_events:
                break
            params.update({"after_id": after_id, "after_time": after_time})

        return events
