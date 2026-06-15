import pytest
from unittest.mock import AsyncMock, Mock, patch

from fastapi import HTTPException
from httpx import AsyncClient, HTTPStatusError, Request, Response

from app.password.schemas import SecondStepPasswordUpdatePayload
from app.password.services.second_step_update_password import (
    dispatch_password_otp_validator,
)


@pytest.mark.asyncio
async def test_dispatch_password_otp_validator_success():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = SecondStepPasswordUpdatePayload(otp="123456", trxId="trx-123")

    mock_settings = Mock()
    mock_settings.password_resetter_api_endpoint = "https://verify.example.com/resetter"

    request = Request(
        "POST",
        "https://verify.example.com/resetter/trx-123/validator",
    )
    response = Response(
        200,
        json={"trxId": "trx-123", "stepsRemaining": 1},
        request=request,
    )

    mock_http_client.post.return_value = response

    with (
        patch(
            "app.password.services.second_step_update_password.get_admin_token",
            new_callable=AsyncMock,
        ) as mock_get_admin_token,
        patch(
            "app.password.services.second_step_update_password.get_auth_request_headers"
        ) as mock_headers,
        patch(
            "app.password.services.second_step_update_password.get_configuration",
            return_value=mock_settings,
        ),
    ):
        mock_get_admin_token.return_value = "admin-token"
        mock_headers.return_value = {"Authorization": "Bearer admin-token"}

        result = await dispatch_password_otp_validator(mock_http_client, payload)

        assert result.status_code == 200


@pytest.mark.asyncio
async def test_dispatch_password_otp_validator_maps_400_to_http_exception():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = SecondStepPasswordUpdatePayload(otp="123456", trxId="trx-123")

    mock_settings = Mock()
    mock_settings.password_resetter_api_endpoint = "https://verify.example.com/resetter"

    request = Request(
        "POST",
        "https://verify.example.com/resetter/trx-123/validator",
    )
    upstream_response = Response(
        400,
        json={
            "messageId": "CSIAM0011E",
            "messageDescription": "The authentication attempt failed.",
        },
        request=request,
    )

    mock_response = Mock(spec=Response)
    mock_response.json.return_value = {
        "messageId": "CSIAM0011E",
        "messageDescription": "The authentication attempt failed.",
    }
    mock_response.raise_for_status.side_effect = HTTPStatusError(
        "400 Bad Request",
        request=request,
        response=upstream_response,
    )
    mock_http_client.post.return_value = mock_response

    with (
        patch(
            "app.password.services.second_step_update_password.get_admin_token",
            new_callable=AsyncMock,
        ) as mock_get_admin_token,
        patch(
            "app.password.services.second_step_update_password.get_auth_request_headers"
        ) as mock_headers,
        patch(
            "app.password.services.second_step_update_password.get_configuration",
            return_value=mock_settings,
        ),
    ):
        mock_get_admin_token.return_value = "admin-token"
        mock_headers.return_value = {"Authorization": "Bearer admin-token"}

        with pytest.raises(HTTPException) as exc_info:
            await dispatch_password_otp_validator(mock_http_client, payload)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == {"message": "CSIAM0011E"}


@pytest.mark.asyncio
async def test_dispatch_password_otp_validator_preserves_attempt_metadata():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = SecondStepPasswordUpdatePayload(otp="123456", trxId="trx-123")

    mock_settings = Mock()
    mock_settings.password_resetter_api_endpoint = "https://verify.example.com/resetter"

    request = Request(
        "POST",
        "https://verify.example.com/resetter/trx-123/validator",
    )
    upstream_response = Response(
        400,
        json={
            "messageId": "CSIAM0011E",
            "attempts": 2,
            "retries": 4,
        },
        request=request,
    )

    mock_response = Mock(spec=Response)
    mock_response.json.return_value = {
        "messageId": "CSIAM0011E",
        "attempts": 2,
        "retries": 4,
    }
    mock_response.raise_for_status.side_effect = HTTPStatusError(
        "400 Bad Request",
        request=request,
        response=upstream_response,
    )
    mock_http_client.post.return_value = mock_response

    with (
        patch(
            "app.password.services.second_step_update_password.get_admin_token",
            new_callable=AsyncMock,
        ) as mock_get_admin_token,
        patch(
            "app.password.services.second_step_update_password.get_auth_request_headers"
        ) as mock_headers,
        patch(
            "app.password.services.second_step_update_password.get_configuration",
            return_value=mock_settings,
        ),
    ):
        mock_get_admin_token.return_value = "admin-token"
        mock_headers.return_value = {"Authorization": "Bearer admin-token"}

        with pytest.raises(HTTPException) as exc_info:
            await dispatch_password_otp_validator(mock_http_client, payload)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == {
            "message": "CSIAM0011E",
            "attempts": 2,
            "retries": 4,
        }


