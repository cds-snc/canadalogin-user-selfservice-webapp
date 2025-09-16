import httpx
import requests
import logging
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuthError
from starsessions import SessionMiddleware, SessionAutoloadMiddleware, InMemoryStore
from redis.asyncio import Redis
from starsessions.stores.redis import RedisStore

from app.config import get_configuration
from app.utils.helpers import generate_error_response
from app.auth.services.auth import redirect_user_to_idp_verify

from .routers import health
from app.users import v1_router as v1_users_router
from app.auth import v1_router as v1_auth_router
from app.password import v1_router as v1_password_router
from app.otp import v1_router as v1_otp_router
from app.auth.services import oidc_config

configuration = get_configuration()

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
    "url": configuration.app_info.github_url,
    "email": configuration.app_info.email,
}

redis_url = configuration.session_config.SESSION_REDIS_URL
if configuration.ENVIRONMENT != "local":
    # Construct the Redis URL with TLS and authentication for non-local environments
    redis_url = f"rediss://:{configuration.session_config.REDIS_AUTH_SECRET}@{configuration.session_config.REDIS_DOMAIN}:{configuration.session_config.REDIS_PORT}?ssl_cert_reqs=none"
    logger.info(
        f"Connecting to Redis at {configuration.session_config.REDIS_DOMAIN}"
    )
else:
    logger.info("Connecting to local Redis instance")
redis_client = Redis.from_url(redis_url)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.config = configuration
    ibm_verify_config = app.state.config.ibm_verify_config
    logger.info("Starting IBM Verify Integration API")
    logger.info(f"Tenant URL: {ibm_verify_config.IBM_VERIFY_TENANT_URL}")
    logger.info(
        f"Client ID: {ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID}"
    )
    logger.info(
        f"PROFILE_MANAGEMENT_CLIENT_ID: {ibm_verify_config.IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID}"
    )
    logger.info("Application startup complete")
    app.state.request_client = httpx.AsyncClient()

    if redis_client is not None:
        pong = await redis_client.ping()
        if pong:
            logger.info("Connected to Redis server successfully")
            app.state.redis_client = redis_client
            logger.info("Using RedisStore for session management")

    oidc_config.register_oidc(app.state.config)
    logger.info(f"CORS Origins: {app.state.config.cors_origins_list}")
    logger.info(f"oidc_well_known_config: {app.state.config.oidc_well_known_config}")
    logger.info(f"my_profile_endpoint: {app.state.config.profile_api_endpoint}")
    yield
    logger.info("Closing global HTTP client")
    await app.state.request_client.aclose()
    logger.info("Shutting down IBM Verify Integration API")
    if hasattr(app.state, "redis_client"):
        await app.state.redis_client.close()
        logger.info("Closing Redis client")


app = FastAPI(
    lifespan=lifespan,
    title=configuration.app_info.app_name,
    description=API_DESCRIPTION,
    contact=CONTACT_INFO,
)

# Determine session domain
session_domain = None
if configuration.ENVIRONMENT != "local":
    session_domain = f".{configuration.ROOT_DOMAIN}"
logger.info(f"ROOT_DOMAIN: {session_domain}")

# Determine session store
session_store = InMemoryStore()
if redis_client is not None:
    session_store = RedisStore(
        connection=redis_client,
        prefix="session:",
        gc_ttl=configuration.session_config.SESSION_LIFETIME,
    )

# Determine if cookie should be secure
cookie_secure = False if configuration.ENVIRONMENT == "local" else True
logger.info(f"Cookie Secure: {cookie_secure}")

# Autoload session if cookie is present
app.add_middleware(SessionAutoloadMiddleware)
# SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    store=session_store,
    rolling=True,
    cookie_https_only=cookie_secure,
    lifetime=configuration.session_config.SESSION_LIFETIME,
    cookie_domain=configuration.ROOT_DOMAIN,
    cookie_name=configuration.session_config.SESSION_COOKIE_NAME,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=configuration.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(health.router, prefix="/health")

app.include_router(
    v1_users_router.router,
    prefix=f"{configuration.V1_API_VERSION}/users",
    tags=["Users"],
)

app.include_router(
    v1_auth_router.router,
    prefix=f"{configuration.V1_API_VERSION}/auth",
    tags=["Auth"],
)

app.include_router(
    v1_password_router.router,
    prefix=f"{configuration.V1_API_VERSION}/password",
    tags=["Password"],
)

app.include_router(
    v1_otp_router.router,
    prefix=f"{configuration.V1_API_VERSION}/otp",
    tags=["OTP"],
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


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail},
    )


@app.exception_handler(OAuthError)
async def oauth_error_handler(request: Request, exc: OAuthError):
    """Catch OAuth errors and redirect user to IdP login."""
    logger.error("OAuth exception handler error: %s", exc)
    if "application/json" in request.headers.get("accept", ""):
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or expired token"},
        )
    return await redirect_user_to_idp_verify(request)


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
