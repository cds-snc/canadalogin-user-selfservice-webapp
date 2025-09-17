import logging
from fastapi import Request
from authlib.integrations.starlette_client import OAuth
from authlib.jose import jwt
from authlib.jose.errors import JoseError
from authlib.jose.rfc7519.jwt import create_load_key

oauth = OAuth()
logger = logging.getLogger(__name__)


def register_oidc(config):
    verify_config = config.ibm_verify_config
    logger.info(
        f"PROFILE_MANAGEMENT_CLIENT_ID: {verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID}"
    )

    oauth.register(
        name="verify",
        client_id=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID,
        client_secret=verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_SECRET,
        server_metadata_url=config.oidc_well_known_config,
        client_kwargs={"scope": "openid email profile phone"},
    )


async def validate_logout_token(request: Request):
    """Validate logout token using your registered OAuth client"""
    form_data = await request.form()
    if form_data is None:
        raise ValueError("Missing logout_token parameter")
    form_dict = dict(form_data)

    logout_token = form_dict.get("logout_token")
    if logout_token is None or not isinstance(logout_token, str):
        raise ValueError("Missing logout_token parameter Or invalid type")

    # Get your registered client
    client = oauth.create_client("verify")
    if client is None:
        raise ValueError("OAuth client 'verify' is not registered")

    jwk_set_data = await client.fetch_jwk_set()
    load_key = create_load_key(jwk_set_data)

    # Configure logout token specific claims
    claims_options = {
        "aud": {"essential": True, "value": client.client_id},
        "iat": {"essential": True},
        "jti": {"essential": True},
        "events": {"essential": True, "validate": _validate_logout_events},
        "sid": {"essential": False},  # Session ID (optional)
        "sub": {"essential": False},  # Subject (optional)
        "nonce": {"essential": False, "validate": _reject_nonce},  # Must be None
    }

    try:
        claims = jwt.decode(logout_token, key=load_key, claims_options=claims_options)
        claims.validate(leeway=120)
        return claims
    except JoseError as e:
        raise ValueError(f"Invalid logout token: {e}")


def _validate_logout_events(claims, events):
    """Validate the events claim contains logout event"""
    logout_event_uri = "http://schemas.openid.net/event/backchannel-logout"
    return isinstance(events, dict) and logout_event_uri in events


def _reject_nonce(claims, nonce):
    """Logout tokens MUST NOT contain nonce"""
    return nonce is None
