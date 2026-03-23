# tests/test_retrieve_transient_otp.py
# Also import the module so we can monkeypatch its names directly
import app.otp.services.retrieve_transient_otp as feature_module
import pytest

# Import schemas you provided
from app.otp.schemas import OtpDataResponse, OtpType, RetrievalData

# ⬇️ UPDATE this import to the actual module where your feature functions live
from app.otp.services.retrieve_transient_otp import (
    dispatch_otp_status_retrieval,
    handle_otp_status_retrieval,
)
from fastapi import HTTPException
from httpx import AsyncClient, MockTransport, Request, Response


@pytest.fixture
def fake_settings():
    class _VerifyConfig:
        IBM_VERIFY_TENANT_URL = "https://tenant.verify.ibm.com"

    class _Config:
        ibm_verify_config = _VerifyConfig()

    return _Config()


@pytest.fixture(autouse=True)
def patch_config_and_auth(monkeypatch, fake_settings):
    """
    Patches:
    - get_configuration().ibm_verify_config
    - get_auth_request_headers (returns a minimal header)
    """
    monkeypatch.setattr(feature_module, "get_configuration", lambda: fake_settings)

    monkeypatch.setattr(
        feature_module,
        "get_auth_request_headers",
        lambda token, is_json=True, language=None: {"Authorization": f"Bearer {token}"},
    )


def build_transport(handler):
    """Create a MockTransport with handler(request) -> Response (or raises)."""
    return MockTransport(handler)


def make_valid_payload(otp_type: OtpType, trxn_id: str, correlation_id: str = "corr-1"):
    """Construct a schema-valid payload matching OtpDataResponse."""
    base = {
        "trxnId": trxn_id,
        "type": f"{otp_type.value}otp",  # e.g., smsotp, voiceotp, emailotp
        "created": "2025-10-01T21:00:00Z",
        "updated": "2025-10-01T21:00:10Z",
        "expiry": "2025-10-01T21:05:00Z",
        "state": "DELIVERED",
        "correlationID": correlation_id,
        "attempts": 1,
        "retries": 0,
    }
    if otp_type == OtpType.EMAIL:
        base["emailAddress"] = "user@example.com"
    else:
        base["phoneNumber"] = "+14165551234"
    return base


# -----------------------------
# dispatch_otp_status_retrieval
# -----------------------------
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "otp_type, path_segment",
    [
        (OtpType.SMS, "smsotp"),
        (OtpType.VOICE, "voiceotp"),
        (OtpType.EMAIL, "emailotp"),
    ],
)
async def test_dispatch_success_for_each_otp_type(otp_type, path_segment):
    trxn_id = "abc123"
    expected_path = f"/v2.0/factors/{path_segment}/transient/verifications/{trxn_id}"

    def handler(request: Request) -> Response:
        # Verify URL build and HTTP method
        assert request.method == "GET"
        assert request.url.scheme == "https"
        assert request.url.host == "tenant.verify.ibm.com"
        assert request.url.path == expected_path
        # Return any JSON; dispatch does not validate schema
        return Response(200, json={"ok": True})

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        retrieval_data = RetrievalData(otpType=otp_type, trxnId=trxn_id)
        resp = await dispatch_otp_status_retrieval(client, retrieval_data, "USER_TOKEN")
        assert resp.status_code == 200
        assert resp.json() == {"ok": True}


# -----------------------------
# handle_otp_status_retrieval
# -----------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("otp_type", [OtpType.SMS, OtpType.VOICE, OtpType.EMAIL])
async def test_handle_success_validates_into_OtpDataResponse(otp_type, monkeypatch):
    trxn_id = f"ok-{otp_type.value}-123"
    payload = make_valid_payload(otp_type, trxn_id, correlation_id="corr-xyz")

    # Monkeypatch dispatch to return our payload
    async def fake_dispatch(client, retrieval_data, user_access_token):
        assert isinstance(retrieval_data, RetrievalData)
        return Response(200, json=payload)

    monkeypatch.setattr(feature_module, "dispatch_otp_status_retrieval", fake_dispatch)

    async with AsyncClient() as client:
        rd = RetrievalData(otpType=otp_type, trxnId=trxn_id)
        result = await handle_otp_status_retrieval(client, rd, "USER_TOKEN")

    # Expect enum value in message because implementation uses the Enum directly
    expected_msg_fragment = f"{otp_type} OTP status checked successfully"
    # Possibly a Pydantic ResponseModel instance
    assert getattr(result, "success", None) is True
    data = getattr(result, "data", None)
    assert isinstance(data, OtpDataResponse)
    assert data.id == trxn_id
    assert data.correlation == "corr-xyz"
    if otp_type == OtpType.EMAIL:
        assert data.emailAddress == "us****@example.com"
        assert data.phoneNumber in (None, "")
    else:
        assert data.phoneNumber == "+1 (***) ***-1234"
        assert data.emailAddress in (None, "")
    assert expected_msg_fragment in (getattr(result, "message", "") or "")