@pytest.mark.asyncio
async def test_dispatch_password_otp_validator_maps_405_to_http_exception():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = SecondStepPasswordUpdatePayload(otp="123456", trxId="trx-123")

    mock_settings = Mock()
    mock_settings.password_resetter_api_endpoint = "https://verify.example.com/resetter"

    request = Request(
        "POST",
        "https://verify.example.com/resetter/trx-123/validator",
    )
    upstream_response = Response(
        405,
        json={
            "messageId": "CSIAM0023E",
            "messageDescription": "The authentication attempt failed.",
        },
        request=request,
    )

    mock_response = Mock(spec=Response)
    mock_response.json.return_value = {
        "messageId": "CSIAM0023E",
        "messageDescription": "The authentication attempt failed.",
    }
    mock_response.raise_for_status.side_effect = HTTPStatusError(
        "405 Method Not Allowed",
        request=request,
        response=upstream_response,
    )
    mock_http_client.post.return_value = mock_response

    with (
        patch(
            "app.password.services.second_step_update_password.get_admin_token",
            new_callable=AsyncMock,
        ) as mock_get_admin_token,
        patch(
            "app.password.services.second_step_update_password.get_auth_request_headers"
        ) as mock_headers,
        patch(
            "app.password.services.second_step_update_password.get_configuration",
            return_value=mock_settings,
        ),
    ):
        mock_get_admin_token.return_value = "admin-token"
        mock_headers.return_value = {"Authorization": "Bearer admin-token"}

        with pytest.raises(HTTPException) as exc_info:
            await dispatch_password_otp_validator(mock_http_client, payload)

        assert exc_info.value.status_code == 400
        assert exc_info.value.detail == {"message": "CSIAM0023E"}


@pytest.mark.asyncio
async def test_dispatch_password_otp_validator_reraises_non_400_errors():
    mock_http_client = AsyncMock(spec=AsyncClient)
    payload = SecondStepPasswordUpdatePayload(otp="123456", trxId="trx-123")

    mock_settings = Mock()
    mock_settings.password_resetter_api_endpoint = "https://verify.example.com/resetter"

    request = Request(
        "POST",
        "https://verify.example.com/resetter/trx-123/validator",
    )
    upstream_response = Response(
        500,
        json={"message": "server error"},
        request=request,
    )

    mock_response = Mock(spec=Response)
    mock_response.json.return_value = {"message": "server error"}
    mock_response.raise_for_status.side_effect = HTTPStatusError(
        "500 Internal Server Error",
        request=request,
        response=upstream_response,
    )
    mock_http_client.post.return_value = mock_response

    with (
        patch(
            "app.password.services.second_step_update_password.get_admin_token",
            new_callable=AsyncMock,
        ) as mock_get_admin_token,
        patch(
            "app.password.services.second_step_update_password.get_auth_request_headers"
        ) as mock_headers,
        patch(
            "app.password.services.second_step_update_password.get_configuration",
            return_value=mock_settings,
        ),
    ):
        mock_get_admin_token.return_value = "admin-token"
        mock_headers.return_value = {"Authorization": "Bearer admin-token"}

        with pytest.raises(HTTPStatusError):
            await dispatch_password_otp_validator(mock_http_client, payload)
