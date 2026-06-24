import logging
from urllib.parse import urlparse

from fastapi import HTTPException, Request, status

from app.constants.session_keys import SessionKeys
from app.users.services.rp_info import get_relying_party_info
from app.utils.schemas import ResponseModel

logger = logging.getLogger(__name__)


def _normalize_path(path: str) -> str:
    normalized_path = path or "/"
    if not normalized_path.startswith("/"):
        normalized_path = f"/{normalized_path}"
    return normalized_path.rstrip("/") or "/"


def _is_matching_target_url(target_url: str, allowed_url: str) -> bool:
    parsed_target_url = urlparse(target_url)
    parsed_allowed_url = urlparse(allowed_url)

    if parsed_target_url.scheme not in {"http", "https"} or not parsed_target_url.netloc:
        return False

    if parsed_allowed_url.scheme not in {"http", "https"} or not parsed_allowed_url.netloc:
        return False

    if (
        parsed_target_url.scheme,
        parsed_target_url.netloc,
    ) != (
        parsed_allowed_url.scheme,
        parsed_allowed_url.netloc,
    ):
        return False

    allowed_path = _normalize_path(parsed_allowed_url.path)
    target_path = _normalize_path(parsed_target_url.path)

    return (
        allowed_path == "/"
        or target_path == allowed_path
        or target_path.startswith(f"{allowed_path}/")
    )


async def _get_allowed_relying_party_urls(request: Request) -> list[str]:
    rp_response = await get_relying_party_info(request)
    rp_info = rp_response.data if rp_response else None

    if rp_info is None:
        return []

    allowed_urls = [rp_info.url]
    if rp_info.localized:
        allowed_urls.extend(
            localized_detail.url
            for localized_detail in rp_info.localized.values()
            if localized_detail.url
        )

    return list(dict.fromkeys(filter(None, allowed_urls)))


async def store_identity_verification_target_url(
    request: Request, target_url: str
) -> ResponseModel:
    if not target_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL is required",
        )

    allowed_urls = await _get_allowed_relying_party_urls(request)
    if not allowed_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relying party URL not found",
        )

    if not any(
        _is_matching_target_url(target_url, allowed_url)
        for allowed_url in allowed_urls
    ):
        logger.warning("Rejected IDV target URL that does not match RP URL: %s", target_url)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target URL does not match relying party URL",
        )

    request.session[SessionKeys.IDV_TARGET_URL.value] = target_url
    logger.info("Stored IDV target URL in session")

    return ResponseModel(
        success=True,
        message="Identity verification target URL stored successfully.",
        data={"target_url": target_url},
    )


async def get_identity_verification_redirect_url(request: Request) -> ResponseModel:
    allowed_urls = await _get_allowed_relying_party_urls(request)
    target_url = request.session.pop(SessionKeys.IDV_TARGET_URL.value, None)

    if target_url and any(
        _is_matching_target_url(target_url, allowed_url)
        for allowed_url in allowed_urls
    ):
        redirect_url = target_url
    else:
        redirect_url = allowed_urls[0] if allowed_urls else "/"

    logger.info("Resolved IDV redirect URL after confirmation")

    return ResponseModel(
        success=True,
        message="Identity verification redirect URL resolved successfully.",
        data={"redirect_url": redirect_url},
    )
