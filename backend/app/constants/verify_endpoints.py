from enum import Enum


class VerifyAPIEndpoint(str, Enum):
    PROFILE = "/v2.0/Me"
    OIDC_WELL_KNOWN_CONFIG = "/oauth2/.well-known/openid-configuration"
