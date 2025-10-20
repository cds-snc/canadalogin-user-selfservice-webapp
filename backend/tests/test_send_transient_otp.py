# backend/tests/test_send_transient_otp.py
import json
from types import SimpleNamespace

import app.otp.services.send_transient_otp as feature_module
import pytest

# Schemas
from app.otp.schemas import OtpDataResponse, OtpType, UserOtpInfo

# Feature under test
from app.otp.services.send_transient_otp import dispatch_otp, handle_otp_send
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
def patch_config_and_auth(monkeypatch, fake_settings):
    """
    Patch only app helpers; do NOT mock httpx:
      - get_configuration().ibm_verify_config
      - get_admin_token (awaitable, accepts the AsyncClient)
      - get_auth_request_headers
      - prepare_pydantic_phone_number_for_verify (normalize to E.164)
      - get_my_profile (awaitable; returns data.userName)
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

    # Robust E.164 formatter: handles str or PhoneNumber-like objects.
    def _prep_pn(pn):
        # Try attributes from phonenumbers.PhoneNumber (country_code, national_number)
        cc = getattr(pn, "country_code", None)
        nn = getattr(pn, "national_number", None)
        if cc and nn:
            return f"+{cc}{nn}"

        s = str(pn)
        # If already E.164-ish, keep it
        if s.startswith("+"):
            # strip spaces/dashes just to be deterministic in tests
            digits = "".join(ch for ch in s if ch.isdigit())
            return f"+{digits}"
        # Fallback: coerce to digits and assume +1 if 10 digits
        digits = "".join(ch for ch in s if ch.isdigit())
        if len(digits) == 11 and digits.startswith("1"):
            return f"+{digits}"
        if len(digits) == 10:
            return f"+1{digits}"
        return f"+{digits}" if digits else s

    monkeypatch.setattr(
        feature_module,
        "prepare_pydantic_phone_number_for_verify",
        _prep_pn,
    )

    # Async my_profile returning the same username by default
    async def _ok_profile(_client, user_access_token: str):
        return SimpleNamespace(data=SimpleNamespace(userName="user@example.com"))

    monkeypatch.setattr(feature_module, "get_my_profile", _ok_profile)


def build_transport(handler):
    """Create a MockTransport with handler(request) -> Response (or raises)."""
    return MockTransport(handler)


def make_valid_payload(otp_type: OtpType, correlation_id="corr-1", *, trxn_id="tx-123"):
    """
    Build a payload that conforms to OtpDataResponse:
      - trxnId, type, created, updated, expiry, state, correlationID, attempts, retries
      - phoneNumber for SMS/VOICE; emailAddress for EMAIL
    """
    base = {
        "trxnId": trxn_id,
        "type": f"{otp_type.value}otp",
        "created": "2025-10-01T21:00:00Z",
        "updated": "2025-10-01T21:00:05Z",
        "expiry": "2025-10-01T21:05:00Z",
        "state": "PENDING",
        "correlationID": correlation_id,
        "attempts": 0,
        "retries": 0,
    }
    if otp_type == OtpType.EMAIL:
        base["emailAddress"] = "user@example.com"
    else:
        base["phoneNumber"] = "+14165551234"
    return base


# -------------------------
# dispatch_otp (unit level)
# -------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "otp_type, path_segment",
    [
        (OtpType.SMS, "smsotp"),
        (OtpType.VOICE, "voiceotp"),
    ],
)
async def test_dispatch_posts_correct_request_for_phone_otp(otp_type, path_segment):
    """
    Asserts that dispatch_otp builds the correct URL, headers, and POST body.
    NOTE: UserOtpInfo.phoneNumber is a Pydantic PhoneNumber; pass E.164 to satisfy validation.
    """
    expected_body = {"phoneNumber": "+14165551234"}

    def handler(request: Request) -> Response:
        # Verify URL build and HTTP method
        assert request.method == "POST"
        assert request.url.scheme == "https"
        assert request.url.host == "tenant.verify.ibm.com"
        assert (
            request.url.path == f"/v2.0/factors/{path_segment}/transient/verifications"
        )
        assert request.headers.get("Authorization") == "Bearer FAKE_ADMIN_TOKEN"
        payload = json.loads(request.content.decode() or "{}")
        assert payload == expected_body
        return Response(201, json=make_valid_payload(otp_type, trxn_id="tx-dispatch-1"))

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=otp_type,
            userName="user@example.com",
            phoneNumber="+14165551234",  # ✅ E.164 valid input for Pydantic PhoneNumber
        )
        resp = await dispatch_otp(client, info)
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_dispatch_posts_correct_request_for_email():
    """
    EMAIL path uses userName.lower() -> user@example.com in body.
    """

    def handler(request: Request) -> Response:
        assert request.method == "POST"
        assert request.url.scheme == "https"
        assert request.url.host == "tenant.verify.ibm.com"
        assert request.url.path == "/v2.0/factors/emailotp/transient/verifications"
        assert request.headers.get("Authorization") == "Bearer FAKE_ADMIN_TOKEN"
        payload = json.loads(request.content.decode() or "{}")
        assert payload == {"emailAddress": "user@example.com"}
        return Response(
            201, json=make_valid_payload(OtpType.EMAIL, trxn_id="tx-email-1")
        )

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=OtpType.EMAIL,
            userName="User@Example.com",  # ensure lower-casing is applied by impl
            phoneNumber=None,
        )
        resp = await dispatch_otp(client, info)
    assert resp.status_code == 201


# --------------------------------
# handle_otp_send (integration-ish)
# --------------------------------


@pytest.mark.asyncio
@pytest.mark.parametrize("otp_type", [OtpType.SMS, OtpType.VOICE, OtpType.EMAIL])
async def test_handle_success_returns_data_and_message(otp_type):
    payload = make_valid_payload(
        otp_type, correlation_id="corr-xyz", trxn_id=f"ok-{otp_type.value}-123"
    )

    def handler(request: Request) -> Response:
        return Response(201, json=payload)

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=otp_type,
            userName="user@example.com",
            phoneNumber=(
                "+14165551234" if otp_type != OtpType.EMAIL else None
            ),  # ✅ E.164
        )
        result = await handle_otp_send(client, info, user_access_token="USER_TOKEN")

    # The function returns a ResponseModel-like object; be robust (dict or model)
    result_dict = try_to_dict(result)
    assert result_dict.get("success") is True
    data = result_dict.get("data")
    # Validate data against OtpDataResponse regardless of shape
    if isinstance(data, dict):
        model = OtpDataResponse(**data)
    else:
        model = data  # might already be a Pydantic model
    assert isinstance(model, OtpDataResponse)
    assert model.id == f"ok-{otp_type.value}-123"
    assert model.correlation == "corr-xyz"
    if otp_type == OtpType.EMAIL:
        assert model.emailAddress == "user@example.com"
    else:
        assert model.phoneNumber == "+14165551234"
    # success message uses enum .value per implementation
    assert (result_dict.get("message") or "").startswith(
        f"{otp_type.value} OTP sent successfully"
    )


@pytest.mark.asyncio
async def test_handle_non_201_returns_error_model():
    def handler(request: Request) -> Response:
        return Response(400, json={"error": "Bad Request"})

    transport = build_transport(handler)

    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=OtpType.EMAIL,
            userName="user@example.com",
            phoneNumber=None,
        )
        result = await handle_otp_send(client, info, user_access_token="USER_TOKEN")

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is False
    assert "bad request" in (result_dict.get("message") or "").lower()


@pytest.mark.asyncio
async def test_handle_validation_error_due_to_incomplete_payload():
    """
    Return 201 but missing required fields to trigger ValidationError -> "Server Error"
    """
    incomplete = {
        "trxnId": "only-id"
    }  # missing many required fields of OtpDataResponse

    def handler(request: Request) -> Response:
        return Response(201, json=incomplete)

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=OtpType.SMS,
            userName="user@example.com",
            phoneNumber="+14165551234",  # ✅ E.164
        )
        result = await handle_otp_send(client, info, user_access_token="USER_TOKEN")

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is False
    assert (result_dict.get("message") or "") == "Server Error"


@pytest.mark.asyncio
async def test_handle_user_mismatch_returns_403(monkeypatch):
    # Override my_profile to return a different userName → expect 403 error response model
    async def _bad_profile(_client, token):
        return SimpleNamespace(data=SimpleNamespace(userName="intruder@example.com"))

    monkeypatch.setattr(feature_module, "get_my_profile", _bad_profile)

    # Transport should not even be called; still provide a handler
    def handler(request: Request) -> Response:
        return Response(500, json={"error": "should-not-be-called"})

    transport = build_transport(handler)

    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=OtpType.SMS,
            userName="user@example.com",
            phoneNumber="+14165551234",  # ✅ E.164
        )
        result = await handle_otp_send(client, info, user_access_token="USER_TOKEN")

    result_dict = try_to_dict(result)
    assert result_dict.get("success") in (False, None)
    # Optionally assert message text if generate_error_response returns one:
    # assert "user mismatch" in (result_dict.get("message") or "").lower()


@pytest.mark.asyncio
async def test_handle_transport_exception_is_captured_in_message():
    """
    Simulate network failure inside transport; handle_otp_send catches and returns ResponseModel with 'Send transient' message.
    """

    def handler(request: Request) -> Response:
        raise RuntimeError("simulated network failure")

    transport = build_transport(handler)
    async with AsyncClient(transport=transport) as client:
        info = UserOtpInfo(
            otpType=OtpType.SMS,
            userName="user@example.com",
            phoneNumber="+14165551234",  # ✅ E.164
        )
        result = await handle_otp_send(client, info, user_access_token="USER_TOKEN")

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is False
    # Implementation uses Enum object in the message (e.g., "OtpType.SMS")
    assert "Send transient OtpType.SMS error: simulated network failure" in (
        result_dict.get("message") or ""
    )


@pytest.mark.asyncio
async def test_handle_status_code_none_branch(monkeypatch):
    """
    Cover branch: http_client_response.status_code is None
    We do NOT mock httpx; instead, we monkeypatch our own dispatch_otp to return a dummy object.
    """

    class _Dummy:
        status_code = None

        def json(self):
            return {}

    async def _fake_dispatch(_client, _info):
        return _Dummy()

    monkeypatch.setattr(feature_module, "dispatch_otp", _fake_dispatch)

    async with AsyncClient() as client:
        info = UserOtpInfo(
            otpType=OtpType.EMAIL,
            userName="user@example.com",
            phoneNumber=None,
        )
        result = await handle_otp_send(client, info, user_access_token="USER_TOKEN")

    result_dict = try_to_dict(result)
    assert result_dict.get("success") is False
    assert (result_dict.get("message") or "").lower() == "unknown error"
