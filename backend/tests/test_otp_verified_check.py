# backend/tests/test_otp_verified_check.py
import json

import app.otp.services.verify_transient_otp as feature_module
import pytest

# Schemas
from app.otp.schemas import OtpType, UserOtpVerificationInfo

# Feature under test
from app.otp.services.verify_transient_otp import handle_otp_verification, verify_otp
from fastapi import HTTPException
from httpx import AsyncClient, MockTransport, Request, Response

# -----------------------
# Helpers for assertions
# -----------------------


def try_to_dict(value):
    """Best-effort conversion of ResponseModel-like objects to a dict."""
    if isinstance(value, dict):
        return value
    for meth in ("model_dump", "dict"):
        fn = getattr(value, meth, None)
        if callable(fn):
            try:
                return fn()
            except Exception:
                pass
    return {"_repr": repr(value)}


def build_transport(handler):
    """Create a MockTransport with handler(request) -> Response (or raises)."""
    return MockTransport(handler)


# -----------------------
# Common test scaffolding
# -----------------------


@pytest.fixture
def fake_settings():
    class _VerifyConfig:
        IBM_VERIFY_TENANT_URL = "https://tenant.verify.ibm.com"

    class _Config:
        ibm_verify_config = _VerifyConfig()

    return _Config()


@pytest.fixture(autouse=True)
def patch_config_and_helpers(monkeypatch, fake_settings):
    """
    Patch only app helpers/types (do NOT mock httpx):
      - get_configuration().ibm_verify_config
      - get_admin_token (awaitable, accepts the AsyncClient)
      - get_auth_request_headers
      - format_error_response (simplify for assertions)
      - generate_error_response (simplify for assertions)
      - RequestErrorHandler.handle (default: re-raise original exception)
    """
    # Config
    monkeypatch.setattr(feature_module, "get_configuration", lambda: fake_settings)

    # Async get_admin_token(client) -> "FAKE_ADMIN_TOKEN"
    async def _fake_admin_token(_client):
        return "FAKE_ADMIN_TOKEN"

    monkeypatch.setattr(feature_module, "get_admin_token", _fake_admin_token)

    # Auth headers
    monkeypatch.setattr(
        feature_module,
        "get_auth_request_headers",
        lambda token, is_json=True: {"Authorization": f"Bearer {token}"},
    )

    # Error formatting/utilities
    def _format_error_response(blob):
        if isinstance(blob, dict):
            return blob.get("error", json.dumps(blob))
        return str(blob)

    monkeypatch.setattr(feature_module, "format_error_response", _format_error_response)

    def _generate_error_response(status_code, message):
        # Minimal, assertion-friendly shape
        return {"success": False, "status": status_code, "message": str(message)}

    monkeypatch.setattr(
        feature_module, "generate_error_response", _generate_error_response
    )

    # Default RequestErrorHandler: re-raise original exception
    class _REH:
        @staticmethod
        def handle(e):
            raise e

    monkeypatch.setattr(feature_module, "RequestErrorHandler", _REH)


# -------------------------
# verify_otp (unit level)
# -------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "otp_type, segment",
    [
        (OtpType.SMS, "smsotp"),
        (OtpType.VOICE, "voiceotp"),
        (OtpType.EMAIL, "emailotp"),
    ],
)
async def test_verify_otp_posts_right_endpoint_and_body(otp_type, segment):
    """
    verify_otp must POST to the correct endpoint with JSON {"otp": "..."} and auth headers,
    and return the raw httpx.Response (204 expected for success).
    """
    trxn_id = f"tx-{otp_type.value}-123"
    otp_value = "654321"

    def handler(request: Request) -> Response:
        assert request.method == "POST"
        assert request.url.scheme == "https"
        assert request.url.host == "tenant.verify.ibm.com"
        assert (
            request.url.path
            == f"/v2.0/factors/{segment}/transient/verifications/{trxn_id}"
        )
        assert request.headers.get("Authorization") == "Bearer FAKE_ADMIN_TOKEN"
        body = json.loads(request.content.decode() or "{}")
        assert body == {"otp": otp_value}
        # 204 No Content is the expected success for verification
        return Response(204)

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(otp=otp_value, trxnId=trxn_id, otpType=otp_type)
        resp = await verify_otp(client, data)
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_verify_otp_transport_error_calls_error_handler():
    """
    If the transport raises, verify_otp should call RequestErrorHandler.handle(e).
    Our default fixture re-raises the original error, so caller sees a RuntimeError.
    """

    def handler(request: Request) -> Response:
        raise RuntimeError("simulated network failure")

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="111111", trxnId="tx-err-1", otpType=OtpType.SMS
        )
        with pytest.raises(RuntimeError) as excinfo:
            await verify_otp(client, data)
        assert "simulated network failure" in str(excinfo.value)


