import importlib

import pytest
from app.fido2.schemas import FIDO2UserResponseModel
from app.password.schemas import OtpType as PhoneOtpType
from app.users.schemas import UserPhoneAuthFactorsResponse, UserPhoneOTP
from fastapi import HTTPException, status
from httpx import AsyncClient

guard_module = importlib.import_module("app.users.services.mfa_delete_guard")
assert_remaining_mfa_factor_after_deletion = (
    guard_module.assert_remaining_mfa_factor_after_deletion
)


@pytest.mark.asyncio
async def test_blocks_deletion_when_last_enabled_mfa_factor_is_removed(monkeypatch):
    async def mock_get_user_otp_factors(client, user_access_token, validated=None):
        return UserPhoneAuthFactorsResponse(success=True, data=[], message="ok")

    async def mock_get_user_fido2_registrations(client, user_access_token):
        return FIDO2UserResponseModel(
            success=True,
            data={
                "fido2": [
                    {
                        "id": "registration-123",
                        "userId": "user-456",
                        "type": "fido2",
                        "created": "2024-01-15T10:30:00Z",
                        "updated": "2024-01-15T10:30:00Z",
                        "enabled": True,
                        "validated": True,
                        "attributes": {"nickname": "Only Passkey"},
                        "references": {"rpUuid": "rp-uuid-123"},
                    }
                ]
            },
            message="ok",
        )

    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_fido2_registrations",
        mock_get_user_fido2_registrations,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await assert_remaining_mfa_factor_after_deletion(
                http_client=client,
                user_access_token="user-token-abc",
                fido2_registration_ids_to_delete={"registration-123"},
            )

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
    assert exc_info.value.detail == "Cannot delete last remaining MFA factor"


@pytest.mark.asyncio
async def test_allows_otp_deletion_when_enabled_passkey_remains(monkeypatch):
    async def mock_get_user_otp_factors(client, user_access_token, validated=None):
        return UserPhoneAuthFactorsResponse(
            success=True,
            data=[
                UserPhoneOTP(
                    id="factor-123",
                    type=PhoneOtpType.SMSOTP,
                    destination="5551234567",
                )
            ],
            message="ok",
        )

    async def mock_get_user_fido2_registrations(client, user_access_token):
        return FIDO2UserResponseModel(
            success=True,
            data={
                "fido2": [
                    {
                        "id": "registration-123",
                        "userId": "user-456",
                        "type": "fido2",
                        "created": "2024-01-15T10:30:00Z",
                        "updated": "2024-01-15T10:30:00Z",
                        "enabled": True,
                        "validated": True,
                        "attributes": {"nickname": "Backup Passkey"},
                        "references": {"rpUuid": "rp-uuid-123"},
                    }
                ]
            },
            message="ok",
        )

    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_fido2_registrations",
        mock_get_user_fido2_registrations,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        await assert_remaining_mfa_factor_after_deletion(
            http_client=client,
            user_access_token="user-token-abc",
            otp_factor_ids_to_delete={"factor-123"},
        )


@pytest.mark.asyncio
async def test_skips_fido2_lookup_when_otp_factor_still_remains(monkeypatch):
    async def mock_get_user_otp_factors(client, user_access_token, validated=None):
        return UserPhoneAuthFactorsResponse(
            success=True,
            data=[
                UserPhoneOTP(
                    id="factor-123",
                    type=PhoneOtpType.SMSOTP,
                    destination="5551234567",
                ),
                UserPhoneOTP(
                    id="factor-456",
                    type=PhoneOtpType.VOICEOTP,
                    destination="5559876543",
                ),
            ],
            message="ok",
        )

    async def mock_get_user_fido2_registrations(client, user_access_token):
        raise AssertionError("FIDO2 lookup should not be called when OTP remains")

    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_fido2_registrations",
        mock_get_user_fido2_registrations,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        await assert_remaining_mfa_factor_after_deletion(
            http_client=client,
            user_access_token="user-token-abc",
            otp_factor_ids_to_delete={"factor-123"},
        )


@pytest.mark.asyncio
async def test_ignores_disabled_passkeys_when_counting_remaining_factors(monkeypatch):
    async def mock_get_user_otp_factors(client, user_access_token, validated=None):
        return UserPhoneAuthFactorsResponse(success=True, data=[], message="ok")

    async def mock_get_user_fido2_registrations(client, user_access_token):
        return FIDO2UserResponseModel(
            success=True,
            data={
                "fido2": [
                    {
                        "id": "registration-123",
                        "userId": "user-456",
                        "type": "fido2",
                        "created": "2024-01-15T10:30:00Z",
                        "updated": "2024-01-15T10:30:00Z",
                        "enabled": False,
                        "validated": True,
                        "attributes": {"nickname": "Disabled Passkey"},
                        "references": {"rpUuid": "rp-uuid-123"},
                    }
                ]
            },
            message="ok",
        )

    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_otp_factors",
        mock_get_user_otp_factors,
    )
    monkeypatch.setattr(
        "app.users.services.mfa_delete_guard.get_user_fido2_registrations",
        mock_get_user_fido2_registrations,
    )

    async with AsyncClient(base_url="http://localhost") as client:
        with pytest.raises(HTTPException) as exc_info:
            await assert_remaining_mfa_factor_after_deletion(
                http_client=client,
                user_access_token="user-token-abc",
            )

    assert exc_info.value.status_code == status.HTTP_409_CONFLICT
