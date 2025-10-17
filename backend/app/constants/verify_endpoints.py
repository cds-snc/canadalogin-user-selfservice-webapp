from enum import Enum


class VerifyAPIEndpoint(str, Enum):
    PROFILE = "/v2.0/Me"
    OIDC_WELL_KNOWN_CONFIG = "/oauth2/.well-known/openid-configuration"
    RP_USER_APPLICATIONS = "/v1.0/user/applications"
    PASSWORD_RESETTER = "/v1.0/usc/password/resetter"
    INTROSPECT_TOKEN = "/oauth2/introspect"
    USER_OTP_FACTORS = "/v2.0/factors"
    PASSWORDPOLICY = "/v2.0/PasswordPolicies"
    END_SESSION_ENDPOINT = "/oauth2/rplogout"
    USERS = "/v2.0/Users"
