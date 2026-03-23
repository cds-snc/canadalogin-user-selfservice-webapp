from datetime import datetime

import pytest
from app.password.schemas import OtpType
from app.users.schemas import (
    Attributes,
    Factor,
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
    assert result[0]["destination"].endswith("8901")


@pytest.mark.asyncio
async def test_parse_phone_auth_factors_response_empty():
    data = UserAuthFactorsIbmResponse(
        factors=[],
        count=0,
        limit=10,
        page=1,
        total=0,
    )
    response = await parse_phone_auth_factors_response(data)
    assert response == []


@pytest.mark.asyncio
async def test_get_user_otp_factors_mocked(monkeypatch):
    # Mock dispatch_user_auth_factors to return a valid response

    async def mock_dispatch_user_auth_factors(
        client, user_access_token, validated=True
    ):
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

    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        result = await get_user_otp_factors(client, "fake-access-token")
        assert isinstance(result, UserPhoneAuthFactorsResponse)
        assert result.success is True
        assert isinstance(result.data, list)
        assert all(isinstance(factor, UserPhoneOTP) for factor in result.data)
        assert result.data[0].id == "factor1"
        assert result.data[0].type == OtpType.SMSOTP
        assert result.data[0].destination.endswith("8901")


@pytest.mark.asyncio
async def test_get_user_otp_factors_no_otp_factors(monkeypatch):

    async def mock_dispatch_user_auth_factors(
        client, user_access_token, validated=True
    ):
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

    monkeypatch.setattr(
        "app.users.services.otp_factors.dispatch_user_auth_factors",
        mock_dispatch_user_auth_factors,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        response = await get_user_otp_factors(client, "fake-access-token")
        assert response.data == []


# Tests for unmasked phone number functionality
@pytest.mark.asyncio
async def test_parse_phone_auth_factors_response_unmasked():
    """Test that unmasked parsing returns actual phone numbers"""
    from app.users.services.otp_factors import (
        parse_phone_auth_factors_response,
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

    result = await parse_phone_auth_factors_response(data, False)
    assert isinstance(result, list)
    assert result[0]["id"] == "factor1"
    assert result[0]["type"] == OtpType.SMSOTP.value
    # Should return the actual phone number, not masked
    assert result[0]["destination"] == "+1 234-567-8901"


@pytest.mark.asyncio
async def test_get_user_otp_factor(monkeypatch):
    """Test getting unmasked user OTP factors"""
    from app.users.services.otp_factors import get_user_otp_factor

    async def mock_dispatch_user_auth_factors(
        client, user_access_token, validated=True
    ):
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
        result = await get_user_otp_factor(client, "fake-access-token", "factor123")
        assert result["id"] == "factor123"
        assert result["type"] == OtpType.SMSOTP.value
        # Should return unmasked phone number
        assert result["destination"] == "+1 234-567-8901"
