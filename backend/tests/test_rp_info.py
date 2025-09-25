# backend/tests/test_rp_info.py

import types
import pytest
import httpx
from unittest.mock import AsyncMock
from fastapi import HTTPException

# Source under test
from app.users.services.rp_info import get_relying_party_info, SessionKeys

HTTPXResponse = httpx.Response


class DummyRequest:
    """
    Minimal stand-in for FastAPI's Request used by get_relying_party_info.

    Provides:
      - app.state.request_client: httpx.AsyncClient
      - app.state.http_client:    httpx.AsyncClient (alias, just in case)
      - app.state.config.rp_user_applications_api_endpoint: str
      - session: dict (and state.session for compatibility)
      - endpoint/url/base_url: str
      - headers/state: basic containers
    """

    def __init__(self, client: httpx.AsyncClient, endpoint: str, session: dict):
        # Some code paths might read request.client directly
        self.client = client

        # Build app.state with required attributes
        state = types.SimpleNamespace()
        state.request_client = client
        state.http_client = client  # alias if other code paths use it
        state.config = types.SimpleNamespace(rp_user_applications_api_endpoint=endpoint)
        self.app = types.SimpleNamespace(state=state)

        # Sessions
        self.session = session
        self.state = types.SimpleNamespace(session=session)

        # URL-ish attributes (harmless if unused)
        self.endpoint = endpoint
        self.url = endpoint
        self.base_url = endpoint

        self.headers = {}


def apps_payload_no_match():
    return {
        "applications": [
            {
                "id": "app-001",
                "name": "Non Matching App",
                "description": "does-not-match-any-client-id",
                "status": ["ENABLED"],
                "category": ["General"],
                "links": [],
            }
        ]
    }


def apps_payload_match_but_no_links(client_id: str):
    return {
        "applications": [
            {
                "id": "app-002",
                "name": "Matching App",
                "description": client_id,
                "status": ["ENABLED"],
                "category": ["General"],
                "links": [],
            }
        ]
    }


@pytest.mark.asyncio
async def test_get_relying_party_info_not_found_404(monkeypatch):
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    def re_raise(e: Exception):
        raise e

    monkeypatch.setattr(f"{module_path}.RequestErrorHandler.handle", re_raise)

    client_id = "client-123"
    payload = apps_payload_no_match()

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(200, json=payload)

    transport = httpx.MockTransport(transport_handler)

    session = {SessionKeys.RP_CLIENT_ID_KEY.value: client_id}
    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        req = DummyRequest(client=client, endpoint=endpoint, session=session)
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(req)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Relying party info not found"


@pytest.mark.asyncio
async def test_get_relying_party_info_dispatch_error_bubbles_via_handler(monkeypatch):
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    def re_raise(e: Exception):
        raise e

    monkeypatch.setattr(f"{module_path}.RequestErrorHandler.handle", re_raise)

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(500, json={"detail": "Upstream error"})

    transport = httpx.MockTransport(transport_handler)

    session = {SessionKeys.RP_CLIENT_ID_KEY.value: "client-123"}
    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        req = DummyRequest(client=client, endpoint=endpoint, session=session)
        with pytest.raises(httpx.HTTPStatusError):
            await get_relying_party_info(req)


@pytest.mark.asyncio
async def test_get_relying_party_info_match_but_no_links_404(monkeypatch):
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    def re_raise(e: Exception):
        raise e

    monkeypatch.setattr(f"{module_path}.RequestErrorHandler.handle", re_raise)

    client_id = "client-123"
    payload = apps_payload_match_but_no_links(client_id)

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(200, json=payload)

    transport = httpx.MockTransport(transport_handler)

    session = {SessionKeys.RP_CLIENT_ID_KEY.value: client_id}
    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        req = DummyRequest(client=client, endpoint=endpoint, session=session)
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(req)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Relying party info not found"
