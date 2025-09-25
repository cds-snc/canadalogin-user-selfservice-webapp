# tests/test_relying_party_info.py
import pytest
import httpx
from unittest.mock import AsyncMock
from httpx import Response as HTTPXResponse
from fastapi import HTTPException
from pydantic import BaseModel, EmailStr

# 🔧 Adjust this import to your actual module path:
# e.g., from app.users.services.relying_party import get_relying_party_info
from app.users.services.rp_info import get_relying_party_info

# And these to your actual schema paths if needed:
from app.users.schemas import RelyingPartyResponse


@pytest.mark.asyncio
async def test_get_relying_party_info_success_with_mock_transport(monkeypatch):
    """
    200 OK with a matching relying_party_id in applications[*].links[*]
    → returns RelyingPartyResponse(success=True, data=RelyingPartyInfo)
    """
    module_path = "app.users.services.rp_info"

    relying_party_id = "rp-123"
    endpoint = "https://example.test/verify/apps"

    # Patch auth helpers
    monkeypatch.setattr(
        f"{module_path}.get_admin_token", AsyncMock(return_value="adm-token")
    )
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda token, *_: {"Authorization": f"Bearer {token}", "X-Test": "1"},
    )

    # Build a valid response
    json_payload = {
        "applications": [
            {
                "name": "App One",
                "links": [
                    {
                        "id": "rp-999",
                        "icon": "ico1.png",
                        "linkName": "Other",
                        "url": "https://other.example",
                    },
                    {
                        "id": "rp-123",
                        "icon": "ico.png",
                        "linkName": "Main RP",
                        "url": "https://rp.example",
                    },
                ],
            },
            {
                "name": "App Two",
                "links": [
                    {
                        "id": "rp-777",
                        "icon": "ico2.png",
                        "linkName": "Another",
                        "url": "https://another.example",
                    },
                ],
            },
        ]
    }

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        assert str(request.url) == endpoint
        assert request.headers["Authorization"] == "Bearer adm-token"
        assert request.headers["X-Test"] == "1"
        return HTTPXResponse(200, json=json_payload)

    transport = httpx.MockTransport(transport_handler)

    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        result = await get_relying_party_info(
            client,
            relying_party_id=relying_party_id,
            rp_user_applications_api_endpoint=endpoint,
        )

    assert isinstance(result, RelyingPartyResponse)
    assert result.success is True
    assert result.message == "User profile retrieved successfully."
    assert result.data.id == "rp-123"
    assert result.data.icon == "ico.png"
    assert result.data.linkName == "Main RP"
    assert result.data.url == "https://rp.example"


@pytest.mark.asyncio
async def test_get_relying_party_info_200_not_found(monkeypatch):
    """
    200 OK but the relying_party_id is NOT present → 404
    """
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    json_payload = {
        "applications": [
            {
                "links": [
                    {
                        "id": "not-this-one",
                        "icon": "i.png",
                        "linkName": "X",
                        "url": "https://x",
                    }
                ]
            }
        ]
    }

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(200, json=json_payload)

    transport = httpx.MockTransport(transport_handler)

    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(client, "missing-id", endpoint)

    assert exc.value.status_code == 404
    assert "Relying party info not found" in exc.value.detail


@pytest.mark.asyncio
async def test_get_relying_party_info_200_invalid_schema(monkeypatch):
    """
    200 OK and link found, but link schema invalid → 422 ("Response data validation error")
    (e.g., missing required 'url')
    """
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    json_payload = {
        "applications": [
            {
                "links": [
                    # Missing 'url' to trigger Pydantic ValidationError
                    {"id": "rp-123", "icon": "ico.png", "linkName": "Main RP"}
                ]
            }
        ]
    }

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(200, json=json_payload)

    transport = httpx.MockTransport(transport_handler)

    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(client, "rp-123", endpoint)

    assert exc.value.status_code == 422
    assert exc.value.detail == "Response data validation error"


@pytest.mark.asyncio
async def test_get_relying_party_info_401_unauthenticated(monkeypatch):
    """
    Non-200: 401 → raises 401 Not authenticated
    """
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(401, json={"detail": "token invalid"})

    transport = httpx.MockTransport(transport_handler)

    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(client, "rp-123", endpoint)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Not authenticated"


@pytest.mark.asyncio
async def test_get_relying_party_info_non_json_error_body(monkeypatch):
    """
    Non-200: e.g., 502 with text body → raises 400 with that text in detail
    """
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(502, text="Bad gateway")

    transport = httpx.MockTransport(transport_handler)

    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(client, "rp-123", endpoint)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Failed to fetch RP info: Bad gateway"


@pytest.mark.asyncio
async def test_get_relying_party_info_json_error_body(monkeypatch):
    """
    Non-200 JSON with 'detail' key → its value is included in the raised 400 error
    """
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))
    monkeypatch.setattr(
        f"{module_path}.get_auth_request_headers",
        lambda *_: {"Authorization": "Bearer adm"},
    )

    def transport_handler(request: httpx.Request) -> HTTPXResponse:
        return HTTPXResponse(500, json={"detail": "Upstream crashed"})

    transport = httpx.MockTransport(transport_handler)

    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(client, "rp-123", endpoint)

    assert exc.value.status_code == 400
    assert exc.value.detail == "Failed to fetch RP info: Upstream crashed"


@pytest.mark.asyncio
async def test_get_relying_party_info_request_validation_error(monkeypatch):
    """
    If a Pydantic ValidationError is raised while preparing the request (e.g., headers),
    the function catches it and raises HTTPException(422) with 'Request data validation error'.
    """
    module_path = "app.users.services.rp_info"
    endpoint = "https://example.test/verify/apps"

    # get_admin_token succeeds
    monkeypatch.setattr(f"{module_path}.get_admin_token", AsyncMock(return_value="adm"))

    # get_auth_request_headers will raise a real pydantic.ValidationError
    class HeaderModel(BaseModel):
        email: EmailStr  # force a validation error with bad input

    def bad_headers(*_, **__):
        # This triggers a real ValidationError
        HeaderModel(email="not-an-email")

    monkeypatch.setattr(f"{module_path}.get_auth_request_headers", bad_headers)

    # We still provide a client; the GET should never be reached
    transport = httpx.MockTransport(lambda request: HTTPXResponse(200, json={}))
    async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
        with pytest.raises(HTTPException) as exc:
            await get_relying_party_info(client, "rp-123", endpoint)

    assert exc.value.status_code == 422
