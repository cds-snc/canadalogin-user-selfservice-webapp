import pytest
from fastapi import HTTPException, status
from unittest.mock import Mock, patch, AsyncMock

from app.utils.validate_user_request_match import validate_user_id_matches_session


class TestValidateUserRequestMatch:
    """Test cases for validate_user_id_matches_session function."""

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_valid_user_match_passes(self, mock_get_user_info):
        """Test that validation passes when user IDs match."""
        # Mock the get_user_info response
        mock_get_user_info.return_value = {
            "uid": "user123",
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
        }

        mock_request = Mock()
        request_user_id = "user123"

        # Should not raise any exception
        await validate_user_id_matches_session(mock_request, request_user_id)

        # Verify get_user_info was called with the request
        mock_get_user_info.assert_called_once_with(mock_request)

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_user_mismatch_raises_403(self, mock_get_user_info):
        """Test that mismatched user IDs raise 403 Forbidden."""
        mock_get_user_info.return_value = {
            "uid": "user123",
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = "user456"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_missing_profile_uid_raises_400(self, mock_get_user_info):
        """Test that missing profile UID raises 400 Bad Request."""
        mock_get_user_info.return_value = {
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            # Missing 'uid' field
        }

        mock_request = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_empty_profile_uid_raises_400(self, mock_get_user_info):
        """Test that empty profile UID raises 400 Bad Request."""
        mock_get_user_info.return_value = {
            "uid": "",  # Empty string
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_none_profile_uid_raises_400(self, mock_get_user_info):
        """Test that None profile UID raises 400 Bad Request."""
        mock_get_user_info.return_value = {
            "uid": None,
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_missing_request_user_id_raises_400(self, mock_get_user_info):
        """Test that missing request user ID raises 400 Bad Request."""
        mock_get_user_info.return_value = {
            "uid": "user123",
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = None

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_empty_request_user_id_raises_400(self, mock_get_user_info):
        """Test that empty request user ID raises 400 Bad Request."""
        mock_get_user_info.return_value = {
            "uid": "user123",
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = ""

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_invalid_profile_type_raises_400(self, mock_get_user_info):
        """Test that invalid profile type raises 400 Bad Request."""
        invalid_profiles = ["invalid_string", 123, ["list", "not", "dict"], None, True]
        request_user_id = "user123"

        for invalid_profile in invalid_profiles:
            mock_get_user_info.return_value = invalid_profile
            mock_request = Mock()

            with pytest.raises(HTTPException) as exc_info:
                await validate_user_id_matches_session(mock_request, request_user_id)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_empty_profile_dict_raises_400(self, mock_get_user_info):
        """Test that empty profile dictionary raises 400 Bad Request."""
        mock_get_user_info.return_value = {}

        mock_request = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_case_sensitive_user_id_comparison(self, mock_get_user_info):
        """Test that user ID comparison is case-sensitive."""
        mock_get_user_info.return_value = {
            "uid": "User123",
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = "user123"  # Different case

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_whitespace_in_user_ids(self, mock_get_user_info):
        """Test that whitespace in user IDs is not automatically trimmed."""
        mock_get_user_info.return_value = {
            "uid": " user123 ",
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_special_characters_in_user_ids(self, mock_get_user_info):
        """Test that special characters in user IDs are handled correctly."""
        special_user_id = "user@domain.com-123_456"
        mock_get_user_info.return_value = {
            "uid": special_user_id,
            "userName": "john.doe@example.com",
        }

        mock_request = Mock()
        request_user_id = special_user_id

        # Should not raise any exception
        await validate_user_id_matches_session(mock_request, request_user_id)

    @pytest.mark.asyncio
    @patch(
        "app.utils.validate_user_request_match.get_user_info", new_callable=AsyncMock
    )
    async def test_get_user_info_exception_propagates(self, mock_get_user_info):
        """Test that exceptions from get_user_info are propagated."""
        mock_get_user_info.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

        mock_request = Mock()
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            await validate_user_id_matches_session(mock_request, request_user_id)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Invalid token"
