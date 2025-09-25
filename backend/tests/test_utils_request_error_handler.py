import pytest
from fastapi import HTTPException
from httpx import HTTPStatusError, Request, Response
from pydantic import BaseModel, ValidationError
from authlib.integrations.starlette_client import OAuthError
from httpx import TimeoutException
from app.utils.request_error_handler import RequestErrorHandler


class DummyModel(BaseModel):
    foo: str


def make_http_status_error(
    status_code, json_body=None, text_body=None, url="http://test"
):
    response = Response(
        status_code=status_code,
        content=text_body.encode() if text_body else None,
        json=json_body,
        request=Request("GET", url),
    )
    exc = HTTPStatusError("Error", request=response.request, response=response)
    return exc


def test_handle_validation_error():
    try:
        DummyModel.validate({"foo": 123})  # invalid type: expecting str, got int
    except ValidationError as ve:
        with pytest.raises(HTTPException) as e:
            RequestErrorHandler.handle(ve, context="Validation test")
        assert e.value.status_code == 422
        assert "Validation Error" in e.value.detail


def test_handle_http_exception_re_raises():
    exc = HTTPException(status_code=403, detail="Forbidden")
    # simulate active exception context to allow bare raise inside handler
    try:
        raise exc
    except HTTPException as caught_exc:
        with pytest.raises(HTTPException) as e:
            RequestErrorHandler.handle(caught_exc, context="HTTPException test")
    assert e.value.status_code == 403


def test_handle_oauth_error_re_raises():
    exc = OAuthError("OAuth problem")
    try:
        raise exc
    except OAuthError as caught_exc:
        with pytest.raises(OAuthError):
            RequestErrorHandler.handle(caught_exc, context="OAuthError test")


def test_handle_http_status_error_429():
    exc = make_http_status_error(
        status_code=429,
        json_body={"messageId": "TooManyRequests"},
    )
    with pytest.raises(HTTPException) as e:
        RequestErrorHandler.handle(exc, context="429 test")
    assert e.value.status_code == 429
    assert "TooManyRequests" in e.value.detail


def test_handle_http_status_error_400():
    exc = make_http_status_error(
        status_code=400,
        json_body={"messageId": "BadRequest"},
    )
    with pytest.raises(HTTPException) as e:
        RequestErrorHandler.handle(exc, context="400 test")
    assert e.value.status_code == 400
    assert "BadRequest" in e.value.detail


def test_handle_http_status_error_401():
    exc = make_http_status_error(
        status_code=401,
        json_body={"messageId": "Unauthorized"},
    )
    with pytest.raises(OAuthError):
        RequestErrorHandler.handle(exc, context="401 test")


def test_handle_http_status_error_other():
    exc = make_http_status_error(
        status_code=500,
        json_body={"detail": "ServerError"},
    )
    with pytest.raises(HTTPException) as e:
        RequestErrorHandler.handle(exc, context="500 test")
    assert e.value.status_code == 500
    assert "500 test failed" in e.value.detail


def test_handle_timeout_exception():
    exc = TimeoutException("timeout")
    with pytest.raises(HTTPException) as e:
        RequestErrorHandler.handle(exc, context="timeout test")
    assert e.value.status_code == 504
    assert "timeout test timed out" in e.value.detail


def test_handle_unexpected_exception():
    exc = Exception("unexpected")
    with pytest.raises(HTTPException) as e:
        RequestErrorHandler.handle(exc, context="unexpected test")
    assert e.value.status_code == 500
    assert "Unexpected unexpected test error" in e.value.detail
