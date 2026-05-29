# backend/tests/test_otp_verified_check.py
import json

import app.otp.services.verify_transient_otp as feature_module
import pytest

# Schemas
from app.otp.schemas import OtpType, UserOtpVerificationInfo

# Feature under test
from app.otp.services.verify_transient_otp import handle_otp_verification, verify_otp
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
      - get_auth_request_headers
      - format_error_response (simplify for assertions)
      - generate_error_response (simplify for assertions)
      - RequestErrorHandler.handle (default: re-raise original exception)
    """
    # Config
    monkeypatch.setattr(feature_module, "get_configuration", lambda: fake_settings)

    # Auth headers
    monkeypatch.setattr(
        feature_module,
        "get_auth_request_headers",
        lambda token, is_json=True, language=None: {"Authorization": f"Bearer {token}"},
    )


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
        assert request.headers.get("Authorization") == "Bearer USER_TOKEN"
        body = json.loads(request.content.decode() or "{}")
        assert body == {"otp": otp_value}
        # 204 No Content is the expected success for verification
        return Response(204)

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(otp=otp_value, trxnId=trxn_id, otpType=otp_type)
        resp = await verify_otp(client, data, "USER_TOKEN")
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
            await verify_otp(client, data, "USER_TOKEN")
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
        result = await handle_otp_verification(client, data, "USER_TOKEN")

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is True
    msg = result_dict.get("message") or ""
    assert msg == f"{otp_type.value} OTP has been verified"


# -----------------------------------------------
# verify_otp: wrong code — structured error detail
# -----------------------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "otp_type",
    [OtpType.SMS, OtpType.VOICE, OtpType.EMAIL],
)
async def test_verify_otp_wrong_code_raises_400_with_attempts(otp_type):
    """
    When IBM Verify returns a non-204 response (wrong OTP), verify_otp must raise
    HTTPException(400) with structured detail containing messageId, attempts, retries.
    The attempts/retries are fetched from the retrieve endpoint (GET).
    """
    from fastapi import HTTPException

    def handler(request: Request) -> Response:
        if request.method == "POST":
            return Response(
                400,
                json={
                    "messageId": "CSIAM0011E",
                },
            )
        # GET — retrieve endpoint returns attempts/retries
        return Response(
            200,
            json={
                "attempts": 2,
                "retries": 2,
            },
        )

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="000000", trxnId="tx-wrong-1", otpType=otp_type
        )
        with pytest.raises(HTTPException) as excinfo:
            await verify_otp(client, data, "USER_TOKEN")

    exc = excinfo.value
    assert exc.status_code == 400
    assert exc.detail["message"] == "CSIAM0011E"
    assert exc.detail["attempts"] == 2
    assert exc.detail["retries"] == 2


@pytest.mark.asyncio
async def test_verify_otp_wrong_code_zero_retries_raises_400():
    """
    When IBM Verify returns a non-204 response with retries=0, verify_otp raises
    HTTPException(400) with retries=0 in the detail.
    """
    from fastapi import HTTPException

    def handler(request: Request) -> Response:
        if request.method == "POST":
            return Response(
                400,
                json={
                    "messageId": "CSIAM0011E",
                },
            )
        # GET — retrieve endpoint returns retries=0
        return Response(
            200,
            json={
                "attempts": 4,
                "retries": 0,
            },
        )

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="000000", trxnId="tx-no-retries", otpType=OtpType.SMS
        )
        with pytest.raises(HTTPException) as excinfo:
            await verify_otp(client, data, "USER_TOKEN")

    exc = excinfo.value
    assert exc.status_code == 400
    assert exc.detail["retries"] == 0


@pytest.mark.asyncio
async def test_verify_otp_non_json_error_body_uses_default_message_id():
    """
    When IBM Verify returns a non-204 response with a non-JSON body, verify_otp
    raises HTTPException(400) with the default messageId fallback.
    The retrieve endpoint also fails, so attempts/retries are None.
    """
    from fastapi import HTTPException

    def handler(request: Request) -> Response:
        if request.method == "POST":
            return Response(400, content=b"Bad Request")
        # GET also fails — simulate retrieve endpoint unavailable
        return Response(500, content=b"Internal Server Error")

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="000000", trxnId="tx-non-json", otpType=OtpType.SMS
        )
        with pytest.raises(HTTPException) as excinfo:
            await verify_otp(client, data, "USER_TOKEN")

    exc = excinfo.value
    assert exc.status_code == 400
    assert exc.detail["message"] == "UNKNOWN"
    assert exc.detail["attempts"] is None
    assert exc.detail["retries"] is None


@pytest.mark.asyncio
@pytest.mark.parametrize("otp_type", [OtpType.SMS, OtpType.VOICE, OtpType.EMAIL])
async def test_handle_otp_verification_wrong_code_propagates_http_exception(otp_type):
    """
    handle_otp_verification propagates the HTTPException raised by verify_otp
    when IBM Verify rejects the OTP code.
    """
    from fastapi import HTTPException

    def handler(request: Request) -> Response:
        if request.method == "POST":
            return Response(
                400,
                json={"messageId": "CSIAM0011E"},
            )
        # GET — retrieve endpoint returns attempts/retries
        return Response(
            200,
            json={"attempts": 1, "retries": 3},
        )

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        data = UserOtpVerificationInfo(
            otp="000000", trxnId=f"tx-fail-{otp_type.value}", otpType=otp_type
        )
        with pytest.raises(HTTPException) as excinfo:
            await handle_otp_verification(client, data, "USER_TOKEN")

    exc = excinfo.value
    assert exc.status_code == 400
    assert exc.detail["message"] == "CSIAM0011E"
    assert exc.detail["retries"] == 3
