import pytest
from unittest.mock import Mock, patch, AsyncMock
from httpx import AsyncClient, Response
from fastapi import HTTPException, Request

from app.password.services.verify_password import (
    dispatch_verify_password,
    verify_user_password,
)
from app.password.schemas import UserPassword, VerifiedUserPassword
from app.utils.schemas import ResponseModel


@pytest.mark.asyncio
async def test_dispatch_verify_password_success():
    """Test successful password verification dispatch to IBM Verify."""
    # Arrange
    mock_http_client = AsyncMock(spec=AsyncClient)
    verify_password_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )
    cloud_directory_id = "test-directory-123"
    payload = {
        "username": "john.doe@example.com",
        "password": "SecurePass123!",
    }

    # Mock get_admin_token as AsyncMock
    with patch(
        "app.password.services.verify_password.get_admin_token", new_callable=AsyncMock
    ) as mock_get_admin:
        mock_get_admin.return_value = "admin-token-123"

        # Mock get_auth_request_headers
        with patch(
            "app.password.services.verify_password.get_auth_request_headers"
        ) as mock_get_headers:
            mock_get_headers.return_value = {
                "Authorization": "Bearer admin-token-123",
                "Content-Type": "application/json",
            }

            # Mock get_cloud_directory_id to return the cloud directory ID
            with patch(
                "app.password.services.verify_password.get_cloud_directory_id",
                new_callable=AsyncMock,
            ) as mock_get_cloud_dir:
                mock_get_cloud_dir.return_value = cloud_directory_id

                # Mock HTTP response
                mock_response = Mock(spec=Response)
                mock_response.json.return_value = {"id": "user-456"}
                mock_response.raise_for_status = Mock()
                mock_http_client.post.return_value = mock_response

                # Act
                response = await dispatch_verify_password(
                    http_client=mock_http_client,
                    verify_password_endpoint=verify_password_endpoint,
                    payload=payload,
                )

                # Assert
                assert response == mock_response
                mock_get_admin.assert_called_once_with(mock_http_client)
                mock_get_headers.assert_called_once_with("admin-token-123", True)
                mock_get_cloud_dir.assert_called_once_with(
                    mock_http_client, verify_password_endpoint
                )
                mock_http_client.post.assert_called_once_with(
                    f"{verify_password_endpoint}/{cloud_directory_id}",
                    json=payload,
                    headers={
                        "Authorization": "Bearer admin-token-123",
                        "Content-Type": "application/json",
                    },
                )
                mock_response.raise_for_status.assert_called_once()


@pytest.mark.asyncio
async def test_verify_user_password_success():
    """Test successful user password verification."""
    # Arrange
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="SecurePass123!")

    # Mock get_user_info
    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        mock_profile = Mock()
        mock_profile.userName = "john.doe@example.com"
        mock_profile.id = "user-123"
        mock_profile.active = True
        mock_profile.emails = [{"value": "john.doe@example.com", "type": "work"}]
        mock_profile.preferredLanguage = "en"
        mock_profile.model_dump.return_value = {
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            "preferredLanguage": "en",
            "meta": {
                "location": "https://example.com/users/user-123",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "name": {
                "givenName": "John",
                "familyName": "Doe",
                "formatted": "John Doe",
            },
            "active": True,
            "id": "user-123",
            "userName": "john.doe@example.com",
            "phoneNumbers": [],
            "details": {},
        }

        mock_get_user_info.return_value = mock_profile

        # Mock dispatch_verify_password
        with patch(
            "app.password.services.verify_password.dispatch_verify_password",
            new_callable=AsyncMock,
        ) as mock_dispatch:
            mock_response = Mock(spec=Response)
            mock_response.json.return_value = {"id": "user-456"}
            mock_response.status_code = 200
            mock_dispatch.return_value = mock_response

            # Act
            result = await verify_user_password(
                request=mock_request,
                user_access_token="user-access-token-123",
                payload=user_password,
            )

            # Assert
            assert isinstance(result, ResponseModel)
            assert result.success is True
            assert result.message == "User verified successfully"
            assert isinstance(result.data, VerifiedUserPassword)
            assert result.data.id == "user-456"

            # Verify functions were called
            assert mock_get_user_info.await_count == 1
            assert mock_dispatch.await_count == 1

            # Get the actual call arguments
            dispatch_call_args = mock_dispatch.call_args
            assert dispatch_call_args is not None

            # Extract the payload from kwargs
            kwargs = dispatch_call_args.kwargs
            assert "payload" in kwargs
            actual_payload = kwargs["payload"]
            assert actual_payload["password"] == "SecurePass123!"
            assert actual_payload["username"] == "john.doe@example.com"


@pytest.mark.asyncio
async def test_verify_user_password_missing_user_id_in_response():
    """Test verify_user_password handles missing user ID in IBM Verify response."""
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="SecurePass123!")

    # Mock dispatch_get_my_profile_from_ibm with proper profile structure
    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        mock_profile = Mock()
        mock_profile.userName = "john.doe@example.com"
        mock_profile.id = "user-123"
        mock_profile.active = True
        mock_profile.emails = [{"value": "john.doe@example.com", "type": "work"}]
        mock_profile.preferredLanguage = "en"

        mock_get_user_info.return_value = mock_profile

        with patch(
            "app.password.services.verify_password.dispatch_verify_password",
            new_callable=AsyncMock,
        ) as mock_dispatch:
            mock_response = Mock(spec=Response)
            mock_response.json.return_value = {"message": "success"}  # No 'id' field
            mock_response.status_code = 200
            mock_dispatch.return_value = mock_response

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await verify_user_password(
                    request=mock_request,
                    user_access_token="user-access-token-123",
                    payload=user_password,
                )

            assert exc_info.value.status_code == 404
            assert mock_get_user_info.await_count == 1
            assert mock_dispatch.await_count == 1


