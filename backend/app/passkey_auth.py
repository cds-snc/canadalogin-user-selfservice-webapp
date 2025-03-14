import requests
import logging
import json
from fastapi import HTTPException
from .config import get_settings
settings = get_settings().ibm_verify_config


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class PasskeyAuth:
    def __init__(self):
        self.tenant_url = settings.IBM_VERIFY_TENANT_URL.rstrip('/')
        self.client_id = settings.IBM_VERIFY_CLIENT_ID
        self.client_secret = settings.IBM_VERIFY_CLIENT_SECRET

    def log_api_call(self, method: str, url: str, headers: dict, data: dict = None, params: dict = None, response: requests.Response = None):
        """Helper function to log API requests and responses"""
        masked_headers = {k: v if k.lower() not in [
            'authorization'] else '***' for k, v in headers.items()}

        logger.info(f"\n{'='*80}")
        logger.info(f"API Call: {method} {url}")
        logger.info(f"Headers: {json.dumps(masked_headers, indent=2)}")

        if params:
            logger.info(f"Query Params: {json.dumps(params, indent=2)}")
        if data:
            logger.info(f"Request Body: {json.dumps(data, indent=2)}")

        if response:
            logger.info(f"Response Status: {response.status_code}")
            logger.info(
                f"Response Headers: {json.dumps(dict(response.headers), indent=2)}")
            try:
                response_json = response.json()
                logger.info(
                    f"Response Body: {json.dumps(response_json, indent=2)}")
            except:
                logger.info(f"Response Text: {response.text}")
        logger.info(f"{'='*80}\n")

    async def get_admin_token(self):
        """Get admin token for IBM Verify API operations"""
        try:
            logger.info("Attempting to get admin token")
            token_url = f"{self.tenant_url}/oauth2/token"
            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "openid"
            }
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }

            self.log_api_call("POST", token_url, headers, data)
            response = requests.post(token_url, data=data, headers=headers)
            self.log_api_call("POST", token_url, headers,
                              data, response=response)

            if response.status_code != 200:
                logger.error(
                    f"Failed to get admin token. Status: {response.status_code}")
                raise HTTPException(
                    status_code=400, detail="Failed to get admin token")

            return response.json()["access_token"]
        except Exception as e:
            logger.error(f"Error getting admin token: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"Admin token error: {str(e)}")

    async def get_user_id(self, username: str, admin_token: str) -> str:
        """Get user ID from IBM Verify using username"""
        try:
            user_url = f"{self.tenant_url}/v2.0/Users"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Accept": "application/scim+json"
            }
            params = {
                "filter": f'userName eq "{username}"',
                "attributes": "id"
            }

            logger.info(f"Getting user ID for username: {username}")
            response = requests.get(user_url, headers=headers, params=params)

            if response.status_code != 200:
                logger.error(
                    f"Failed to get user. Status: {response.status_code}")
                logger.error(f"Response: {response.text}")
                raise HTTPException(
                    status_code=400, detail="Failed to get user ID")

            resources = response.json().get("Resources", [])
            if not resources:
                raise HTTPException(status_code=404, detail="User not found")

            user_id = resources[0].get("id")
            if not user_id:
                raise HTTPException(
                    status_code=400, detail="User ID not found in response")

            return user_id

        except Exception as e:
            logger.error(f"Error getting user ID: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"Error getting user ID: {str(e)}")

    async def generate_authentication_options(self, username: str):
        """Generate authentication options for passkey signin"""
        try:
            admin_token = await self.get_admin_token()

            # Get user ID first
            user_id = await self.get_user_id(username, admin_token)

            auth_options_url = f"{self.tenant_url}/v2.0/factors/fido2/relyingparties/a142dd1a-9618-401a-bbfc-1d3ccc5fa8a2/assertion/options"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            options_data = {
                "userId": user_id,  # Use user ID instead of username
                "userVerification": "preferred"
            }

            logger.info(
                f"Making assertion options request to: {auth_options_url}")
            logger.info(f"Request headers: {headers}")
            logger.info(f"Request data: {options_data}")

            response = requests.post(
                auth_options_url, json=options_data, headers=headers)
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response: {response.text}")

            if response.status_code != 200:
                logger.error(
                    f"Failed to generate assertion options. Status: {response.status_code}")
                logger.error(f"Error response: {response.text}")
                raise HTTPException(
                    status_code=400, detail="Failed to generate authentication options")

            return response.json()

        except Exception as e:
            logger.error(
                f"Error generating assertion options: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"Authentication options error: {str(e)}")

    # https://docs.verify.ibm.com/verify/reference/assertionresult
    async def verify_authentication(self, username: str, credential: dict):
        """Verify passkey authentication response"""
        try:
            admin_token = await self.get_admin_token()

            verify_url = f"{self.tenant_url}/v2.0/factors/fido2/relyingparties/a142dd1a-9618-401a-bbfc-1d3ccc5fa8a2/assertion/result"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            verify_data = {
                "id": credential.get("id"),
                "rawId": credential.get("rawId"),
                "response": {
                    "authenticatorData": credential.get("response", {}).get("authenticatorData"),
                    "clientDataJSON": credential.get("response", {}).get("clientDataJSON"),
                    "signature": credential.get("response", {}).get("signature"),
                    "userHandle": credential.get("response", {}).get("userHandle")
                },
                "type": credential.get("type")
            }

            logger.info(f"Making assertion result request to: {verify_url}")
            logger.info(f"Request data: {verify_data}")

            response = requests.post(
                verify_url, json=verify_data, headers=headers)
            logger.info(f"Assertion result response: {response.text}")

            if response.status_code != 200:
                logger.error(
                    f"Failed to verify assertion. Status: {response.status_code}")
                raise HTTPException(
                    status_code=400, detail="Failed to verify authentication")

            verification_token = response.json().get("verification_token")
            if not verification_token:
                raise HTTPException(
                    status_code=400, detail="No verification token received")

            # Generate access token for the user
            token_data = {
                "grant_type": "urn:ibm:params:oauth:grant-type:verify",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "username": username,
                "verification_token": verification_token
            }

            token_response = await self.get_user_token(token_data)
            return token_response

        except Exception as e:
            logger.error(f"Error verifying assertion: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"Authentication verification error: {str(e)}")

    async def get_user_token(self, token_data: dict):
        """Get user access token after successful authentication"""
        try:
            token_url = f"{self.tenant_url}/oauth2/token"
            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }

            self.log_api_call("POST", token_url, headers, token_data)
            response = requests.post(
                token_url, data=token_data, headers=headers)
            self.log_api_call("POST", token_url, headers,
                              token_data, response=response)

            if response.status_code != 200:
                logger.error(
                    f"Failed to get user token. Status: {response.status_code}")
                raise HTTPException(
                    status_code=400, detail="Failed to get user token")

            return {
                "access_token": response.json()["access_token"],
                "token_type": "bearer"
            }
        except Exception as e:
            logger.error(f"Error getting user token: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"User token error: {str(e)}")


passkey_auth = PasskeyAuth()
