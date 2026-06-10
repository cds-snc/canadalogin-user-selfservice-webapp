import pytest
import importlib
import time
import json

from unittest.mock import AsyncMock, Mock, MagicMock, patch
from types import SimpleNamespace

from httpx import HTTPStatusError, AsyncClient, Response, Request, NetworkError

from fastapi import status, HTTPException
from fastapi.testclient import TestClient
from starlette.middleware.base import BaseHTTPMiddleware
from starsessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuthError

from app.auth.services.auth_user_session import (
    get_users_current_session,
    get_user_info,
    get_user_id_token,
)
from app.users.schemas import IBMVerifyUserProfileSchema

from app.otp.schemas import OtpType

delete_mfa_otp_module = importlib.import_module("app.otp.services.delete_mfa_otp")
enroll_mfa_otp_module = importlib.import_module("app.otp.services.enroll_mfa_otp")
send_mfa_otp_module = importlib.import_module("app.otp.services.send_mfa_otp")
verify_mfa_otp_module = importlib.import_module("app.otp.services.verify_mfa_otp")
retrieve_transient_otp_module = importlib.import_module(
    "app.otp.services.retrieve_transient_otp"
)
send_transient_otp_module = importlib.import_module(
    "app.otp.services.send_transient_otp"
)
verify_transient_otp_module = importlib.import_module(
    "app.otp.services.verify_transient_otp"
)
otp_router = importlib.import_module("app.otp.v1_router")

verify_password_module = importlib.import_module(
    "app.password.services.verify_password"
)
stepup_module = importlib.import_module("app.password.services.verify_password_stepup")

get_my_profile_module = importlib.import_module("app.users.services.get_my_profile")
update_my_profile_module = importlib.import_module(
    "app.users.services.update_my_profile"
)
otp_factors_module = importlib.import_module("app.users.services.otp_factors")
update_profile_with_otp = importlib.import_module(
    "app.users.services.update_profile_with_otp"
)
rp_info_module = importlib.import_module("app.users.services.rp_info")
user_router = importlib.import_module("app.users.v1_router")

add_fido2_registration_module = importlib.import_module(
    "app.fido2.services.add_fido2_registration"
)
authenticate_fido2_registration_module = importlib.import_module(
    "app.fido2.services.authenticate_fido2_registration"
)
delete_fido2_registration_module = importlib.import_module(
    "app.fido2.services.delete_fido2_registration"
)
get_fido2_registration_details_module = importlib.import_module(
    "app.fido2.services.get_registration_details"
)
get_fido2_registrations_module = importlib.import_module(
    "app.fido2.services.get_fido2_registrations"
)
update_fido2_registrations_module = importlib.import_module(
    "app.fido2.services.update_fido2_registration"
)

auth_user_session_module = importlib.import_module(
    "app.auth.services.auth_user_session"
)
auth_logout_module = importlib.import_module("app.auth.services.auth_logout")
auth_module = importlib.import_module("app.auth.services.auth")


# region Mocks (Middleware/Fixtures)
class MockSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, session_data: dict):
        super().__init__(app)
        self.session_data = session_data

    async def dispatch(self, request, call_next):
        # Create a mock object for the session_handler
        class MockHandler:
            def __init__(self, data):
                self.data = data
                self.loaded = True

            async def load(self):
                return self.data

            async def save(self):
                pass

        # Define your mock data
        mock_data = self.session_data

        # Inject both keys that starsessions utilities look for
        request.scope["session"] = mock_data
        request.scope["session_handler"] = MockHandler(mock_data)

        response = await call_next(request)
        return response


@pytest.fixture
def mock_test_client():

    clients_to_close = []

    def _make_client(request_client, session_data={}, disable_overrides=False):
        from app.main import create_app

        app = create_app()

        if not disable_overrides:
            """A factory fixture to create a TestClient with custom state."""
            app.dependency_overrides[get_user_info] = lambda: MagicMock()
            app.dependency_overrides[get_users_current_session] = lambda: MagicMock()
            app.dependency_overrides[get_user_id_token] = lambda: MagicMock()

        # remove existing session middleware
        app.user_middleware = [
            m for m in app.user_middleware if m.cls != SessionMiddleware
        ]
        app.state.request_client = request_client
        app.state.config = SimpleNamespace(
            verify_password_api_endpoint="", rp_user_applications_api_endpoint=""
        )

        # add mock session middleware
        app.add_middleware(MockSessionMiddleware, session_data=session_data)
        app.middleware_stack = app.build_middleware_stack()

        client = TestClient(app, raise_server_exceptions=False)
        clients_to_close.append(client)
        return client

    yield _make_client


# endregion


# region /v1/otp/mfa/delete
class TestErrorHandlingDeleteMfaOtp:

    @pytest.mark.asyncio
    @patch.object(delete_mfa_otp_module, "get_my_profile")
    @patch.object(delete_mfa_otp_module, "verify_otp_before_operation")
    async def test_verify_otp_before_operation_unexpected_exception(
        self,
        mock_verify_otp_before_operation,
        mock_get_my_profile,
        mock_test_client,
        caplog,
    ):
        mock_get_my_profile.return_value = MagicMock()
        mock_verify_otp_before_operation.side_effect = ValueError(
            "Unexpected error occurred"
        )

        deletion_request = {
            "id": "factor123",
            "otpType": OtpType.SMS,
            "otp": "123456",
            "trxnId": "txn123",
            "otpVerificationType": OtpType.SMS,
        }
        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/otp/mfa/delete", json=deletion_request)
        response_json = response.json()
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Unexpected error occurred" in caplog.text

    @pytest.mark.asyncio
    @patch.object(delete_mfa_otp_module, "get_my_profile")
    @patch.object(delete_mfa_otp_module, "verify_otp_before_operation")
    @patch.object(delete_mfa_otp_module, "assert_remaining_mfa_factor_after_deletion")
    @patch.object(delete_mfa_otp_module, "dispatch_otp_deletion")
    async def test_handle_otp_deletion_exception(
        self,
        mock_dispatch_otp_deletion,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_verify_otp_before_operation,
        mock_get_my_profile,
        mock_test_client,
        caplog,
    ):
        mock_get_my_profile.return_value = MagicMock()
        mock_verify_otp_before_operation.return_value = None
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None
        mock_dispatch_otp_deletion.side_effect = Exception("Network error")

        deletion_request = {
            "id": "factor123",
            "otpType": OtpType.SMS,
            "otp": "123456",
            "trxnId": "txn123",
            "otpVerificationType": OtpType.SMS,
        }
        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/otp/mfa/delete", json=deletion_request)
        response_json = response.json()
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Network error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(delete_mfa_otp_module, "get_my_profile")
    @patch.object(delete_mfa_otp_module, "verify_otp_before_operation")
    @patch.object(delete_mfa_otp_module, "assert_remaining_mfa_factor_after_deletion")
    async def test_dispatch_otp_deletion_unsupported_type(
        self,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_verify_otp_before_operation,
        mock_get_my_profile,
        mock_test_client,
    ):
        mock_get_my_profile.return_value = MagicMock()
        mock_verify_otp_before_operation.return_value = None
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None

        deletion_request = {
            "id": "factor123",
            "otpType": OtpType.EMAIL,
            "otp": "123456",
            "trxnId": "txn123",
            "otpVerificationType": OtpType.EMAIL,
        }

        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/otp/mfa/delete", json=deletion_request)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "Unsupported OTP type: OtpType.EMAIL"

    @pytest.mark.asyncio
    @patch.object(delete_mfa_otp_module, "get_my_profile")
    @patch.object(delete_mfa_otp_module, "verify_otp_before_operation")
    @patch.object(delete_mfa_otp_module, "assert_remaining_mfa_factor_after_deletion")
    @patch.object(delete_mfa_otp_module, "get_auth_request_headers")
    @patch.object(delete_mfa_otp_module, "get_configuration")
    async def test_dispatch_otp_deletion_http_error(
        self,
        mock_get_configuration,
        mock_get_auth_request_headers,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_verify_otp_before_operation,
        mock_get_my_profile,
        mock_test_client,
    ):
        mock_get_my_profile.return_value = MagicMock()
        mock_verify_otp_before_operation.return_value = None
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None
        mock_get_auth_request_headers.side_effect = (
            lambda token, _content_type, _language=None, **kwargs: {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        )

        def mock_get_configuration_return_value():
            config = Mock()
            config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                "https://test.verify.ibm.com"
            )
            return config

        mock_get_configuration.side_effect = mock_get_configuration_return_value

        # Mock HTTP client to raise HTTPStatusError
        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Mock()
        mock_request.url = "https://test.verify.ibm.com/v2.0/factors/smsotp/factor123"
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.request = mock_request
        mock_response.json = MagicMock(return_value={"messageId": "test123"})

        mock_client.delete.side_effect = HTTPStatusError(
            "Not found", request=mock_request, response=mock_response
        )

        deletion_request = {
            "id": "factor123",
            "otpType": OtpType.SMS,
            "otp": "123456",
            "trxnId": "txn123",
            "otpVerificationType": OtpType.SMS,
        }

        client = mock_test_client(mock_client)

        response = client.request("DELETE", "/v1/otp/mfa/delete", json=deletion_request)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"

    @pytest.mark.asyncio
    @patch.object(delete_mfa_otp_module, "get_my_profile")
    @patch.object(delete_mfa_otp_module, "verify_otp_before_operation")
    @patch.object(delete_mfa_otp_module, "assert_remaining_mfa_factor_after_deletion")
    @patch.object(delete_mfa_otp_module, "dispatch_otp_deletion")
    async def test_handle_otp_deletion_unexpected_status(
        self,
        mock_dispatch_otp_deletion,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_verify_otp_before_operation,
        mock_get_my_profile,
        mock_test_client,
    ):
        mock_get_my_profile.return_value = MagicMock()
        mock_verify_otp_before_operation.return_value = None
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None

        def mock_dispatch_otp_deletion_return_value(
            client, request, user_token, language=None
        ):
            mock_response = Mock(spec=Response)
            mock_response.status_code = 200  # Unexpected status for deletion
            return mock_response

        mock_dispatch_otp_deletion.side_effect = mock_dispatch_otp_deletion_return_value

        deletion_request = {
            "id": "factor123",
            "otpType": OtpType.SMS,
            "otp": "123456",
            "trxnId": "txn123",
            "otpVerificationType": OtpType.SMS,
        }

        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/otp/mfa/delete", json=deletion_request)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 200."
        )

    @pytest.mark.asyncio
    @patch.object(delete_mfa_otp_module, "get_my_profile")
    @patch.object(delete_mfa_otp_module, "verify_otp_before_operation")
    @patch.object(delete_mfa_otp_module, "assert_remaining_mfa_factor_after_deletion")
    @patch.object(delete_mfa_otp_module, "get_auth_request_headers")
    @patch.object(delete_mfa_otp_module, "get_configuration")
    async def test_dispatch_otp_deletion_generic_exception(
        self,
        mock_get_configuration,
        mock_get_auth_request_headers,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_verify_otp_before_operation,
        mock_get_my_profile,
        mock_test_client,
        caplog,
    ):
        mock_get_my_profile.return_value = MagicMock()
        mock_verify_otp_before_operation.return_value = None
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None
        mock_get_auth_request_headers.side_effect = (
            lambda token, _content_type, _language=None, **kwargs: {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        )

        def mock_get_configuration_return_value():
            config = Mock()
            config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                "https://test.verify.ibm.com"
            )
            return config

        mock_get_configuration.side_effect = mock_get_configuration_return_value

        # Mock HTTP client to raise generic exception
        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.delete.side_effect = Exception("Connection timeout")

        deletion_request = {
            "id": "factor123",
            "otpType": OtpType.SMS,
            "otp": "123456",
            "trxnId": "txn123",
            "otpVerificationType": OtpType.SMS,
        }

        client = mock_test_client(mock_client)

        response = client.request("DELETE", "/v1/otp/mfa/delete", json=deletion_request)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Connection timeout" in caplog.text


