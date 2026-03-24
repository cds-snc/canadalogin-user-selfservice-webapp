from enum import Enum


class RedisKeys(str, Enum):
    REDIS_SESSION_KEY = "session:"
    REDIS_LOGOUT_SESSION_KEY = "logout_session:"
    FIDO2_MDS_METADATA = "fido2:mds:metadata"
