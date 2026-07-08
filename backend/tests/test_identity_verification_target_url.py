from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.constants.session_keys import SessionKeys
from app.identity_verification.services import target_url as target_url_service


def _build_config(tenant_url: str):
    return MagicMock(
        ibm_verify_config=MagicMock(IBM_VERIFY_TENANT_URL=tenant_url)
    )


@pytest.mark.asyncio
async def test_store_identity_verification_target_url_sets_session_value():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_configuration",
        return_value=_build_config("https://tenant.example.com"),
    ):
        response = await target_url_service.store_identity_verification_target_url(
            mock_request,
            "https://tenant.example.com/identity-verification/complete",
        )

    assert mock_request.session[SessionKeys.IDV_TARGET_URL.value] == (
        "https://tenant.example.com/identity-verification/complete"
    )
    assert response.data["target_url"] == (
        "https://tenant.example.com/identity-verification/complete"
    )


@pytest.mark.asyncio
async def test_store_identity_verification_target_url_accepts_wrapped_target_param():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_configuration",
        return_value=_build_config("https://cds-gcsignin-dev.verify.ibm.com"),
    ):
        response = await target_url_service.store_identity_verification_target_url(
            mock_request,
            "?Target=https%3A%2F%2Fcds-gcsignin-dev.verify.ibm.com",
        )

    assert mock_request.session[SessionKeys.IDV_TARGET_URL.value] == (
        "https://cds-gcsignin-dev.verify.ibm.com"
    )
    assert response.data["target_url"] == "https://cds-gcsignin-dev.verify.ibm.com"


@pytest.mark.asyncio
async def test_store_identity_verification_target_url_preserves_full_wrapped_target_with_query_params():
    mock_request = MagicMock()
    mock_request.session = {}
    full_target_url = (
        "https://cds-gcsignin-dev.verify.ibm.com/oauth2/authorize"
        "?client_id=d109133c-6984-4705-ac5c-eb3538b4c67d"
        "&requestId=ed98aac7-9816-4206-bbaa-1fb6ccc8107e"
        "&stateId=992423a4-fe88-4d49-9cb4-ef9f2626e74c"
    )

    with patch(
        "app.identity_verification.services.target_url.get_configuration",
        return_value=_build_config("https://cds-gcsignin-dev.verify.ibm.com"),
    ):
        response = await target_url_service.store_identity_verification_target_url(
            mock_request,
            f"?Target={full_target_url}",
        )

    assert mock_request.session[SessionKeys.IDV_TARGET_URL.value] == full_target_url
    assert response.data["target_url"] == full_target_url


@pytest.mark.asyncio
async def test_store_identity_verification_target_url_rejects_mismatched_domain():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_configuration",
        return_value=_build_config("https://tenant.example.com"),
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
        SessionKeys.IDV_TARGET_URL.value: "https://tenant.example.com/return"
    }

    with patch(
        "app.identity_verification.services.target_url.get_configuration",
        return_value=_build_config("https://tenant.example.com"),
    ):
        response = await target_url_service.get_identity_verification_redirect_url(
            mock_request
        )

    assert response.data["redirect_url"] == "https://tenant.example.com/return"
    assert SessionKeys.IDV_TARGET_URL.value not in mock_request.session


@pytest.mark.asyncio
async def test_get_identity_verification_redirect_url_falls_back_to_rp_url():
    mock_request = MagicMock()
    mock_request.session = {}

    with patch(
        "app.identity_verification.services.target_url.get_configuration",
        return_value=_build_config("https://tenant.example.com"),
    ):
        response = await target_url_service.get_identity_verification_redirect_url(
            mock_request
        )

    assert response.data["redirect_url"] == "https://tenant.example.com"