# endregion


# region /v1/fido2/attestation/options
class TestErrorHandlingFido2AttestationOptions:

    @pytest.mark.asyncio
    @patch.object(add_fido2_registration_module, "get_admin_token")
    @patch.object(add_fido2_registration_module, "get_rp_id")
    @patch.object(add_fido2_registration_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_test_client,
        caplog,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = Exception("Token service error")

        attestation_options = {}

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/attestation/options", json=attestation_options
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Token service error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(add_fido2_registration_module, "get_auth_request_headers")
    @patch.object(add_fido2_registration_module, "get_user_profile_info")
    @patch.object(add_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_fido2_registration_module, "get_admin_token")
    @patch.object(add_fido2_registration_module, "get_rp_id")
    @patch.object(add_fido2_registration_module, "get_tenant_url")
    async def test_handles_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_test_client,
    ):
        """Should handle HTTP error from API"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("POST", "https://example.com")
        mock_response = Response(400, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Bad Request", request=mock_request, response=mock_response
        )
        mock_client.post = AsyncMock(return_value=mock_response_obj)

        attestation_options = {}

        client = mock_test_client(mock_client)

        response = client.request(
            "POST", "/v1/fido2/attestation/options", json=attestation_options
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"

    @pytest.mark.asyncio
    @patch.object(add_fido2_registration_module, "get_user_profile_info")
    @patch.object(add_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_fido2_registration_module, "get_admin_token")
    @patch.object(add_fido2_registration_module, "get_rp_id")
    @patch.object(add_fido2_registration_module, "get_tenant_url")
    async def test_handles_user_profile_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_test_client,
        caplog,
    ):
        """Should handle error when getting user profile fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.side_effect = Exception("Profile fetch error")

        attestation_options = {}

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/attestation/options", json=attestation_options
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Profile fetch error" in caplog.text


# endregion


