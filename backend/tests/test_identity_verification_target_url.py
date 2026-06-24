from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.constants.session_keys import SessionKeys
from app.identity_verification.services import target_url as target_url_service


def _build_rp_response(url: str):
    return SimpleNamespace(
        data=SimpleNamespace(
            url=url,
            localized={
                "en": SimpleNamespace(url=url),
            },
        )
    )


@pytest.mark.asyncio
async def test_store_identity_verification_target_url_sets_session_value():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_relying_party_info",
        new=AsyncMock(return_value=_build_rp_response("https://rp.example.com/service")),
    ):
        response = await target_url_service.store_identity_verification_target_url(
            mock_request,
            "https://rp.example.com/service/identity-verification/complete",
        )

    assert mock_request.session[SessionKeys.IDV_TARGET_URL.value] == (
        "https://rp.example.com/service/identity-verification/complete"
    )
    assert response.data["target_url"] == (
        "https://rp.example.com/service/identity-verification/complete"
    )


@pytest.mark.asyncio
async def test_store_identity_verification_target_url_rejects_mismatched_domain():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_relying_party_info",
        new=AsyncMock(return_value=_build_rp_response("https://rp.example.com/service")),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await target_url_service.store_identity_verification_target_url(
                mock_request,
                "https://attacker.example.com/service/identity-verification/complete",
            )

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Target URL does not match relying party URL"


@pytest.mark.asyncio
async def test_get_identity_verification_redirect_url_returns_and_clears_target():
    mock_request = MagicMock()
    mock_request.session = {
        SessionKeys.IDV_TARGET_URL.value: "https://rp.example.com/service/return"
    }

    with patch(
        "app.identity_verification.services.target_url.get_relying_party_info",
        new=AsyncMock(return_value=_build_rp_response("https://rp.example.com/service")),
    ):
        response = await target_url_service.get_identity_verification_redirect_url(
            mock_request
        )

    assert response.data["redirect_url"] == "https://rp.example.com/service/return"
    assert SessionKeys.IDV_TARGET_URL.value not in mock_request.session


@pytest.mark.asyncio
async def test_get_identity_verification_redirect_url_falls_back_to_rp_url():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_relying_party_info",
        new=AsyncMock(return_value=_build_rp_response("https://rp.example.com/service")),
    ):
        response = await target_url_service.get_identity_verification_redirect_url(
            mock_request
        )

    assert response.data["redirect_url"] == "https://rp.example.com/service"
