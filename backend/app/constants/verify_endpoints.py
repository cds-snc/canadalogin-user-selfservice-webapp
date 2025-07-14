from enum import Enum


class VerifyAPIEndpoint(str, Enum):
    ME = "/v2.0/Me"
    WELLKNOWNCONFIG = "/oauth2/.well-known/openid-configuration"