# --------------------------------
# handle_otp_verification (higher)
# --------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("otp_type", [OtpType.SMS, OtpType.VOICE, OtpType.EMAIL])
async def test_handle_otp_verification_success_returns_model(otp_type):
    """
    204 from verify_otp should return ResponseModel(success=True, message='<type> OTP has been verified')
    (Message uses otpType.value in implementation.)
    """

    def handler(request: Request) -> Response:
        return Response(204)  # success for verification

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="123456", trxnId=f"ok-{otp_type.value}-1", otpType=otp_type
        )
        result = await handle_otp_verification(client, data)

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is True
    msg = result_dict.get("message") or ""
    assert msg == f"{otp_type.value} OTP has been verified"


@pytest.mark.asyncio
async def test_handle_otp_verification_non_204_returns_error_model(monkeypatch):
    """
    To hit the non-204 branch in handle_otp_verification, we must *bypass* the raise_for_status()
    inside verify_otp. We do that by monkeypatching verify_otp to return an httpx.Response(400, ...).
    """

    async def _fake_verify(_client, _data):
        return Response(400, json={"error": "Bad Request"})

    monkeypatch.setattr(feature_module, "verify_otp", _fake_verify)

    async with AsyncClient() as client:
        data = UserOtpVerificationInfo(
            otp="123456", trxnId="bad-1", otpType=OtpType.EMAIL
        )
        result = await handle_otp_verification(client, data)

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is False
    assert result_dict.get("status") == 400
    assert result_dict.get("message") == "Bad Request"


@pytest.mark.asyncio
async def test_handle_otp_verification_status_code_none_branch(monkeypatch):
    """
    Cover the branch where verify_otp returns an object with status_code=None.
    (We do not mock httpx; we patch our own verify_otp function to return a dummy.)
    """

    class _Dummy:
        status_code = None

        def json(self):
            return {}

    async def _fake_verify(_client, _data):
        return _Dummy()

    monkeypatch.setattr(feature_module, "verify_otp", _fake_verify)

    async with AsyncClient() as client:
        data = UserOtpVerificationInfo(
            otp="999999", trxnId="none-1", otpType=OtpType.SMS
        )
        result = await handle_otp_verification(client, data)

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is False
    assert result_dict.get("status") == 400
    assert (result_dict.get("message") or "").lower() == "unknown error"


@pytest.mark.asyncio
async def test_handle_otp_verification_transport_exception_translates_to_http_exception():
    """
    If verify_otp/transport raises (and our default error handler re-raises that error),
    handle_otp_verification catches it in the general 'except Exception' and raises HTTPException(400)
    with detail 'OtpType.<X> verification error: <message>'.
    """

    def handler(request: Request) -> Response:
        raise RuntimeError("simulated network failure")

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="123456", trxnId="err-2", otpType=OtpType.VOICE
        )
        with pytest.raises(HTTPException) as excinfo:
            await handle_otp_verification(client, data)

    exc: HTTPException = excinfo.value
    assert exc.status_code == 400
    # Implementation uses the Enum object (not .value) in the error detail:
    # f"{user_verification_data.otpType} verification error: ..."
    assert "OtpType.VOICE verification error: simulated network failure" in exc.detail
