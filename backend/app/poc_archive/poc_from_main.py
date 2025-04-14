# from webauthn import (
#     generate_registration_options,
#     verify_registration_response,
# )

# from webauthn.helpers.cose import COSEAlgorithmIdentifier
# from webauthn.helpers.structs import (
#     AuthenticatorSelectionCriteria,
#     UserVerificationRequirement,
#     RegistrationCredential,
# )

# # WebAuthn configuration
# RP_ID = "localhost"
# RP_NAME = "IBM Verify Integration"
# ORIGIN = "http://localhost:3000"

# # Helper functions for base64url encoding/decoding


# def bytes_to_base64url(bytes_data):
#     return base64.urlsafe_b64encode(bytes_data).rstrip(b'=').decode('ascii')


# def base64url_to_bytes(base64url_data):
#     padding = b'=' * (-len(base64url_data) % 4)
#     return base64.urlsafe_b64decode(base64url_data.encode('ascii') + padding)


# async def get_admin_token():
#     """Get admin token for IBM Verify API operations"""
#     try:
#         logger.info("Attempting to get admin token")
#         token_url = f"{settings.ibm_verify_config.IBM_VERIFY_TENANT_URL}/oauth2/token"
#         data = {
#             "grant_type": "client_credentials",
#             "client_id": settings.ibm_verify_config.IBM_VERIFY_API_CLIENT_ID,
#             "client_secret": settings.ibm_verify_config.IBM_VERIFY_API_CLIENT_SECRET,
#             "scope": "openid"
#         }

#         logger.debug(f"Token URL: {token_url}")
#         start_time = datetime.now()
#         response = requests.post(token_url, data=data)
#         duration = (datetime.now() - start_time).total_seconds()
#         logger.info(f"Token request completed in {duration:.2f} seconds")

#         if response.status_code != 200:
#             logger.error(
#                 f"Failed to get admin token. Status: {response.status_code}")
#             logger.error(f"Error response: {response.text}")
#             raise HTTPException(
#                 status_code=400, detail="Failed to get admin token")

#         logger.info("Successfully obtained admin token")
#         return response.json()["access_token"]
#     except Exception as e:
#         logger.error(f"Error getting admin token: {str(e)}", exc_info=True)
#         raise HTTPException(
#             status_code=400, detail=f"Admin token error: {str(e)}")


# @app.post("/api/auth/signup")
# async def signup(request: Request):
#     """Handle user registration through IBM Verify"""
#     try:
#         logger.info("Processing signup request")
#         user_data = await request.json()
#         logger.debug(
#             f"Received user data: {json.dumps({**user_data, 'password': '***REDACTED***'}, indent=2)}")

#         # Get admin token for user creation
#         admin_token = await get_admin_token()

#         signup_url = f"{settings.ibm_verify_config.IBM_VERIFY_TENANT_URL}/v2.0/Users"
#         headers = {
#             "Authorization": f"Bearer {admin_token}",
#             "Content-Type": "application/scim+json",
#             "Accept": "application/scim+json"
#         }

#         # Prepare user data according to SCIM 2.0 schema
#         verify_user_data = {
#             "schemas": [
#                 "urn:ietf:params:scim:schemas:core:2.0:User",
#                 "urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
#             ],
#             "userName": user_data.get("userName"),
#             "password": user_data.get("password"),
#             "name": {
#                 "givenName": user_data.get("name", {}).get("givenName", ""),
#                 "familyName": user_data.get("name", {}).get("familyName", "")
#             },
#             "emails": [
#                 {
#                     "value": user_data.get("userName"),
#                     "type": "work",
#                     "primary": True
#                 }
#             ],
#             "active": True,
#             "urn:ietf:params:scim:schemas:extension:ibm:2.0:User": {
#                 "realm": "www.ibm.com",
#                 "userCategory": "regular"
#             }
#         }

#         # Log request details (excluding sensitive data)
#         log_data = {**verify_user_data}
#         log_data["password"] = "***REDACTED***"
#         logger.debug(f"Signup URL: {signup_url}")
#         logger.debug(f"Request headers: {headers}")
#         logger.debug(f"Request body: {json.dumps(log_data, indent=2)}")
#         logger.info(f"Attempting to create user: {user_data.get('userName')}")

#         start_time = datetime.now()
#         response = requests.post(
#             signup_url, json=verify_user_data, headers=headers)
#         duration = (datetime.now() - start_time).total_seconds()
#         logger.info(f"Signup request completed in {duration:.2f} seconds")

