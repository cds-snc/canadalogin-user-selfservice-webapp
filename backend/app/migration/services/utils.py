import base64
import hashlib
import json
import logging
import secrets

from fastapi import HTTPException, requests
from httpx import AsyncClient
from pydantic import ValidationError
from typing import List


from app.config import get_configuration
from app.migration.schemas import (
    CustomAttribute,
    LegacyIdpOidcSchema,
    MeResponse,
    UserToken,
)

from app.utils.access_token import get_admin_token, get_auth_request_headers

logger = logging.getLogger(__name__)


async def get_attribute_value(
    key: str,
    attributes: List[CustomAttribute],
) -> List[str] | None:
    for attr in attributes:
        if attr.name == key:
            return attr.values
    return None


async def get_custom_attribute(
    custom_attribute_name: str, custom_attributes: List[CustomAttribute]
):
    try:

        custom_attribute_value = await get_attribute_value(
            custom_attribute_name, custom_attributes
        )
        logger.info(
            f"Custom Attribute {custom_attribute_name} value: {custom_attribute_value}"
        )

        return custom_attribute_value

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


async def get_user_custom_attributes(
    global_http_client: AsyncClient,
    user_access_token: str,
):
    try:

        settings = get_configuration()

        profile_api_endpoint = settings.profile_api_endpoint
        headers = get_auth_request_headers(user_access_token)
        response = await global_http_client.get(profile_api_endpoint, headers=headers)

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")

    if response.status_code == 200:
        json_data = response.json()
        response_data = MeResponse(**json_data)
        return response_data.ibm_extension.custom_attributes

    else:

        logger.error(f"Failed to retrieve profile. Response: {response.text}")

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Not authenticated")

        else:
            json_data = response.json()
            error_details = json_data.get("detail")
            raise HTTPException(
                status_code=response.status_code, detail=f"HTTP error, {error_details}"
            )


async def patch_payload(
    custom_attribute_name: str,
    custom_attribute_value: str,
):

    try:

        # patch_request = PatchRequest(
        #     schemas=["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
        #     operations=[
        #         Operation(
        #             op="add",
        #             path="urn:ietf:params:scim:schemas:extension:ibm:2.0:User:customAttributes",
        #             value=[
        #                 CustomAttribute(
        #                     name=custom_attribute_name, values=custom_attribute_value
        #                 )
        #             ],
        #         )
        #     ],
        # )

        # payload = patch_request.model_dump_json()

        payload = {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [
                {
                    "op": "add",
                    "path": "urn:ietf:params:scim:schemas:extension:ibm:2.0:User:customAttributes",
                    "value": [
                        {
                            "name": custom_attribute_name,
                            "values": custom_attribute_value,
                        }
                    ],
                }
            ],
        }

        logger.info(f"Payload to Patch {custom_attribute_name}: {payload}")

        return payload

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


async def patch_custom_attribute(
    global_http_client: AsyncClient, ibm_id: str, patch_payload: str
):
    try:

        settings = get_configuration()

        access_token = await get_admin_token(global_http_client)

        users_api_endpoint = f"{settings.users_api_endpoint}/{ibm_id}"
        logger.info(f"API Endpoint: {users_api_endpoint}")

        h = get_auth_request_headers(access_token, False)
        logger.info(f"headers: {h}")

        response = await global_http_client.patch(
            users_api_endpoint,
            headers=h,
            json=patch_payload,
            follow_redirects=False,
            cookies={},
        )

        logger.info(f"Status code: {response.status_code}")
        logger.info(f"Response body: {response.text}")
        logger.info(f"Request headers: {response.request.headers}")
        logger.info(f"Request body: {response.request.content.decode()}")

        return response.status_code

    except ValidationError as e:
        logger.error(f"Validation Error: {e.json()}")
        raise HTTPException(status_code=422, detail="Request data validation error")


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


async def legacy_idp_auth_url(
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


async def rp_auth_url(
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