# region /v1/fido2/attestation/result
class TestErrorHandlingFido2AttestationResults:

    @pytest.mark.asyncio
    @patch.object(add_fido2_registration_module, "get_admin_token")
    @patch.object(add_fido2_registration_module, "get_rp_id")
    @patch.object(add_fido2_registration_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_test_client,
        caplog,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = Exception("Token service error")

        request_data = {
            "id": "credential-id",
            "rawId": "raw-credential-id",
            "type": "credential-type",
            "response": {},
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/attestation/result", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Token service error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(add_fido2_registration_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(add_fido2_registration_module, "get_auth_request_headers")
    @patch.object(add_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(add_fido2_registration_module, "get_admin_token")
    @patch.object(add_fido2_registration_module, "get_rp_id")
    @patch.object(add_fido2_registration_module, "get_tenant_url")
    async def test_handles_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        """Should handle HTTP error from API"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }
        mock_profile = MagicMock()
        mock_profile.preferredLanguage = "en"
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_profile

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("POST", "https://example.com")
        mock_response = Response(400, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Bad Request", request=mock_request, response=mock_response
        )
        mock_client.post = AsyncMock(return_value=mock_response_obj)

        request_data = {
            "id": "credential-id",
            "rawId": "raw-credential-id",
            "type": "credential-type",
            "response": {},
        }

        client = mock_test_client(mock_client)

        response = client.request(
            "POST", "/v1/fido2/attestation/result", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"


class TestErrorHandlingFido2AssertionOptions:

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_test_client,
        caplog,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = Exception("Token service error")

        assertion_options = {}

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/assertion/options", json=assertion_options
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Token service error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_user_profile_info")
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_user_profile_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_test_client,
        caplog,
    ):
        """Should handle error when getting user profile fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.side_effect = Exception("Profile fetch error")

        assertion_options = {}

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/assertion/options", json=assertion_options
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Profile fetch error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_auth_request_headers")
    @patch.object(authenticate_fido2_registration_module, "get_user_profile_info")
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_user_profile_info,
        mock_get_auth_request_headers,
        mock_test_client,
    ):
        """Should handle HTTP error from API"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-id-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("POST", "https://example.com")
        mock_response = Response(400, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Bad Request", request=mock_request, response=mock_response
        )
        mock_client.post = AsyncMock(return_value=mock_response_obj)

        assertion_options = {}

        client = mock_test_client(mock_client)

        response = client.request(
            "POST", "/v1/fido2/assertion/options", json=assertion_options
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"


# endregion


# region /v1/fido2/assertion/result
class TestErrorHandlingFido2SubmitAssertionResult:

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_auth_request_headers")
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_return_jwt_true_without_stepup_token_raises(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_test_client,
        caplog,
    ):
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/assertion/result?return_jwt=True", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Step-up authentication required" in caplog.text

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "_is_token_expired")
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_return_jwt_true_with_expired_token_raises_exception(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_is_token_expired,
        mock_test_client,
        caplog,
    ):
        """Should raise exception when stepup token has expired"""

        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_is_token_expired.return_value = True  # Token is expired

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(
            MagicMock(),
            {
                "stepup_token_data": {
                    "access_token": "access-token-123",
                    "refresh_token": "refresh-token-123",
                    "grant_id": "grant-id-123",
                    "expires_in": 3600,
                },
                "stepup_token_timestamp": time.time() - 4000,  # Expired
            },
        )

        response = client.request(
            "POST", "/v1/fido2/assertion/result?return_jwt=True", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert (
            "Step-up token expired: Please call POST /v1/password/verify/stepup again."
            in caplog.text
        )

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_test_client,
        caplog,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.side_effect = Exception("Token service error")

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/assertion/result", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Token service error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_generic_exception(
        self, mock_get_tenant_url, mock_get_rp_id, mock_test_client, caplog
    ):
        """Should handle any generic exception and call error handler"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.side_effect = Exception("Unexpected error")

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/fido2/assertion/result", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Unexpected error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "get_auth_request_headers")
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_test_client,
    ):
        """Should handle HTTP error from API"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request_obj = Request("POST", "https://example.com")
        mock_response = Response(401, request=mock_request_obj)
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Unauthorized", request=mock_request_obj, response=mock_response
        )
        mock_client.post = AsyncMock(return_value=mock_response_obj)

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(mock_client)

        response = client.request(
            "POST", "/v1/fido2/assertion/result", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 401."
        )

    @pytest.mark.asyncio
    @patch.object(authenticate_fido2_registration_module, "_get_mfa_challenge_token")
    @patch.object(authenticate_fido2_registration_module, "get_auth_request_headers")
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_handles_token_exchange_http_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        _get_mfa_challenge_token,
        mock_test_client,
        caplog,
    ):
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token"
        }
        _get_mfa_challenge_token.return_value = "token"

        """Should handle HTTP errors during token exchange"""
        mock_client = AsyncMock(spec=AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid grant"

        http_error = HTTPStatusError(
            "400 Bad Request",
            request=MagicMock(spec=Request),
            response=mock_response,
        )
        mock_client.post = AsyncMock(
            side_effect=[
                Response(
                    200,
                    content=json.dumps({"assertion": "token"}),
                    request=MagicMock(spec=Request),
                ),
                http_error,
            ]
        )

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(mock_client)

        response = client.request(
            "POST", "/v1/fido2/assertion/result?return_jwt=True", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert response_json["success"]
        assert "Error exchanging FIDO2 JWT for combined token" in caplog.text

    @pytest.mark.asyncio
    @patch.object(
        authenticate_fido2_registration_module, "_perform_mfa_refresh_token_flow"
    )
    @patch.object(authenticate_fido2_registration_module, "get_rp_uuid_from_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_admin_token")
    @patch.object(authenticate_fido2_registration_module, "get_rp_id")
    @patch.object(authenticate_fido2_registration_module, "get_tenant_url")
    async def test_mfa_refresh_failure_wraps_exception(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        _perform_mfa_refresh_token_flow,
        mock_test_client,
        caplog,
    ):
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_admin_token.return_value = "admin-token"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"

        _perform_mfa_refresh_token_flow.side_effect = Exception("Network error")

        request_data = {
            "id": "credential-id",
            "rawId": "raw-id",
            "type": "public-key",
            "response": {
                "authenticatorData": "auth-data",
                "clientDataJSON": "client-data",
                "signature": "signature",
            },
        }

        client = mock_test_client(
            MagicMock(),
            {
                "stepup_token_data": {
                    "access_token": "access-token-123",
                    "refresh_token": "refresh-token-123",
                    "grant_id": "grant-id-123",
                    "expires_in": 3600,
                },
                "stepup_token_timestamp": time.time() + 5000,
            },
        )

        response = client.request(
            "POST", "/v1/fido2/assertion/result?return_jwt=True", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Network error" in caplog.text


# endregion


# region /v1/fido2/registration
class TestErrorHandlingFido2DeleteRegistration:

    @pytest.mark.asyncio
    @patch.object(delete_fido2_registration_module, "submit_assertion_result")
    @patch.object(delete_fido2_registration_module, "get_user_profile_info")
    @patch.object(delete_fido2_registration_module, "get_tenant_url")
    async def test_handles_get_user_profile_error(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_submit_assertion_result,
        mock_test_client,
    ):
        """Should handle error when getting user profile from token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

        request_data = {
            "id": "credential-id",
            "assertionResult": {
                "response": {
                    "clientDataJSON": "client-data-json",
                    "authenticatorData": "authenticator-data",
                    "signature": "signature",
                },
                "id": "",
                "rawId": "",
                "type": "",
            },
        }

        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not response_json["success"]
        assert response_json["message"] == "Invalid token"

    @pytest.mark.asyncio
    @patch.object(delete_fido2_registration_module, "submit_assertion_result")
    @patch.object(delete_fido2_registration_module, "verify_registration_ownership")
    @patch.object(delete_fido2_registration_module, "get_user_profile_info")
    @patch.object(delete_fido2_registration_module, "get_tenant_url")
    async def test_handles_ownership_verification_failure(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_submit_assertion_result,
        mock_test_client,
    ):
        """Should handle error when registration ownership verification fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_verify_registration_ownership.side_effect = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this registration",
        )

        request_data = {
            "id": "credential-id",
            "assertionResult": {
                "response": {
                    "clientDataJSON": "client-data-json",
                    "authenticatorData": "authenticator-data",
                    "signature": "signature",
                },
                "id": "",
                "rawId": "",
                "type": "",
            },
        }

        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not response_json["success"]
        assert response_json["message"] == "User does not own this registration"

    @pytest.mark.asyncio
    @patch.object(delete_fido2_registration_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(delete_fido2_registration_module, "submit_assertion_result")
    @patch.object(delete_fido2_registration_module, "get_auth_request_headers")
    @patch.object(
        delete_fido2_registration_module, "assert_remaining_mfa_factor_after_deletion"
    )
    @patch.object(delete_fido2_registration_module, "verify_registration_ownership")
    @patch.object(delete_fido2_registration_module, "get_user_profile_info")
    @patch.object(delete_fido2_registration_module, "get_tenant_url")
    async def test_handles_http_delete_error(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        """Should handle error when HTTP delete request fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None
        mock_profile = MagicMock()
        mock_profile.preferredLanguage = "en"
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_profile

        # Simulate HTTP error on delete
        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request(
            "DELETE",
            "https://tenant.verify.ibm.com/v2.0/factors/fido2/registrations/reg-123",
        )
        mock_response = Response(404, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        mock_delete_response = MagicMock()
        mock_delete_response.raise_for_status.side_effect = HTTPStatusError(
            message="Not Found",
            request=mock_request,
            response=mock_response,
        )
        mock_client.delete = AsyncMock(return_value=mock_delete_response)

        request_data = {
            "id": "credential-id",
            "assertionResult": {
                "response": {
                    "clientDataJSON": "client-data-json",
                    "authenticatorData": "authenticator-data",
                    "signature": "signature",
                },
                "id": "",
                "rawId": "",
                "type": "",
            },
        }

        client = mock_test_client(mock_client)

        response = client.request("DELETE", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"

    @pytest.mark.asyncio
    @patch.object(delete_fido2_registration_module, "get_tenant_url")
    async def test_handles_generic_exception(
        self, mock_get_tenant_url, mock_test_client, caplog
    ):
        """Should handle any generic exception and call error handler"""
        mock_get_tenant_url.side_effect = Exception("Unexpected error")

        request_data = {
            "id": "credential-id",
            "assertionResult": {
                "response": {
                    "clientDataJSON": "client-data-json",
                    "authenticatorData": "authenticator-data",
                    "signature": "signature",
                },
                "id": "",
                "rawId": "",
                "type": "",
            },
        }

        client = mock_test_client(MagicMock())

        response = client.request("DELETE", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Unexpected error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(delete_fido2_registration_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(delete_fido2_registration_module, "submit_assertion_result")
    @patch.object(delete_fido2_registration_module, "get_auth_request_headers")
    @patch.object(
        delete_fido2_registration_module, "assert_remaining_mfa_factor_after_deletion"
    )
    @patch.object(delete_fido2_registration_module, "verify_registration_ownership")
    @patch.object(delete_fido2_registration_module, "get_user_profile_info")
    @patch.object(delete_fido2_registration_module, "get_tenant_url")
    async def test_handles_connection_error(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_assert_remaining_mfa_factor_after_deletion,
        mock_get_auth_request_headers,
        mock_submit_assertion_result,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
        caplog,
    ):
        """Should handle connection errors during delete request"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"

        mock_assertion_response = MagicMock()
        mock_assertion_response.success = True
        mock_submit_assertion_result.return_value = mock_assertion_response

        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }
        mock_assert_remaining_mfa_factor_after_deletion.return_value = None
        mock_profile = MagicMock()
        mock_profile.preferredLanguage = "en"
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_profile

        # Simulate connection error
        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.delete = AsyncMock(
            side_effect=ConnectionError("Connection refused")
        )

        request_data = {
            "id": "credential-id",
            "assertionResult": {
                "response": {
                    "clientDataJSON": "client-data-json",
                    "authenticatorData": "authenticator-data",
                    "signature": "signature",
                },
                "id": "",
                "rawId": "",
                "type": "",
            },
        }

        client = mock_test_client(mock_client)

        response = client.request("DELETE", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Connection refused" in caplog.text


# endregion


# region /v1/fido2/registration/{registration_id}
class TestErrorHandlingFido2GetRegistrationDetails:
    @pytest.mark.asyncio
    @patch.object(get_fido2_registration_details_module, "get_user_profile_info")
    async def test_handles_generic_exception(
        self, mock_get_user_profile_info, mock_test_client, caplog
    ):
        """Should handle generic exceptions with RequestErrorHandler"""
        mock_get_user_profile_info.side_effect = Exception("Unexpected error")

        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/fido2/registration/reg-123")
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Unexpected error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(
        get_fido2_registration_details_module, "verify_registration_ownership"
    )
    @patch.object(get_fido2_registration_details_module, "get_user_profile_info")
    async def test_handles_connection_error(
        self,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_test_client,
        caplog,
    ):
        """Should handle connection errors"""
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_verify_registration_ownership.side_effect = ConnectionError(
            "Connection refused"
        )

        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/fido2/registration/reg-123")
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Connection refused" in caplog.text


# endregion


# region /v1/fido2/registration/{registration_id}
class TestErrorHandlingFido2GetRegistrations:

    @pytest.mark.asyncio
    @patch.object(get_fido2_registrations_module, "get_admin_token")
    @patch.object(get_fido2_registrations_module, "get_user_profile_info")
    @patch.object(get_fido2_registrations_module, "get_rp_id")
    @patch.object(get_fido2_registrations_module, "get_tenant_url")
    async def test_handles_admin_token_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_test_client,
    ):
        """Should handle error when getting admin token fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )

        mock_get_admin_token.side_effect = Exception("Token service error")

        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/fido2/user")
        response_json = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert not response_json["success"]
        assert response_json["message"] == "Failed to get user FIDO2 credentials"

    @pytest.mark.asyncio
    @patch.object(get_fido2_registrations_module, "get_auth_request_headers")
    @patch.object(get_fido2_registrations_module, "get_rp_uuid_from_rp_id")
    @patch.object(get_fido2_registrations_module, "get_admin_token")
    @patch.object(get_fido2_registrations_module, "get_user_profile_info")
    @patch.object(get_fido2_registrations_module, "get_rp_id")
    @patch.object(get_fido2_registrations_module, "get_tenant_url")
    async def test_handles_http_get_error(
        self,
        mock_get_tenant_url,
        mock_get_rp_id,
        mock_get_user_profile_info,
        mock_get_admin_token,
        mock_get_rp_uuid_from_rp_id,
        mock_get_auth_request_headers,
        mock_test_client,
    ):
        """Should handle error when HTTP GET request fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_rp_id.return_value = "example.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_get_admin_token.return_value = "admin-token-xyz"
        mock_get_rp_uuid_from_rp_id.return_value = "rp-uuid-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer user-token"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request(
            "GET", "https://tenant.verify.ibm.com/v2.0/factors/fido2/registrations"
        )
        mock_response = Response(500, request=mock_request)
        mock_get_response = MagicMock()
        mock_get_response.raise_for_status.side_effect = HTTPStatusError(
            message="Server Error",
            request=mock_request,
            response=mock_response,
        )
        mock_client.get = AsyncMock(return_value=mock_get_response)

        client = mock_test_client(mock_client)

        response = client.request("GET", "/v1/fido2/user")
        response_json = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert not response_json["success"]
        assert response_json["message"] == "Failed to get user FIDO2 credentials"


# endregion


# region /v1/fido2/registration
class TestErrorHandlingFido2UpdateRegistrations:

    @pytest.mark.asyncio
    @patch.object(update_fido2_registrations_module, "get_user_profile_info")
    @patch.object(update_fido2_registrations_module, "get_tenant_url")
    async def test_handles_get_user_id_error(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_test_client,
    ):
        """Should handle error when getting user ID fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_profile_info.side_effect = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

        request_data = {
            "id": "reg-123",
            "nickname": "New Passkey Name",
            "enabled": None,
        }

        client = mock_test_client(MagicMock())

        response = client.request("PUT", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not response_json["success"]
        assert response_json["message"] == "Invalid token"

    @pytest.mark.asyncio
    @patch.object(update_fido2_registrations_module, "verify_registration_ownership")
    @patch.object(update_fido2_registrations_module, "get_user_profile_info")
    @patch.object(update_fido2_registrations_module, "get_tenant_url")
    async def test_handles_ownership_verification_failure(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_test_client,
    ):
        """Should handle error when ownership verification fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_verify_registration_ownership.side_effect = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not own this registration",
        )

        request_data = {
            "id": "reg-123",
            "nickname": "New Passkey Name",
            "enabled": None,
        }

        client = mock_test_client(MagicMock())

        response = client.request("PUT", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert not response_json["success"]
        assert response_json["message"] == "User does not own this registration"

    @pytest.mark.asyncio
    @patch.object(update_fido2_registrations_module, "get_auth_request_headers")
    @patch.object(update_fido2_registrations_module, "verify_registration_ownership")
    @patch.object(update_fido2_registrations_module, "get_user_profile_info")
    @patch.object(update_fido2_registrations_module, "get_tenant_url")
    async def test_handles_http_put_error(
        self,
        mock_get_tenant_url,
        mock_get_user_profile_info,
        mock_verify_registration_ownership,
        mock_get_auth_request_headers,
        mock_test_client,
    ):
        """Should handle error when HTTP PUT request fails"""
        mock_get_tenant_url.return_value = "https://tenant.verify.ibm.com"
        mock_get_user_profile_info.return_value = (
            "user@example.com",
            "Test User",
            "user-456",
        )
        mock_verify_registration_ownership.return_value = {
            "id": "reg-123",
            "userId": "user-456",
            "enabled": True,
            "created": "2024-01-15T10:30:00Z",
            "attributes": {
                "nickname": "Old Passkey Name",
                "rpId": "example.com",
                "credentialId": "cred-abc-123",
            },
            "references": {
                "rpUuid": "rp-uuid-123",
            },
        }
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-xyz"
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request(
            "PUT",
            "https://tenant.verify.ibm.com/v2.0/factors/fido2/registrations/reg-123",
        )
        mock_response = Response(400, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        mock_put_response = MagicMock()
        mock_put_response.raise_for_status.side_effect = HTTPStatusError(
            message="Bad Request",
            request=mock_request,
            response=mock_response,
        )
        mock_client.put = AsyncMock(return_value=mock_put_response)

        request_data = {
            "id": "reg-123",
            "nickname": "New Passkey Name",
            "enabled": None,
        }

        client = mock_test_client(mock_client)

        response = client.request("PUT", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"

    @pytest.mark.asyncio
    @patch.object(update_fido2_registrations_module, "get_tenant_url")
    async def test_handles_generic_exception(
        self, mock_get_tenant_url, mock_test_client, caplog
    ):
        """Should handle any generic exception"""
        mock_get_tenant_url.side_effect = Exception("Unexpected error")

        request_data = {
            "id": "reg-123",
            "nickname": "New Passkey Name",
            "enabled": None,
        }

        client = mock_test_client(MagicMock())

        response = client.request("PUT", "/v1/fido2/registration", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Unexpected error" in caplog.text


# endregion

# region /v1/otp/mfa/enroll


class TestErrorHandlingEnrollMfaOtp:

    @pytest.mark.asyncio
    @patch.object(enroll_mfa_otp_module, "get_my_profile")
    @patch.object(enroll_mfa_otp_module, "dispatch_otp_enrollment")
    async def test_handle_sms_otp_enrollment_ibm_error(
        self, mock_dispatch_otp_enrollment, mock_get_my_profile, mock_test_client
    ):

        mock_get_my_profile.return_value = MagicMock(success=True)

        mock_response = MagicMock(status_code=400)
        mock_response.json.return_value = {"error": "Invalid phone number"}
        mock_dispatch_otp_enrollment.return_value = mock_response

        request_data = {"destination": "+14155552671", "otpType": "sms"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/enroll", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Error enrolling OtpType.SMS OTP: {'error': 'Invalid phone number'}"
        )

    @pytest.mark.asyncio
    @patch.object(enroll_mfa_otp_module, "get_my_profile")
    @patch.object(enroll_mfa_otp_module, "dispatch_otp_enrollment")
    async def test_handle_voice_otp_enrollment_ibm_error(
        self, mock_dispatch_otp_enrollment, mock_get_my_profile, mock_test_client
    ):

        mock_get_my_profile.return_value = MagicMock(success=True)

        mock_response = MagicMock(status_code=400)
        mock_response.json.return_value = {"error": "Invalid phone number"}
        mock_dispatch_otp_enrollment.return_value = mock_response

        request_data = {"destination": "+14155552671", "otpType": "voice"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/enroll", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Error enrolling OtpType.VOICE OTP: {'error': 'Invalid phone number'}"
        )


# endregion

# region /v1/otp/mfa/send


class TestErrorHandlingSendMfaOtp:

    @pytest.mark.asyncio
    @patch.object(send_mfa_otp_module, "get_my_profile")
    @patch.object(send_mfa_otp_module, "dispatch_send_mfa_otp")
    async def test_verification_create_validation_error(
        self, mock_dispatch_send_mfa_otp, mock_get_my_profile, mock_test_client
    ):
        mock_get_my_profile.return_value = MagicMock(success=True)
        mock_response = MagicMock()
        # Invalid response that will cause ValidationError
        mock_response.json.return_value = {"invalid": "data"}
        mock_dispatch_send_mfa_otp.return_value = mock_response

        request_data = {"id": "factor123", "otpType": "sms"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(send_mfa_otp_module, "get_my_profile")
    @patch.object(send_mfa_otp_module, "dispatch_send_mfa_otp")
    async def test_verification_create_general_exception(
        self, mock_dispatch_send_mfa_otp, mock_get_my_profile, mock_test_client, caplog
    ):
        mock_get_my_profile.return_value = MagicMock(success=True)
        mock_dispatch_send_mfa_otp.side_effect = Exception("Network error")

        request_data = {"id": "factor123", "otpType": "sms"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Network error" in caplog.text

    @pytest.mark.asyncio
    @patch.object(verify_mfa_otp_module, "get_my_profile")
    @patch.object(verify_mfa_otp_module, "dispatch_verify_mfa_otp")
    async def test_verification_attempt_general_exception(
        self,
        mock_dispatch_verify_mfa_otp,
        mock_get_my_profile,
        mock_test_client,
        caplog,
    ):
        mock_get_my_profile.return_value = MagicMock(success=True)
        mock_dispatch_verify_mfa_otp.side_effect = Exception("Network error")

        request_data = {
            "id": "factor123",
            "trxnId": "trxn456",
            "otp": "123456,",
            "otpType": "sms",
        }

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Network error" in caplog.text

    @pytest.mark.asyncio
    async def test_dispatch_verification_create_unsupported_otp_type(
        self, mock_test_client
    ):
        request_data = {"id": "factor123", "otpType": "INVALID_TYPE"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(send_mfa_otp_module, "get_my_profile")
    @patch.object(send_mfa_otp_module, "get_auth_request_headers")
    @patch.object(send_mfa_otp_module, "get_configuration")
    async def test_dispatch_verification_create_http_error(
        self,
        mock_get_configuration,
        mock_get_auth_request_headers,
        mock_get_my_profile,
        mock_test_client,
    ):
        mock_get_my_profile.return_value = MagicMock(success=True)
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin_token"
        }
        mock_get_configuration.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://test.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("POST", "https://test.ibm.com")
        mock_response = Response(400, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        http_error = HTTPStatusError(
            "Bad Request", request=mock_request, response=mock_response
        )
        mock_client.post.side_effect = http_error

        request_data = {"id": "factor123", "otpType": "sms"}

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/otp/mfa/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"

    @pytest.mark.asyncio
    async def test_dispatch_verification_attempt_unsupported_otp_type(
        self, mock_test_client
    ):
        request_data = {"id": "factor123", "otpType": "INVALID_TYPE"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/mfa/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(verify_mfa_otp_module, "get_my_profile")
    @patch.object(verify_mfa_otp_module, "get_auth_request_headers")
    @patch.object(verify_mfa_otp_module, "get_configuration")
    async def test_dispatch_verification_attempt_http_error(
        self,
        mock_get_configuration,
        mock_get_auth_request_headers,
        mock_get_my_profile,
        mock_test_client,
    ):
        mock_get_my_profile.return_value = MagicMock(success=True)
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin_token"
        }
        mock_get_configuration.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://test.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("POST", "https://test.ibm.com")
        mock_response = Response(401, request=mock_request)
        http_error = HTTPStatusError(
            "Unauthorized", request=mock_request, response=mock_response
        )
        mock_client.post.side_effect = http_error

        request_data = {
            "id": "factor123",
            "trxnId": "trxn456",
            "otp": "123456,",
            "otpType": "sms",
        }

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/otp/mfa/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 401."
        )


# endregion

# region /v1/users/profile


class TestErrorHandlingUpdateProfileWithOtp:
    @pytest.mark.asyncio
    @patch.object(update_profile_with_otp, "verify_otp_before_operation")
    @patch.object(update_profile_with_otp, "dispatch_get_my_profile_from_ibm")
    @patch.object(update_profile_with_otp, "_build_profile_update_request")
    @patch.object(update_profile_with_otp, "_get_update_field_names")
    @patch.object(update_profile_with_otp, "update_profile_for_verified_changes")
    async def test_unexpected_error_is_handled(
        self,
        mock_update_profile_for_verified_changes,
        mock_get_update_field_names,
        mock_build_profile_update_request,
        mock_dispatch_get_my_profile_from_ibm,
        mock_verify_otp_before_operation,
        mock_test_client,
        caplog,
    ):
        mock_verify_otp_before_operation.return_value = MagicMock()
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock(
            userName="John Doe"
        )
        mock_build_profile_update_request.return_value = MagicMock()
        mock_get_update_field_names.return_value = MagicMock()
        mock_update_profile_for_verified_changes.side_effect = Exception(
            "Unexpected database error"
        )

        request_data = {
            "otp": "123456",
            "trxnId": "test-trxn-id",
            "otpType": "sms",
            "newEmailAddress": "new@example.com",
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/users/profile/update-with-otp", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Unexpected database error" in caplog.text


class TestErrorHandlingGetMyProfile:

    @pytest.mark.asyncio
    @patch.object(get_my_profile_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(get_my_profile_module, "mask_profile_details")
    async def test_profile_response_uses_details_key_not_urn_alias(
        self,
        mock_mask_profile_details,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        extension_key = "urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
        profile_data = {
            "userName": "jo****@example.com",
            "emails": [{"value": "jo****@example.com", "type": "work"}],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
            extension_key: {
                "pwdChangedTime": "2026-06-10T15:22:05Z",
                "customAttributes": [
                    {"name": "acceptedtermsversion", "values": ["1.0.0"]}
                ],
            },
        }

        mock_dispatch_get_my_profile_from_ibm.return_value = IBMVerifyUserProfileSchema(
            **profile_data
        )
        mock_mask_profile_details.return_value = profile_data

        mock_client = AsyncMock(spec=AsyncClient)
        client = mock_test_client(mock_client)

        response = client.request("GET", "/v1/users/profile")
        response_json = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "details" in response_json["data"]
        assert extension_key not in response_json["data"]
        assert response_json["data"]["details"]["customAttributes"][0]["name"] == (
            "acceptedtermsversion"
        )

    @pytest.mark.asyncio
    @patch.object(get_my_profile_module, "get_configuration")
    async def test_dispatch_get_my_profile_from_ibm_http_error(
        self, mock_get_configuration, mock_test_client
    ):
        mock_get_configuration.return_value = MagicMock()

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("GET", "https://mocked-api.ibm.com/v2.0/Me")
        mock_response = Response(500, request=mock_request)
        http_error = HTTPStatusError(
            "Unauthorized", request=mock_request, response=mock_response
        )
        mock_client.get.side_effect = http_error

        client = mock_test_client(mock_client)

        response = client.request("GET", "/v1/users/profile")
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 500."
        )

    @pytest.mark.asyncio
    @patch.object(get_my_profile_module, "get_configuration")
    async def test_dispatch_get_my_profile_from_ibm_validation_error(
        self, mock_get_configuration, mock_test_client
    ):
        mock_get_configuration.return_value = MagicMock()

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("GET", "https://mocked-api.ibm.com/v2.0/Me")
        mock_response = Response(
            200,
            request=mock_request,
            json={
                "userName": "jo****@example.com",
                # Missing: schemas, emails, meta, active, id
            },
        )

        mock_client.get.return_value = mock_response

        client = mock_test_client(mock_client)

        response = client.request("GET", "/v1/users/profile")
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(get_my_profile_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(get_my_profile_module, "mask_profile_details")
    async def test_my_profile_validation_error_after_masking(
        self,
        mock_mask_profile_details,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_mask_profile_details.return_value = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
            ],
            "userName": "jo****@example.com",
            "emails": [{"value": "jo****@example.com", "type": "work"}],
            "phoneNumbers": ["invalid", "array", "data"],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
        }
        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/users/profile")
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."


# endregion

# region /v1/user/profile


class TestErrorHandlingUpdateMyProfile:

    @pytest.mark.asyncio
    @patch.object(user_router, "validate_user_id_matches_session")
    @patch.object(update_my_profile_module, "sanitize_user_profile_data")
    @patch.object(update_my_profile_module, "dispatch_get_my_profile_from_ibm")
    async def test_update_profile_validation_error(
        self,
        mock_dispatch_get_my_profile_from_ibm,
        mock_sanitize_user_profile_data,
        mock_validate_user_id_matches_session,
        mock_test_client,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_sanitize_user_profile_data.return_value = {
            "userName": "john.doe@example.com",
            "id": 123,
            "user_id": "string-instead-of-int",
        }
        mock_dispatch_get_my_profile_from_ibm.return_value = Mock(
            model_dump=Mock(
                return_value={
                    "userName": "john.doe@example.com",
                    "id": "string-instead-of-int",
                }
            )
        )

        request_data = {"userName": "john.doe@example.com"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/users/profile", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(user_router, "validate_user_id_matches_session")
    @patch.object(update_my_profile_module, "sanitize_user_profile_data")
    @patch.object(update_my_profile_module, "dispatch_get_my_profile_from_ibm")
    async def test_update_profile_for_verified_changes_validation_error(
        self,
        mock_dispatch_get_my_profile_from_ibm,
        mock_sanitize_user_profile_data,
        mock_validate_user_id_matches_session,
        mock_test_client,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_sanitize_user_profile_data.return_value = {
            "userName": "john.doe@example.com",
            "id": 123,
        }
        mock_dispatch_get_my_profile_from_ibm.return_value = Mock(
            model_dump=Mock(
                return_value={
                    "userName": "john.doe@example.com",
                    "id": "string-instead-of-int",
                    "invalid_field": "this-will-cause-validation-error",
                }
            )
        )

        request_data = {"userName": "john.doe@example.com"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/users/profile", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(user_router, "validate_user_id_matches_session")
    @patch.object(update_my_profile_module, "sanitize_user_profile_data")
    @patch.object(update_my_profile_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(update_my_profile_module, "dispatch_update_my_profile")
    async def test_update_profile_for_verified_changes_json_parse_error(
        self,
        mock_dispatch_update_my_profile,
        mock_dispatch_get_my_profile_from_ibm,
        mock_sanitize_user_profile_data,
        mock_validate_user_id_matches_session,
        mock_test_client,
        caplog,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_sanitize_user_profile_data.return_value = {
            "userName": "john.doe@example.com",
            "id": "123",
        }
        mock_response = MagicMock()
        mock_response.model_dump.return_value = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
            ],
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
        }
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_response
        mock_response = Mock()
        mock_response.json.side_effect = Exception("Invalid JSON")
        mock_dispatch_update_my_profile.return_value = mock_response

        request_data = {"userName": "john.doe@example.com"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/users/profile", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Invalid JSON" in caplog.text

    @pytest.mark.asyncio
    @patch.object(user_router, "validate_user_id_matches_session")
    @patch.object(update_my_profile_module, "sanitize_user_profile_data")
    @patch.object(update_my_profile_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(update_my_profile_module, "dispatch_update_my_profile")
    @patch.object(update_my_profile_module, "mask_profile_details")
    async def test_update_profile_for_verified_changes_response_validation_error(
        self,
        mock_mask_profile_details,
        mock_dispatch_update_my_profile,
        mock_dispatch_get_my_profile_from_ibm,
        mock_sanitize_user_profile_data,
        mock_validate_user_id_matches_session,
        mock_test_client,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_sanitize_user_profile_data.return_value = {
            "userName": "john.doe@example.com",
            "id": "123",
        }
        mock_response = MagicMock()
        mock_response.model_dump.return_value = {
            "schemas": [
                "urn:ietf:params:scim:schemas:core:2.0:User",
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
            ],
            "userName": "john.doe@example.com",
            "emails": [{"value": "john.doe@example.com", "type": "work"}],
            "meta": {
                "location": "here",
                "created": "2023-01-01T00:00:00Z",
                "lastModified": "2023-09-22T12:30:00Z",
                "resourceType": "User",
            },
            "active": True,
            "id": "user-123",
        }
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_response
        mock_dispatch_update_my_profile.return_value = MagicMock()

        mock_mask_profile_details.return_value = {
            "userName": "john.doe@example.com",
            "emails": "invalid-emails-format",  # Should be list, not string
            "id": None,  # Invalid - id is required
        }

        request_data = {"userName": "john.doe@example.com"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/users/profile", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."


# endregion

# region /v1/users/logout


class TestErrorHandlingAuthLogout:

    @pytest.mark.asyncio
    @patch.object(auth_logout_module, "get_user_info")
    async def test_logout_user_error_path_uses_request_error_handler(
        self, mock_get_user_info, mock_test_client, caplog
    ):
        mock_get_user_info.side_effect = Exception("Get user info failed.")

        request_data = {"userName": "john.doe@example.com"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/auth/logout", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Get user info failed." in caplog.text


# endregion

# region /v1/otp/transient/status/{otpType}/{trxnId}


class TestErrorHandlingRetrieveTransientOtp:

    @pytest.mark.asyncio
    @patch.object(retrieve_transient_otp_module, "dispatch_otp_status_retrieval")
    async def test_handle_non_200_returns_error_model(
        self, mock_dispatch_otp_status_retrieval, mock_test_client
    ):
        mock_dispatch_otp_status_retrieval.return_value = Response(
            400, json={"error": "Bad Request"}
        )

        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/otp/transient/status/email/bad-req-1")
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Error while retrieving OtpType.EMAIL OTP: bad-req-1"
        )

    @pytest.mark.asyncio
    @patch.object(retrieve_transient_otp_module, "dispatch_otp_status_retrieval")
    async def test_handle_validation_error_due_to_incomplete_payload(
        self, mock_dispatch_otp_status_retrieval, mock_test_client
    ):
        mock_dispatch_otp_status_retrieval.return_value = Response(
            200, json={"trxnId": "only-id-present"}
        )

        client = mock_test_client(MagicMock())

        response = client.request(
            "GET", "/v1/otp/transient/status/email/only-id-present"
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(retrieve_transient_otp_module, "dispatch_otp_status_retrieval")
    async def test_handle_transport_exception_translates_to_500_http_exception(
        self, mock_dispatch_otp_status_retrieval, mock_test_client, caplog
    ):
        mock_dispatch_otp_status_retrieval.side_effect = RuntimeError(
            "simulated network failure"
        )

        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/otp/transient/status/voice/trxn-err-1")
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "simulated network failure" in caplog.text


# endregion

# region /v1/otp/transient/send


class TestErrorHandlingSendTransientOtp:

    @pytest.mark.asyncio
    @patch.object(otp_router, "validate_user_id_matches_session")
    @patch.object(send_transient_otp_module, "get_my_profile")
    @patch.object(send_transient_otp_module, "dispatch_otp")
    async def test_handle_non_201_returns_error_model(
        self,
        mock_dispatch_otp,
        mock_get_my_profile,
        mock_validate_user_id_matches_session,
        mock_test_client,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_get_my_profile.return_value = MagicMock()
        mock_dispatch_otp.return_value = Response(
            400, json={"error": "Bad Request"}, request=MagicMock()
        )

        request_data = {
            "otpType": "email",
            "user_id": "user@example.com",
            "destination": "user@example.com",
        }

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/transient/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 400."
        )

    @pytest.mark.asyncio
    @patch.object(otp_router, "validate_user_id_matches_session")
    @patch.object(send_transient_otp_module, "get_my_profile")
    @patch.object(send_transient_otp_module, "dispatch_otp")
    async def test_handle_validation_error_due_to_incomplete_payload(
        self,
        mock_dispatch_otp,
        mock_get_my_profile,
        mock_validate_user_id_matches_session,
        mock_test_client,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_get_my_profile.return_value = MagicMock()
        mock_dispatch_otp.return_value = Response(
            201, json={"trxnId": "only-id"}, request=MagicMock()
        )

        request_data = {
            "otpType": "email",
            "user_id": "user@example.com",
            "destination": "user@example.com",
        }

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/transient/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(otp_router, "validate_user_id_matches_session")
    @patch.object(send_transient_otp_module, "get_my_profile")
    @patch.object(send_transient_otp_module, "dispatch_otp")
    async def test_handle_transport_exception_is_captured_in_message(
        self,
        mock_dispatch_otp,
        mock_get_my_profile,
        mock_validate_user_id_matches_session,
        mock_test_client,
        caplog,
    ):
        mock_validate_user_id_matches_session.return_value = MagicMock()
        mock_get_my_profile.return_value = MagicMock()
        mock_dispatch_otp.side_effect = RuntimeError("simulated network failure")

        request_data = {
            "otpType": "email",
            "user_id": "user@example.com",
            "destination": "user@example.com",
        }

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/otp/transient/send", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "simulated network failure" in caplog.text


# endregion

# region /v1/password/verify


class TestErrorHandlingVerifyPassword:

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "dispatch_get_cloud_directory_Id")
    async def test_get_cloud_directory_id_dispatch_raises_http_exception(
        self,
        mock_dispatch_get_cloud_directory_Id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }
        mock_dispatch_get_cloud_directory_Id.side_effect = HTTPException(
            status_code=500, detail="Internal server error"
        )

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "Internal server error"

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    async def test_dispatch_get_cloud_directory_id_http_error(
        self,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):

        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request(
            method="GET",
            url="https://tenant.verify.ibm.com/v1.0/authnmethods/password?search=name%3D%22Cloud%20Directory%22",
        )

        mock_response = Response(404, request=mock_request)
        mock_response.json = MagicMock(return_value={"messageId": "test123"})
        mock_response_obj = MagicMock()
        mock_response_obj.raise_for_status.side_effect = HTTPStatusError(
            message="Not Found", request=mock_request, response=mock_response
        )
        mock_client.get = AsyncMock(return_value=mock_response_obj)

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert response_json["message"] == "test123"

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    async def test_dispatch_get_cloud_directory_id_network_error(
        self,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
        caplog,
    ):

        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }
        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.get.side_effect = NetworkError("Connection timeout")

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Connection timeout" in caplog.text

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "dispatch_get_cloud_directory_Id")
    async def test_get_cloud_directory_id_missing_password_field(
        self,
        mock_dispatch_get_cloud_directory_Id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }

        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {"password": []}
        mock_dispatch_get_cloud_directory_Id.return_value = mock_response

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not response_json["success"]
        assert response_json["message"] == "Bad Request"

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "dispatch_get_cloud_directory_Id")
    async def test_get_cloud_directory_id_missing_id_field(
        self,
        mock_dispatch_get_cloud_directory_Id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }

        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {
            "password": [
                {
                    "name": "Cloud Directory",
                    "type": "cloudDirectory",
                    "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/",
                    # Missing 'id' field
                }
            ]
        }
        mock_dispatch_get_cloud_directory_Id.return_value = mock_response

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "dispatch_get_cloud_directory_Id")
    async def test_get_cloud_directory_id_invalid_response_schema(
        self,
        mock_dispatch_get_cloud_directory_Id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }

        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {"password": "invalid"}
        mock_dispatch_get_cloud_directory_Id.return_value = mock_response

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "dispatch_get_cloud_directory_Id")
    async def test_get_cloud_directory_id_null_id(
        self,
        mock_dispatch_get_cloud_directory_Id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }

        mock_response = Mock(spec=Response)
        mock_response.json.return_value = {
            "password": [
                {
                    "id": None,  # Null ID - will cause Pydantic validation error
                    "name": "Cloud Directory",
                    "type": "cloudDirectory",
                    "location": "https://tenant.verify.ibm.com/v1.0/authnmethods/password/",
                }
            ]
        }
        mock_dispatch_get_cloud_directory_Id.return_value = mock_response

        request_data = {"password": "purple_monkey_dishwasher"}

        client = mock_test_client(MagicMock())

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "get_cloud_directory_id")
    async def test_dispatch_verify_password_http_error_with_message_id(
        self,
        mock_get_cloud_directory_id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        """IBM Verify returns 401 with messageId — should return 400 with the error code."""
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }
        mock_get_cloud_directory_id.return_value = "test-directory-123"

        # Create a proper httpx Request object
        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request(
            method="POST",
            url="https://example.com",
        )

        mock_response = Mock(spec=Response)
        mock_response.status_code = 401
        mock_response.json.return_value = {
            "messageId": "CSIBH0044E",
            "messageDescription": "The username or password is incorrect.",
        }

        # Configure the mock to raise HTTPStatusError when raise_for_status is called
        http_error = HTTPStatusError(
            message="Unauthorized",
            request=mock_request,
            response=mock_response,
        )
        mock_response.raise_for_status.side_effect = http_error
        mock_client.post.return_value = mock_response

        request_data = {
            "password": "purple_monkey_dishwasher",
        }

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not response_json["success"]
        assert response_json["message"] == "CSIBH0044E"

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "get_cloud_directory_id")
    async def test_dispatch_verify_password_http_error_without_message_id(
        self,
        mock_get_cloud_directory_id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
    ):
        """IBM Verify returns 401 without messageId — should return 502 with generic message."""
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }
        mock_get_cloud_directory_id.return_value = "test-directory-123"

        # Create a proper httpx Request object
        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request(
            method="POST",
            url="https://example.com",
        )

        mock_response = Mock(spec=Response)
        mock_response.status_code = 401
        mock_response.json.return_value = {
            "error": "Unauthorized"
        }  # valid JSON, no messageId key

        # Configure the mock to raise HTTPStatusError when raise_for_status is called
        http_error = HTTPStatusError(
            message="Unauthorized",
            request=mock_request,
            response=mock_response,
        )
        mock_response.raise_for_status.side_effect = http_error
        mock_client.post.return_value = mock_response

        request_data = {
            "password": "purple_monkey_dishwasher",
        }

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 401."
        )

    @pytest.mark.asyncio
    @patch.object(verify_password_module, "dispatch_get_my_profile_from_ibm")
    @patch.object(verify_password_module, "get_admin_token")
    @patch.object(verify_password_module, "get_auth_request_headers")
    @patch.object(verify_password_module, "get_cloud_directory_id")
    async def test_dispatch_verify_password_network_error(
        self,
        mock_get_cloud_directory_id,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_test_client,
        caplog,
    ):
        mock_dispatch_get_my_profile_from_ibm.return_value = MagicMock()
        mock_get_admin_token.return_value = "admin-token-123"
        mock_get_auth_request_headers.return_value = {
            "Authorization": "Bearer admin-token-123",
            "Content-Type": "application/json",
        }
        mock_get_cloud_directory_id.return_value = "test-directory-123"

        # Create a proper httpx Request object
        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.post.side_effect = NetworkError("Connection timeout")

        request_data = {
            "password": "purple_monkey_dishwasher",
        }

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/password/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Connection timeout" in caplog.text


# endregion


# region /password/verify/stepup


class TestErrorHandlingVerifyPasswordStepup:

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_configuration")
    @patch(
        "app.password.services.verify_password_stepup.dispatch_get_my_profile_from_ibm"
    )
    @patch.object(stepup_module, "verify_password_with_jwt")
    @patch.object(stepup_module, "get_admin_token")
    async def test_handles_password_verification_error(
        self,
        mock_get_admin_token,
        mock_verify_password_with_jwt,
        mock_dispatch_get_my_profile_from_ibm,
        mock_get_configuration,
        mock_test_client,
        caplog,
    ):
        """Should handle error when password verification fails"""
        # Mock config
        mock_config = MagicMock()
        mock_config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://tenant.verify.ibm.com"
        )
        mock_config.verify_password_api_endpoint = (
            "https://tenant.verify.ibm.com/v2.0/authnmethods/password"
        )
        mock_get_configuration.return_value = mock_config

        # Mock user profile
        mock_user_info = MagicMock()
        mock_user_info.userName = "user@example.com"
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_user_info

        # Mock admin token
        mock_get_admin_token.return_value = "admin-token-123"

        # Mock step 1 failure
        mock_verify_password_with_jwt.side_effect = Exception("Invalid password")

        request_data = {
            "password": "purple_monkey_dishwasher",
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/password/verify/stepup", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Invalid password" in caplog.text

    @pytest.mark.asyncio
    @patch("app.password.services.verify_password_stepup.get_configuration")
    @patch(
        "app.password.services.verify_password_stepup.dispatch_get_my_profile_from_ibm"
    )
    @patch.object(stepup_module, "exchange_password_jwt_for_token")
    @patch.object(stepup_module, "verify_password_with_jwt")
    @patch.object(stepup_module, "get_admin_token")
    async def test_handles_jwt_exchange_error(
        self,
        mock_get_admin_token,
        mock_verify_password_with_jwt,
        mock_exchange_password_jwt_for_token,
        mock_dispatch_get_my_profile_from_ibm,
        mock_get_configuration,
        mock_test_client,
        caplog,
    ):
        """Should handle error when JWT exchange fails"""
        # Mock config
        mock_config = MagicMock()
        mock_config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://tenant.verify.ibm.com"
        )
        mock_config.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID = (
            "profile-mgmt-client-123"
        )
        mock_config.ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET = (
            "profile-mgmt-secret-456"
        )
        mock_config.verify_password_api_endpoint = (
            "https://tenant.verify.ibm.com/v2.0/authnmethods/password"
        )
        mock_get_configuration.return_value = mock_config

        # Mock user profile
        mock_user_info = MagicMock()
        mock_user_info.userName = "user@example.com"
        mock_dispatch_get_my_profile_from_ibm.return_value = mock_user_info

        # Mock admin token
        mock_get_admin_token.return_value = "admin-token-123"

        # Mock step 1 success
        mock_verify_password_with_jwt.return_value = ("user-123", "password-jwt-token")

        # Mock step 2 failure
        mock_exchange_password_jwt_for_token.side_effect = Exception("Invalid grant")

        request_data = {
            "password": "purple_monkey_dishwasher",
        }

        client = mock_test_client(MagicMock())

        response = client.request(
            "POST", "/v1/password/verify/stepup", json=request_data
        )
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "Invalid grant" in caplog.text


# endregion

# region /v1/otp/transient/verify


class TestErrorHandlingVerifyTransientOtp:

    @pytest.mark.asyncio
    @patch.object(verify_transient_otp_module, "get_auth_request_headers")
    @patch.object(verify_transient_otp_module, "get_configuration")
    async def test_handle_otp_verification_transport_exception_translates_to_http_exception(
        self,
        mock_get_configuration,
        mock_get_auth_request_headers,
        mock_test_client,
        caplog,
    ):
        mock_get_auth_request_headers.side_effect = lambda token, _content_type: {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        def mock_get_configuration_return_value():
            config = Mock()
            config.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
                "https://test.verify.ibm.com"
            )
            return config

        mock_get_configuration.side_effect = mock_get_configuration_return_value

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.post.side_effect = RuntimeError("simulated network failure")

        request_data = {"otp": "123456", "trxnId": "bad-1", "otpType": "email"}

        client = mock_test_client(mock_client)

        response = client.request("POST", "/v1/otp/transient/verify", json=request_data)
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "An unexpected error occurred."
        assert "simulated network failure" in caplog.text


# endregion

# region user session


class TestErrorHandlingAuthUserSession:

    @pytest.mark.asyncio
    @patch.object(auth_user_session_module, "set_rp_client_id_in_session")
    @patch.object(auth_user_session_module, "get_http_client")
    @patch.object(auth_user_session_module, "get_admin_token")
    @patch.object(auth_user_session_module, "get_auth_request_headers")
    @patch.object(auth_user_session_module, "get_configuration")
    async def test_introspect_user_token_handles_http_exception_and_other_errors(
        self,
        mock_get_configuration,
        mock_get_auth_request_headers,
        mock_get_admin_token,
        mock_get_http_client,
        mock_set_rp_client_id_in_session,
        mock_test_client,
    ):
        mock_set_rp_client_id_in_session.return_value = MagicMock()
        mock_get_admin_token.return_value = MagicMock()
        mock_get_auth_request_headers.return_value = MagicMock()
        mock_get_configuration.return_value = MagicMock()

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.post.side_effect = HTTPException(
            status_code=500, detail="Issue validating user token."
        )
        mock_get_http_client.return_value = mock_client
        client = mock_test_client(
            mock_client, session_data={"access_token": True}, disable_overrides=True
        )

        response = client.request("GET", "/v1/users/profile")
        response_json = response.json()

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert not response_json["success"]
        assert response_json["message"] == "Issue validating user token."


# endregion


# region /v1/users/otp_factors
class TestErrorHandlingOtpFactors:

    @pytest.mark.asyncio
    @patch.object(otp_factors_module, "dispatch_user_auth_factors")
    async def test_get_user_otp_factors_invalid_schema(
        self, mock_dispatch_user_auth_factors, mock_test_client
    ):
        mock_dispatch_user_auth_factors.return_value = {
            "factors": [{"invalid": "data"}],
            "count": 1,
            "limit": 10,
            "page": 1,
            "total": 1,
        }

        client = mock_test_client(MagicMock())

        response = client.request("GET", "/v1/users/otp_factors")
        response_json = response.json()

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
        assert not response_json["success"]
        assert response_json["message"] == "The provided data is not valid."


# endregion


# region /v1/users/rp_info
class TestErrorHandlingRpInfo:

    @pytest.mark.asyncio
    @patch.object(rp_info_module, "dispatch_get_oidc_user_applications")
    async def test_get_relying_party_info_not_found_404(
        self, mock_dispatch_get_oidc_user_applications, mock_test_client
    ):
        mock_dispatch_get_oidc_user_applications.return_value = SimpleNamespace(
            applications=[
                SimpleNamespace(
                    id="app-001",
                    name="Non Matching App",
                    description='{"no-match-id": {"en": {"name": "Non Matching EN", "url": "http://localhost/en"}, "fr": {"name": "Non Matching FR", "url": "http://localhost/fr"}}}',
                    status=["ENABLED"],
                    category=["General"],
                    links=[
                        SimpleNamespace(
                            icon="icon-url",
                            id="link-001",
                            linkName="Non Matching App",
                            url="http://localhost:8080",
                            model_dump=lambda: {
                                "icon": "icon-url",
                                "id": "link-001",
                                "linkName": "Non Matching App",
                                "url": "http://localhost:8080",
                            },
                        )
                    ],
                )
            ]
        )

        client = mock_test_client(MagicMock(), session_data={"rp_client_id": "123456"})

        response = client.request("GET", "/v1/users/rp_info")
        response_json = response.json()

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not response_json["success"]
        assert response_json["message"] == "Relying party info not found"

    @pytest.mark.asyncio
    @patch.object(rp_info_module, "dispatch_get_oidc_user_applications")
    async def test_get_relying_party_info_match_but_no_links_404(
        self, mock_dispatch_get_oidc_user_applications, mock_test_client
    ):
        mock_dispatch_get_oidc_user_applications.return_value = SimpleNamespace(
            applications=[
                SimpleNamespace(
                    id="app-002",
                    name="Matching App",
                    description='{"123456": {"en": {"name": "Matching EN", "url": "http://localhost/en"}, "fr": {"name": "Matching FR", "url": "http://localhost/fr"}}}',
                    status=["ENABLED"],
                    category=["General"],
                    links=[],
                )
            ]
        )

        client = mock_test_client(MagicMock(), session_data={"rp_client_id": "123456"})

        response = client.request("GET", "/v1/users/rp_info")
        response_json = response.json()

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert not response_json["success"]
        assert response_json["message"] == "Relying party info not found"

    @pytest.mark.asyncio
    @patch.object(rp_info_module, "get_admin_token")
    @patch.object(rp_info_module, "get_auth_request_headers")
    async def test_get_relying_party_info_dispatch_error_bubbles_via_handler(
        self, mock_get_auth_request_headers, mock_get_admin_token, mock_test_client
    ):

        mock_get_admin_token.return_value = MagicMock()
        mock_get_auth_request_headers.return_value = MagicMock()

        mock_client = AsyncMock(spec=AsyncClient)
        mock_request = Request("GET", "https://example.com")
        mock_response = Response(500, request=mock_request)
        mock_client.get.return_value = mock_response

        client = mock_test_client(mock_client, session_data={"rp_client_id": "123456"})

        response = client.request("GET", "/v1/users/rp_info")
        response_json = response.json()

        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert not response_json["success"]
        assert (
            response_json["message"]
            == "Upstream service returned the following HTTP status code: 500."
        )


# endregion

# region /auth/callback


class TestErrorHandlingAuth:

    @pytest.mark.asyncio
    @patch.object(auth_module, "get_base_profile_management_url")
    @patch.object(auth_module, "oauth")
    async def test_callback_handler_oauth_error_results_in_500(
        self, mock_oauth, mock_get_base_profile_management_url, mock_test_client
    ):
        mock_get_base_profile_management_url.return_value = MagicMock()
        mock_oauth.verify.authorize_access_token.side_effect = OAuthError(
            "An OAuth error occurred."
        )

        client = mock_test_client(MagicMock(), session_data={"returnToPage": None})

        response = client.request("GET", "/v1/auth/callback")
        response_json = response.json()

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not response_json["success"]
        assert response_json["message"] == "Authentication failed. Please try again."


# endregion
