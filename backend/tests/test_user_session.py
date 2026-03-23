import pytest
from datetime import datetime

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from authlib.integrations.starlette_client import OAuthError

from unittest.mock import patch, AsyncMock, MagicMock

from app.auth.services import auth_user_session
from app.constants.session_keys import SessionKeys


@pytest.mark.asyncio
async def test_set_rp_client_id_in_session_sets_value():
    mock_request = MagicMock()
    key = SessionKeys.RP_CLIENT_ID_KEY.value
    mock_request.query_params = {key: "rp-abc"}
    mock_request.session = {}

    auth_user_session.set_rp_client_id_in_session(mock_request)

    assert mock_request.session.get(key) == "rp-abc"


@pytest.mark.asyncio
async def test_get_session_data_by_id_returns_none_when_missing():
    mock_request = MagicMock()
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=None)

    with patch(
        "app.auth.services.auth_user_session.get_redis_client", return_value=mock_redis
    ):
        result = await auth_user_session.get_session_data_by_id(mock_request, "sid123")
        assert result is None


@pytest.mark.asyncio
async def test_get_session_data_by_id_decodes_bytes_to_dict():
    mock_request = MagicMock()
    session_json = b'{"a": 1, "__metadata__": {"last_access": 10}}'
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=session_json)

    with patch(
        "app.auth.services.auth_user_session.get_redis_client", return_value=mock_redis
    ):
        result = await auth_user_session.get_session_data_by_id(mock_request, "sid456")
        assert isinstance(result, dict)
        assert result.get("a") == 1


@pytest.mark.asyncio
async def test_is_backchannel_logout_false_when_no_sid():
    mock_request = AsyncMock()
    result = await auth_user_session.is_backchannel_logout(mock_request, "")
    assert result is False


@pytest.mark.asyncio
async def test_is_backchannel_logout_true_when_backchannel_value():
    mock_request = MagicMock()
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=b"backchannel_logout")

    with patch(
        "app.auth.services.auth_user_session.get_redis_client", return_value=mock_redis
    ):
        result = await auth_user_session.is_backchannel_logout(mock_request, "sid789")
        assert result is True


@pytest.mark.asyncio
async def test_is_backchannel_logout_false_for_other_value():
    mock_request = MagicMock()
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=b"processed")

    with patch(
        "app.auth.services.auth_user_session.get_redis_client", return_value=mock_redis
    ):
        result = await auth_user_session.is_backchannel_logout(mock_request, "sid000")
        assert result is False


def test_update_session_tokens_updates_session_dict():
    mock_request = MagicMock()
    mock_request.session = {}
    new_tokens = {"access_token": "at-1", "refresh_token": "rt-1"}

    auth_user_session.update_session_tokens(mock_request, new_tokens)

    assert (
        mock_request.session[SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value] == "at-1"
    )
    assert mock_request.session[SessionKeys.SESSION_USER_TOKEN.value] == new_tokens


@pytest.mark.asyncio
async def test_refresh_token_calls_oauth_and_returns_tokens():
    mock_fetch = AsyncMock(return_value={"access_token": "new-at"})
    mock_oauth = MagicMock()
    mock_oauth.verify = MagicMock(fetch_access_token=mock_fetch)

    with patch("app.auth.services.auth_user_session.oauth", new=mock_oauth):
        tokens = await auth_user_session.refresh_user_token("refresh-xyz")
        assert tokens.get("access_token") == "new-at"


@pytest.mark.asyncio
async def test_introspect_user_token_success():
    mock_http_client = AsyncMock()
    # Prepare response object
    resp = MagicMock()
    resp.raise_for_status = MagicMock()
    resp.json = MagicMock(return_value={"active": True})
    mock_http_client.post = AsyncMock(return_value=resp)

    with (
        patch(
            "app.auth.services.auth_user_session.get_admin_token",
            new_callable=AsyncMock,
            return_value="admintok",
        ),
        patch(
            "app.auth.services.auth_user_session.get_auth_request_headers",
            return_value={},
        ),
        patch(
            "app.auth.services.auth_user_session.get_configuration",
            return_value=MagicMock(
                introspect_token_api_endpoint="https://introspect",
                ibm_verify_config=MagicMock(
                    IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID="cid",
                    IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET="secret",
                ),
            ),
        ),
    ):
        result = await auth_user_session.introspect_user_token(
            mock_http_client, "user-at-1"
        )
        assert result is not None
        assert result.get("active") is True


@pytest.mark.asyncio
async def test_get_http_client_returns_client():
    mock_request = MagicMock()
    client = AsyncMock()
    mock_request.app = MagicMock()
    mock_request.app.state = MagicMock()
    mock_request.app.state.request_client = client

    got = await auth_user_session.get_http_client(mock_request)
    assert got is client


