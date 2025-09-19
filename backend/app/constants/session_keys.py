from enum import Enum


class SessionKeys(str, Enum):
    SESSION_USER_ACCESS_TOKEN_KEY = "access_token"
    RETURN_TO_PAGE = "returnToPage"
    CALLBACK_ROUTE_NAME = "callback_route"
    SESSION_USER_INFO = "user_info"
    SESSION_USER_REFRESH_TOKEN_KEY = "user_refresh_token"
    SESSION_EXPIRY = "session_expiry"
    SESSION_USER_ID_TOKEN_KEY = "user_id_token"
    SESSION_USER_TOKEN = "token"