#         if response.status_code == 201:
#             logger.info(
#                 f"Successfully created user: {user_data.get('userName')}")
#             return response.json()
#         else:
#             error_detail = response.json()
#             logger.error(f"Signup failed. Status: {response.status_code}")
#             logger.error(
#                 f"Error response: {json.dumps(error_detail, indent=2)}")
#             raise HTTPException(
#                 status_code=response.status_code,
#                 detail=error_detail.get(
#                     "detail", error_detail.get("message", "Signup failed"))
#             )

#     except HTTPException as he:
#         logger.error(f"HTTP Exception in signup: {str(he)}")
#         raise he
#     except Exception as e:
#         logger.error(f"Signup error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")


# @app.post("/api/auth/login")
# async def login(code: str):
#     """Handle OIDC login with authorization code"""
#     try:
#         logger.info("Processing login request")
#         token_url = f"{settings.IBM_VERIFY_TENANT_URL}/oauth2/token"
#         data = {
#             "grant_type": "authorization_code",
#             "client_id": settings.IBM_VERIFY_CLIENT_ID,
#             "client_secret": settings.IBM_VERIFY_CLIENT_SECRET,
#             "code": code,
#             "redirect_uri": settings.IBM_VERIFY_REDIRECT_URI
#         }

#         logger.debug(f"Login URL: {token_url}")
#         start_time = datetime.now()
#         response = requests.post(token_url, data=data)
#         duration = (datetime.now() - start_time).total_seconds()
#         logger.info(f"Login request completed in {duration:.2f} seconds")

#         if response.status_code != 200:
#             logger.error(f"Login failed. Status: {response.status_code}")
#             logger.error(f"Error response: {response.text}")
#             raise HTTPException(status_code=400, detail="Login failed")

#         logger.info("Login successful")
#         return response.json()
#     except Exception as e:
#         logger.error(f"Login error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=str(e))


# @app.get("/api/user/profile")
# async def get_user_profile(token: str):
#     """Get user profile information"""
#     try:
#         logger.info("Fetching user profile")
#         userinfo_url = f"{settings.IBM_VERIFY_TENANT_URL}/oauth2/userinfo"
#         headers = {"Authorization": f"Bearer {token}"}

#         logger.debug(f"Profile URL: {userinfo_url}")
#         start_time = datetime.now()
#         response = requests.get(userinfo_url, headers=headers)
#         duration = (datetime.now() - start_time).total_seconds()
#         logger.info(f"Profile request completed in {duration:.2f} seconds")

#         if response.status_code != 200:
#             logger.error(
#                 f"Failed to fetch profile. Status: {response.status_code}")
#             logger.error(f"Error response: {response.text}")
#             raise HTTPException(
#                 status_code=400, detail="Failed to fetch profile")

#         logger.info("Successfully retrieved user profile")
#         return response.json()
#     except Exception as e:
#         logger.error(f"Profile error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=str(e))


# @app.post("/api/auth/passkey/register/options")
# async def get_registration_options(request: Request):
#     """Get registration options for passkey signup"""
#     try:
#         user_data = await request.json()
#         user_id = str(uuid.uuid4())  # Generate a unique user ID

#         logger.debug(
#             f"Available algorithms: {[alg.name for alg in COSEAlgorithmIdentifier]}")

#         options = generate_registration_options(
#             rp_id=RP_ID,
#             rp_name=RP_NAME,
#             user_id=user_id,
#             user_name=user_data.get("userName"),
#             user_display_name=f"{user_data.get('name', {}).get('givenName', '')} {user_data.get('name', {}).get('familyName', '')}",
#             authenticator_selection=AuthenticatorSelectionCriteria(
#                 user_verification=UserVerificationRequirement.PREFERRED,
#                 resident_key="required",
#             ),
#             supported_pub_key_algs=[
#                 -7,  # ES256 (ECDSA with SHA-256)
#                 -257  # RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
#             ],
#         )

#         # Store registration state for verification
#         # In production, this should be stored in a database
#         registration_state = {
#             "user_id": user_id,
#             "user_data": user_data,
#             "challenge": bytes_to_base64url(options.challenge),
#         }

#         logger.info(
#             f"Generated registration options for user: {user_data.get('userName')}")

