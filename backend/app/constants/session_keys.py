from enum import Enum


class SessionKeys(str, Enum):
    SESSION_USER_ACCESS_TOKEN_KEY = "access_token"
    SESSION_USER_ID_TOKEN_KEY = "id_token"
    RETURN_TO_PAGE = "returnToPage"
    CALLBACK_ROUTE_NAME = "callback_route"
