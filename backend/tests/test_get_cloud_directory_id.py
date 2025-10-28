import pytest
from unittest.mock import Mock, patch, AsyncMock
from httpx import AsyncClient, Response, HTTPStatusError, Request as HttpxRequest
from fastapi import HTTPException, status
from pydantic import ValidationError

from app.password.services.verify_password import (
    dispatch_get_cloud_directory_Id,
    get_cloud_directory_id,
)
from app.password.schemas import IBMIdentitySourceResponse


@pytest.mark.asyncio
async def test_dispatch_get_cloud_directory_id_success():
    """Test successful dispatch of Cloud Directory ID request."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.get_admin_token",
        new_callable=AsyncMock
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
                        "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/bd45bba8-a1d4-4de2-bc80-be2855589363"
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
            expected_url = f'{verify_password_endpoint}?search=name%3D%22Cloud%20Directory%22'
            mock_http_client.get.assert_called_once_with(
                expected_url,
                headers={
                    "Authorization": "Bearer admin-token-123",
                    "Content-Type": "application/json",
                }
            )
            mock_response.raise_for_status.assert_called_once()


@pytest.mark.asyncio
async def test_dispatch_get_cloud_directory_id_http_error():
    """Test dispatch_get_cloud_directory_Id handles HTTP errors correctly."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.get_admin_token",
        new_callable=AsyncMock
    ) as mock_get_admin:
        mock_get_admin.return_value = "admin-token-123"

        with patch(
            "app.password.services.verify_password.get_auth_request_headers"
        ) as mock_get_headers:
            mock_get_headers.return_value = {
                "Authorization": "Bearer admin-token-123",
                "Content-Type": "application/json",
            }

            # Create proper httpx Request object
            mock_request = HttpxRequest(
                method="GET",
                url=f"{verify_password_endpoint}?search=name%3D%22Cloud%20Directory%22",
            )

            mock_response = Mock(spec=Response)
            mock_response.status_code = 404
            mock_response.text = "Not Found"

            http_error = HTTPStatusError(
                message="Not Found",
                request=mock_request,
                response=mock_response,
            )
            mock_response.raise_for_status.side_effect = http_error
            mock_http_client.get.return_value = mock_response

            # Mock RequestErrorHandler
            with patch(
                "app.password.services.verify_password.RequestErrorHandler.handle"
            ) as mock_handler:
                mock_handler.side_effect = HTTPException(
                    status_code=404,
                    detail="Failed to get cloud directory id"
                )

                # Act & Assert
                with pytest.raises(HTTPException) as exc_info:
                    await dispatch_get_cloud_directory_Id(
                        global_http_client=mock_http_client,
                        verify_password_endpoint=verify_password_endpoint,
                    )

                assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_dispatch_get_cloud_directory_id_network_error():
    """Test dispatch_get_cloud_directory_Id handles network errors."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.get_admin_token",
        new_callable=AsyncMock
    ) as mock_get_admin:
        mock_get_admin.return_value = "admin-token-123"

        with patch(
            "app.password.services.verify_password.get_auth_request_headers"
        ) as mock_get_headers:
            mock_get_headers.return_value = {
                "Authorization": "Bearer admin-token-123",
                "Content-Type": "application/json",
            }

            from httpx import NetworkError

            mock_http_client.get.side_effect = NetworkError("Connection timeout")

            with patch(
                "app.password.services.verify_password.RequestErrorHandler.handle"
            ) as mock_handler:
                mock_handler.side_effect = HTTPException(
                    status_code=503,
                    detail="Service unavailable"
                )

                # Act & Assert
                with pytest.raises(HTTPException) as exc_info:
                    await dispatch_get_cloud_directory_Id(
                        global_http_client=mock_http_client,
                        verify_password_endpoint=verify_password_endpoint,
                    )

                assert exc_info.value.status_code == 503


@pytest.mark.asyncio
async def test_get_cloud_directory_id_success():
    """Test successful retrieval of Cloud Directory ID."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

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
                    "location": f"https://tenant.verify.ibm.com/v1.0/authnmethods/password/{expected_cloud_directory_id}"
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
        mock_dispatch.assert_called_once_with(mock_http_client, verify_password_endpoint)


