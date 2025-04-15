import httpx
import requests
import logging
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.utils.helpers import generate_error_response

from .routers import health
from app.password import v1_router as v1_password_router
from app.users import v1_router as v1_users_router
from app.otp import v1_router as v1_otp_router

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
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
    "email": settings.app_info.email
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.config = get_settings().ibm_verify_config

    logger.info("Starting IBM Verify Integration API")
    logger.info(
        f"Tenant URL: {app.state.config.IBM_VERIFY_TENANT_URL}")
    logger.info(
        f"Client ID: {app.state.config.IBM_VERIFY_API_CLIENT_ID}")
    logger.info("Application startup complete")
    app.state.request_client = httpx.AsyncClient()
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

app.include_router(health.router, prefix="/health")

app.include_router(
    v1_users_router.router,
    prefix=f"{settings.V1_API_PATH}/users",
    tags=["Users"],
)

app.include_router(
    v1_password_router.router,
    prefix=f"{settings.V1_API_PATH}/password",
    tags=["Password Related APIs"],
)

app.include_router(
    v1_otp_router.router,
    prefix=f"{settings.V1_API_PATH}/otp",
    tags=["OTP"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # The Signup user endpoint uses Pydantic to validate the email
    # This handler is required to send a common format for errors

    error_message = ""
    for error in exc.errors():
        error_message = error["msg"]
        break
    return generate_error_response(
        status_code=400,
        message=error_message
    )


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


def log_request_response(endpoint: str, request_data: dict, response: requests.Response):
    """Log request and response details"""
    try:
        logger.info(
            f"[{endpoint}] Request data: {json.dumps(request_data, indent=2)}")
        logger.info(f"[{endpoint}] Response status: {response.status_code}")
        logger.info(f"[{endpoint}] Response headers: {dict(response.headers)}")
        logger.info(
            f"[{endpoint}] Response body: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        logger.error(f"[{endpoint}] Error logging request/response: {str(e)}")
