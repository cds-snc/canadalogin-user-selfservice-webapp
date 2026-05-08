import logging
import uuid
from urllib.parse import urlparse

from httpx import AsyncClient

from app.config import get_configuration
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.config import BluinkConfig

logger = logging.getLogger(__name__)
_bluink_config = BluinkConfig()

ALLOWED_REDIRECT_HOSTS = {"demoeidv.bluink.ca", "demoidv.bluink.ca", "idv.bluink.ca"}
BLUINK_API_URL = "https://demoeid.bluink.ca/api/prereg/v2/request-registration"


async def create_identity_verification(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    """Starts the Identity Verification process by requesting a Bluink
    registration for the authenticated user's email address.

    Returns a ``ResponseModel`` whose ``data`` field contains the Bluink
    redirect URL the frontend should navigate the user to.
    """

    profile = await dispatch_get_my_profile_from_ibm(
        global_http_client, user_access_token
    )
    email = profile.userName
    
    state = str(uuid.uuid4())
    nonce = str(uuid.uuid4())
    
    payload = {
        "email": email,
        "rp_client_id": _bluink_config.BLUINK_CLIENT_ID,
        "rp_client_secret": _bluink_config.BLUINK_CLIENT_SECRET,
        "state": state,
        "nonce": nonce,
    }

    try:
        response = await global_http_client.post(
            BLUINK_API_URL, json=payload, timeout=30
        )
        response.raise_for_status()
    except Exception as exc:
        RequestErrorHandler.handle(exc, context="Bluink identity verification request")

    data = response.json()
    redirect_url = data.get("url")

    if not redirect_url:
        logger.error("Bluink API response did not contain a redirect URL")
        raise RequestErrorHandler.handle(
            ValueError("Missing redirect URL in Bluink response"),
            context="Bluink identity verification response",
        )

    parsed = urlparse(redirect_url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_REDIRECT_HOSTS:
        logger.error("Bluink API returned an unexpected redirect URL: %s", redirect_url)
        raise RequestErrorHandler.handle(
            ValueError("Unexpected redirect URL from Bluink"),
            context="Bluink identity verification redirect validation",
        )

    return ResponseModel(
        success=True,
        message="Identity verification registration created",
        data={"redirect_url": redirect_url, "state": state},
    )
