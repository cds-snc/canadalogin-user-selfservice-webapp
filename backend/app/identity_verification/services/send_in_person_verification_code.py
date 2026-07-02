import logging

from httpx import AsyncClient

from app.config import GCNotifyConfig
from app.constants.gc_notify import (
    GC_NOTIFY_BASE_URL,
    GCNotifyEndpoint,
    GCNotifyTemplateID,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)

_gc_notify_config = GCNotifyConfig()

GC_NOTIFY_EMAIL_ENDPOINT = f"{GC_NOTIFY_BASE_URL}{GCNotifyEndpoint.SEND_EMAIL.value}"

# TODO: Replace with a real generated verification code once that feature exists.
HARDCODED_VERIFICATION_CODE = "387DHROGJ"


async def send_in_person_verification_code(
    global_http_client: AsyncClient,
    user_access_token: str,
) -> ResponseModel:
    """Sends an in-person identity verification email via GC Notify containing
    a verification code the user must present at a Service Canada Centre.
    """

    if not _gc_notify_config.GC_NOTIFY_API_KEY:
        logger.error("GC_NOTIFY_API_KEY is not configured")
        raise RequestErrorHandler.handle(
            ValueError("GC Notify API key is not configured"),
            context="GC Notify in-person verification email",
        )

    profile = await dispatch_get_my_profile_from_ibm(
        global_http_client, user_access_token
    )
    email_address = profile.userName

    headers = {
        "Authorization": f"ApiKey-v1 {_gc_notify_config.GC_NOTIFY_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "email_address": email_address,
        "template_id": GCNotifyTemplateID.IN_PERSON_VERIFICATION.value,
        "personalisation": {
            "verification_code": HARDCODED_VERIFICATION_CODE,
        },
    }

    try:
        response = await global_http_client.post(
            GC_NOTIFY_EMAIL_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
    except Exception as exc:
        raise RequestErrorHandler.handle(
            exc, context="GC Notify in-person verification email"
        )

    logger.info("In-person verification email sent to %s", email_address)

    return ResponseModel(
        success=True,
        message="In-person verification email sent",
        data={"email_address": email_address},
    )
