import requests
import logging
import json
from datetime import datetime
from .config import get_settings
from fastapi import HTTPException
settings = get_settings().ibm_verify


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def log_api_call(method: str, url: str, headers: dict, data: dict = None, params: dict = None, response: requests.Response = None):
    """Helper function to log API requests and responses"""
    # Mask sensitive data
    masked_headers = {k: v if k.lower() not in [
        'authorization', 'password'] else '***' for k, v in headers.items()}
    masked_data = {k: v if k.lower() != 'password' else '***' for k,
                   v in (data or {}).items()}

    logger.info(f"\n{'='*80}")
    logger.info(f"API Call: {method} {url}")
    logger.info(f"Headers: {json.dumps(masked_headers, indent=2)}")

    if params:
        logger.info(f"Query Params: {json.dumps(params, indent=2)}")
    if data:
        logger.info(f"Request Body: {json.dumps(masked_data, indent=2)}")

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


async def get_admin_token():
    """Get admin token for IBM Verify API operations"""
    try:
        logger.info("Attempting to get admin token")
        token_url = f"{settings.IBM_VERIFY_TENANT_URL}/oauth2/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": settings.IBM_VERIFY_CLIENT_ID,
            "client_secret": settings.IBM_VERIFY_CLIENT_SECRET,
            "scope": "openid"
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }

        log_api_call("POST", token_url, headers, data)
        response = requests.post(token_url, data=data, headers=headers)
        log_api_call("POST", token_url, headers, data, response=response)

        if response.status_code != 200:
            logger.error(
                f"Failed to get admin token. Status: {response.status_code}")
            logger.error(f"Error response: {response.text}")
            raise HTTPException(
                status_code=400, detail="Failed to get admin token")

        logger.info("Successfully obtained admin token")
        return response.json()["access_token"]
    except Exception as e:
        logger.error(f"Error getting admin token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Admin token error: {str(e)}")


async def verify_user_exists(username: str, admin_token: str):
    """Verify user exists in IBM Security Verify"""
    try:
        users_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users"
        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Accept": "application/scim+json"
        }

        search_params = {
            "filter": f'userName eq "{username}"'
        }

        logger.info(f"Verifying user exists: {username}")
        log_api_call("GET", users_url, headers, params=search_params)
        response = requests.get(
            users_url, headers=headers, params=search_params)
        log_api_call("GET", users_url, headers,
                     params=search_params, response=response)

        if response.status_code != 200:
            logger.error(
                f"Failed to verify user. Status: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None

        user_data = response.json()
        if not user_data.get("Resources") or len(user_data["Resources"]) == 0:
            logger.error(f"User not found: {username}")
            return None

        logger.info(f"User found: {username}")
        return user_data["Resources"][0]
    except Exception as e:
        logger.error(f"Error verifying user: {str(e)}", exc_info=True)
        return None


async def authenticate_password(username: str, password: str):
    """Authenticate user with password using IBM Security Verify first-factor authentication"""
    try:
        # Get admin token
        admin_token = await get_admin_token()

        # Verify user exists
        user = await verify_user_exists(username, admin_token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Step 1: Authenticate with password identity source
        tenant_url = settings.IBM_VERIFY_TENANT_URL.rstrip(
            '/')  # Remove trailing slash if present
        # Password identity source identifier
        password_source_id = "3546b745-8790-4578-b4b5-401390cbc9b4"
        initiate_url = f"{tenant_url}/v1.0/authnmethods/password/{password_source_id}"
        initiate_headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        initiate_data = {
            "username": username,
            "password": password
        }

        logger.info("Initiating password authentication")
        logger.info(f"Using authentication URL: {initiate_url}")
        log_api_call("POST", initiate_url, initiate_headers, initiate_data)
        initiate_response = requests.post(
            initiate_url, headers=initiate_headers, json=initiate_data)

        # Log the raw response for debugging
        logger.info("Raw authentication response:")
        logger.info(f"Status Code: {initiate_response.status_code}")
        logger.info(f"Response Headers: {dict(initiate_response.headers)}")
        logger.info(f"Response Body: {initiate_response.text}")

        log_api_call("POST", initiate_url, initiate_headers,
                     initiate_data, response=initiate_response)

        if initiate_response.status_code != 200:
            logger.error(
                f"Authentication failed. Status: {initiate_response.status_code}")
            logger.error(f"Response: {initiate_response.text}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Step 2: Get access token
        token_url = f"{tenant_url}/oauth2/token"
        token_headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        token_data = {
            "grant_type": "client_credentials",
            "client_id": settings.IBM_VERIFY_CLIENT_ID,
            "client_secret": settings.IBM_VERIFY_CLIENT_SECRET,
            "scope": "openid"
        }

        logger.info("Requesting access token")
        log_api_call("POST", token_url, token_headers, token_data)
        token_response = requests.post(
            token_url, headers=token_headers, data=token_data)
        log_api_call("POST", token_url, token_headers,
                     token_data, response=token_response)

        if token_response.status_code != 200:
            logger.error(
                f"Token request failed. Status: {token_response.status_code}")
            logger.error(f"Response: {token_response.text}")
            raise HTTPException(
                status_code=401, detail="Failed to get access token")

        # Combine the responses
        result = {
            "access_token": token_response.json()["access_token"],
            # Include all fields from the password authentication response
            **initiate_response.json()
        }

        logger.info("Authentication successful")
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=400, detail=f"Authentication error: {str(e)}")


class PasswordAuth:
    def __init__(self):
        self.tenant_url = settings.IBM_VERIFY_TENANT_URL.rstrip('/')
        self.client_id = settings.IBM_VERIFY_CLIENT_ID
        self.client_secret = settings.IBM_VERIFY_CLIENT_SECRET

    async def verify_password(self, username: str, password: str):
        """Verify password and return verification token"""
        try:
            # Get admin token
            admin_token = await self.get_admin_token()

            # Verify user exists
            user = await self.verify_user_exists(username, admin_token)
            if not user:
                raise HTTPException(
                    status_code=401, detail="Invalid credentials")

            # Verify password
            verify_url = f"{self.tenant_url}/v2.0/authnmethods/password/verify"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            }

            verify_data = {
                "username": username,
                "password": password
            }

            logger.info(f"Verifying password for user: {username}")
            response = requests.post(
                verify_url, headers=headers, json=verify_data)

            if response.status_code != 200:
                logger.error(
                    f"Password verification failed. Status: {response.status_code}")
                raise HTTPException(
                    status_code=401, detail="Invalid credentials")

            verification_token = response.json().get("verification_token")
            if not verification_token:
                raise HTTPException(
                    status_code=400, detail="No verification token received")

            return {"verification_token": verification_token}

        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(
                f"Password verification error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=400, detail=str(e))
