import json
from unittest.mock import patch, AsyncMock, MagicMock
import pytest
from httpx import AsyncClient
from app.users.schemas import UserLoginRequestData
from app.users.services.login import (
    requestCloudDirectoryId,
    getCloudDirectoryId,
    signin_with_password,
)
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_request_cloud_directory_id_success():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "password": [
            {
                "name": "Cloud Directory",
                "location": "https://mocktenant.verify.ibm.com/v1.0/authnmethods/password/d67ed8...-a376-2b357a9ef0e4",
                "id": "435345783450784728527828075870543708354",
                "type": "ibmldap",
            }
        ],
        "total": 1,
        "count": 200,
        "limit": 200,
        "page": 1,
    }

    with (
        patch(
            "app.users.services.login.get_admin_token", new_callable=AsyncMock
        ) as mock_token,
        patch("app.users.services.login.get_auth_request_headers") as mock_headers,
        patch("app.users.services.login.get_settings") as mock_settings,
        patch("app.users.services.login.AsyncClient") as mock_client_class,
    ):
        mock_token.return_value = "fake--token"
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        response = await requestCloudDirectoryId(global_http_client=mock_client)
        mock_token.assert_called_once()
        mock_headers.assert_called_once()
        mock_settings.assert_called_once()
        assert response.json()
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_request_cloud_directory_id_raises_http_exception():
    with (
        patch(
            "app.users.services.login.get_admin_token", new_callable=AsyncMock
        ) as mock_token,
        patch("app.users.services.login.get_auth_request_headers") as mock_headers,
        patch("app.users.services.login.get_settings") as mock_settings,
        patch("app.users.services.login.AsyncClient") as mock_client_class,
    ):
        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.get.side_effect = Exception("Connection error")
        mock_client_class.return_value = mock_client

        with pytest.raises(HTTPException) as exc_info:
            await requestCloudDirectoryId(global_http_client=mock_client)

        mock_token.assert_called_once()
        mock_headers.assert_called_once()
        mock_settings.assert_called_once()
        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_cloud_directory_id_success():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "password": [
            {
                "name": "Cloud Directory",
                "location": "https://mocktenant.verify.ibm.com/v1.0/authnmethods/password/d67ed8...-a376-2b357a9ef0e4",
                "id": "435345783450784728527828075870543708354",
                "type": "ibmldap",
            }
        ],
        "total": 1,
        "count": 200,
        "limit": 200,
        "page": 1,
    }

    with (
        patch(
            "app.users.services.login.get_admin_token", new_callable=AsyncMock
        ) as mock_token,
        patch("app.users.services.login.get_auth_request_headers") as mock_headers,
        patch("app.users.services.login.get_settings") as mock_settings,
        patch("app.users.services.login.AsyncClient") as mock_client_class,
    ):
        mock_client = AsyncMock(spec=AsyncClient)
        mock_client_class.return_value = mock_client
        mock_client.get.return_value = mock_response
        response = await getCloudDirectoryId(global_http_client=mock_client)
        mock_token.assert_called_once()
        mock_headers.assert_called_once()
        mock_settings.assert_called_once()
        assert response == "435345783450784728527828075870543708354"


@pytest.mark.asyncio
async def test_get_cloud_directory_id_failure():
    mock_response = MagicMock()
    mock_response.return_value = "0"
    mock_response.status_code = 400

    mock_client = AsyncMock(spec=AsyncClient)

    with (
        patch(
            "app.users.services.login.requestCloudDirectoryId",
            return_value=mock_response,
        ) as dispatcher,
        patch(
            "app.users.services.login.generate_error_response"
        ) as generate_error_response,
    ):
        await getCloudDirectoryId(global_http_client=mock_client)
        dispatcher.assert_called_once()
        generate_error_response.assert_called_once()


@pytest.mark.asyncio
async def test_signin_with_password_successfully():
    mock_response = MagicMock()
    mock_response.status_code = 200
    user_login_request_data = UserLoginRequestData(
        userName="testuser@example.com", password="frpY3wU*zm%+BL15"
    )

    with (
        patch(
            "app.users.services.login.signin_with_username_password",
            return_value=mock_response,
        ) as sign_in,
        patch("app.users.services.login.ResponseModel") as response_model,
        patch(
            "app.users.services.login.get_admin_token", new_callable=AsyncMock
        ) as mock_token,
        patch("app.users.services.create.AsyncClient") as mock_client_class,
    ):
        mock_token.return_value = "fake--token"

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client

        sign_in.json.return_value = json.dumps('{"id": "2s2e","assertion": "asdad"}')
        mock_client_class.return_value = mock_client

        await signin_with_password(user_login_request_data, mock_client)
        # If there are no problems, a ResponseModel filled with user data will be called.
        response_model.assert_called_once()


@pytest.mark.asyncio
async def test_signin_with_password_status_code_is_400():
    mock_response = MagicMock()
    mock_response.status_code = 400

    user_login_request_data = UserLoginRequestData(
        userName="testuser@example.com", password="frpY3wU*zm%+BL15"
    )

    with (
        patch(
            "app.users.services.login.signin_with_username_password",
            return_value=mock_response,
        ) as sign_in,
        patch(
            "app.users.services.login.get_admin_token", new_callable=AsyncMock
        ) as mock_token,
        patch("app.users.services.create.AsyncClient") as mock_client_class,
        patch(
            "app.users.services.login.generate_error_response"
        ) as generate_error_response,
    ):
        mock_token.return_value = "fake--token"

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client_class.return_value = mock_client

        sign_in.json.return_value = json.dumps('{"id": "2s2e","assertion": "asdad"}')
        await signin_with_password(user_login_request_data, mock_client)

        generate_error_response.assert_called_once()