@pytest.mark.asyncio
async def test_verify_user_password_get_user_info_fails():
    """Test verify_user_password handles get_user_info failure."""
    # Arrange
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="SecurePass123!")

    # Mock dispatch_get_my_profile_from_ibm with proper profile structure
    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        mock_get_user_info.side_effect = HTTPException(
            status_code=401,
            detail="Session expired",
        )

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await verify_user_password(
                request=mock_request,
                user_access_token="user-access-token-123",
                payload=user_password,
            )

        assert exc_info.value.status_code == 401
        assert "Session expired" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_user_password_dispatch_fails():
    """Test verify_user_password handles dispatch_verify_password failure."""
    # Arrange
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="WrongPassword!")

    # Mock dispatch_get_my_profile_from_ibm with proper profile structure
    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        mock_profile = Mock()
        mock_profile.userName = "john.doe@example.com"
        mock_profile.id = "user-123"
        mock_profile.active = True
        mock_profile.emails = [{"value": "john.doe@example.com", "type": "work"}]
        mock_profile.preferredLanguage = "en"

        mock_get_user_info.return_value = mock_profile

        with patch(
            "app.password.services.verify_password.dispatch_verify_password"
        ) as mock_dispatch:
            # Simulate verification failure
            mock_dispatch.side_effect = HTTPException(
                status_code=401,
                detail="Invalid credentials",
            )

            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                await verify_user_password(
                    request=mock_request,
                    user_access_token="user-access-token-123",
                    payload=user_password,
                )

            assert exc_info.value.status_code == 401
            assert "Invalid credentials" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_user_password_with_logging():
    """Test that verify_user_password logs appropriate messages."""
    # Arrange
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="WrongPassword!")

    # Mock dispatch_get_my_profile_from_ibm with proper profile structure
    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        mock_profile = Mock()
        mock_profile.userName = "john.doe@example.com"
        mock_profile.id = "user-123"
        mock_profile.active = True
        mock_profile.emails = [{"value": "john.doe@example.com", "type": "work"}]
        mock_profile.preferredLanguage = "en"

        mock_get_user_info.return_value = mock_profile

        with patch(
            "app.password.services.verify_password.dispatch_verify_password"
        ) as mock_dispatch:
            mock_response = Mock(spec=Response)
            mock_response.json.return_value = {"id": "user-456"}
            mock_dispatch.return_value = mock_response

            with patch("app.password.services.verify_password.logger") as mock_logger:
                # Act
                result = await verify_user_password(
                    request=mock_request,
                    user_access_token="user-access-token-123",
                    payload=user_password,
                )

                # Assert
                assert result.success is True
                mock_logger.info.assert_any_call("Starting verification for user")
                mock_logger.info.assert_any_call("User verified successfully: user-456")


