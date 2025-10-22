import logging
import json
import requests

from fastapi import HTTPException
from httpx import AsyncClient
from pydantic import ValidationError

from app.migration.services.utils import (
    generate_secure_token,
    generate_code_verifier,
    generate_code_challenge,
)

from app.migration.schemas import LegacyIdpOidcSchema


logger = logging.getLogger(__name__)


async def get_auth_url(
    global_http_client: AsyncClient,
    rp_client_id: str,
    user_access_token: str,
):
    try:

        # TODO: Decide how to handle rp legacy idp configuration
        # Temp loading from json file for now

        with open("/app/migration.json") as f:
            data = json.load(f)

        legacy_idp_configs = [LegacyIdpOidcSchema(**item) for item in data]

        matching_legacy_idp = next(
            (idp for idp in legacy_idp_configs if idp.client_id == rp_client_id), None
        )

        if not matching_legacy_idp:
            raise HTTPException(
                status_code=404, detail="Legacy IdP configuration not found"
            )

        logger.info(f"Loaded migration config: {matching_legacy_idp}")

        # TODO: Grab from config
        authorization_endpoint = matching_legacy_idp.authorization_endpoint
        client_id = matching_legacy_idp.client_id
        redirect_uri = matching_legacy_idp.redirect_uri
        scope = matching_legacy_idp.scope
        max_age = matching_legacy_idp.max_age
        response_type = matching_legacy_idp.response_types[0]
        state = generate_secure_token()
        nonce = generate_secure_token()
        code_verifier = generate_code_verifier()  # Store
        code_challenge = generate_code_challenge(code_verifier)
        code_challenge_method = matching_legacy_idp.code_challenge_method

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


async def callback():
    try:
        return "CALLBACK"
    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")
