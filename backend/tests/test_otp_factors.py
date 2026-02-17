from datetime import datetime

import pytest
from app.password.schemas import OtpType
from app.users.schemas import (
    Attributes,
    Factor,
    IBMVerifyUserProfileSchema,
    ProfileResponse,
    UserAuthFactorsIbmResponse,
    UserPhoneAuthFactorsResponse,
    UserPhoneOTP,
)
from app.users.services.otp_factors import (
    get_user_otp_factors,
    parse_phone_auth_factors_response,
)
from app.utils.string_masking import mask_phone_number
from fastapi import HTTPException
from httpx import AsyncClient

profile_import_path = "app.users.services.otp_factors.get_my_profile"


@pytest.mark.asyncio
async def test_mask_phone_number_valid():
    phone = "+1 234-567-8901"
    masked = mask_phone_number(phone)
    assert masked == "+1 (***) ***-8901"


@pytest.mark.asyncio
async def test_mask_phone_number_invalid():
    import phonenumbers

    phone = "invalid-phone"
    with pytest.raises(
        phonenumbers.NumberParseException,
        match="The string supplied did not seem to be a phone number.",
    ):
        mask_phone_number(phone)


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
    assert result[0]["id"] == "factor1"
    assert result[0]["type"] == OtpType.SMSOTP.value
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

    async def mock_dispatch_user_auth_factors(client, user_profile_id, validated=True):
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

    monkeypatch.setattr(profile_import_path, mock_my_profile)
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
        assert result.data[0].id == "factor1"
        assert result.data[0].type == OtpType.SMSOTP
        assert result.data[0].phoneNumber.endswith("8901")


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

    async def mock_dispatch_user_auth_factors(client, user_profile_id, validated=True):
        # Missing required fields for Factor → will cause ValidationError
        return {
            "factors": [{"invalid": "data"}],
            "count": 1,
            "limit": 10,
            "page": 1,
            "total": 1,
        }

    monkeypatch.setattr(profile_import_path, mock_my_profile)
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

    async def mock_dispatch_user_auth_factors(client, user_profile_id, validated=True):
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

    monkeypatch.setattr(profile_import_path, mock_my_profile)
    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException):
            await get_user_otp_factors(client, "user123", "fake-token")


# Tests for unmasked phone number functionality
@pytest.mark.asyncio
async def test_parse_phone_auth_factors_response_unmasked():
    """Test that unmasked parsing returns actual phone numbers"""
    from app.users.services.otp_factors import (
        parse_phone_auth_factors_response_unmasked,
    )

    factor = Factor(
        id="factor1",
        userId="user1",
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

    result = await parse_phone_auth_factors_response_unmasked(data)
    assert isinstance(result, list)
    assert result[0]["id"] == "factor1"
    assert result[0]["type"] == OtpType.SMSOTP.value
    # Should return the actual phone number, not masked
    assert result[0]["destination"] == "+1 234-567-8901"


@pytest.mark.asyncio
async def test_get_user_otp_factor(monkeypatch):
    """Test getting unmasked user OTP factors"""
    from app.users.services.otp_factors import get_user_otp_factor

    async def mock_dispatch_user_auth_factors(client, user_id, validated=True):
        return {
            "factors": [
                {
                    "id": "factor123",
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

    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        result = await get_user_otp_factor(client, "user123", "factor123")
        assert result["id"] == "factor123"
        assert result["type"] == OtpType.SMSOTP.value
        # Should return unmasked phone number
        assert result["destination"] == "+1 234-567-8901"