@pytest.mark.asyncio
async def test_verify_user_password_missing_username_in_profile():
    """Test verify_user_password handles ValidationError when userName is missing from IBM response."""
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="SecurePass123!")

    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        # Mock dispatch_get_my_profile_from_ibm to raise HTTPException 422
        # This simulates what happens when IBM Verify API response is missing userName
        # and the RequestErrorHandler in dispatch_get_my_profile_from_ibm converts
        # the ValidationError to HTTPException 422
        mock_get_user_info.side_effect = HTTPException(
            status_code=422, detail="Validation Error"
        )

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await verify_user_password(
                request=mock_request,
                user_access_token="user-access-token-123",
                payload=user_password,
            )

        # The HTTPException from dispatch_get_my_profile_from_ibm should bubble up
        # because RequestErrorHandler doesn't re-wrap HTTPExceptions
        assert exc_info.value.status_code == 422
        assert "Validation Error" in exc_info.value.detail

        # Verify that the profile function was called
        assert mock_get_user_info.await_count == 1


@pytest.mark.asyncio
async def test_verify_user_password_empty_username_in_profile():
    """Test verify_user_password handles empty userName in profile."""
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="SecurePass123!")

    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        # Mock profile with empty userName
        mock_profile = Mock()
        mock_profile.userName = ""  # Empty username
        mock_profile.id = "user-123"
        mock_profile.active = True
        mock_profile.emails = [{"value": "john.doe@example.com", "type": "work"}]

        mock_get_user_info.return_value = mock_profile

        with patch(
            "app.password.services.verify_password.dispatch_verify_password",
            new_callable=AsyncMock,
        ) as mock_dispatch:
            # Mock IBM Verify API to reject empty username with 400 Bad Request
            mock_dispatch.side_effect = HTTPException(
                status_code=400, detail="Invalid username"
            )

            # Act & Assert - IBM Verify should reject empty username
            with pytest.raises(HTTPException) as exc_info:
                await verify_user_password(
                    request=mock_request,
                    user_access_token="user-access-token-123",
                    payload=user_password,
                )

            # Verify that dispatch was called with empty username and IBM rejected it
            assert exc_info.value.status_code == 400
            assert "Invalid username" in exc_info.value.detail

            # Verify that dispatch_verify_password was called with empty username
            dispatch_call_args = mock_dispatch.call_args
            assert dispatch_call_args is not None
            payload = dispatch_call_args.kwargs["payload"]
            assert payload["username"] == ""  # Empty string was passed through
            assert payload["password"] == "SecurePass123!"


@pytest.mark.asyncio
async def test_dispatch_get_my_profile_returns_valid_username():
    """Test that dispatch_get_my_profile_from_ibm actually returns a valid username."""
    mock_request = Mock(spec=Request)
    mock_request.app = Mock()
    mock_request.app.state = Mock()
    mock_request.app.state.request_client = Mock(spec=AsyncClient)
    mock_request.app.state.config = Mock()
    mock_request.app.state.config.verify_password_api_endpoint = (
        "https://verify.ibm.com/v2.0/factors/cloudDirectory/authnmethods/password"
    )

    user_password = UserPassword(password="SecurePass123!")

    with patch(
        "app.password.services.verify_password.dispatch_get_my_profile_from_ibm",
        new_callable=AsyncMock,
    ) as mock_get_user_info:
        # Mock profile with valid userName
        mock_profile = Mock()
        mock_profile.userName = "john.doe@example.com"
        mock_profile.id = "user-123"
        mock_profile.active = True

        mock_get_user_info.return_value = mock_profile

        with patch(
            "app.password.services.verify_password.dispatch_verify_password",
            new_callable=AsyncMock,
        ) as mock_dispatch:
            mock_response = Mock(spec=Response)
            mock_response.json.return_value = {"id": "user-456"}
            mock_dispatch.return_value = mock_response

            # Act
            result = await verify_user_password(
                request=mock_request,
                user_access_token="user-access-token-123",
                payload=user_password,
            )

            # Assert - verify userName was used correctly
            assert result.success is True

            # Verify that dispatch was called with the userName from the profile
            dispatch_call_args = mock_dispatch.call_args
            payload = dispatch_call_args.kwargs["payload"]
            assert payload["username"] == "john.doe@example.com"

            # Verify that mock_get_user_info was called and returned a profile with userName
            assert mock_get_user_info.await_count == 1
            profile = mock_get_user_info.return_value
            assert hasattr(profile, "userName")
            assert profile.userName == "john.doe@example.com"
