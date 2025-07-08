import httpx
import requests
import logging
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.utils.helpers import generate_error_response

from .routers import health
from app.users import v1_router as v1_users_router
from app.auth import v1_router as v1_auth_router
from app.auth.services import oidc_config

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


API_DESCRIPTION = """
This API backend service primarily interacts with [IBM Verify service](https://docs.verify.ibm.com/verify/reference).
API endpoints are consumed by our frontend application to perform user authentication and profile management.
The API endpoints enable our custom frontend application to implement complex workflows and user interfaces without limitations.

### Features

* Password-based authentication
* SMS, Email, Voice callback one-time passcode (OTP)
"""

CONTACT_INFO = {
    "name": "GC Sign In Team",
    "url": settings.app_info.github_url,
    "email": settings.app_info.email,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.config = get_settings()
    ibm_verify_config = app.state.config.ibm_verify_config
    logger.info("Starting IBM Verify Integration API")
    logger.info(f"Tenant URL: {ibm_verify_config.IBM_VERIFY_TENANT_URL}")
    logger.info(f"Client ID: {ibm_verify_config.IBM_VERIFY_API_CLIENT_ID}")
    logger.info("Application startup complete")
    app.state.request_client = httpx.AsyncClient()
    oidc_config.register_oidc(ibm_verify_config)

    yield
    logger.info("Closing global HTTP client")
    await app.state.request_client.aclose()
    logger.info("Shutting down IBM Verify Integration API")


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_info.app_name,
    description=API_DESCRIPTION,
    contact=CONTACT_INFO,
)


# Sets the session cookie - https://docs.authlib.org/en/latest/client/fastapi.html
# SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key="some-random-string",  # Use a strong secret in production
    https_only=False,  # Optional but recommended for HTTPS
    same_site="lax",  # Can be "strict", "lax", or "none"
    # domain=settings.PROFILE_MANAGEMENT_ORIGIN,  # Set to your domain if needed
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(health.router, prefix="/health")

app.include_router(
    v1_users_router.router,
    prefix=f"{settings.V1_API_VERSION}/users",
    tags=["Users"],
)

app.include_router(
    v1_auth_router.router,
    prefix=f"{settings.V1_API_VERSION}/auth",
    tags=["Auth"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # The Signup user endpoint uses Pydantic to validate the email
    # This handler is required to send a common format for errors

    error_message = ""
    for error in exc.errors():
        error_message = error["msg"]
        logger.error(f"Validation error: {error_message} at " + str(request.url))
        break
    return generate_error_response(status_code=400, message=error_message)


def log_request_response(
    endpoint: str, request_data: dict, response: requests.Response
):
    """Log request and response details"""
    try:
        logger.info(f"[{endpoint}] Request data: {json.dumps(request_data, indent=2)}")
        logger.info(f"[{endpoint}] Response status: {response.status_code}")
        logger.info(f"[{endpoint}] Response headers: {dict(response.headers)}")
        logger.info(
            f"[{endpoint}] Response body: {json.dumps(response.json(), indent=2)}"
        )
    except Exception as e:
        logger.error(f"[{endpoint}] Error logging request/response: {str(e)}")
