from unittest.mock import patch, AsyncMock, MagicMock
import pytest
from httpx import AsyncClient
from app.users.services.login import requestCloudDirectoryId
from fastapi import HTTPException

@pytest.mark.asyncio
async def test_request_cloud_directory_id_success():

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "success": True,
        "message": "Successfully signed in",
        "data": {
            "id": "771001FN6K",
            "assertion": "eyJhbGciOiJSUzI1NiIsImtpZCI6InNlcnZlciJ9"
        }
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
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_request_cloud_directory_id_raises_http_exception():

    with (
        patch("app.users.services.create.get_admin_token", new_callable=AsyncMock),
        patch("app.users.services.create.get_auth_request_headers") as mock_headers,
        patch("app.users.services.create.get_settings") as mock_settings,
        patch("app.users.services.create.AsyncClient") as mock_client_class,
    ):

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.side_effect = Exception("Connection error")
        mock_client_class.return_value = mock_client

        with pytest.raises(Exception) as exc_info:
            await requestCloudDirectoryId(global_http_client=mock_client)

        assert exc_info.value
        # assert "Signup error: Connection error" in str(exc_info.value.detail)