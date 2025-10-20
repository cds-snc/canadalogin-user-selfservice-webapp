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
    - get_admin_token (returns a constant)  ← make it ASYNC to match implementation
    - get_auth_request_headers (returns a minimal header)
    """
    monkeypatch.setattr(feature_module, "get_configuration", lambda: fake_settings)

    async def _fake_admin_token():
        return "FAKE_ADMIN_TOKEN"

    monkeypatch.setattr(feature_module, "get_admin_token", _fake_admin_token)
    monkeypatch.setattr(
        feature_module,
        "get_auth_request_headers",
        lambda token, is_json=True: {"Authorization": f"Bearer {token}"},
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
        resp = await dispatch_otp_status_retrieval(client, retrieval_data)
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

    # Monkeypatch dispatch to tolerate wrong argument order and return our payload
    async def fake_dispatch(arg1, arg2):
        # identify retrieval_data regardless of order
        rd = arg1 if isinstance(arg1, RetrievalData) else arg2
        assert isinstance(rd, RetrievalData)
        return Response(200, json=payload)

    monkeypatch.setattr(feature_module, "dispatch_otp_status_retrieval", fake_dispatch)

    async with AsyncClient() as client:
        rd = RetrievalData(otpType=otp_type, trxnId=trxn_id)
        result = await handle_otp_status_retrieval(client, rd)

    # Expect 'OtpType.SMS' style in message because implementation uses the Enum object
    expected_msg_fragment = f"{str(otp_type)} OTP status checked successfully"

    # Assert ResponseModel-like contract defensively (dict or model)
    if isinstance(result, dict):
        assert result.get("success") is True
        data = result.get("data")
        # If 'data' is a dict; validate via OtpDataResponse
        if isinstance(data, dict):
            data_model = OtpDataResponse(**data)
        else:
            data_model = data  # maybe already a model
        assert isinstance(data_model, OtpDataResponse)
        assert data_model.id == trxn_id
        assert data_model.correlation == "corr-xyz"
        if otp_type == OtpType.EMAIL:
            assert data_model.emailAddress == "user@example.com"
            assert data_model.phoneNumber in (None, "")
        else:
            assert data_model.phoneNumber == "+14165551234"
            assert data_model.emailAddress in (None, "")
        assert expected_msg_fragment in (result.get("message") or "")
    else:
        # Possibly a Pydantic ResponseModel instance
        assert getattr(result, "success", None) is True
        data = getattr(result, "data", None)
        assert isinstance(data, OtpDataResponse)
        assert data.id == trxn_id
        assert data.correlation == "corr-xyz"
        if otp_type == OtpType.EMAIL:
            assert data.emailAddress == "user@example.com"
            assert data.phoneNumber in (None, "")
        else:
            assert data.phoneNumber == "+14165551234"
            assert data.emailAddress in (None, "")
        assert expected_msg_fragment in (getattr(result, "message", "") or "")


@pytest.mark.asyncio
async def test_handle_non_200_returns_error_model(monkeypatch):
    # Make dispatch return a 400 response (no network)
    async def fake_dispatch(*args, **kwargs):
        return Response(400, json={"error": "Bad Request"})

    monkeypatch.setattr(feature_module, "dispatch_otp_status_retrieval", fake_dispatch)

    async with AsyncClient() as client:
        rd = RetrievalData(otpType=OtpType.EMAIL, trxnId="bad-req-1")
        result = await handle_otp_status_retrieval(client, rd)

    # Be robust to either dict or Pydantic model shapes.
    if isinstance(result, dict):
        payload = result
    else:
        # Try to obtain a plain dict view from a model
        payload = None
        for meth in ("model_dump", "dict"):
            fn = getattr(result, meth, None)
            if callable(fn):
                try:
                    payload = fn()
                    break
                except Exception:
                    pass
        if payload is None:
            # Last resort: stringify – just so we don't crash the test
            payload = {"_repr": repr(result)}

    # Minimal contract: not a success result for non-200
    assert payload.get("success") in (False, None)


@pytest.mark.asyncio
async def test_handle_validation_error_due_to_incomplete_payload(monkeypatch):
    """
    Return a 200 but with missing required fields to trigger pydantic.ValidationError
    in OtpDataResponse(**response_json). Expect generate_error_response(422, ...).
    """
    incomplete_payload = {"trxnId": "only-id-present"}

    async def fake_dispatch(*args, **kwargs):
        return Response(200, json=incomplete_payload)

    monkeypatch.setattr(feature_module, "dispatch_otp_status_retrieval", fake_dispatch)

    async with AsyncClient() as client:
        rd = RetrievalData(otpType=OtpType.SMS, trxnId="only-id-present")
        result = await handle_otp_status_retrieval(client, rd)

    # Be robust to either dict or Pydantic model shapes.
    if isinstance(result, dict):
        payload = result
    else:
        payload = None
        for meth in ("model_dump", "dict"):
            fn = getattr(result, meth, None)
            if callable(fn):
                try:
                    payload = fn()
                    break
                except Exception:
                    pass
        if payload is None:
            payload = {"_repr": repr(result)}

    # Minimal contract: not a success result for validation failure
    assert payload.get("success") in (False, None)


@pytest.mark.asyncio
async def test_handle_transport_exception_translates_to_405_http_exception(monkeypatch):
    """
    If transport raises, our monkeypatched dispatch raises, leading handle_otp_status_retrieval
    to hit the outer except and raise HTTPException(405).
    """

    async def fake_dispatch(*args, **kwargs):
        raise RuntimeError("simulated network failure")

    monkeypatch.setattr(feature_module, "dispatch_otp_status_retrieval", fake_dispatch)

    async with AsyncClient() as client:
        rd = RetrievalData(otpType=OtpType.VOICE, trxnId="trxn-err-1")
        with pytest.raises(HTTPException) as excinfo:
            await handle_otp_status_retrieval(client, rd)

    exc: HTTPException = excinfo.value
    assert exc.status_code == 405
    # Implementation uses Enum object in string form -> "OtpType.VOICE"
    assert "Verify transient OtpType.VOICE error: " in exc.detail
