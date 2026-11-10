import hashlib

from fastapi import Request

from app.constants.redis_keys import RedisKeys
from app.utils.redis import get_redis_client

OIDC_SESSION_INDEX_PREFIX = "oidc_session_index:"
OIDC_SESSION_INDEX_TTL_SECONDS = 12 * 60 * 60


def get_oidc_sid_fingerprint(sid: str) -> str:
    return hashlib.sha256(sid.encode("utf-8")).hexdigest()


def get_oidc_session_index_key(sid: str) -> str:
    return f"{OIDC_SESSION_INDEX_PREFIX}{get_oidc_sid_fingerprint(sid)}"


def get_logout_marker_key(sid: str) -> str:
    return (
        f"{RedisKeys.REDIS_LOGOUT_SESSION_KEY.value}" f"{get_oidc_sid_fingerprint(sid)}"
    )


async def associate_oidc_session(
    request: Request, sid: str, app_session_id: str
) -> None:
    redis_client = get_redis_client(request)
    index_key = get_oidc_session_index_key(sid)
    await redis_client.sadd(index_key, app_session_id)
    await redis_client.expire(index_key, OIDC_SESSION_INDEX_TTL_SECONDS)


async def get_associated_session_ids(request: Request, sid: str) -> set[str]:
    redis_client = get_redis_client(request)
    session_ids = await redis_client.smembers(get_oidc_session_index_key(sid))
    return {
        session_id.decode("utf-8") if isinstance(session_id, bytes) else str(session_id)
        for session_id in session_ids
    }


async def remove_oidc_session_association(request: Request, sid: str) -> None:
    redis_client = get_redis_client(request)
    await redis_client.delete(get_oidc_session_index_key(sid))