@pytest.mark.asyncio
async def test_get_users_current_session_inactive_clears_and_raises():
    mock_request = MagicMock()
    mock_request.query_params = {}
    mock_request.session = MagicMock()
    mock_request.session.get = MagicMock(return_value="user-at-1")
    # simulate introspect returning inactive -> session cleared and OAuthError raised
    resp_data = {"active": False}
    with patch(
        "app.auth.services.auth_user_session.introspect_user_token",
        new=AsyncMock(return_value=resp_data),
    ):
        with pytest.raises(OAuthError):
            await auth_user_session.get_users_current_session(mock_request)
        mock_request.session.clear.assert_called_once()


@pytest.mark.asyncio
async def test_ensure_user_token_errors_and_token_wrappers():
    # no token
    mock_request = MagicMock()
    mock_request.session = {}
    with pytest.raises(OAuthError):
        await auth_user_session.ensure_user_token(mock_request)

    # token with expires but no refresh_token
    mock_request.session = {SessionKeys.SESSION_USER_TOKEN.value: {"expires_at": 1}}
    with pytest.raises(OAuthError):
        await auth_user_session.ensure_user_token(mock_request)

    # token wrappers: get_user_info, access_token, id_token, refresh_token
    token = {
        "userinfo": {"sid": "s1"},
        "access_token": "at",
        "id_token": "id",
        "refresh_token": "rt",
    }
    with patch(
        "app.auth.services.auth_user_session.ensure_user_token",
        new=AsyncMock(return_value=token),
    ):
        inf = await auth_user_session.get_user_info(MagicMock())
        assert inf == token.get("userinfo")
        at = await auth_user_session.get_user_access_token(MagicMock())
        assert at == "at"
        iid = await auth_user_session.get_user_id_token(MagicMock())
        assert iid == "id"
        rt = await auth_user_session.get_user_refresh_token(MagicMock())
        assert rt == "rt"


@pytest.mark.asyncio
async def test_session_event_sse_generator_oautherror_and_no_sid():
    # oauth error path
    mock_request = MagicMock()
    config = MagicMock(CORS_ORIGINS="*")
    with patch(
        "app.auth.services.auth_user_session.get_configuration", return_value=config
    ):
        with patch(
            "app.auth.services.auth_user_session.get_user_info",
            new=AsyncMock(side_effect=OAuthError("no")),
        ):
            resp = await auth_user_session.session_event_sse_generator(mock_request)
            assert isinstance(resp, StreamingResponse)
            assert resp.media_type == "text/event-stream"

    # no sid path
    with patch(
        "app.auth.services.auth_user_session.get_configuration", return_value=config
    ):
        with patch(
            "app.auth.services.auth_user_session.get_user_info",
            new=AsyncMock(return_value={}),
        ):
            resp2 = await auth_user_session.session_event_sse_generator(mock_request)
            assert isinstance(resp2, StreamingResponse)
            assert resp2.media_type == "text/event-stream"


@pytest.mark.asyncio
async def test_session_extend_active():
    mock_request = MagicMock()
    # user is authenticated and created recently
    with (
        patch(
            "app.auth.services.auth_user_session.get_user_info",
            new_callable=AsyncMock,
            return_value={"sid": "s1"},
        ),
        patch(
            "app.auth.services.auth_user_session.get_session_metadata",
            return_value={"last_access": 1000, "created": datetime.now().timestamp()},
        ),
    ):
        with patch(
            "app.auth.services.auth_user_session.get_configuration",
            return_value=MagicMock(session_config=MagicMock(SESSION_LIFETIME=3600)),
        ):
            resp = await auth_user_session.session_extend(mock_request)
            assert resp.success is True
            assert resp.message == "Session is active"


@pytest.mark.asyncio
async def test_session_event_stream_active_and_expired():
    mock_request = MagicMock()
    config = MagicMock(
        session_config=MagicMock(SESSION_LIFETIME=3600), CORS_ORIGINS="*"
    )
    # user_info returns sid
    with (
        patch(
            "app.auth.services.auth_user_session.get_configuration", return_value=config
        ),
        patch(
            "app.auth.services.auth_user_session.get_user_info",
            new=AsyncMock(return_value={"sid": "s1"}),
        ),
        patch(
            "app.auth.services.auth_user_session.get_session_data_by_id",
            new=AsyncMock(side_effect=[{"__metadata__": {"last_access": 100}}, None]),
        ),
        patch(
            "app.auth.services.auth_user_session.is_backchannel_logout",
            new=AsyncMock(return_value=False),
        ),
        patch(
            "app.auth.services.auth_user_session.asyncio.sleep",
            new=AsyncMock(return_value=None),
        ),
    ):
        resp = await auth_user_session.session_event_sse_generator(mock_request)
        collected = []
        async for chunk in resp.body_iterator:
            collected.append(chunk)
            # stop after we see the expired event
            if any(
                "event: expired" in (c.decode() if isinstance(c, bytes) else c)
                for c in collected
            ):
                break

        joined = "".join(c.decode() if isinstance(c, bytes) else c for c in collected)
        assert "event: notification" in joined
        assert "event: expired" in joined


