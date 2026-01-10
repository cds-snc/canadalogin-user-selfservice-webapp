"""
Unit tests for FIDO2 functionality
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from httpx import AsyncClient
from fastapi import HTTPException
from app.fido2.services import FIDO2Service
from app.fido2.schemas import FIDO2CredentialSummary, FIDO2UserResponse


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
            "fido2": {"relyingparties": [{"id": "test-uuid", "rpId": "localhost"}]}
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("app.fido2.services.get_admin_token", return_value="test-token"):
            rp_uuid = await fido2_service._get_rp_uuid_from_rp_id(
                mock_http_client, "test-token", "localhost"
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
                    mock_http_client, "test-token", "localhost"
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

    @pytest.mark.asyncio
    async def test_get_user_fido2_registrations_success(
        self, fido2_service, mock_http_client
    ):
        """Test successful FIDO2 registrations retrieval"""
        # Mock the dependencies
        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            "fido2": [
                {
                    "id": "reg-1",
                    "enabled": True,
                    "created": "2024-01-01T00:00:00Z",
                    "attributes": {
                        "nickname": "Test Device",
                        "rpId": "localhost",
                        "credentialId": "cred-1",
                    },
                }
            ]
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch.object(
            fido2_service, "_get_user_scim_id", return_value="user-scim-id"
        ), patch.object(
            fido2_service, "_get_rp_uuid_from_rp_id", return_value="rp-uuid"
        ), patch(
            "app.fido2.services.get_admin_token", return_value="test-token"
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
            assert user_response.username == "testuser"
            assert len(user_response.credentials) == 1
            assert user_response.credentials[0].id == "reg-1"

