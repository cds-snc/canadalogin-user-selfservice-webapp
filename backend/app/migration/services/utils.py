import logging

from fastapi import HTTPException
from pydantic import ValidationError

from app.migration.schemas import UserToken

logger = logging.getLogger(__name__)


async def get_ibm_id(
        user_token: str,
):
    try:

        token = UserToken(**user_token)

        # TODO: which value to use
        # ibm_id = token.userinfo.sub
        # ibm_id = token.userinfo.uid
        ibm_id = token.userinfo.uniqueSecurityName
        logger.info(f"IBM Id: {ibm_id}")

        return ibm_id

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
