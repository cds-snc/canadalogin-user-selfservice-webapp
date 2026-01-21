"""
Unit tests for FIDO2 functionality
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from httpx import AsyncClient
from fastapi import HTTPException
from app.fido2.services import FIDO2Service
from app.fido2.schemas import (
    FIDO2CredentialSummary,
    FIDO2UserResponse,
    FIDO2RegistrationResponse,
    DeleteRegistrationRequest,
    UpdateRegistrationRequest,
)


class TestFIDO2Service:
    """Test cases for FIDO2Service"""

    @pytest.fixture
    def fido2_service(self):
        """Create FIDO2Service instance for testing"""
        return FIDO2Service()

    @pytest.fixture
    def mock_http_client(self):
        """Mock HTTP client"""
        return Mock(spec=AsyncClient)

    @pytest.mark.asyncio
    async def test_get_rp_uuid_from_rp_id_success(
        self, fido2_service, mock_http_client
    ):
        """Test successful RP UUID retrieval"""
        # Mock response data
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "fido2": {"relyingparties": [{"id": "test-uuid", "rpId": "test-rpid"}]}
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("app.fido2.services.get_admin_token", return_value="test-token"):
            rp_uuid = await fido2_service._get_rp_uuid_from_rp_id(
                mock_http_client, "test-token", "test-rpid"
            )
            assert rp_uuid == "test-uuid"

    @pytest.mark.asyncio
    async def test_get_rp_uuid_from_rp_id_not_found(
        self, fido2_service, mock_http_client
    ):
        """Test RP UUID retrieval when RP ID not found"""
        # Mock response data with no matching rpId
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "fido2": {"relyingparties": [{"id": "test-uuid", "rpId": "different-rp"}]}
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("app.fido2.services.get_admin_token", return_value="test-token"):
            with pytest.raises(HTTPException) as exc_info:
                await fido2_service._get_rp_uuid_from_rp_id(
                    mock_http_client, "test-token", "test-rpid"
                )
            assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_user_scim_id_success(self, fido2_service, mock_http_client):
        """Test successful user SCIM ID retrieval"""
        # Mock response data
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "totalResults": 1,
            "Resources": [{"id": "user-scim-id", "active": True}],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        user_scim_id = await fido2_service._get_user_scim_id(
            mock_http_client, "test-token", "testuser"
        )
        assert user_scim_id == "user-scim-id"

    @pytest.mark.asyncio
    async def test_get_user_scim_id_user_disabled(
        self, fido2_service, mock_http_client
    ):
        """Test user SCIM ID retrieval when user is disabled"""
        # Mock response data with disabled user
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "totalResults": 1,
            "Resources": [{"id": "user-scim-id", "active": False}],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service._get_user_scim_id(
                mock_http_client, "test-token", "testuser"
            )
        assert exc_info.value.status_code == 403

    def test_prepare_attestation_result_body(self, fido2_service):
        """Test attestation result body preparation"""
        # Test with None getClientExtensionResults
        body = {
            "id": "test-id",
            "getClientExtensionResults": None,
        }

        result = fido2_service._prepare_attestation_result_body(body)

        assert result["enabled"] is True
        assert result["getClientExtensionResults"] == {}
        assert result["id"] == "test-id"

        # Test with existing getClientExtensionResults
        body_with_extensions = {
            "id": "test-id",
            "getClientExtensionResults": {"existing": "value"},
        }

        result2 = fido2_service._prepare_attestation_result_body(body_with_extensions)

        assert result2["enabled"] is True
        assert result2["getClientExtensionResults"] == {"existing": "value"}
        assert result2["id"] == "test-id"

    @pytest.mark.asyncio
    async def test_delete_registration_success(self, fido2_service, mock_http_client):
        """Test successful registration deletion"""
        # Mock userinfo response
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {"sub": "user-id-123"}

        # Mock registration details response for ownership verification
        mock_registration_response = Mock()
        mock_registration_response.raise_for_status.return_value = None
        mock_registration_response.json.return_value = {
            "id": "reg-1",
            "userId": "user-id-123",
            "enabled": True,
        }

        # Mock delete response
        mock_delete_response = Mock()
        mock_delete_response.raise_for_status.return_value = None

        # Mock updated user response
        mock_user_response = FIDO2UserResponse(
            authenticated=True, username=None, displayName=None, credentials=[]
        )

        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)
        mock_http_client.get = AsyncMock(return_value=mock_registration_response)
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        request_data = DeleteRegistrationRequest(id="reg-1")

        with (
            patch("app.fido2.services.get_admin_token", return_value="admin-token"),
            patch.object(
                fido2_service, "get_user_response", return_value=mock_user_response
            ),
        ):
            result = await fido2_service.delete_registration(
                mock_http_client, "user-token", request_data
            )

            assert isinstance(result, FIDO2UserResponse)
            assert result.authenticated is True
            mock_http_client.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_fido2_registrations_success(
        self, fido2_service, mock_http_client
    ):
        """Test successful FIDO2 registrations retrieval"""
        # Mock userinfo response
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {"sub": "user-id-123"}

        # Mock FIDO2 registrations response
        mock_fido2_response = Mock()
        mock_fido2_response.raise_for_status.return_value = None
        mock_fido2_response.json.return_value = {
            "fido2": [
                {
                    "id": "reg-1",
                    "enabled": True,
                    "created": "2024-01-01T00:00:00Z",
                    "attributes": {
                        "nickname": "Test Device",
                        "rpId": "test-rpid",
                        "credentialId": "cred-1",
                    },
                }
            ]
        }

        # Set up the HTTP client to return different responses for different calls
        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)
        mock_http_client.get = AsyncMock(return_value=mock_fido2_response)

        with (
            patch.object(
                fido2_service, "_get_rp_uuid_from_rp_id", return_value="rp-uuid"
            ),
            patch("app.fido2.services.get_admin_token", return_value="test-token"),
        ):

            credentials = await fido2_service.get_user_fido2_registrations(
                mock_http_client, "testuser"
            )

            assert len(credentials) == 1
            assert credentials[0].id == "reg-1"
            assert credentials[0].nickname == "Test Device"
            assert credentials[0].enabled is True

    @pytest.mark.asyncio
    async def test_get_user_response_success(self, fido2_service, mock_http_client):
        """Test successful user response generation"""
        mock_credentials = [
            FIDO2CredentialSummary(
                id="reg-1", nickname="Test Device", enabled=True, credentialId="cred-1"
            )
        ]

        with patch.object(
            fido2_service, "get_user_fido2_registrations", return_value=mock_credentials
        ):
            user_response = await fido2_service.get_user_response(
                mock_http_client, "testuser"
            )

            assert isinstance(user_response, FIDO2UserResponse)
            assert user_response.authenticated is True
            assert (
                user_response.username is None
            )  # Username is intentionally None in the service implementation
            assert len(user_response.credentials) == 1
            assert user_response.credentials[0].id == "reg-1"

    @pytest.mark.asyncio
    async def test_get_user_profile_info_success(self, fido2_service, mock_http_client):
        """Test successful user profile info retrieval"""
        # Mock profile response
        mock_profile = Mock()
        mock_profile.userName = "testuser"
        mock_profile.name = Mock()
        mock_profile.name.givenName = "John"
        mock_profile.name.familyName = "Doe"

        with patch(
            "app.fido2.services.dispatch_get_my_profile_from_ibm",
            return_value=mock_profile,
        ):
            username, display_name = await fido2_service._get_user_profile_info(
                mock_http_client, "test-token"
            )

            assert username == "testuser"
            assert display_name == "John Doe"

    @pytest.mark.asyncio
    async def test_get_user_profile_info_no_name(self, fido2_service, mock_http_client):
        """Test user profile info retrieval with no name fields"""
        # Mock profile response with no name
        mock_profile = Mock()
        mock_profile.userName = "testuser"
        mock_profile.name = None

        with patch(
            "app.fido2.services.dispatch_get_my_profile_from_ibm",
            return_value=mock_profile,
        ):
            username, display_name = await fido2_service._get_user_profile_info(
                mock_http_client, "test-token"
            )

            assert username == "testuser"
            assert display_name == "testuser"  # Fallback to username

    @pytest.mark.asyncio
    async def test_get_registration_details_success(
        self, fido2_service, mock_http_client
    ):
        """Test successful registration details retrieval"""
        # Mock userinfo response
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {"sub": "user-id-123"}

        # Mock registration details response
        mock_registration_response = Mock()
        mock_registration_response.raise_for_status.return_value = None
        mock_registration_response.json.return_value = {
            "id": "reg-1",
            "userId": "user-id-123",
            "rpId": "test-rpid",
            "enabled": True,
            "created": "2024-01-01T00:00:00Z",
            "attributes": {
                "nickname": "Test Device",
                "credentialId": "cred-1",
            },
            "references": {"rpUuid": "rp-uuid-123"},
        }

        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)
        mock_http_client.get = AsyncMock(return_value=mock_registration_response)

        with patch("app.fido2.services.get_admin_token", return_value="admin-token"):
            registration = await fido2_service.get_registration_details(
                mock_http_client, "user-token", "reg-1"
            )

            assert isinstance(registration, FIDO2RegistrationResponse)
            assert registration.id == "reg-1"
            assert registration.userId == "user-id-123"
            assert registration.enabled is True
            assert registration.attributes["transactions"] == []  # Added by service

    @pytest.mark.asyncio
    async def test_get_registration_details_ownership_violation(
        self, fido2_service, mock_http_client
    ):
        """Test registration details retrieval with ownership violation"""
        # Mock userinfo response
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {"sub": "user-id-123"}

        # Mock registration details response with different user ID
        mock_registration_response = Mock()
        mock_registration_response.raise_for_status.return_value = None
        mock_registration_response.json.return_value = {
            "id": "reg-1",
            "userId": "different-user-id",
            "rpId": "test-rpid",
            "enabled": True,
            "references": {"rpUuid": "rp-uuid-123"},
            "attributes": {},
        }

        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)
        mock_http_client.get = AsyncMock(return_value=mock_registration_response)

        with patch("app.fido2.services.get_admin_token", return_value="admin-token"):
            with pytest.raises(HTTPException) as exc_info:
                await fido2_service.get_registration_details(
                    mock_http_client, "user-token", "reg-1"
                )
            assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_registration_success_with_mock_responses(
        self, fido2_service, mock_http_client
    ):
        """Test successful registration deletion with comprehensive mocked responses"""
        # Mock userinfo response
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {"sub": "user-id-123"}

        # Mock registration details response for ownership verification
        mock_registration_response = Mock()
        mock_registration_response.raise_for_status.return_value = None
        mock_registration_response.json.return_value = {
            "id": "reg-1",
            "userId": "user-id-123",
            "enabled": True,
        }

        # Mock delete response
        mock_delete_response = Mock()
        mock_delete_response.raise_for_status.return_value = None

        # Mock updated user response
        mock_user_response = FIDO2UserResponse(
            authenticated=True, username=None, displayName=None, credentials=[]
        )

        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)
        mock_http_client.get = AsyncMock(return_value=mock_registration_response)
        mock_http_client.delete = AsyncMock(return_value=mock_delete_response)

        request_data = DeleteRegistrationRequest(id="reg-1")

        with (
            patch("app.fido2.services.get_admin_token", return_value="admin-token"),
            patch.object(
                fido2_service, "get_user_response", return_value=mock_user_response
            ),
        ):
            result = await fido2_service.delete_registration(
                mock_http_client, "user-token", request_data
            )

            assert isinstance(result, FIDO2UserResponse)
            assert result.authenticated is True
            mock_http_client.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_registration_success(self, fido2_service, mock_http_client):
        """Test successful registration update"""
        # Mock userinfo response
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {"sub": "user-id-123"}

        # Mock registration details response for ownership verification
        mock_registration_response = Mock()
        mock_registration_response.raise_for_status.return_value = None
        mock_registration_response.json.return_value = {
            "id": "reg-1",
            "userId": "user-id-123",
            "enabled": True,
            "attributes": {
                "nickname": "Old Device",
                "credentialId": "cred-1",
            },
        }

        # Mock update response
        mock_update_response = Mock()
        mock_update_response.raise_for_status.return_value = None

        # Mock updated user response
        mock_user_response = FIDO2UserResponse(
            authenticated=True,
            username=None,
            displayName=None,
            credentials=[
                FIDO2CredentialSummary(
                    id="reg-1",
                    nickname="New Device",
                    enabled=False,
                    credentialId="cred-1",
                )
            ],
        )

        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)
        mock_http_client.get = AsyncMock(return_value=mock_registration_response)
        mock_http_client.put = AsyncMock(return_value=mock_update_response)

        request_data = UpdateRegistrationRequest(
            id="reg-1", nickname="New Device", enabled=False
        )

        with (
            patch("app.fido2.services.get_admin_token", return_value="admin-token"),
            patch.object(
                fido2_service, "get_user_response", return_value=mock_user_response
            ),
        ):
            result = await fido2_service.update_registration(
                mock_http_client, "user-token", request_data
            )

            assert isinstance(result, FIDO2UserResponse)
            assert result.authenticated is True
            assert len(result.credentials) == 1
            assert result.credentials[0].nickname == "New Device"
            assert result.credentials[0].enabled is False
            mock_http_client.put.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user_id_from_token_success(
        self, fido2_service, mock_http_client
    ):
        """Test successful user ID retrieval from token"""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"sub": "user-id-123"}

        mock_http_client.post = AsyncMock(return_value=mock_response)

        user_id = await fido2_service._get_user_id_from_token(
            mock_http_client, "user-token"
        )

        assert user_id == "user-id-123"

    @pytest.mark.asyncio
    async def test_get_user_id_from_token_missing_sub(
        self, fido2_service, mock_http_client
    ):
        """Test user ID retrieval when sub field is missing"""
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {}  # Missing 'sub' field

        mock_http_client.post = AsyncMock(return_value=mock_response)

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service._get_user_id_from_token(mock_http_client, "user-token")
        assert exc_info.value.status_code == 400

    def test_prepare_attestation_result_body_comprehensive(self, fido2_service):
        """Test comprehensive attestation result body preparation scenarios"""
        # Test with None getClientExtensionResults
        body = {
            "id": "test-id",
            "getClientExtensionResults": None,
        }

        result = fido2_service._prepare_attestation_result_body(body)

        assert result["enabled"] is True
        assert result["getClientExtensionResults"] == {}
        assert result["id"] == "test-id"

        # Test with existing getClientExtensionResults
        body_with_extensions = {
            "id": "test-id",
            "getClientExtensionResults": {"existing": "value"},
        }

        result2 = fido2_service._prepare_attestation_result_body(body_with_extensions)

        assert result2["enabled"] is True
        assert result2["getClientExtensionResults"] == {"existing": "value"}
        assert result2["id"] == "test-id"

    @pytest.mark.asyncio
    async def test_get_user_fido2_registrations_missing_user_id(
        self, fido2_service, mock_http_client
    ):
        """Test FIDO2 registrations retrieval when user ID is missing from userinfo"""
        # Mock userinfo response with missing 'sub'
        mock_userinfo_response = Mock()
        mock_userinfo_response.raise_for_status.return_value = None
        mock_userinfo_response.json.return_value = {}  # Missing 'sub' field

        mock_http_client.post = AsyncMock(return_value=mock_userinfo_response)

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service.get_user_fido2_registrations(
                mock_http_client, "testuser"
            )
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_get_user_response_error_handling(
        self, fido2_service, mock_http_client
    ):
        """Test error handling in get_user_response"""
        with patch.object(
            fido2_service,
            "get_user_fido2_registrations",
            side_effect=HTTPException(500, "Test error"),
        ):
            with pytest.raises(HTTPException):
                await fido2_service.get_user_response(mock_http_client, "testuser")

    @pytest.mark.asyncio
    async def test_get_user_scim_id_no_results(self, fido2_service, mock_http_client):
        """Test user SCIM ID retrieval when no user found"""
        # Mock response data with no results
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "totalResults": 0,
            "Resources": [],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service._get_user_scim_id(
                mock_http_client, "test-token", "nonexistentuser"
            )
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_user_scim_id_with_user_token_success(
        self, fido2_service, mock_http_client
    ):
        """Test successful user SCIM ID retrieval with user token"""
        # Mock response data
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "totalResults": 1,
            "Resources": [{"id": "user-scim-id", "active": True}],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        user_scim_id = await fido2_service._get_user_scim_id_with_user_token(
            mock_http_client, "user-token", "testuser"
        )
        assert user_scim_id == "user-scim-id"

    @pytest.mark.asyncio
    async def test_get_user_scim_id_with_user_token_disabled(
        self, fido2_service, mock_http_client
    ):
        """Test user SCIM ID retrieval with user token when user is disabled"""
        # Mock response data with disabled user
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "totalResults": 1,
            "Resources": [{"id": "user-scim-id", "active": False}],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service._get_user_scim_id_with_user_token(
                mock_http_client, "user-token", "testuser"
            )
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_get_user_scim_id_with_user_token_no_results(
        self, fido2_service, mock_http_client
    ):
        """Test user SCIM ID retrieval with user token when no user found"""
        # Mock response data with no results
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "totalResults": 0,
            "Resources": [],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service._get_user_scim_id_with_user_token(
                mock_http_client, "user-token", "nonexistentuser"
            )
        assert exc_info.value.status_code == 404

    @pytest.mark.asyncio
    async def test_get_user_profile_info_partial_name(
        self, fido2_service, mock_http_client
    ):
        """Test user profile info retrieval with partial name fields"""
        # Mock profile response with only given name
        mock_profile = Mock()
        mock_profile.userName = "testuser"
        mock_profile.name = Mock()
        mock_profile.name.givenName = "John"
        mock_profile.name.familyName = None
        mock_profile.name.formatted = None

        with patch(
            "app.fido2.services.dispatch_get_my_profile_from_ibm",
            return_value=mock_profile,
        ):
            username, display_name = await fido2_service._get_user_profile_info(
                mock_http_client, "test-token"
            )

            assert username == "testuser"
            assert display_name == "John"

    @pytest.mark.asyncio
    async def test_get_user_profile_info_family_name_only(
        self, fido2_service, mock_http_client
    ):
        """Test user profile info retrieval with only family name"""
        # Mock profile response with only family name
        mock_profile = Mock()
        mock_profile.userName = "testuser"
        mock_profile.name = Mock()
        mock_profile.name.givenName = None
        mock_profile.name.familyName = "Doe"
        mock_profile.name.formatted = None

        with patch(
            "app.fido2.services.dispatch_get_my_profile_from_ibm",
            return_value=mock_profile,
        ):
            username, display_name = await fido2_service._get_user_profile_info(
                mock_http_client, "test-token"
            )

            assert username == "testuser"
            assert display_name == "Doe"

    @pytest.mark.asyncio
    async def test_get_user_profile_info_empty_names(
        self, fido2_service, mock_http_client
    ):
        """Test user profile info retrieval with empty name fields"""
        # Mock profile response with empty name fields
        mock_profile = Mock()
        mock_profile.userName = "testuser"
        mock_profile.name = Mock()
        mock_profile.name.givenName = ""
        mock_profile.name.familyName = ""
        mock_profile.name.formatted = None

        with patch(
            "app.fido2.services.dispatch_get_my_profile_from_ibm",
            return_value=mock_profile,
        ):
            username, display_name = await fido2_service._get_user_profile_info(
                mock_http_client, "test-token"
            )

            assert username == "testuser"
            assert display_name == "testuser"  # Fallback to username

    @pytest.mark.asyncio
    async def test_validate_authentication_valid(self, fido2_service):
        """Test authentication validation with valid data"""
        request_body = {"username": "testuser"}

        # This should not raise any exception
        await fido2_service._validate_authentication(
            user_id="user-123",
            request_body=request_body,
            validate_username=True,
            allow_empty_username=False,
        )

    @pytest.mark.asyncio
    async def test_validate_authentication_missing_user_id(self, fido2_service):
        """Test authentication validation with missing user ID"""
        request_body = {"username": "testuser"}

        with pytest.raises(HTTPException) as exc_info:
            await fido2_service._validate_authentication(
                user_id=None,
                request_body=request_body,
                validate_username=True,
                allow_empty_username=False,
            )
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_validate_authentication_empty_username_allowed(self, fido2_service):
        """Test authentication validation with empty username when allowed"""
        request_body = {"username": ""}

        # This should not raise any exception
        await fido2_service._validate_authentication(
            user_id=None,
            request_body=request_body,
            validate_username=True,
            allow_empty_username=True,
        )

    @pytest.mark.asyncio
    async def test_prepare_request_body_attestation_options(
        self, fido2_service, mock_http_client
    ):
        """Test request body preparation for attestation options"""
        with patch.object(
            fido2_service,
            "_get_user_profile_info",
            return_value=("testuser", "John Doe"),
        ):
            result = await fido2_service._prepare_request_body(
                mock_http_client,
                "user-token",
                "/fido2/attestation/options",
                {"challenge": "test-challenge"},
                "user-123",
            )

            assert result["displayName"] == "John Doe"
            assert result["challenge"] == "test-challenge"
            assert result["userId"] == "user-123"
            assert "username" not in result  # Username gets replaced with userId

    @pytest.mark.asyncio
    async def test_prepare_request_body_assertion_options(
        self, fido2_service, mock_http_client
    ):
        """Test request body preparation for assertion options"""
        with patch.object(
            fido2_service,
            "_get_user_profile_info",
            return_value=("testuser", "John Doe"),
        ):
            result = await fido2_service._prepare_request_body(
                mock_http_client,
                "user-token",
                "/fido2/assertion/options",
                {"challenge": "test-challenge", "attestation": "none"},
                "user-123",
            )

            assert result["challenge"] == "test-challenge"
            assert "attestation" not in result  # Should be removed
            assert result["userId"] == "user-123"
            assert "username" not in result  # Username gets replaced with userId

    @pytest.mark.asyncio
    async def test_prepare_request_body_attestation_result(
        self, fido2_service, mock_http_client
    ):
        """Test request body preparation for attestation result"""
        result = await fido2_service._prepare_request_body(
            mock_http_client,
            "user-token",
            "/fido2/attestation/result",
            {"username": "testuser", "credential": "test"},
            "user-123",
        )

        assert result["enabled"] is True
        assert result["getClientExtensionResults"] == {}
        assert result["credential"] == "test"
        assert "username" not in result  # Username gets deleted
        assert "userId" not in result  # And userId is NOT added for attestation/result

    def test_handle_error_response_success_false(self, fido2_service):
        """Test error response handling with success: false format"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.headers = {"content-type": "application/json"}
        mock_response.text = '{"success": false, "message": "Test error message"}'
        mock_response.json.return_value = {
            "success": False,
            "message": "Test error message",
        }

        result = fido2_service._handle_error_response(mock_response)

        # The actual implementation returns errorMessage/status format
        assert "status" in result
        assert result["status"] == "failed"
        assert "errorMessage" in result
        assert result["errorMessage"] == "Test error message"

    def test_handle_error_response_error_format(self, fido2_service):
        """Test error response handling with error object format"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.headers = {"content-type": "application/json"}
        mock_response.text = (
            '{"error": {"messageId": "INVALID_REQUEST", "message": "Bad request"}}'
        )
        mock_response.json.return_value = {
            "error": {"messageId": "INVALID_REQUEST", "message": "Bad request"}
        }

        result = fido2_service._handle_error_response(mock_response)

        # The actual implementation returns errorMessage with messageId format
        assert "status" in result
        assert result["status"] == "failed"
        assert "errorMessage" in result
        assert "INVALID_REQUEST:" in result["errorMessage"]

    def test_handle_error_response_json_parse_error(self, fido2_service):
        """Test error response handling when JSON parsing fails"""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.headers = {"content-type": "text/html"}
        mock_response.text = "<html>Internal Server Error</html>"
        mock_response.json.side_effect = ValueError("Invalid JSON")

        result = fido2_service._handle_error_response(mock_response)

        # The actual implementation returns errorMessage and status
        assert "errorMessage" in result
        assert "status" in result
        assert result["status"] == "failed"

    @pytest.mark.asyncio
    async def test_proxy_fido2_request_success(self, fido2_service, mock_http_client):
        """Test successful FIDO2 proxy request"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {"success": True, "data": "test-result"}

        mock_http_client.post = AsyncMock(return_value=mock_response)
        mock_http_client.get = AsyncMock(return_value=mock_response)

        # Mock the get RP response for _get_rp_uuid_from_rp_id
        rp_response = Mock()
        rp_response.status_code = 200
        rp_response.raise_for_status.return_value = None
        rp_response.json.return_value = {
            "relyingparties": [{"rpId": "test-rpid", "id": "test-rp-uuid"}]
        }
        mock_http_client.get = AsyncMock(return_value=rp_response)

        with (
            patch.object(
                fido2_service, "_get_user_id_from_token", return_value="user-123"
            ),
            patch("app.fido2.services.get_admin_token", return_value="admin-token"),
        ):
            result = await fido2_service.proxy_fido2_request(
                mock_http_client,
                "user-token",
                "/assertion/result",  # Use assertion/result to avoid profile fetching
                {"challenge": "test"},
            )

            assert result["success"] is True
            assert result["data"] == "test-result"

    @pytest.mark.asyncio
    async def test_proxy_fido2_request_error(self, fido2_service, mock_http_client):
        """Test FIDO2 proxy request with error response"""
        from httpx import HTTPStatusError

        # Mock RP response first (successful)
        rp_response = Mock()
        rp_response.status_code = 200
        rp_response.raise_for_status.return_value = None
        rp_response.json.return_value = {
            "relyingparties": [{"rpId": "test-rpid", "id": "test-rp-uuid"}]
        }

        # Mock error response for the actual proxy request
        error_response = Mock()
        error_response.status_code = 400
        error_response.headers = {"content-type": "application/json"}
        error_response.text = '{"success": false, "message": "Invalid data"}'
        error_response.json.return_value = {"success": False, "message": "Invalid data"}

        # Mock the HTTPStatusError properly
        http_error = HTTPStatusError(
            "400 Bad Request", request=Mock(), response=error_response
        )

        # Setup mock responses: first call (GET for RP) succeeds, second call (POST) fails
        mock_http_client.get = AsyncMock(return_value=rp_response)
        mock_http_client.post = AsyncMock(side_effect=http_error)

        with (
            patch.object(
                fido2_service, "_get_user_id_from_token", return_value="user-123"
            ),
            patch("app.fido2.services.get_admin_token", return_value="admin-token"),
        ):
            result = await fido2_service.proxy_fido2_request(
                mock_http_client,
                "user-token",
                "/assertion/result",  # Use assertion/result to avoid profile fetching
                {"challenge": "test"},
            )

            # Should return the error response from _handle_error_response
            assert "status" in result
            assert result["status"] == "failed"

    @pytest.mark.asyncio
    async def test_validate_fido2_login_success(self, fido2_service, mock_http_client):
        """Test successful FIDO2 login validation"""
        # Mock RP response for _get_rp_uuid_from_rp_id
        rp_response = Mock()
        rp_response.status_code = 200
        rp_response.raise_for_status.return_value = None
        rp_response.json.return_value = {
            "relyingparties": [{"rpId": "test-rpid", "id": "test-rp-uuid"}]
        }

        # Mock assertion result proxy response
        mock_assertion_response = {"success": True, "userId": "user-123"}

        # Mock user response
        mock_user_response = FIDO2UserResponse(
            authenticated=True,
            username="testuser",
            displayName="Test User",
            credentials=[
                FIDO2CredentialSummary(
                    id="reg-1", nickname="Device", enabled=True, credentialId="cred-1"
                )
            ],
        )

        # Setup mock HTTP responses
        assertion_response = Mock()
        assertion_response.status_code = 200
        assertion_response.json.return_value = mock_assertion_response

        # Mock SCIM user response
        scim_user_response = Mock()
        scim_user_response.status_code = 200
        scim_user_response.raise_for_status.return_value = None
        scim_user_response.json.return_value = {
            "totalResults": 1,
            "Resources": [
                {
                    "userName": "testuser",
                    "active": True,
                    "name": {"formatted": "Test User"},
                }
            ],
        }

        # Mock responses: get for RP lookup, post for assertion request, get for SCIM user lookup
        def mock_get_response(url, **kwargs):
            if "/v2.0/Users" in url:
                return scim_user_response
            else:  # RP lookup
                return rp_response

        def mock_post_response(url, **kwargs):
            return assertion_response

        mock_http_client.get = AsyncMock(side_effect=mock_get_response)
        mock_http_client.post = AsyncMock(side_effect=mock_post_response)

        with (
            patch("app.fido2.services.get_admin_token", return_value="admin-token"),
            patch(
                "app.fido2.services.dispatch_get_my_profile_from_ibm"
            ) as mock_profile,
            patch.object(
                fido2_service,
                "get_user_response",
                return_value=mock_user_response,
            ),
        ):
            # Setup profile mock
            profile_mock = Mock()
            profile_mock.userName = "testuser"
            profile_mock.name = Mock()
            profile_mock.name.givenName = "Test"
            profile_mock.name.familyName = "User"
            profile_mock.name.formatted = None
            mock_profile.return_value = profile_mock

            result = await fido2_service.validate_fido2_login(
                mock_http_client, {"assertion": "test-assertion"}
            )

            assert isinstance(result, FIDO2UserResponse)
            assert result.authenticated is True

    @pytest.mark.asyncio
    async def test_validate_fido2_login_assertion_failed(
        self, fido2_service, mock_http_client
    ):
        """Test FIDO2 login validation when assertion fails"""
        # Mock RP response for _get_rp_uuid_from_rp_id
        rp_response = Mock()
        rp_response.status_code = 200
        rp_response.raise_for_status.return_value = None
        rp_response.json.return_value = {
            "relyingparties": [{"rpId": "test-rpid", "id": "test-rp-uuid"}]
        }

        # Mock failed assertion result
        assertion_response = Mock()
        assertion_response.status_code = 200
        assertion_response.json.return_value = {
            "success": False,
            "message": "Invalid assertion",
        }

        # Setup mock responses
        mock_http_client.get = AsyncMock(return_value=rp_response)
        mock_http_client.post = AsyncMock(return_value=assertion_response)

        with (patch("app.fido2.services.get_admin_token", return_value="admin-token"),):
            with pytest.raises(HTTPException) as exc_info:
                await fido2_service.validate_fido2_login(
                    mock_http_client, {"assertion": "test-assertion"}
                )
            assert exc_info.value.status_code == 400  # 400 for invalid assertion result
