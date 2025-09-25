from enum import Enum


class SessionKeys(str, Enum):
    SESSION_USER_ACCESS_TOKEN_KEY = "access_token"
    RETURN_TO_PAGE = "returnToPage"
    CALLBACK_ROUTE_NAME = "callback_route"
    SESSION_USER_TOKEN = "token"
    RP_CLIENT_ID_KEY = "rp_client_id"
