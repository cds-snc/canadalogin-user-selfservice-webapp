import pytest
from authlib.jose.errors import JoseError
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException, status

from app.auth.services import auth_logout
from app.auth.services.auth_session_index import (
    OIDC_SESSION_INDEX_TTL_SECONDS,
    get_logout_marker_key,
    get_oidc_session_index_key,
)
from app.constants.redis_keys import RedisKeys


class _Claims(dict):
    def validate(self, leeway=0):
        return True


@pytest.mark.asyncio
async def test_is_logout_processed_false_when_no_sid():
    # empty or falsy sid should return False without calling Redis
    result = await auth_logout.is_logout_processed(AsyncMock(), "")
    assert result is False


@pytest.mark.asyncio
async def test_is_logout_processed_true_when_in_redis():
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value=b"processed")

    with patch(
        "app.auth.services.auth_logout.get_redis_client", return_value=mock_redis
    ):
        result = await auth_logout.is_logout_processed(AsyncMock(), "sid123")
        assert result is True
        expected_key = get_logout_marker_key("sid123")
        mock_redis.get.assert_awaited_once_with(expected_key)


@pytest.mark.asyncio
async def test_mark_session_logout_sets_hashed_redis_key_without_logging_sid(caplog):
    mock_redis = MagicMock()
    mock_redis.setex = AsyncMock()

    with patch(
        "app.auth.services.auth_logout.get_redis_client", return_value=mock_redis
    ):
        await auth_logout.mark_session_logout(
            AsyncMock(), "sid123", source="test_source", expiration_seconds=60
        )
        expected_key = get_logout_marker_key("sid123")
        mock_redis.setex.assert_awaited_once_with(expected_key, 60, "test_source")
        assert "sid123" not in caplog.text


@pytest.mark.asyncio
async def test_backchannel_logout_already_processed():
    mock_request = AsyncMock()

    with (
        patch(
            "app.auth.services.auth_logout.validate_logout_token",
            new_callable=AsyncMock,
        ) as mock_validate,
        patch(
            "app.auth.services.auth_logout.is_logout_processed",
            new_callable=AsyncMock,
            return_value=True,
        ),
    ):
        mock_validate.return_value = {"sid": "sidX", "jti": "jtiX"}

        response = await auth_logout.backchannel_logout(mock_request)

        assert response.success is True
        assert response.message == "Backchannel logout already processed"


@pytest.mark.asyncio
async def test_backchannel_logout_deletes_indexed_and_legacy_sessions_without_sid_logs(
    caplog,
):
    mock_request = AsyncMock()
    caplog.set_level("DEBUG")

    with (
        patch(
            "app.auth.services.auth_logout.validate_logout_token",
            new_callable=AsyncMock,
        ) as mock_validate,
        patch("app.auth.services.auth_logout.get_redis_client") as mock_get_redis,
        patch(
            "app.auth.services.auth_logout.is_logout_processed",
            new_callable=AsyncMock,
            return_value=False,
        ),
        patch(
            "app.auth.services.auth_logout.get_associated_session_ids",
            new_callable=AsyncMock,
            return_value={"app-session-1", "app-session-2"},
        ),
        patch(
            "app.auth.services.auth_logout.remove_oidc_session_association",
            new_callable=AsyncMock,
        ) as mock_remove_association,
        patch(
            "app.auth.services.auth_logout.mark_session_logout", new_callable=AsyncMock
        ) as mock_mark,
    ):
        mock_validate.return_value = {"sid": "sidY", "jti": "jtiY"}
        mock_redis = MagicMock()
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.delete = AsyncMock()
        mock_get_redis.return_value = mock_redis

        response = await auth_logout.backchannel_logout(mock_request)

        assert response.success is True
        assert response.message == "Backchannel logout successful"

        expected_delete_keys = {
            f"{RedisKeys.REDIS_SESSION_KEY.value}app-session-1",
            f"{RedisKeys.REDIS_SESSION_KEY.value}app-session-2",
            f"{RedisKeys.REDIS_SESSION_KEY.value}sidY",
        }
        assert set(mock_redis.delete.await_args.args) == expected_delete_keys
    mock_remove_association.assert_awaited_once_with(mock_request, "sidY")
    mock_mark.assert_awaited_once_with(
        mock_request, "sidY", source="backchannel_logout"
    )
    assert "sidY" not in caplog.text


@pytest.mark.asyncio
async def test_associate_oidc_session_stores_generated_id_under_sid_fingerprint():
    mock_redis = MagicMock()
    mock_redis.sadd = AsyncMock()
    mock_redis.expire = AsyncMock()
    mock_request = AsyncMock()

    with patch(
        "app.auth.services.auth_session_index.get_redis_client",
        return_value=mock_redis,
    ):
        from app.auth.services.auth_session_index import associate_oidc_session

        await associate_oidc_session(mock_request, "private-sid", "app-session-id")

    index_key = get_oidc_session_index_key("private-sid")
    assert "private-sid" not in index_key
    mock_redis.sadd.assert_awaited_once_with(index_key, "app-session-id")
    mock_redis.expire.assert_awaited_once_with(
        index_key, OIDC_SESSION_INDEX_TTL_SECONDS
    )


