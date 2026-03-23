import pytest
from unittest.mock import Mock, patch, AsyncMock
from httpx import AsyncClient, Response
from fastapi import HTTPException, status

from app.password.services.verify_password import (
    dispatch_get_cloud_directory_Id,
    get_cloud_directory_id,
)


@pytest.mark.asyncio
async def test_dispatch_get_cloud_directory_id_success():
    """Test successful dispatch of Cloud Directory ID request."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = (
        "https://tenant.verify.ibm.com/v1.0/authnmethods/password"
    )

    with patch(
        "app.password.services.verify_password.get_admin_token", new_callable=AsyncMock
    ) as mock_get_admin:
        mock_get_admin.return_value = "admin-token-123"

        with patch(
            "app.password.services.verify_password.get_auth_request_headers"
        ) as mock_get_headers:
            mock_get_headers.return_value = {
                "Authorization": "Bearer admin-token-123",
                "Content-Type": "application/json",
            }

            # Mock successful response
            mock_response = Mock(spec=Response)
            mock_response.json.return_value = {
                "password": [
                    {
                        "id": "bd45bba8-a1d4-4de2-bc80-be2855589363",
                        "name": "Cloud Directory",
                        "type": "cloudDirectory",
                        "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/bd45bba8-a1d4-4de2-bc80-be2855589363",
                    }
                ]
            }
            mock_response.raise_for_status = Mock()
            mock_http_client.get.return_value = mock_response

            # Act
            response = await dispatch_get_cloud_directory_Id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )

            # Assert
            assert response == mock_response
            mock_get_admin.assert_called_once_with(mock_http_client)
            mock_get_headers.assert_called_once_with("admin-token-123", True)

            # Verify the search query is properly encoded
            expected_url = (
                f"{verify_password_endpoint}?search=name%3D%22Cloud%20Directory%22"
            )
            mock_http_client.get.assert_called_once_with(
                expected_url,
                headers={
                    "Authorization": "Bearer admin-token-123",
                    "Content-Type": "application/json",
                },
            )
            mock_response.raise_for_status.assert_called_once()


@pytest.mark.asyncio
async def test_get_cloud_directory_id_success():
    """Test successful retrieval of Cloud Directory ID."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = (
        "https://tenant.verify.ibm.com/v1.0/authnmethods/password"
    )

    expected_cloud_directory_id = "bd45bba8-a1d4-4de2-bc80-be2855589363"

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {
            "password": [
                {
                    "id": expected_cloud_directory_id,
                    "name": "Cloud Directory",
                    "type": "cloudDirectory",
                    "location": f"https://tenant.verify.ibm.com/v1.0/authnmethods/password/{expected_cloud_directory_id}",
                }
            ]
        }
        mock_dispatch.return_value = mock_response

        # Act
        result = await get_cloud_directory_id(
            global_http_client=mock_http_client,
            verify_password_endpoint=verify_password_endpoint,
        )

        # Assert
        assert result == expected_cloud_directory_id
        mock_dispatch.assert_called_once_with(
            mock_http_client, verify_password_endpoint
        )


@pytest.mark.asyncio
async def test_get_cloud_directory_id_empty_password_list():
    """Test get_cloud_directory_id handles empty password list."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = (
        "https://tenant.verify.ibm.com/v1.0/authnmethods/password"
    )

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {"password": []}
        mock_dispatch.return_value = mock_response

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_cloud_directory_id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Bad Request" in exc_info.value.detail


@pytest.mark.asyncio
async def test_dispatch_get_cloud_directory_id_with_logging():
    """Test that dispatch_get_cloud_directory_Id logs appropriate messages."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = (
        "https://tenant.verify.ibm.com/v1.0/authnmethods/password"
    )

    with patch(
        "app.password.services.verify_password.get_admin_token", new_callable=AsyncMock
    ) as mock_get_admin:
        mock_get_admin.return_value = "admin-token-123"

        with patch(
            "app.password.services.verify_password.get_auth_request_headers"
        ) as mock_get_headers:
            mock_get_headers.return_value = {
                "Authorization": "Bearer admin-token-123",
                "Content-Type": "application/json",
            }

            mock_response = Mock(spec=Response)
            mock_response.json.return_value = {"password": []}
            mock_response.raise_for_status = Mock()
            mock_http_client.get.return_value = mock_response

            with patch("app.password.services.verify_password.logger") as mock_logger:
                # Act
                await dispatch_get_cloud_directory_Id(
                    global_http_client=mock_http_client,
                    verify_password_endpoint=verify_password_endpoint,
                )

                # Assert
                mock_logger.info.assert_any_call("Request returned")
                mock_logger.info.assert_any_call(
                    "successfully retrieved dispatch_get_cloud_directory_Id"
                )


@pytest.mark.asyncio
async def test_get_cloud_directory_id_empty_string_id():
    """Test get_cloud_directory_id handles empty string id value."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = (
        "https://tenant.verify.ibm.com/v1.0/authnmethods/password"
    )

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {
            "password": [
                {
                    "id": "",  # Empty string - passes Pydantic but should fail business logic
                    "name": "Cloud Directory",
                    "type": "cloudDirectory",
                    "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/",
                }
            ]
        }
        mock_dispatch.return_value = mock_response

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_cloud_directory_id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )

        # Empty string triggers your null check, raising 404
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert "Bad Request" in exc_info.value.detail
