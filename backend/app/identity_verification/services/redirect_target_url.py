import logging
from urllib.parse import parse_qs, unquote, urlparse

from fastapi import HTTPException, Request, status

from app.config import get_configuration
from app.constants.session_keys import SessionKeys
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


def _normalize_path(path: str) -> str:
    normalized_path = path or "/"
    if not normalized_path.startswith("/"):
        normalized_path = f"/{normalized_path}"
    return normalized_path.rstrip("/") or "/"


def _extract_target_url(target_url: str) -> str:
    stripped_target_url = target_url.strip()

    if not stripped_target_url:
        return ""

    parsed_target_url = urlparse(stripped_target_url)
    if parsed_target_url.scheme in {"http", "https"} and parsed_target_url.netloc:
        return stripped_target_url

    query_string = (
        stripped_target_url[1:]
        if stripped_target_url.startswith("?")
        else stripped_target_url
    )

    # Preserve the full nested URL when input is raw query format, e.g.
    # Target=https://.../oauth2/authorize?client_id=...&requestId=...&stateId=...
    for key in ("Target", "target_url"):
        prefix = f"{key}="
        if query_string.startswith(prefix):
            return unquote(query_string[len(prefix) :]).strip()

    target_values = parse_qs(query_string).get("Target", [])

    return target_values[0].strip() if target_values else stripped_target_url


def _is_matching_target_url(target_url: str, allowed_url: str) -> bool:
    parsed_target_url = urlparse(_extract_target_url(target_url))
    parsed_allowed_url = urlparse(allowed_url)

    if (
        parsed_target_url.scheme not in {"http", "https"}
        or not parsed_target_url.netloc
    ):
        return False

    if (
        parsed_allowed_url.scheme not in {"http", "https"}
        or not parsed_allowed_url.netloc
    ):
        return False

    if (
        parsed_target_url.scheme,
        parsed_target_url.hostname,
    ) != (
        parsed_allowed_url.scheme,
        parsed_allowed_url.hostname,
    ):
        return False

    allowed_path = _normalize_path(parsed_allowed_url.path)
    target_path = _normalize_path(parsed_target_url.path)

    return (
        allowed_path == "/"
        or target_path == allowed_path
        or target_path.startswith(f"{allowed_path}/")
    )


def _get_allowed_tenant_url() -> str | None:
    config = get_configuration()
    tenant_url = config.ibm_verify_config.IBM_VERIFY_TENANT_URL
    return tenant_url or None


async def store_identity_verification_target_url(
    request: Request, target_url: str
) -> ResponseModel:

    logger.info("IDV redirect URL Target: %s", target_url)

    if not target_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL is required",
        )

    normalized_target_url = _extract_target_url(target_url)

    allowed_url = _get_allowed_tenant_url()
    if not allowed_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IBM Verify tenant URL not found",
        )

    if not _is_matching_target_url(normalized_target_url, allowed_url):
        logger.warning(
            "Rejected IDV target URL that does not match RP URL: %s", target_url
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL does not match relying party URL",
        )

    request.session[SessionKeys.IDV_TARGET_URL.value] = normalized_target_url
    logger.info("Stored IDV target URL in session")

    return ResponseModel(
        success=True,
        message="Identity verification target URL stored successfully.",
        data={"target_url": normalized_target_url},
    )


async def get_identity_verification_redirect_url(request: Request) -> ResponseModel:
    allowed_url = _get_allowed_tenant_url()
    target_url = _extract_target_url(
        request.session.pop(SessionKeys.IDV_TARGET_URL.value, None) or ""
    )

    logger.info("IDV redirect URL Target: %s", target_url)

    if target_url and allowed_url and _is_matching_target_url(target_url, allowed_url):
        redirect_url = target_url
    else:
        redirect_url = allowed_url or "/"

    logger.info("Resolved IDV redirect URL after confirmation: %s", redirect_url)

    return ResponseModel(
        success=True,
        message="Identity verification redirect URL resolved successfully.",
        data={"redirect_url": redirect_url},
    )
