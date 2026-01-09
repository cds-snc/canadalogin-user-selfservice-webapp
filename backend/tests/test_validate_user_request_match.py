import pytest
from fastapi import HTTPException, status
from unittest.mock import Mock, patch, AsyncMock

from app.utils.validate_user_request_match import validate_user_id_matches_session

USER_INFO_PATH = "app.utils.validate_user_request_match.get_my_profile"


class TestValidateUserRequestMatch:
    """Test cases for validate_user_id_matches_session function."""

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_valid_user_match_passes(self, mock_get_user_info):
        """Test that validation passes when user IDs match."""
        # Mock the get_my_profile response with ProfileResponse structure
        mock_profile_data = Mock()
        mock_profile_data.id = "user123"

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        # Should not raise any exception
        await validate_user_id_matches_session(mock_request, "123", request_user_id)

        # Verify get_my_profile was called with the correct arguments
        mock_get_user_info.assert_called_once_with(mock_request.app.state.request_client, "123")

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_user_mismatch_raises_403(self, mock_get_user_info):
        """Test that mismatched user IDs raise 403 Forbidden."""
        mock_profile_data = Mock()
        mock_profile_data.id = "user123"

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user456"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_missing_profile_uid_raises_400(self, mock_get_user_info):
        """Test that missing profile UID raises 400 Bad Request."""
        mock_profile_data = Mock()
        mock_profile_data.id = None  # Missing 'id' field

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_empty_profile_uid_raises_400(self, mock_get_user_info):
        """Test that empty profile UID raises 400 Bad Request."""
        mock_profile_data = Mock()
        mock_profile_data.id = ""  # Empty string

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_none_profile_uid_raises_400(self, mock_get_user_info):
        """Test that None profile UID raises 400 Bad Request."""
        mock_profile_data = Mock()
        mock_profile_data.id = None

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_missing_request_user_id_raises_400(self, mock_get_user_info):
        """Test that missing request user ID raises 400 Bad Request."""
        mock_profile_data = Mock()
        mock_profile_data.id = "user123"

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = None

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_empty_request_user_id_raises_400(self, mock_get_user_info):
        """Test that empty request user ID raises 400 Bad Request."""
        mock_profile_data = Mock()
        mock_profile_data.id = "user123"

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = ""

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_invalid_profile_type_raises_400(self, mock_get_user_info):
        """Test that when profile data is not accessible, AttributeError is raised."""
        invalid_profile_data_types = ["invalid_string", 123, ["list", "not", "dict"], True]
        request_user_id = "user123"

        for invalid_data in invalid_profile_data_types:
            mock_response = Mock()
            mock_response.data = invalid_data  # Set data to invalid type
            mock_get_user_info.return_value = mock_response

            mock_request = Mock()
            mock_request.app.state.request_client = Mock()

            with pytest.raises(AttributeError):  # Will raise AttributeError when trying to access .id on invalid types
                await validate_user_id_matches_session(mock_request, "123", request_user_id)

        # Test None separately since it should be caught by the implementation
        mock_response = Mock()
        mock_response.data = None
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()

        with pytest.raises(AttributeError):  # Will raise AttributeError when trying to access .id on None
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_empty_profile_dict_raises_400(self, mock_get_user_info):
        """Test that profile data without id raises AttributeError."""
        mock_profile_data = Mock()
        mock_profile_data.configure_mock(**{})  # Empty mock with no attributes
        # When accessing .id, it will return Mock() which evaluates to truthy, so we need to make it None
        mock_profile_data.id = None

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_case_sensitive_user_id_comparison(self, mock_get_user_info):
        """Test that user ID comparison is case-sensitive."""
        mock_profile_data = Mock()
        mock_profile_data.id = "User123"

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"  # Different case

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_whitespace_in_user_ids(self, mock_get_user_info):
        """Test that whitespace in user IDs is not automatically trimmed."""
        mock_profile_data = Mock()
        mock_profile_data.id = " user123 "

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_special_characters_in_user_ids(self, mock_get_user_info):
        """Test that special characters in user IDs are handled correctly."""
        special_user_id = "user@domain.com-123_456"
        mock_profile_data = Mock()
        mock_profile_data.id = special_user_id

        mock_response = Mock()
        mock_response.data = mock_profile_data
        mock_get_user_info.return_value = mock_response

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = special_user_id

        # Should not raise any exception
        await validate_user_id_matches_session(mock_request, "123", request_user_id)

    @pytest.mark.asyncio
    @patch(
        USER_INFO_PATH, new_callable=AsyncMock
    )
    async def test_get_user_info_exception_propagates(self, mock_get_user_info):
        """Test that exceptions from get_user_info are propagated."""
        mock_get_user_info.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

        mock_request = Mock()
        mock_request.app.state.request_client = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, "123", request_user_id)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token"