@pytest.mark.asyncio
async def test_backchannel_logout_missing_sid_is_bad_request():
    with patch(
        "app.auth.services.auth_logout.validate_logout_token",
        new_callable=AsyncMock,
        return_value={"jti": "jtiX"},
    ):
        with pytest.raises(HTTPException) as exc_info:
            await auth_logout.backchannel_logout(AsyncMock())

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_validate_logout_token_success():
    mock_request = AsyncMock()
    mock_request.form = AsyncMock(return_value={"logout_token": "token123"})

    # Mock oauth.verify client
    mock_client = MagicMock()
    mock_client.client_id = "client-id-1"
    mock_client.fetch_jwk_set = AsyncMock(return_value={})

    # Patch oauth.verify and jwt.decode
    with (
        patch("app.auth.services.auth_logout.oauth", new=MagicMock(verify=mock_client)),
        patch("app.auth.services.auth_logout.create_load_key", return_value="loadkey"),
        patch(
            "app.auth.services.auth_logout.jwt.decode",
            return_value=_Claims({"sid": "s1", "jti": "j1"}),
        ),
    ):
        claims = await auth_logout.validate_logout_token(mock_request)
        assert isinstance(claims, dict)
        assert claims.get("sid") == "s1"


@pytest.mark.asyncio
async def test_validate_logout_token_missing_token_raises():
    mock_request = AsyncMock()
    mock_request.form = AsyncMock(return_value={})

    with patch(
        "app.auth.services.auth_logout.oauth", new=MagicMock(verify=MagicMock())
    ):
        with pytest.raises(HTTPException) as exc_info:
            await auth_logout.validate_logout_token(mock_request)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_validate_logout_token_unregistered_oauth_client_is_server_error():
    mock_request = AsyncMock()
    mock_request.form = AsyncMock(return_value={"logout_token": "token123"})

    with patch("app.auth.services.auth_logout.oauth", new=MagicMock(verify=None)):
        with pytest.raises(RuntimeError, match="not registered"):
            await auth_logout.validate_logout_token(mock_request)


@pytest.mark.asyncio
async def test_validate_logout_token_jose_error_raises():
    mock_request = AsyncMock()
    mock_request.form = AsyncMock(return_value={"logout_token": "token123"})

    mock_client = MagicMock()
    mock_client.client_id = "client-id-1"
    mock_client.fetch_jwk_set = AsyncMock(return_value={})

    with (
        patch("app.auth.services.auth_logout.oauth", new=MagicMock(verify=mock_client)),
        patch("app.auth.services.auth_logout.create_load_key", return_value="loadkey"),
        patch(
            "app.auth.services.auth_logout.jwt.decode",
            side_effect=JoseError("bad token"),
        ),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await auth_logout.validate_logout_token(mock_request)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


def test_validate_logout_events_and_reject_nonce():
    # events contains the required URI
    events = {"http://schemas.openid.net/event/backchannel-logout": {}}
    assert auth_logout._validate_logout_events({}, events) is True

    # nonce must be None
    assert auth_logout._reject_nonce({}, None) is True
    assert auth_logout._reject_nonce({}, "not-none") is False


@pytest.mark.asyncio
async def test_logout_user_success():
    # Setup request/app/state/config
    mock_request = AsyncMock()

    class C:
        pass

    cfg = C()
    cfg.end_session_endpoint = "https://oidc.example/logout"
    mock_request.app = MagicMock()
    mock_request.app.state = MagicMock()
    mock_request.app.state.config = cfg

    # session.clear
    mock_request.session = MagicMock()
    mock_request.session.clear = MagicMock()

    # Mock get_user_info and get_base_profile_management_url and mark_session_logout
    with (
        patch(
            "app.auth.services.auth_logout.get_user_info", new_callable=AsyncMock
        ) as mock_user_info,
        patch(
            "app.auth.services.auth_logout.get_base_profile_management_url",
            return_value="https://pm.example/post",
        ),
        patch(
            "app.auth.services.auth_logout.mark_session_logout", new_callable=AsyncMock
        ) as mock_mark,
    ):
        mock_user_info.return_value = {"locale": "fr", "sid": "session123"}

        resp = await auth_logout.logout_user(mock_request, "idtok-xyz")

        assert resp.success is True
        assert resp.message == "Redirect url to logout"
        assert resp.data.redirect_url.startswith("https://oidc.example/logout?")
        # session cleared and mark_session_logout called
        mock_request.session.clear.assert_called_once()
    # logout_user calls mark_session_logout(request, sid=..., source=...)
    mock_mark.assert_awaited_once_with(
        mock_request, sid="session123", source="logout_button"
    )


@pytest.mark.asyncio
async def test_validate_logout_token_missing_events_raises():
    # simulate decode returning claims whose validate() raises JoseError for missing events
    mock_request = AsyncMock()
    mock_request.form = AsyncMock(return_value={"logout_token": "token123"})

    mock_client = MagicMock()
    mock_client.client_id = "client-id-1"
    mock_client.fetch_jwk_set = AsyncMock(return_value={})

    class BadClaims(dict):
        def validate(self, leeway=0):
            raise JoseError("missing events")

    with (
        patch("app.auth.services.auth_logout.oauth", new=MagicMock(verify=mock_client)),
        patch("app.auth.services.auth_logout.create_load_key", return_value="loadkey"),
        patch("app.auth.services.auth_logout.jwt.decode", return_value=BadClaims()),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await auth_logout.validate_logout_token(mock_request)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_validate_logout_token_missing_jti_raises():
    # simulate decode returning claims whose validate() raises JoseError for missing jti
    mock_request = AsyncMock()
    mock_request.form = AsyncMock(return_value={"logout_token": "token123"})

    mock_client = MagicMock()
    mock_client.client_id = "client-id-1"
    mock_client.fetch_jwk_set = AsyncMock(return_value={})

    class BadClaims2(dict):
        def validate(self, leeway=0):
            raise JoseError("missing jti")

    with (
        patch("app.auth.services.auth_logout.oauth", new=MagicMock(verify=mock_client)),
        patch("app.auth.services.auth_logout.create_load_key", return_value="loadkey"),
        patch("app.auth.services.auth_logout.jwt.decode", return_value=BadClaims2()),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await auth_logout.validate_logout_token(mock_request)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