#         # Convert options to JSON-serializable format
#         options_json = {
#             "rp": {
#                 "name": RP_NAME,
#                 "id": RP_ID,
#             },
#             "user": {
#                 "id": bytes_to_base64url(user_id.encode()),
#                 "name": user_data.get("userName"),
#                 "displayName": f"{user_data.get('name', {}).get('givenName', '')} {user_data.get('name', {}).get('familyName', '')}",
#             },
#             "challenge": bytes_to_base64url(options.challenge),
#             # ES256 and RS256
#             "pubKeyCredParams": [{"type": "public-key", "alg": alg} for alg in [-7, -257]],
#             "timeout": 60000,  # 60 seconds
#             "attestation": "none",
#             "authenticatorSelection": {
#                 "authenticatorAttachment": None,
#                 "residentKey": "required",
#                 "requireResidentKey": True,
#                 "userVerification": "preferred",
#             },
#         }

#         return {
#             "options": options_json,
#             "state": registration_state
#         }

#     except Exception as e:
#         logger.error(
#             f"Error generating registration options: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=str(e))


# @app.post("/api/auth/passkey/register/verify")
# async def verify_registration(request: Request):
#     """Verify passkey registration and create user"""
#     try:
#         data = await request.json()
#         credential_data = data.get("credential")
#         registration_state = data.get("state")

#         if not credential_data or not registration_state:
#             raise HTTPException(
#                 status_code=400, detail="Missing registration data")

#         try:
#             # Convert the credential data to the expected format
#             raw_id = base64url_to_bytes(credential_data["rawId"])
#             client_data = base64url_to_bytes(
#                 credential_data["response"]["clientDataJSON"])
#             att_obj = base64url_to_bytes(
#                 credential_data["response"]["attestationObject"])

#             credential = RegistrationCredential(
#                 id=credential_data["id"],
#                 raw_id=raw_id,
#                 response={
#                     "clientDataJSON": client_data,
#                     "attestationObject": att_obj,
#                 },
#                 type=credential_data["type"]
#             )

#             try:
#                 verification = verify_registration_response(
#                     credential=credential,
#                     expected_challenge=base64url_to_bytes(
#                         registration_state["challenge"]),
#                     expected_origin=ORIGIN,
#                     expected_rp_id=RP_ID,
#                 )

#                 logger.info("Verification result:", verification)

#                 # Create user in IBM Verify with passkey credentials
#                 user_data = registration_state["user_data"]
#                 admin_token = await get_admin_token()

#                 signup_url = f"{settings.IBM_VERIFY_TENANT_URL}/v2.0/Users"
#                 headers = {
#                     "Authorization": f"Bearer {admin_token}",
#                     "Content-Type": "application/scim+json",
#                     "Accept": "application/scim+json"
#                 }

#                 verify_user_data = {
#                     "schemas": [
#                         "urn:ietf:params:scim:schemas:core:2.0:User",
#                         "urn:ietf:params:scim:schemas:extension:ibm:2.0:User"
#                     ],
#                     "userName": user_data.get("userName"),
#                     "name": {
#                         "givenName": user_data.get("name", {}).get("givenName", ""),
#                         "familyName": user_data.get("name", {}).get("familyName", "")
#                     },
#                     "emails": [
#                         {
#                             "value": user_data.get("userName"),
#                             "type": "work",
#                             "primary": True
#                         }
#                     ],
#                     "active": True,
#                     "urn:ietf:params:scim:schemas:extension:ibm:2.0:User": {
#                         "realm": "www.ibm.com",
#                         "userCategory": "regular",
#                         "authenticators": [
#                             {
#                                 "type": "passkey",
#                                 "credentialId": bytes_to_base64url(verification.credential_id),
#                                 "publicKey": bytes_to_base64url(verification.credential_public_key),
#                                 "signCount": verification.sign_count,
#                             }
#                         ]
#                     }
#                 }

#                 response = requests.post(
#                     signup_url, json=verify_user_data, headers=headers)

#                 if response.status_code == 201:
#                     logger.info(
#                         f"Successfully created user with passkey: {user_data.get('userName')}")
#                     return response.json()
#                 else:
#                     error_detail = response.json()
#                     logger.error(
#                         f"Passkey signup failed. Status: {response.status_code}")
#                     logger.error(
#                         f"Error response: {json.dumps(error_detail, indent=2)}")
#                     raise HTTPException(
#                         status_code=response.status_code,
#                         detail=error_detail.get(
#                             "detail", "Passkey signup failed")
#                     )

#             except Exception as e:
#                 logger.error(f"Error during verification: {str(e)}")
#                 raise HTTPException(
#                     status_code=400, detail=f"Verification failed: {str(e)}")

#         except Exception as e:
#             logger.error(
#                 f"Error verifying passkey registration: {str(e)}", exc_info=True)
#             raise HTTPException(status_code=400, detail=str(e))

