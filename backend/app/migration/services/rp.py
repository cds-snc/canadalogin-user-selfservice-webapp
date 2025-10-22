import logging
import requests

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.migration.services.utils import (
    generate_secure_token,
    generate_code_verifier,
    generate_code_challenge,
)


logger = logging.getLogger(__name__)


async def get_auth_url(
    global_http_client: AsyncClient,
    rp_client_id: str,
    user_access_token: str,
):
    try:

        # TODO: Grab from config
        authorization_endpoint = "https://te-auth.id.tbs-sct.gc.ca/oxauth"
        client_id = "e1a58c16-a649-45e1-b80c-3cd3daaeea0d"
        redirect_uri = "http://localhost:8000/migration/auth/callback"
        scope = "openid"
        max_age = "1200"
        response_type = "code"
        state = generate_secure_token()
        nonce = generate_secure_token()
        code_verifier = generate_code_verifier()  # Store
        code_challenge = generate_code_challenge(code_verifier)
        code_challenge_method = "S256"

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": response_type,
            "scope": scope,
            "max_age": max_age,
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
            "state": state,
            "nonce": nonce,
        }

        logger.info(f"Parms: {params}")

        auth_url = (
            requests.Request("GET", authorization_endpoint, params=params).prepare().url
        )

        return auth_url

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
