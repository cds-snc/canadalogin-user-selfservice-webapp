import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from app.password.service import get_password_policy
from fastapi.testclient import TestClient
from app.main import app
from app.config import Settings, IBMVerifyConfig
from pydantic import BaseModel, ValidationError


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_settings(scope="session"):
    # Return a mocked Settings object with the required configuration
    return Settings(
        ibm_verify_config=IBMVerifyConfig(
            IBM_VERIFY_TENANT_URL="https://fake.ibm.com",
            IBM_VERIFY_API_CLIENT_ID="client_id",
            IBM_VERIFY_API_CLIENT_SECRET="client_secret",
        )
    )


@pytest.mark.asyncio
@patch("app.password.service.AsyncClient")
@patch("app.password.service.get_admin_token", new_callable=AsyncMock)
@patch("app.password.service.get_settings")
@patch("app.password.service.get_auth_request_headers")
async def test_get_password_policy_success(
    mock_headers,
    mock_get_settings,
    mock_get_token,
    mock_client_class,
    mock_settings,  # 2 fixtures
    client,
):
    mock_get_settings.return_value = mock_settings
    # Mock token
    mock_get_token.return_value = "fake_token"

    # Mock headers
    mock_headers.return_value = {"Authorization": "Bearer fake_token"}

    # Mock HTTP response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "minLength": 8,
        "maxLength": 16,
        "requireUppercase": True,
        "requireLowercase": True,
        "requireNumber": True,
        "requireSpecialCharacter": False,
    }
    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client_class.return_value.__aenter__.return_value = mock_client

    # Patch model
    with patch(
        "app.password.service.IBMVerifyPasswordPolicy",
        return_value="validated_model",
    ):
        result = await get_password_policy()

    assert result.success is True
    assert result.data == "validated_model"


@pytest.mark.asyncio
@patch("app.password.service.get_settings")
@patch("app.password.service.get_admin_token", new_callable=AsyncMock)
async def test_get_password_policy_token_failure(
    mock_get_token, mock_get_settings, mock_settings, client
):
    mock_get_settings.return_value = mock_settings
    mock_get_token.return_value = None

    with pytest.raises(HTTPException) as exc:
        await get_password_policy()

    assert exc.value.status_code == 500
    assert "Failed to get access token" in exc.value.detail


@pytest.mark.asyncio
@patch("app.password.service.get_admin_token", new_callable=AsyncMock)
@patch("app.password.service.AsyncClient")
@patch("app.password.service.get_auth_request_headers")
@patch("app.password.service.get_settings")
async def test_get_password_policy_http_error(
    mock_get_settings,
    mock_headers,
    mock_client_class,
    mock_get_token,
    mock_settings,
    client,
):
    mock_get_settings.return_value = mock_settings
    mock_get_token.return_value = "fake_token"
    mock_headers.return_value = {"Authorization": "Bearer fake_token"}

    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.json.return_value = {}

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client_class.return_value.__aenter__.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        await get_password_policy()

    assert exc.value.status_code == 401
    assert "Failed to get password policy" in exc.value.detail


class DummyModel(BaseModel):
    minLength: int


@pytest.mark.asyncio
@patch("app.password.service.get_admin_token", new_callable=AsyncMock)
@patch("app.password.service.AsyncClient")
@patch("app.password.service.get_auth_request_headers")
@patch("app.password.service.get_settings")
async def test_get_password_policy_validation_error(
    mock_get_settings,
    mock_headers,
    mock_client_class,
    mock_get_token,
    mock_settings,
    client,
):
    mock_get_settings.return_value = mock_settings

    mock_get_token.return_value = "fake_token"
    mock_headers.return_value = {"Authorization": "Bearer fake_token"}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"invalid": "data"}

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client_class.return_value.__aenter__.return_value = mock_client

    with patch("app.password.service.IBMVerifyPasswordPolicy") as mock_model:
        try:
            DummyModel.model_validate({"invalid": "data"})
        except ValidationError as e:
            mock_model.side_effect = e

        with pytest.raises(HTTPException) as exc:
            await get_password_policy()

    assert exc.value.status_code == 422
    assert "Response validation error" in exc.value.detail


@patch("app.password.v1_router.get_password_policy", new_callable=AsyncMock)
def test_policy_endpoint_success(mock_policy_func, client):
    mock_policy_func.return_value = {
        "success": True,
        "data": {
            "schemas": ["schema1"],
            "passwordMinAlphaChars": 2,
            "passwordMinOtherChars": 2,
            "pwdMinAge": 0,
            "pwdExpireWarning": 5,
            "pwdInHistory": 5,
            "pwdLockout": True,
            "pwdLockoutDuration": 10,
            "pwdMaxAge": 90,
            "pwdMaxFailure": 5,
            "pwdMinLength": 8,
            "pwdGraceLoginLimit": 2,
            "pwdMustChange": False,
            "pwdAllowUserChange": True,
            "pwdFailureCountInterval": 10,
            "passwordMaxRepeatedChars": 3,
            "pwdSafeModify": True,
            "passwordMaxConsecutiveRepeatedChars": 2,
            "passwordMinDiffChars": 4,
            "pwdCheckSyntax": 1,
            "ibm_pwdPolicy": True,
        },
        "message": "Password policy retrieved successfully",
    }

    response = client.get("/v1/password/policy")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "data" in response.json()


@patch("app.password.v1_router.get_password_policy", new_callable=AsyncMock)
def test_policy_endpoint_token_failure(mock_policy_func, client):
    mock_policy_func.side_effect = HTTPException(
        status_code=500, detail="Failed to get access token"
    )

    response = client.get("/v1/password/policy")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to get access token"


@patch("app.password.v1_router.get_password_policy", new_callable=AsyncMock)
def test_policy_endpoint_http_error(mock_policy_func, client):
    mock_policy_func.side_effect = HTTPException(
        status_code=401, detail="Failed to get password policy"
    )

    response = client.get("/v1/password/policy")
    assert response.status_code == 401
    assert response.json()["detail"] == "Failed to get password policy"


@patch("app.password.v1_router.get_password_policy", new_callable=AsyncMock)
def test_policy_endpoint_validation_error(mock_policy_func, client):
    mock_policy_func.side_effect = HTTPException(
        status_code=422, detail="Response validation error"
    )

    response = client.get("/v1/password/policy")
    assert response.status_code == 422
    assert response.json()["detail"] == "Response validation error"
