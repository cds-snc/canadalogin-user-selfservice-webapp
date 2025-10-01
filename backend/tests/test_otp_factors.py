import pytest
from datetime import datetime
from httpx import AsyncClient
from fastapi import HTTPException
from app.users.schemas import IBMVerifyUserProfileSchema, ProfileResponse

from app.users.services.otp_factors import (
    get_user_otp_factors,
    parse_phone_auth_factors_response,
    mask_phone_last4,
)
from app.users.schemas import (
    UserAuthFactorsIbmResponse,
    UserPhoneOTP,
    UserPhoneAuthFactorsResponse,
    Factor,
    Attributes,
)
from app.password.schemas import OtpType


@pytest.mark.asyncio
async def test_mask_phone_last4_valid():
    phone = "+1 234-567-8901"
    masked = await mask_phone_last4(phone)
    assert masked == "*** *** 8901"


@pytest.mark.asyncio
async def test_mask_phone_last4_invalid():
    phone = "invalid-phone"
    masked = await mask_phone_last4(phone)
    assert masked.startswith("Invalid phone number")


@pytest.mark.asyncio
async def test_parse_phone_auth_factors_response_valid():
    factor = Factor(
        id="factor1",
        userId="user123",
        type=OtpType.SMSOTP.value,
        created=datetime.now(),
        updated=datetime.now(),
        attempted=datetime.now(),
        enabled=True,
        validated=True,
        attributes=Attributes(phoneNumber="+1 234-567-8901"),
    )

    data = UserAuthFactorsIbmResponse(
        factors=[factor],
        count=1,
        limit=10,
        page=1,
        total=1,
    )

    result = await parse_phone_auth_factors_response(data)
    assert isinstance(result, list)
    assert result[0]["phoneNumber"].endswith("8901")


@pytest.mark.asyncio
async def test_parse_phone_auth_factors_response_empty():
    data = UserAuthFactorsIbmResponse(
        factors=[],
        count=0,
        limit=10,
        page=1,
        total=0,
    )
    with pytest.raises(HTTPException) as exc_info:
        await parse_phone_auth_factors_response(data)
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_user_otp_factors_mocked(monkeypatch):
    # Mock my_profile to avoid 401 error

    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Mocked profile",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="mockuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "mockuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Mock User",
                    "givenName": "Mock",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    # Mock dispatch_user_auth_factors to return a valid response

    async def mock_dispatch_user_auth_factors(client, user_profile_id):
        return {
            "factors": [
                {
                    "id": "factor1",
                    "userId": "user123",
                    "type": OtpType.SMSOTP.value,
                    "created": datetime.now().isoformat(),
                    "updated": datetime.now().isoformat(),
                    "attempted": datetime.now().isoformat(),
                    "enabled": True,
                    "validated": True,
                    "attributes": {"phoneNumber": "+1 234-567-8901"},
                }
            ],
            "count": 1,
            "limit": 10,
            "page": 1,
            "total": 1,
        }

    monkeypatch.setattr("app.users.services.otp_factors.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        result = await get_user_otp_factors(client, "user123", "fake-token")
        assert isinstance(result, UserPhoneAuthFactorsResponse)
        assert result.success is True
        assert isinstance(result.data, list)
        assert all(isinstance(factor, UserPhoneOTP) for factor in result.data)


@pytest.mark.asyncio
async def test_get_user_otp_factors_invalid_schema(monkeypatch):
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Mocked profile",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="mockuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "mockuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Mock User",
                    "givenName": "Mock",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    async def mock_dispatch_user_auth_factors(client, user_profile_id):
        # Missing required fields for Factor → will cause ValidationError
        return {
            "factors": [{"invalid": "data"}],
            "count": 1,
            "limit": 10,
            "page": 1,
            "total": 1,
        }

    monkeypatch.setattr("app.users.services.otp_factors.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await get_user_otp_factors(client, "user123", "fake-token")
        assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_get_user_otp_factors_no_otp_factors(monkeypatch):
    async def mock_my_profile(client, token):
        return ProfileResponse(
            success=True,
            message="Mocked profile",
            data=IBMVerifyUserProfileSchema(
                id="user123",
                userName="mockuser@example.com",
                active=True,
                meta={
                    "created": datetime.now().isoformat(),
                    "lastModified": datetime.now().isoformat(),
                    "location": "https://example.com/scim/v2/Users/user123",
                    "resourceType": "User",
                },
                emails=[
                    {"value": "mockuser@example.com", "primary": True, "type": "work"}
                ],
                name={
                    "formatted": "Mock User",
                    "givenName": "Mock",
                    "familyName": "User",
                },
                phoneNumbers=[{"value": "+1 234-567-8901", "type": "mobile"}],
            ),
        )

    async def mock_dispatch_user_auth_factors(client, user_profile_id):
        # Valid schema but no SMSOTP or VOICEOTP types
        return {
            "factors": [
                {
                    "id": "factor1",
                    "userId": "user123",
                    "type": "EMAILOTP",  # not allowed
                    "created": datetime.now().isoformat(),
                    "updated": datetime.now().isoformat(),
                    "attempted": datetime.now().isoformat(),
                    "enabled": True,
                    "validated": True,
                    "attributes": {"phoneNumber": "+1 234-567-8901"},
                }
            ],
            "count": 1,
            "limit": 10,
            "page": 1,
            "total": 1,
        }

    monkeypatch.setattr("app.users.services.otp_factors.my_profile", mock_my_profile)
    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException):
            await get_user_otp_factors(client, "user123", "fake-token")