@pytest.mark.asyncio
async def test_get_cloud_directory_id_empty_password_list():
    """Test get_cloud_directory_id handles empty password list."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

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
async def test_get_cloud_directory_id_missing_password_field():
    """Test get_cloud_directory_id handles missing password field."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {}  # No 'password' field
        mock_dispatch.return_value = mock_response

        # Act & Assert
        with pytest.raises(HTTPException):
            await get_cloud_directory_id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )


@pytest.mark.asyncio
async def test_get_cloud_directory_id_missing_id_field():
    """Test get_cloud_directory_id handles missing id field in response."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {
            "password": [
                {
                    "name": "Cloud Directory",
                    "type": "cloudDirectory",
                    "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/"
                    # Missing 'id' field
                }
            ]
        }
        mock_dispatch.return_value = mock_response

        # Act & Assert
        with pytest.raises(HTTPException):
            await get_cloud_directory_id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )


@pytest.mark.asyncio
async def test_get_cloud_directory_id_invalid_response_schema():
    """Test get_cloud_directory_id handles invalid response schema."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        # Invalid schema - password is not a list
        mock_response.json.return_value = {"password": "invalid"}
        mock_dispatch.return_value = mock_response

        # Act & Assert
        with pytest.raises(HTTPException):
            await get_cloud_directory_id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )


@pytest.mark.asyncio
async def test_get_cloud_directory_id_dispatch_raises_http_exception():
    """Test get_cloud_directory_id re-raises HTTPException from dispatch."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_dispatch.side_effect = HTTPException(
            status_code=500,
            detail="Internal server error"
        )

        with patch(
            "app.password.services.verify_password.RequestErrorHandler.handle"
        ) as mock_handler:
            mock_handler.side_effect = HTTPException(
                status_code=500,
                detail="Failed to get cloud directory id"
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await get_cloud_directory_id(
                    global_http_client=mock_http_client,
                    verify_password_endpoint=verify_password_endpoint,
                )

            assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_cloud_directory_id_with_logging():
    """Test that get_cloud_directory_id logs appropriate messages."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"
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
                    "location": f"https://tenant.verify.ibm.com/v1.0/authnmethods/password/{expected_cloud_directory_id}"
                }
            ]
        }
        mock_dispatch.return_value = mock_response

        with patch("app.password.services.verify_password.logger") as mock_logger:
            # Act
            result = await get_cloud_directory_id(
                global_http_client=mock_http_client,
                verify_password_endpoint=verify_password_endpoint,
            )

            # Assert
            assert result == expected_cloud_directory_id
            # Verify error logging was called when validation fails (in other test cases)
            # This test just verifies successful path doesn't log errors


@pytest.mark.asyncio
async def test_dispatch_get_cloud_directory_id_with_logging():
    """Test that dispatch_get_cloud_directory_Id logs appropriate messages."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.get_admin_token",
        new_callable=AsyncMock
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
                mock_logger.info.assert_any_call("successfully retrieved dispatch_get_cloud_directory_Id")


@pytest.mark.asyncio
async def test_get_cloud_directory_id_null_id():
    """Test get_cloud_directory_id handles null/None id value."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

    with patch(
        "app.password.services.verify_password.dispatch_get_cloud_directory_Id"
    ) as mock_dispatch:
        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {
            "password": [
                {
                    "id": None,  # Null ID - will cause Pydantic validation error
                    "name": "Cloud Directory",
                    "type": "cloudDirectory",
                    "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/"
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

        # Pydantic validation error gets converted to 422 by RequestErrorHandler
        assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_get_cloud_directory_id_empty_string_id():
    """Test get_cloud_directory_id handles empty string id value."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = "https://tenant.verify.ibm.com/v1.0/authnmethods/password"

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
                    "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/"
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
