"""
FIDO2 services for interacting with IBM Verify API
"""

import logging
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from fastapi import HTTPException, status
from httpx import AsyncClient
from app.utils.access_token import get_admin_token, get_auth_request_headers
from app.utils.request_error_handler import RequestErrorHandler
from app.utils.schemas import ResponseModel
from app.config import get_configuration
from app.constants.verify_endpoints import VerifyAPIEndpoint
from app.fido2.schemas import (
    FIDO2RegistrationResponse,
    FIDO2CredentialSummary,
    FIDO2UserResponse,
    FIDO2UserResponseModel,
    FIDO2RegistrationResponseModel,
    FIDO2CredentialsResponseModel,
    DeleteRegistrationRequest,
    UpdateRegistrationRequest,
)
from app.users.services.get_my_profile import dispatch_get_my_profile_from_ibm

logger = logging.getLogger(__name__)


class FIDO2Service:
    """Service class for FIDO2 operations"""

    def __init__(self):
        self.config = get_configuration()
        self.tenant_url = self.config.ibm_verify_config.IBM_VERIFY_TENANT_URL
        parsed_url = urlparse(self.config.ibm_verify_config.IBM_VERIFY_TENANT_URL)
        self.rp_id = parsed_url.hostname

    async def _get_user_profile_info(
        self, http_client: AsyncClient, user_access_token: str
    ) -> tuple[str, str]:
        """
        Get username and displayName from user profile using their access token.

        Returns:
            tuple[str, str]: (username, displayName)
        """
        try:
            logger.info("Fetching user profile for FIDO2 operation")
            profile = await dispatch_get_my_profile_from_ibm(
                http_client, user_access_token
            )

            username = profile.userName

            # Construct display name from profile
            display_name = ""
            if profile.name:
                if profile.name.givenName and profile.name.familyName:
                    display_name = f"{profile.name.givenName} {profile.name.familyName}"
                elif profile.name.formatted:
                    display_name = profile.name.formatted
                elif profile.name.givenName:
                    display_name = profile.name.givenName
                elif profile.name.familyName:
                    display_name = profile.name.familyName

            # Fallback to username if no display name could be constructed
            if not display_name:
                display_name = username

            logger.info("Retrieved user profile for FIDO2 operation")
            return username, display_name

        except Exception as e:
            logger.error(
                f"Error fetching user profile for FIDO2: {str(e)}", exc_info=True
            )
            RequestErrorHandler.handle(e)

    async def _get_rp_uuid_from_rp_id(
        self, http_client: AsyncClient, access_token: str, rp_id: str
    ) -> str:
        """Get RP UUID from RP ID by querying the discovery service"""
        try:
            url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_RELYING_PARTIES.value}"
            headers = get_auth_request_headers(access_token, json_content_type=True)

            response = await http_client.get(url, headers=headers)
            response.raise_for_status()

            rp_data = response.json()

            # Handle both old and new response schemas
            rp_wrapper = rp_data.get("fido2", rp_data)
            relying_parties = rp_wrapper.get("relyingparties", [])

            for rp in relying_parties:
                if rp.get("rpId") == rp_id:
                    return rp.get("id")

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"RP ID '{rp_id}' not found",
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting RP UUID: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def _get_user_scim_id_with_user_token(
        self, http_client: AsyncClient, user_access_token: str, username: str
    ) -> str:
        """Get user SCIM ID from username using the user's own access token"""
        try:
            url = f"{self.tenant_url}{VerifyAPIEndpoint.USERS.value}"
            headers = get_auth_request_headers(user_access_token)
            params = {"filter": f'userName eq "{username}"'}

            response = await http_client.get(url, headers=headers, params=params)
            response.raise_for_status()

            user_data = response.json()

            if user_data.get("totalResults") == 1:
                user = user_data["Resources"][0]
                if user.get("active", False):
                    return user["id"]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Error getting user SCIM ID with user token: {str(e)}", exc_info=True
            )
            RequestErrorHandler.handle(e)

    async def _get_user_scim_id(
        self, http_client: AsyncClient, access_token: str, username: str
    ) -> str:
        """Get user SCIM ID from username"""
        try:
            url = f"{self.tenant_url}{VerifyAPIEndpoint.USERS.value}"
            headers = get_auth_request_headers(access_token)
            params = {"filter": f'userName eq "{username}"'}

            response = await http_client.get(url, headers=headers, params=params)
            response.raise_for_status()

            user_data = response.json()

            if user_data.get("totalResults") == 1:
                user = user_data["Resources"][0]
                if user.get("active", False):
                    return user["id"]
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting user SCIM ID: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def get_user_fido2_registrations(
        self, http_client: AsyncClient, user_access_token: str
    ) -> FIDO2CredentialsResponseModel:
        """Get all FIDO2 registrations for a user using their own access token"""
        try:
            logger.info("Getting FIDO2 registrations using user access token")
            logger.info(f"Using RPID: {self.rp_id}")

            # First, we need to get the user ID from the token
            # We can use the userinfo endpoint with the user's token (like the JavaScript does)
            userinfo_url = f"{self.tenant_url}{VerifyAPIEndpoint.USERINFO.value}"
            headers = get_auth_request_headers(user_access_token)

            userinfo_response = await http_client.post(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo_data = userinfo_response.json()

            user_id = userinfo_data.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User ID not found in userinfo",
                )

            logger.info(f"Found user ID from userinfo: {user_id}")

            # Get RP UUID from RP ID (like JavaScript does)
            admin_token = await get_admin_token(http_client)
            rp_uuid = await self._get_rp_uuid_from_rp_id(
                http_client, admin_token, self.rp_id
            )
            logger.info(f"Found RP UUID: {rp_uuid}")

            # Search for registrations using user's own token and RP UUID
            url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}"
            headers = get_auth_request_headers(
                user_access_token, json_content_type=True
            )

            # Use the same filter approach as JavaScript: userId + references/rpUuid
            search_filter = f'userId="{user_id}"&references/rpUuid="{rp_uuid}"'
            params = {"search": search_filter}

            logger.info(f"Making request to: {url}")
            logger.info(f"Search filter: {search_filter}")

            response = await http_client.get(url, headers=headers, params=params)
            response.raise_for_status()

            registrations_data = response.json()

            credentials = []

            for reg in registrations_data.get("fido2", []):
                credential = FIDO2CredentialSummary(
                    id=reg.get("id"),
                    nickname=reg.get("attributes", {}).get("nickname"),
                    enabled=reg.get("enabled", False),
                    created=reg.get("created"),
                    rpId=reg.get("attributes", {}).get("rpId"),
                    credentialId=reg.get("attributes", {}).get("credentialId"),
                    transactions=[],  # TODO: Add transaction support if needed
                )
                credentials.append(credential)

            logger.info(f"Found {len(credentials)} FIDO2 credentials")
            return FIDO2CredentialsResponseModel(
                success=True,
                data=credentials,
                message="FIDO2 credentials retrieved successfully",
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting FIDO2 registrations: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def get_user_response(
        self,
        http_client: AsyncClient,
        user_access_token: str,
    ) -> FIDO2UserResponseModel:
        """Get user response with FIDO2 credentials"""
        try:
            credentials_response = await self.get_user_fido2_registrations(
                http_client, user_access_token
            )

            user_response = FIDO2UserResponse(
                authenticated=True,
                username=None,  # We can extract this from token if needed
                displayName=None,
                credentials=credentials_response.data or [],
            )

            return FIDO2UserResponseModel(
                success=True,
                data=user_response,
                message="User FIDO2 data retrieved successfully",
            )

        except Exception as e:
            logger.error(f"Error getting user response: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def get_registration_details(
        self, http_client: AsyncClient, user_access_token: str, registration_id: str
    ) -> FIDO2RegistrationResponseModel:
        """Get details of a specific FIDO2 registration"""
        try:
            # Get user ID from the token using userinfo endpoint
            userinfo_url = f"{self.tenant_url}{VerifyAPIEndpoint.USERINFO.value}"
            headers = get_auth_request_headers(user_access_token)

            userinfo_response = await http_client.post(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo_data = userinfo_response.json()

            user_id = userinfo_data.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User ID not found in userinfo",
                )

            # Get the registration with admin token for now (registration details might need admin access)
            admin_token = await get_admin_token(http_client)
            url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
            headers = get_auth_request_headers(admin_token, json_content_type=True)

            response = await http_client.get(url, headers=headers)
            response.raise_for_status()

            registration_data = response.json()

            # Verify ownership
            if registration_data.get("userId") != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not owner of registration",
                )

            # TODO: Add transaction data if needed
            registration_data.setdefault("attributes", {})["transactions"] = []

            registration_response = FIDO2RegistrationResponse(**registration_data)
            return FIDO2RegistrationResponseModel(
                success=True,
                data=registration_response,
                message="Registration details retrieved successfully",
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting registration details: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def delete_registration(
        self,
        http_client: AsyncClient,
        user_access_token: str,
        request_data: DeleteRegistrationRequest,
    ) -> FIDO2UserResponseModel:
        """Delete a FIDO2 registration"""
        try:
            registration_id = request_data.id

            # Get user ID from the token using userinfo endpoint
            userinfo_url = f"{self.tenant_url}{VerifyAPIEndpoint.USERINFO.value}"
            headers = get_auth_request_headers(user_access_token)

            userinfo_response = await http_client.post(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo_data = userinfo_response.json()

            user_id = userinfo_data.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User ID not found in userinfo",
                )

            # Get admin token for delete operations (might need admin access)
            admin_token = await get_admin_token(http_client)

            # First verify ownership
            reg_url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
            headers = get_auth_request_headers(admin_token, json_content_type=True)

            reg_response = await http_client.get(reg_url, headers=headers)
            reg_response.raise_for_status()

            registration_data = reg_response.json()

            if registration_data.get("userId") != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not owner of registration",
                )

            # Delete the registration
            delete_response = await http_client.delete(reg_url, headers=headers)
            delete_response.raise_for_status()

            logger.info(f"Registration deleted: {registration_id}")

            # Return updated user response
            return await self.get_user_response(http_client, user_access_token)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting registration: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def update_registration(
        self,
        http_client: AsyncClient,
        user_access_token: str,
        request_data: UpdateRegistrationRequest,
    ) -> FIDO2UserResponseModel:
        """Update a FIDO2 registration (nickname, enabled status)"""
        try:
            registration_id = request_data.id

            # Get user ID from the token using userinfo endpoint
            userinfo_url = f"{self.tenant_url}{VerifyAPIEndpoint.USERINFO.value}"
            headers = get_auth_request_headers(user_access_token)

            userinfo_response = await http_client.post(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo_data = userinfo_response.json()

            user_id = userinfo_data.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User ID not found in userinfo",
                )

            # Get admin token for update operations
            admin_token = await get_admin_token(http_client)

            # First verify ownership
            reg_url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_REGISTRATIONS.value}/{registration_id}"
            headers = get_auth_request_headers(admin_token, json_content_type=True)

            reg_response = await http_client.get(reg_url, headers=headers)
            reg_response.raise_for_status()

            registration_data = reg_response.json()

            if registration_data.get("userId") != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not owner of registration",
                )

            # Prepare update payload - IBM Verify API requires PUT with complete object
            # Start with current registration data and update specific fields
            current_attributes = registration_data.get("attributes", {})
            update_payload = registration_data.copy()  # Preserve all existing fields

            # Ensure required fields are set
            update_payload["id"] = registration_id
            update_payload["userId"] = user_id
            update_payload["attributes"] = (
                current_attributes.copy()
            )  # Preserve existing attributes

            # Override with provided values
            if request_data.nickname is not None:
                # Send nickname inside attributes field
                update_payload["attributes"]["nickname"] = request_data.nickname
            elif "nickname" not in update_payload["attributes"]:
                # Preserve existing nickname from top-level or set empty if none
                existing_nickname = registration_data.get("nickname", "")
                if existing_nickname:
                    update_payload["attributes"]["nickname"] = existing_nickname

            if request_data.enabled is not None:
                update_payload["enabled"] = request_data.enabled

            # Update the registration using PUT (required by IBM Verify API)
            update_response = await http_client.put(
                reg_url, headers=headers, json=update_payload
            )
            update_response.raise_for_status()

            logger.info(f"Registration updated: {registration_id}")

            # Return updated user response
            return await self.get_user_response(http_client, user_access_token)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating registration: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def _get_user_id_from_token(
        self, http_client: AsyncClient, user_access_token: str
    ) -> str:
        """Get user ID from access token using userinfo endpoint"""
        userinfo_url = f"{self.tenant_url}{VerifyAPIEndpoint.USERINFO.value}"
        headers = get_auth_request_headers(user_access_token)

        userinfo_response = await http_client.post(userinfo_url, headers=headers)
        userinfo_response.raise_for_status()
        userinfo_data = userinfo_response.json()

        user_id = userinfo_data.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User ID not found in userinfo",
            )
        return user_id

    async def _validate_authentication(
        self,
        user_id: Optional[str],
        request_body: Dict[str, Any],
        validate_username: bool,
        allow_empty_username: bool,
    ) -> None:
        """Validate user authentication requirements"""
        username = request_body.get("username") if request_body else None
        if validate_username and not user_id:
            if not (allow_empty_username and username == ""):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not authenticated",
                )

    async def _prepare_request_body(
        self,
        http_client: AsyncClient,
        user_access_token: Optional[str],
        endpoint_path: str,
        request_body: Dict[str, Any],
        user_id: Optional[str],
    ) -> Dict[str, Any]:
        """Prepare and modify request body for IBM Verify API"""
        body_to_send = request_body.copy() if request_body else {}

        # For attestation options, automatically fetch and inject user profile information
        if endpoint_path.endswith("/attestation/options") and user_access_token:
            username, display_name = await self._get_user_profile_info(
                http_client, user_access_token
            )
            body_to_send["username"] = username
            body_to_send["displayName"] = display_name
            logger.info(
                f"Injected user profile info - username: {username}, displayName: {display_name}"
            )

        # For assertion options, automatically fetch and inject username
        elif endpoint_path.endswith("/assertion/options") and user_access_token:
            username, _ = await self._get_user_profile_info(
                http_client, user_access_token
            )
            body_to_send["username"] = username
            logger.info(f"Injected username for assertion options: {username}")

        # Replace username with userId (but NOT for attestation/result)
        if "username" in body_to_send:
            del body_to_send["username"]
            if user_id and not endpoint_path.endswith("/attestation/result"):
                body_to_send["userId"] = user_id

        # Handle specific endpoint modifications
        if endpoint_path.endswith("/attestation/result"):
            body_to_send = self._prepare_attestation_result_body(body_to_send)
        elif endpoint_path.endswith("/assertion/options"):
            body_to_send.pop("attestation", None)

        return body_to_send

    def _prepare_attestation_result_body(
        self, body_to_send: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare body for attestation/result endpoint"""
        # Add enabled: true like ciservices.js does
        body_to_send["enabled"] = True

        # Ensure getClientExtensionResults is an empty object if null/None
        if body_to_send.get("getClientExtensionResults") is None:
            body_to_send["getClientExtensionResults"] = {}

        return body_to_send

    def _handle_error_response(self, response) -> Dict[str, Any]:
        """Handle error response from IBM Verify API"""
        logger.error(f"IBM Verify API error - Status: {response.status_code}")
        logger.error(f"Response headers: {dict(response.headers)}")
        logger.error(f"Response body: {response.text}")

        try:
            error_data = response.json()
            # Check for IBM Verify error format
            if error_data.get("success") is False and "message" in error_data:
                return {
                    "status": "failed",
                    "errorMessage": error_data["message"],
                }
            elif "error" in error_data and "messageId" in error_data.get("error", {}):
                # Handle CI-style error format
                error_info = error_data["error"]
                error_message = f"{error_info.get('messageId', '')}: {error_info.get('messageDescription', '')}"
                return {
                    "status": "failed",
                    "errorMessage": error_message,
                }
            else:
                # Generic error response
                return {
                    "status": "failed",
                    "errorMessage": f"Unexpected HTTP response code: {response.status_code}",
                }
        except Exception:
            # If JSON parsing fails, return generic error
            return {
                "status": "failed",
                "errorMessage": f"Unexpected HTTP response code: {response.status_code}",
            }

    async def proxy_fido2_request(
        self,
        http_client: AsyncClient,
        user_access_token: Optional[str] = None,
        endpoint_path: str = "",
        request_body: Dict[str, Any] = None,
        validate_username: bool = True,
        allow_empty_username: bool = False,
    ) -> ResponseModel:
        """
        Proxy FIDO2 server requests to IBM Verify API
        """
        try:
            # Get admin token for RP operations
            admin_token = await get_admin_token(http_client)
            rp_uuid = await self._get_rp_uuid_from_rp_id(
                http_client, admin_token, self.rp_id
            )

            user_id = None
            if user_access_token:
                user_id = await self._get_user_id_from_token(
                    http_client, user_access_token
                )

            # Validate username if required
            await self._validate_authentication(
                user_id, request_body, validate_username, allow_empty_username
            )

            # Prepare request body
            body_to_send = await self._prepare_request_body(
                http_client, user_access_token, endpoint_path, request_body, user_id
            )

            # Make the request using admin token for FIDO2 operations
            url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}{endpoint_path}"
            headers = get_auth_request_headers(admin_token, json_content_type=True)

            response = await http_client.post(url, headers=headers, json=body_to_send)

            # Handle IBM Verify API response
            if response.status_code == 200:
                response_data = response.json()
                return ResponseModel(
                    success=True,
                    data=response_data,
                    message="FIDO2 request processed successfully",
                )
            else:
                error_response = self._handle_error_response(response)
                # Raise HTTPException with the same status code as IBM Verify
                raise HTTPException(
                    status_code=response.status_code, detail=error_response
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error proxying FIDO2 request: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)

    async def validate_fido2_login(
        self, http_client: AsyncClient, assertion_result: Dict[str, Any]
    ) -> FIDO2UserResponseModel:
        """
        Validate FIDO2 assertion and complete login
        """
        try:
            access_token = await get_admin_token(http_client)
            rp_uuid = await self._get_rp_uuid_from_rp_id(
                http_client, access_token, self.rp_id
            )

            # Submit assertion result
            url = f"{self.tenant_url}{VerifyAPIEndpoint.FIDO2_RP_BASE.value}/{rp_uuid}/assertion/result"
            headers = get_auth_request_headers(access_token, json_content_type=True)

            response = await http_client.post(
                url, headers=headers, json=assertion_result
            )
            response.raise_for_status()

            assertion_response = response.json()
            user_id = assertion_response.get("userId")

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid assertion result",
                )

            # Get user details
            user_url = f"{self.tenant_url}{VerifyAPIEndpoint.USERS.value}"
            user_params = {"filter": f'id eq "{user_id}"'}

            user_response = await http_client.get(
                user_url,
                headers=get_auth_request_headers(access_token),
                params=user_params,
            )
            user_response.raise_for_status()

            user_data = user_response.json()

            if user_data.get("totalResults") == 1:
                user = user_data["Resources"][0]
                if user.get("active", False):
                    username = user["userName"]
                    display_name = user.get("name", {}).get("formatted", username)

                    # Create a user response for successful FIDO2 login
                    # Since this is for login validation, we'll return a minimal response
                    user_response = FIDO2UserResponse(
                        authenticated=True,
                        username=username,
                        displayName=display_name,
                        credentials=[],  # Don't need to fetch full credentials for login validation
                    )

                    return FIDO2UserResponseModel(
                        success=True,
                        data=user_response,
                        message="FIDO2 login validated successfully",
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN, detail="User disabled"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User record not found",
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error validating FIDO2 login: {str(e)}", exc_info=True)
            RequestErrorHandler.handle(e)


# Global service instance
fido2_service = FIDO2Service()
