import base64
import hashlib
import logging
import secrets

from fastapi import HTTPException
from pydantic import ValidationError

from app.migration.schemas import UserToken

logger = logging.getLogger(__name__)


# Generate secure random state and nonce
def generate_secure_token(length=32):
    return (
        base64.urlsafe_b64encode(secrets.token_bytes(length))
        .rstrip(b"=")
        .decode("utf-8")
    )


# Generate code_verifier and code_challenge
def generate_code_verifier(length=64):
    return (
        base64.urlsafe_b64encode(secrets.token_bytes(length))
        .rstrip(b"=")
        .decode("utf-8")
    )


def generate_code_challenge(verifier):
    sha256 = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(sha256).rstrip(b"=").decode("utf-8")


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
