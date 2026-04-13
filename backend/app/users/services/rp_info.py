import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, Request, status

from app.users.schemas import RelyingPartyInfo, RelyingPartyResponse
from app.constants.session_keys import SessionKeys

logger = logging.getLogger(__name__)

_RP_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "rp.json"

with open(_RP_DATA_PATH, "r", encoding="utf-8") as _f:
    _RP_DATA: dict = json.load(_f)


def get_rp_info_from_data(client_id: str, lang: str) -> Optional[RelyingPartyInfo]:
    entry = _RP_DATA.get(client_id)
    if not entry:
        return None
    locale_data = entry.get(lang) or entry.get("en")
    if not locale_data:
        return None
    return RelyingPartyInfo(
        id=client_id,
        linkName=locale_data["name"],
        url=locale_data["url"],
    )


async def get_relying_party_info(request: Request, lang: str = "en"):
    logger.info("Get RP info")
    relying_party_client_id = request.session.get(SessionKeys.RP_CLIENT_ID_KEY.value)
    if not relying_party_client_id:
        logger.info("Relying party client ID not found in session")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="RP Client ID not found"
        )

    rp_info = get_rp_info_from_data(relying_party_client_id, lang)

    if not rp_info:
        logger.error(f"Relying party with ID {relying_party_client_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relying party info not found",
        )

    logger.info(f"Relying party profile: {rp_info}")
    return RelyingPartyResponse(
        success=True,
        message="RP Info retrieved successfully.",
        data=rp_info,
    )
