"""
OAuth token manager for IDV data service integration.

Handles:
- Client registration (if not exists)
- Bearer token issuance and refresh
- Token caching and expiry
"""

from __future__ import annotations

import json
import logging
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class OAuthTokenManager:
    """Manages OAuth2 Bearer token lifecycle for IDV data service."""

    def __init__(
        self,
        base_url: str,
        client_id: str,
        scopes: str = "idv:validations:write idv:validations:read idv:validations:update idv:validations:delete idv:claims:query",
    ):
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id
        self.scopes = scopes
        self._token: Optional[str] = None
        self._token_expiry: Optional[int] = None
        self._client_registered = False

    async def get_token(self, http_client: httpx.AsyncClient) -> str:
        """Get a valid Bearer token, refreshing if needed."""
        # Check if cached token is still valid (with 60s buffer)
        if self._token and self._token_expiry and time.time() < (self._token_expiry - 60):
            logger.debug("[IDV-OAuth] Using cached token")
            return self._token

        # Register client if not already done
        if not self._client_registered:
            await self._register_client(http_client)
            self._client_registered = True

        # Issue new token
        await self._issue_token(http_client)
        return self._token

    async def _register_client(self, http_client: httpx.AsyncClient) -> None:
        """Register API client with IDV data service (idempotent)."""
        try:
            logger.debug(f"[IDV-OAuth] Registering client: {self.client_id}")
            response = await http_client.post(
                f"{self.base_url}/v1/admin/clients",
                json={
                    "client_id": self.client_id,
                    "client_name": "GC Sign-In Backend",
                    "allowed_scopes": self.scopes,
                },
                timeout=10,
            )
            if response.status_code == 409:
                logger.debug(f"[IDV-OAuth] Client already registered: {self.client_id}")
            elif response.status_code == 201:
                logger.info(f"[IDV-OAuth] Client registered: {self.client_id}")
            else:
                logger.error(
                    f"[IDV-OAuth] Client registration failed ({response.status_code}): {response.text[:200]}"
                )
                raise httpx.HTTPStatusError(
                    f"Client registration failed: {response.status_code}",
                    request=response.request,
                    response=response,
                )
        except Exception as exc:
            logger.exception(f"[IDV-OAuth] Failed to register client: {exc}")
            raise

    async def _issue_token(self, http_client: httpx.AsyncClient) -> None:
        """Issue a new Bearer token."""
        try:
            logger.debug(f"[IDV-OAuth] Issuing token for client: {self.client_id}")
            response = await http_client.post(
                f"{self.base_url}/v1/admin/token",
                params={
                    "client_id": self.client_id,
                    "scopes": self.scopes,
                },
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            self._token = data["access_token"]
            
            # Calculate expiry from expires_in if present, else use 3600s default
            expires_in = data.get("expires_in", 3600)
            self._token_expiry = int(time.time()) + expires_in
            
            logger.info(f"[IDV-OAuth] Token issued, expires in {expires_in}s")
        except Exception as exc:
            logger.exception(f"[IDV-OAuth] Failed to issue token: {exc}")
            raise

    def invalidate_token(self) -> None:
        """Invalidate cached token to force refresh on next use."""
        self._token = None
        self._token_expiry = None
        logger.debug("[IDV-OAuth] Token invalidated")