@pytest.mark.asyncio
async def test_session_event_stream_terminated_on_backchannel():
    mock_request = MagicMock()
    config = MagicMock(
        session_config=MagicMock(SESSION_LIFETIME=3600), CORS_ORIGINS="*"
    )
    with (
        patch(
            "app.auth.services.auth_user_session.get_configuration", return_value=config
        ),
        patch(
            "app.auth.services.auth_user_session.get_user_info",
            new=AsyncMock(return_value={"sid": "s1"}),
        ),
        patch(
            "app.auth.services.auth_user_session.get_session_data_by_id",
            new=AsyncMock(side_effect=[None]),
        ),
        patch(
            "app.auth.services.auth_user_session.is_backchannel_logout",
            new=AsyncMock(return_value=True),
        ),
    ):
        resp = await auth_user_session.session_event_sse_generator(mock_request)
        collected = []
        async for chunk in resp.body_iterator:
            collected.append(chunk)
            if any(
                "event: terminated" in (c.decode() if isinstance(c, bytes) else c)
                for c in collected
            ):
                break

        joined = "".join(c.decode() if isinstance(c, bytes) else c for c in collected)
        assert "event: terminated" in joined


@pytest.mark.asyncio
async def test_session_event_stream_handles_internal_error():
    mock_request = MagicMock()
    config = MagicMock(
        session_config=MagicMock(SESSION_LIFETIME=3600), CORS_ORIGINS="*"
    )
    with (
        patch(
            "app.auth.services.auth_user_session.get_configuration", return_value=config
        ),
        patch(
            "app.auth.services.auth_user_session.get_user_info",
            new=AsyncMock(return_value={"sid": "s1"}),
        ),
        patch(
            "app.auth.services.auth_user_session.get_session_data_by_id",
            new=AsyncMock(side_effect=Exception("boom")),
        ),
        patch(
            "app.auth.services.auth_user_session.asyncio.sleep",
            new=AsyncMock(return_value=None),
        ),
    ):
        resp = await auth_user_session.session_event_sse_generator(mock_request)
        collected = []
        async for chunk in resp.body_iterator:
            collected.append(chunk)
            if any(
                "event: error" in (c.decode() if isinstance(c, bytes) else c)
                for c in collected
            ):
                break

        joined = "".join(c.decode() if isinstance(c, bytes) else c for c in collected)
        assert "event: error" in joined


@pytest.mark.asyncio
async def test_get_users_current_session_raises_when_no_token():
    mock_request = MagicMock()
    mock_request.session = {}

    with pytest.raises(OAuthError):
        await auth_user_session.get_users_current_session(mock_request)


@pytest.mark.asyncio
async def test_ensure_user_token_refreshes_and_updates_session():
    mock_request = MagicMock()
    # existing user token that is about to expire
    new_token = {"access_token": "at-new", "userinfo": {"sid": "s1"}}
    old_token = {
        "expires_at": 1,
        "refresh_token": "refresh-token-value",
        "userinfo": {"sid": "s1"},
    }
    mock_request.session = {
        SessionKeys.SESSION_USER_TOKEN.value: old_token,
        SessionKeys.SESSION_USER_ACCESS_TOKEN_KEY.value: "at-old",
    }

    # Mock the oauth.verify client and its fetch_access_token method
    mock_oauth_verify = MagicMock()
    mock_oauth_verify.fetch_access_token = AsyncMock(return_value=new_token)

    with (
        patch(
            "app.auth.services.auth_user_session.update_session_tokens", new=MagicMock()
        ) as mock_update,
        patch(
            "app.auth.services.auth_user_session.oauth.verify",
            mock_oauth_verify,
            create=True,
        ),
    ):
        result = await auth_user_session.ensure_user_token(mock_request)
        assert result == new_token
        mock_update.assert_called_once()
        mock_oauth_verify.fetch_access_token.assert_called_once_with(
            refresh_token="refresh-token-value", grant_type="refresh_token"
        )


@pytest.mark.asyncio
async def test_session_extend_terminated_when_too_old():
    mock_request = MagicMock()
    # user is authenticated
    with (
        patch(
            "app.auth.services.auth_user_session.get_user_info",
            new_callable=AsyncMock,
            return_value={"sid": "s1"},
        ),
        patch(
            "app.auth.services.auth_user_session.get_session_metadata",
            return_value={"last_access": 10, "created": 0},
        ),
    ):
        # make configuration have reasonable session lifetime
        with patch(
            "app.auth.services.auth_user_session.get_configuration",
            return_value=MagicMock(session_config=MagicMock(SESSION_LIFETIME=3600)),
        ):
            resp = await auth_user_session.session_extend(mock_request)
            assert resp.success is False
            assert resp.message == "Session terminated"
