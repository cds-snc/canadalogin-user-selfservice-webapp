"""
Unit tests for FIDO2 helper_utils.py module
"""

import pytest
import respx
from fastapi import HTTPException
from httpx import AsyncClient, Response
from unittest.mock import Mock, patch

from app.fido2.services.helper_utils import (
    get_rp_id,
    get_tenant_url,
    get_user_profile_info,
    get_rp_uuid_from_rp_id,
    verify_registration_ownership,
)

# Test Configuration Constants
MOCK_TENANT_URL = "https://fake-tenant.verify.ibm.com"
MOCK_RP_ID = "fake-tenant.verify.ibm.com"
MOCK_RP_UUID = "rp-uuid-123"
MOCK_USER_ID = "user-123"
MOCK_ADMIN_TOKEN = "admin-token-123"
MOCK_USER_TOKEN = "user-token-123"
MOCK_REGISTRATION_ID = "reg-123"


class TestHelperUtils:
    """Test cases for helper_utils.py functions"""

    @patch("app.fido2.services.helper_utils.get_configuration")
    def test_get_rp_id(self, mock_get_config):
        """Test getting RP ID from configuration falls back to tenant URL hostname"""
        # Arrange
        mock_config = Mock()
        mock_config.ibm_verify_config.IBM_VERIFY_TENANT_URL = MOCK_TENANT_URL
        mock_config.ibm_verify_config.FIDO2_RP_ID = None
        mock_get_config.return_value = mock_config

        # Act
        result = get_rp_id()

        # Assert
        assert result == "fake-tenant.verify.ibm.com"

    @patch("app.fido2.services.helper_utils.get_configuration")
    def test_get_rp_id_uses_explicit_fido2_rp_id(self, mock_get_config):
        """Test that FIDO2_RP_ID env var overrides the tenant URL hostname"""
        # Arrange
        mock_config = Mock()
        mock_config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://auth.dev.login-connexion.alpha.canada.ca"
        )
        mock_config.ibm_verify_config.FIDO2_RP_ID = (
            "dev.login-connexion.alpha.canada.ca"
        )
        mock_get_config.return_value = mock_config

        # Act
        result = get_rp_id()

        # Assert
        assert result == "dev.login-connexion.alpha.canada.ca"

    @patch("app.fido2.services.helper_utils.get_configuration")
    def test_get_tenant_url(self, mock_get_config):
        """Test getting tenant URL from configuration"""
        # Arrange
        mock_config = Mock()
        mock_config.ibm_verify_config.IBM_VERIFY_TENANT_URL = MOCK_TENANT_URL
        mock_get_config.return_value = mock_config

        # Act
        result = get_tenant_url()

        # Assert
        assert result == MOCK_TENANT_URL

    @pytest.mark.asyncio
    @patch("app.fido2.services.helper_utils.dispatch_get_my_profile_from_ibm")
    async def test_get_user_profile_info_success(self, mock_dispatch_profile):
        """Test successful user profile retrieval"""
        # Arrange
        mock_profile = Mock()
        mock_profile.userName = "testuser@example.com"
        mock_profile.id = "user-123"
        mock_profile.name = Mock()
        mock_profile.name.givenName = "John"
        mock_profile.name.familyName = "Doe"
        mock_profile.name.formatted = None
        mock_dispatch_profile.return_value = mock_profile

        http_client = AsyncClient()

        # Act
        username, display_name, user_id = await get_user_profile_info(
            http_client, MOCK_USER_TOKEN
        )

        # Assert
        assert username == "testuser@example.com"
        assert display_name == "John Doe"
        assert user_id == "user-123"
        mock_dispatch_profile.assert_called_once_with(http_client, MOCK_USER_TOKEN)

    @pytest.mark.asyncio
    @patch("app.fido2.services.helper_utils.dispatch_get_my_profile_from_ibm")
    async def test_get_user_profile_info_formatted_name(self, mock_dispatch_profile):
        """Test user profile retrieval with formatted name"""
        # Arrange
        mock_profile = Mock()
        mock_profile.userName = "testuser@example.com"
        mock_profile.id = "user-123"
        mock_profile.name = Mock()
        mock_profile.name.givenName = None
        mock_profile.name.familyName = None
        mock_profile.name.formatted = "John Doe Jr."
        mock_dispatch_profile.return_value = mock_profile

        http_client = AsyncClient()

        # Act
        username, display_name, user_id = await get_user_profile_info(
            http_client, MOCK_USER_TOKEN
        )

        # Assert
        assert username == "testuser@example.com"
        assert display_name == "John Doe Jr."
        assert user_id == "user-123"

    @pytest.mark.asyncio
    @patch("app.fido2.services.helper_utils.dispatch_get_my_profile_from_ibm")
    async def test_get_user_profile_info_username_fallback(self, mock_dispatch_profile):
        """Test user profile retrieval falls back to username for display name"""
        # Arrange
        mock_profile = Mock()
        mock_profile.userName = "testuser@example.com"
        mock_profile.id = "user-123"
        mock_profile.name = Mock()
        mock_profile.name.givenName = None
        mock_profile.name.familyName = None
        mock_profile.name.formatted = None
        mock_dispatch_profile.return_value = mock_profile

        http_client = AsyncClient()

        # Act
        username, display_name, user_id = await get_user_profile_info(
            http_client, MOCK_USER_TOKEN
        )

        # Assert
        assert username == "testuser@example.com"
        assert display_name == "testuser@example.com"
        assert user_id == "user-123"

    @pytest.mark.asyncio
    @respx.mock
    @patch("app.fido2.services.helper_utils.get_tenant_url")
    @patch("app.fido2.services.helper_utils.get_auth_request_headers")
    async def test_get_rp_uuid_from_rp_id_success(self, mock_headers, mock_tenant_url):
        """Test successful RP UUID retrieval"""
        # Arrange
        mock_tenant_url.return_value = MOCK_TENANT_URL
        mock_headers.return_value = {"Authorization": f"Bearer {MOCK_ADMIN_TOKEN}"}

        mock_response = {
            "fido2": {
                "relyingparties": [
                    {"rpId": MOCK_RP_ID, "id": MOCK_RP_UUID},
                    {"rpId": "other.rp.com", "id": "other-uuid"},
                ]
            }
        }

        respx.get(f"{MOCK_TENANT_URL}/config/v2.0/factors/fido2/relyingparties").mock(
            return_value=Response(200, json=mock_response)
        )

        http_client = AsyncClient()

        # Act
        result = await get_rp_uuid_from_rp_id(http_client, MOCK_ADMIN_TOKEN, MOCK_RP_ID)

        # Assert
        assert result == MOCK_RP_UUID

    @pytest.mark.asyncio
    @respx.mock
    @patch("app.fido2.services.helper_utils.get_tenant_url")
    @patch("app.fido2.services.helper_utils.get_auth_request_headers")
    async def test_get_rp_uuid_from_rp_id_not_found(
        self, mock_headers, mock_tenant_url
    ):
        """Test RP UUID retrieval when RP ID not found"""
        # Arrange
        mock_tenant_url.return_value = MOCK_TENANT_URL
        mock_headers.return_value = {"Authorization": f"Bearer {MOCK_ADMIN_TOKEN}"}

        mock_response = {
            "fido2": {"relyingparties": [{"rpId": "other.rp.com", "id": "other-uuid"}]}
        }

        respx.get(f"{MOCK_TENANT_URL}/config/v2.0/factors/fido2/relyingparties").mock(
            return_value=Response(200, json=mock_response)
        )

        http_client = AsyncClient()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await get_rp_uuid_from_rp_id(http_client, MOCK_ADMIN_TOKEN, MOCK_RP_ID)

        assert exc_info.value.status_code == 404
        assert "not found" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    @respx.mock
    @patch("app.fido2.services.helper_utils.get_tenant_url")
    @patch("app.fido2.services.helper_utils.get_auth_request_headers")
    async def test_verify_registration_ownership_success(
        self, mock_headers, mock_tenant_url
    ):
        """Test successful registration ownership verification"""
        # Arrange
        mock_tenant_url.return_value = MOCK_TENANT_URL
        mock_headers.return_value = {"Authorization": f"Bearer {MOCK_ADMIN_TOKEN}"}

        mock_response = {
            "userId": MOCK_USER_ID,
            "id": MOCK_REGISTRATION_ID,
            "credentialId": "cred123",
        }

        respx.get(
            f"{MOCK_TENANT_URL}/v2.0/factors/fido2/registrations/{MOCK_REGISTRATION_ID}"
        ).mock(return_value=Response(200, json=mock_response))

        http_client = AsyncClient()

        # Act
        result = await verify_registration_ownership(
            http_client, MOCK_ADMIN_TOKEN, MOCK_REGISTRATION_ID, MOCK_USER_ID
        )

        # Assert
        assert result["userId"] == MOCK_USER_ID
        assert result["id"] == MOCK_REGISTRATION_ID

    @pytest.mark.asyncio
    @respx.mock
    @patch("app.fido2.services.helper_utils.get_tenant_url")
    @patch("app.fido2.services.helper_utils.get_auth_request_headers")
    async def test_verify_registration_ownership_forbidden(
        self, mock_headers, mock_tenant_url
    ):
        """Test registration ownership verification when user doesn't own registration"""
        # Arrange
        mock_tenant_url.return_value = MOCK_TENANT_URL
        mock_headers.return_value = {"Authorization": f"Bearer {MOCK_ADMIN_TOKEN}"}

        mock_response = {
            "userId": "different-user-id",
            "id": MOCK_REGISTRATION_ID,
            "credentialId": "cred123",
        }

        respx.get(
            f"{MOCK_TENANT_URL}/v2.0/factors/fido2/registrations/{MOCK_REGISTRATION_ID}"
        ).mock(return_value=Response(200, json=mock_response))

        http_client = AsyncClient()

        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            await verify_registration_ownership(
                http_client, MOCK_ADMIN_TOKEN, MOCK_REGISTRATION_ID, MOCK_USER_ID
            )

        assert exc_info.value.status_code == 403
        assert "Not owner of registration" in str(exc_info.value.detail)


if __name__ == "__main__":
    pytest.main([__file__])
