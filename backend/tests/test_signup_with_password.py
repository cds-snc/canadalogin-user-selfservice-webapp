import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import AsyncClient
from fastapi import HTTPException

from app.main import app  # Your FastAPI app instance

from app.users.services.create import (
    signup_with_password,
    create_user,
    IBMUserCreateRequest,
)
from app.users.schemas import (
    UserLoginRequestData,
    SignUpResponse,
    IBMUserCreateResponse, NewUserCreationData,
)
from app.utils.schemas import ResponseModel

from starlette.responses import JSONResponse

from fastapi.testclient import TestClient


@pytest.fixture
def client():
    # Initialize the TestClient to simulate HTTP requests
    return TestClient(app)


@pytest.mark.asyncio
async def test_create_user_success(client):
    user_data = IBMUserCreateRequest(
        userName="test@abc.com",
        emails=[{"value": "test@abc.com"}],
        password="StrongPassword123",
    )

    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {
        "id": "user-123",
        "userName": "test@abc.com",
    }

    with (
        patch(
            "app.users.services.create.get_admin_token",
            new=AsyncMock(return_value="fake-token"),
        ),
        patch("app.users.services.create.get_auth_request_headers") as mock_headers,
        patch("app.users.services.create.get_settings") as mock_settings,
        patch("app.users.services.create.AsyncClient") as mock_client_class,
    ):

        # mock_token.return_value = "fake--token"
        mock_headers.return_value = {"Authorization": "Bearer fake-token"}
        mock_settings.return_value.ibm_verify_config.IBM_VERIFY_TENANT_URL = (
            "https://fake.ibm.com"
        )

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        mock_client.post.return_value = mock_response
        mock_client_class.return_value = mock_client

        response = await create_user(user_data, global_http_client=mock_client)

        assert response.status_code == 201
        assert response.json()["id"] == "user-123"


@pytest.mark.asyncio
async def test_create_user_raises_generic_error(client):
    user_data = IBMUserCreateRequest(
        userName="test@abc.com",
        emails=[{"value": "test@abc.com"}],
        password="StrongPassword123",
    )

    with (
        patch(
            "app.users.services.create.get_admin_token",
            new=AsyncMock(return_value="fake-token"),
        ),
        patch("app.users.services.create.get_auth_request_headers"),
        patch("app.users.services.create.get_settings"),
        patch("app.users.services.create.AsyncClient") as mock_client_class,
    ):

        mock_client = AsyncMock(spec=AsyncClient)
        mock_client.__aenter__.return_value = mock_client
        # Simulate internal failure
        mock_client.post.side_effect = Exception("Connection error")
        mock_client_class.return_value = mock_client

        with pytest.raises(HTTPException) as exc_info:
            await create_user(user_data, global_http_client=mock_client)

        assert exc_info.value.status_code == 400
        assert "Signup error: Connection error" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_signup_success(client):
    user_data = NewUserCreationData(
        userName="test@abc.com", password="StrongPassword123", trxnId=""
    )

    # Mock response object
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {
        "userName": "test@abc.com",
        "id": "abc123",
        "emails": [{"value": "test@abc.com"}],
    }
    mock_http_client = AsyncMock(spec=AsyncClient)

    # Patch only what's necessary
    with (
        patch("app.users.services.create.create_user", return_value=mock_response),
        patch(
            "app.users.services.otp_verified_check.otp_method_is_verified", return_value=True
        ) as email_check,
        patch("app.users.services.create.IBMUserCreateRequest"),
        patch("app.users.services.create.logger"),
    ):

        result = await signup_with_password(
            user_data, global_http_client=mock_http_client
        )

        email_check.assert_called_once()
        assert isinstance(result, ResponseModel)
        assert result.success is True
        assert result.message == "User created successfully"
        assert result.data.userName == "test@abc.com"


@pytest.mark.asyncio
async def test_signup_failure_from_ibm(client):
    user_data = UserLoginRequestData(
        userName="user@abc.com", password="pass", trxnId=""
    )

    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"detail": "Invalid user"}

    mock_http_client = AsyncMock(spec=AsyncClient)

    with (
        patch("app.users.services.create.create_user", return_value=mock_response),
        patch("app.users.services.create.IBMUserCreateRequest"),
        patch("app.users.services.create.logger"),
        patch("app.users.services.otp_verified_check.otp_method_is_verified", return_value=True),
    ):
        result = await signup_with_password(
            user_data, global_http_client=mock_http_client
        )

        assert isinstance(result, JSONResponse)
        assert result.status_code == 400
        assert result.body is not None
        assert b"Invalid user" in result.body


@pytest.mark.asyncio
async def test_signup_failure_caused_by_unverified_email(client):
    user_data = UserLoginRequestData(
        userName="user@abc.com", password="pass", trxnId=""
    )

    mock_response = MagicMock()
    mock_response.status_code = 400

    mock_http_client = AsyncMock(spec=AsyncClient)

    with (
        patch("app.users.services.create.create_user", return_value=mock_response),
        patch(
            "app.users.services.otp_verified_check.otp_method_is_verified", return_value=False
        ) as is_verified_email,
        patch("app.users.services.create.IBMUserCreateRequest"),
        patch("app.users.services.create.logger"),
    ):

        result = await signup_with_password(
            user_data, global_http_client=mock_http_client
        )

        assert isinstance(result, JSONResponse)
        assert result.status_code == 400
        assert result.body is not None
        is_verified_email.assert_called_once()
        assert b"Email has not been verified" in result.body


@pytest.mark.asyncio
async def test_signup_validation_error_response(client):
    user_data = UserLoginRequestData(
        userName="test@abc.com", password="StrongPassword123", trxnId=""
    )

    # Malformed response that fails Pydantic validation
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = {"invalid_field": "unexpected"}

    mock_http_client = AsyncMock(spec=AsyncClient)

    with (
        patch("app.users.services.create.create_user", return_value=mock_response),
        patch("app.users.services.create.IBMUserCreateRequest"),
        patch(
            "app.users.services.otp_verified_check.otp_method_is_verified", return_value=True
        ) as verified_email,
        patch("app.users.services.create.logger"),
    ):

        with pytest.raises(HTTPException) as exc_info:
            await signup_with_password(user_data, global_http_client=mock_http_client)

        verified_email.assert_called_once()
        assert exc_info.value.status_code == 422
        assert "Response validation error" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_user_signup(client):
    # Mock user signup request data
    user_data = UserLoginRequestData(
        userName="test@abc.com", password="testpassword123", trxnId=""
    )

    # Mock the response returned from signup_with_password
    mock_response = SignUpResponse(
        success=True,
        message="User created successfully",
        data=IBMUserCreateResponse(id="user-123", userName="test@abc.com"),
        status_code=201,
    )

    # Patch the signup_with_password function to return the mock response
    with (
        patch("app.users.v1_router.signup_with_password", return_value=mock_response),
    ):

        # Mock the token response to simulate a successful access token request

        mock_client = AsyncMock(spec=AsyncClient)
        client.app.state.request_client = mock_client

        # Simulate the actual API call
        response = client.post("/v1/users/create", json=user_data.model_dump())

        # Debugging: Print the response body to understand the error
        print("Response text:", response.text)

        # Validate response
        assert response.status_code == 201
        assert response.json() == {
            "success": True,
            "message": "User created successfully",
            "data": {"id": "user-123", "userName": "test@abc.com"},
        }