#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         logger.error(f"Passkey registration error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=str(e))


# @app.post("/api/auth/password/signin")
# async def password_signin(request: Request):
#     """Handle password-based sign-in using IBM Security Verify v2.0 API"""
#     try:
#         data = await request.json()
#         username = data.get("userName")
#         password = data.get("password")

#         if not username or not password:
#             raise HTTPException(
#                 status_code=400, detail="Username and password are required")

#         logger.info(f"Processing password sign-in for user: {username}")
#         result = await authenticate_password(username, password)
#         logger.info("Password sign-in successful")
#         return result

#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         logger.error(f"Sign-in error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=f"Sign-in error: {str(e)}")


# @app.post("/api/auth/signup/mfa")
# async def signup_with_mfa(request: Request):
#     """Handle user registration with MFA through IBM Verify"""
#     try:
#         user_data = await request.json()
#         logger.debug(
#             f"Received MFA signup data: {json.dumps({**user_data, 'password': '***REDACTED***'}, indent=2)}")

#         # If TOTP code is provided, complete verification
#         totp_code = user_data.pop("totpCode", None)
#         user_id = user_data.pop("userId", None)
#         totp_id = user_data.pop("totpId", None)

#         if user_id and totp_id and totp_code:
#             # Verify TOTP code
#             return await mfa_signup.verify_totp(user_id, totp_id, totp_code)

#         # Start MFA signup process
#         return await mfa_signup.signup_with_mfa(user_data)

#     except Exception as e:
#         logger.error(f"MFA Signup error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=400, detail=str(e))


# @app.post("/api/email/sendEmailOtp", status_code=201)
# async def send_email_otp(request: Request) -> EmailOtpResponse:
#     response = None  # initialilize response object

#     data = await request.json()

#     email_address = {
#         "emailAddress": data.get("emailAddress")
#     }

#     if not email_address:
#         raise HTTPException(
#             status_code=400, detail="Email address is required")

#     try:
#         admin_token = await get_admin_token()

#         headers = {
#             "Authorization": f"Bearer {admin_token}",
#             "Content-Type": "application/json"
#         }
#         transient_email_otp_url = f"{settings.ibm_verify_config.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications"

#         logger.info("Attempting to send email OTP")

#         response = requests.post(
#             transient_email_otp_url, json=email_address, headers=headers)

#         if response.status_code == 201:
#             logger.info("Email OTP created and sent")

#         successful_response = EmailOtpResponse(
#             transactionID=response.json()['id'],
#             type=response.json()['type'],
#             created=response.json()['created'],
#             updated=response.json()['updated'],
#             expiry=response.json()['expiry'],
#             state=response.json()['state'],
#             correlationID=response.json()['correlation'],
#             emailAddress=response.json()['emailAddress'],
#             attempts=str(response.json()['attempts']),
#             retries=str(response.json()['retries'])
#         )

#         return successful_response

#     except Exception as e:
#         raise HTTPException(status_code=response.status_code,
#                             detail=str(response.reason))


# @app.post("/api/email/verifyEmailOtp", status_code=204)
# async def verify_email_otp(request: Request):
#     data = await request.json()
#     admin_token = await get_admin_token()
#     response = None

#     headers = {
#         "Authorization": f"Bearer {admin_token}",
#         "Content-Type": "application/json",
#     }
#     pass_code = {
#         "otp": data.get('otp')
#     }
#     dd = data.get('trxnId')
#     try:
#         transient_email_verification_url = f"{settings.ibm_verify_config.IBM_VERIFY_TENANT_URL}/v2.0/factors/emailotp/transient/verifications/{dd}"
#         response = requests.post(
#             transient_email_verification_url, json=pass_code, headers=headers)

#         if response.status_code == 204:
#             logger.info("Email OTP has been validated")
#             return response.content

#     except Exception as e:
#         logger.error(e)
#         raise HTTPException(status_code=response.status_code,
#                             detail=str(response.reason))


# class HealthResponse(BaseModel):
#     status: str = Field(..., description="Service health status",
#                         example="healthy")
#     timestamp: str = Field(..., description="Current UTC timestamp in ISO format",
#                            example="2024-03-05T12:34:56.789Z")
#     service: str = Field(..., description="Service name",
#                          example="gc-signin-backend")
#     version: str = Field(..., description="Service version", example="1.0.0")


# class RootResponse(BaseModel):
#     message: str = Field(..., description="Welcome message",
#                          example="GC Sign In Backend Service")
