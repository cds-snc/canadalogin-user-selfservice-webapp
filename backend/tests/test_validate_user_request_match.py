import pytest
from unittest.mock import patch
from fastapi import HTTPException, status

from app.utils.validate_user_request_match import validate_user_request_match


class TestValidateUserRequestMatch:
    """Test cases for validate_user_request_match function."""

    def test_valid_user_match_passes(self):
        """Test that validation passes when user IDs match."""
        current_user_profile = {
            "id": "user123",
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
        }
        request_user_id = "user123"

        # Should not raise any exception
        validate_user_request_match(current_user_profile, request_user_id)

    def test_user_mismatch_raises_403(self):
        """Test that mismatched user IDs raise 403 Forbidden."""
        current_user_profile = {"id": "user123", "userName": "john.doe@example.com"}
        request_user_id = "user456"

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    def test_missing_profile_id_raises_400(self):
        """Test that missing profile ID raises 400 Bad Request."""
        current_user_profile = {
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            # Missing 'id' field
        }
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    def test_empty_profile_id_raises_400(self):
        """Test that empty profile ID raises 400 Bad Request."""
        current_user_profile = {
            "id": "",  # Empty string
            "userName": "john.doe@example.com",
        }
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    def test_none_profile_id_raises_400(self):
        """Test that None profile ID raises 400 Bad Request."""
        current_user_profile = {"id": None, "userName": "john.doe@example.com"}
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    def test_missing_request_user_id_raises_400(self):
        """Test that missing request user ID raises 400 Bad Request."""
        current_user_profile = {"id": "user123", "userName": "john.doe@example.com"}
        request_user_id = None

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    def test_empty_request_user_id_raises_400(self):
        """Test that empty request user ID raises 400 Bad Request."""
        current_user_profile = {"id": "user123", "userName": "john.doe@example.com"}
        request_user_id = ""

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    def test_invalid_profile_type_raises_400(self):
        """Test that invalid profile type raises 400 Bad Request."""
        invalid_profiles = ["invalid_string", 123, ["list", "not", "dict"], None, True]
        request_user_id = "user123"

        for invalid_profile in invalid_profiles:
            with pytest.raises(HTTPException) as exc_info:
                validate_user_request_match(invalid_profile, request_user_id)

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert exc_info.value.detail == "7"

    def test_empty_profile_dict_raises_400(self):
        """Test that empty profile dictionary raises 400 Bad Request."""
        current_user_profile = {}
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "7"

    def test_case_sensitive_user_id_comparison(self):
        """Test that user ID comparison is case-sensitive."""
        current_user_profile = {"id": "User123", "userName": "john.doe@example.com"}
        request_user_id = "user123"  # Different case

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    def test_whitespace_in_user_ids(self):
        """Test that whitespace in user IDs is not automatically trimmed."""
        current_user_profile = {"id": " user123 ", "userName": "john.doe@example.com"}
        request_user_id = "user123"

        with pytest.raises(HTTPException) as exc_info:
            validate_user_request_match(current_user_profile, request_user_id)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert exc_info.value.detail == "7"

    def test_special_characters_in_user_ids(self):
        """Test that special characters in user IDs are handled correctly."""
        special_user_id = "user@domain.com-123_456"
        current_user_profile = {
            "id": special_user_id,
            "userName": "john.doe@example.com",
        }
        request_user_id = special_user_id

        # Should not raise any exception
        validate_user_request_match(current_user_profile, request_user_id)
