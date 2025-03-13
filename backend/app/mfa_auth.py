import requests
import logging
import json
from fastapi import HTTPException
from .config import get_settings
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class MFASignup:
    def __init__(self):
        settings = get_settings().ibm_verify
        self.tenant_url = settings.IBM_VERIFY_TENANT_URL.rstrip('/')
        self.client_id = settings.IBM_VERIFY_CLIENT_ID
        self.client_secret = settings.IBM_VERIFY_CLIENT_SECRET
        self.password_source_id = settings.PASSWORD_SOURCE_ID

    def log_api_call(self, method: str, url: str, headers: dict, data: dict = None, params: dict = None, response: requests.Response = None):
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
                logger.error(f"Error response: {response.text}")
                raise HTTPException(
                    status_code=400, detail="Failed to get admin token")

            logger.info("Successfully obtained admin token")
            return response.json()["access_token"]
        except Exception as e:
            logger.error(f"Error getting admin token: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"Admin token error: {str(e)}")

    async def create_user(self, user_data: dict):
        """Create user in IBM Security Verify"""
        try:
            admin_token = await self.get_admin_token()

            users_url = f"{self.tenant_url}/v2.0/Users"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/scim+json",
                "Accept": "application/scim+json"
            }

            verify_user_data = {
                "schemas": [
                    "urn:ietf:params:scim:schemas:core:2.0:User",
                    "urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
                ],
                "userName": user_data.get("userName"),
                "password": user_data.get("password"),
                "name": {
                    "givenName": user_data.get("name", {}).get("givenName", ""),
                    "familyName": user_data.get("name", {}).get("familyName", "")
                },
                "emails": [
                    {
                        "value": user_data.get("userName"),
                        "type": "work",
                        "primary": True
                    }
                ],
                "active": True,
                "urn:ietf:params:scim:schemas:extension:ibm:2.0:User": {
                    "realm": "www.ibm.com",
                    "userCategory": "regular",
                    "twoFactorAuthentication": True
                }
            }

            self.log_api_call("POST", users_url, headers, verify_user_data)
            response = requests.post(
                users_url, json=verify_user_data, headers=headers)
            self.log_api_call("POST", users_url, headers,
                              verify_user_data, response=response)

            if response.status_code != 201:
                logger.error(
                    f"Failed to create user. Status: {response.status_code}")
                logger.error(f"Response: {response.text}")
                raise HTTPException(
                    status_code=400, detail="Failed to create user")

            return response.json()
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"User creation error: {str(e)}")

    async def generate_totp_qr(self, user_id: str):
        """Generate TOTP QR code for authenticator app"""
        try:
            admin_token = await self.get_admin_token()

            totp_url = f"{self.tenant_url}/v2.0/factors/totp?qrCodeInResponse=true"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            totp_data = {
                "accountName": f"IBM {user_id}",
                "userId": user_id,
                "enabled": True,
            }

            logger.info("Generating TOTP QR code...")
            self.log_api_call("POST", totp_url, headers, totp_data)
            response = requests.post(totp_url, json=totp_data, headers=headers)
            self.log_api_call("POST", totp_url, headers,
                              totp_data, response=response)

            if response.status_code != 201:
                logger.error(
                    f"Failed to generate TOTP QR. Status: {response.status_code}")
                logger.error(f"Response: {response.text}")
                raise HTTPException(
                    status_code=400, detail="Failed to generate TOTP QR code")

            response_data = response.json()
            logger.info("TOTP response data: %s", response_data)
            logger.info("TOTP response attributes: %s",
                        response_data.get('attributes', {}))

            # Extract required fields from response according to API spec
            attributes = response_data.get('attributes', {})
            totp_enrollment = {
                "userId": user_id,
                "totpId": response_data.get("id"),
                "qrcode": attributes.get("qrCode"),  # QR code is in attributes
                "secret": attributes.get("secret"),  # Secret is in attributes
                "period": attributes.get("period", 30),
                "algorithm": attributes.get("algorithm", "SHA1"),
                "digits": attributes.get("digits", 6),
                "message": "Please scan QR code and verify with TOTP code",
                "status": response_data.get("status", "PENDING"),
                "created": response_data.get("created"),
                "lastUpdated": response_data.get("lastUpdated")
            }

            logger.info(
                "TOTP enrollment created successfully. Status: %s", totp_enrollment['status'])
            logger.info("QR code present: %s", 'qrcode' in totp_enrollment)
            logger.info("Secret present: %s", 'secret' in totp_enrollment)

            return totp_enrollment

        except Exception as e:
            logger.error(f"Error generating TOTP QR: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"TOTP QR generation error: {str(e)}")

    async def verify_totp(self, user_id: str, totp_id: str, code: str):
        """Verify TOTP code from authenticator app"""
        try:
            admin_token = await self.get_admin_token()

            verify_url = f"{self.tenant_url}/v2.0/factors/totp/{totp_id}"
            headers = {
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            verify_data = {
                "otp": code
            }

            self.log_api_call("POST", verify_url, headers, verify_data)
            response = requests.post(
                verify_url, json=verify_data, headers=headers)
            self.log_api_call("POST", verify_url, headers,
                              verify_data, response=response)

            if response.status_code not in [200, 204]:
                logger.error(
                    f"Failed to verify TOTP. Status: {response.status_code}")
                logger.error(f"Response: {response.text}")
                raise HTTPException(
                    status_code=400, detail="Invalid TOTP code")

            # For 204 No Content, return success message
            if response.status_code == 204:
                return {"status": "success", "message": "TOTP code verified successfully"}

            # For 200 OK, return the JSON response
            return response.json()
        except Exception as e:
            logger.error(f"Error verifying TOTP: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"TOTP verification error: {str(e)}")

    async def signup_with_mfa(self, user_data: dict, totp_code: str = None):
        """Complete signup process with MFA"""
        try:
            # Step 1: Create user
            user_response = await self.create_user(user_data)
            user_id = user_response.get("id")

            if not user_id:
                raise HTTPException(
                    status_code=400, detail="Failed to get user ID")

            # Step 2: Generate TOTP QR code
            totp_response = await self.generate_totp_qr(user_id)
            logger.info("TOTP response for frontend: %s", {
                "userId": user_id,
                "totpId": totp_response.get("totpId"),
                "qrcode_present": "qrcode" in totp_response,
                "secret_present": "secret" in totp_response
            })

            # If TOTP code is provided, verify it
            if totp_code:
                totp_id = totp_response.get("id")
                if not totp_id:
                    raise HTTPException(
                        status_code=400, detail="Failed to get TOTP ID")

                await self.verify_totp(user_id, totp_id, totp_code)
                return {"message": "MFA signup completed successfully"}

            # If no TOTP code provided, return QR code data
            return {
                "userId": user_id,
                "totpId": totp_response.get("totpId"),
                "qrcode": totp_response.get("qrcode"),
                "secret": totp_response.get("secret"),
                "message": "Please scan QR code and verify with TOTP code"
            }

        except Exception as e:
            logger.error(f"Error in MFA signup: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=400, detail=f"MFA signup error: {str(e)}")


mfa_signup = MFASignup()
