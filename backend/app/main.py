from fastapi import FastAPI
import httpx
import logging
from contextlib import asynccontextmanager

from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from authlib.integrations.starlette_client import OAuthError
from starsessions import SessionMiddleware, SessionAutoloadMiddleware
from redis.asyncio import Redis
from starsessions.stores.redis import RedisStore
from httpx import HTTPStatusError, TimeoutException
from pydantic import ValidationError

from app.config import get_configuration
from app.constants.redis_keys import RedisKeys

from .routers import health
from app.users import v1_router as v1_users_router
from app.auth import v1_router as v1_auth_router
from app.password import v1_router as v1_password_router
from app.otp import v1_router as v1_otp_router
from app.fido2 import v1_router as v1_fido2_router
from app.auth.services import oidc_config
from app.utils.global_error_handlers import (
    http_exception_handler,
    oauth_error_handler,
    http_status_error_handler,
    timeout_error_handler,
    request_validation_error_handler,
    validation_error_handler,
    generic_exception_handler,
)

# from Secweb import SecWeb

configuration = get_configuration()


class HealthCheckFilter(logging.Filter):
    """Filter to suppress healthcheck logs from Uvicorn access logs."""

    def filter(self, record: logging.LogRecord) -> bool:
        # Suppress logs for /health/health endpoint
        return record.getMessage().find("/health/health") == -1


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Add filter to suppress healthcheck logs from Uvicorn access logs
logging.getLogger("uvicorn.access").addFilter(HealthCheckFilter())


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
is_local_environment = configuration.ENVIRONMENT == "local"

if configuration.ENVIRONMENT != "local":
    # Construct the Redis URL with TLS and authentication for non-local environments
    redis_url = f"rediss://:{configuration.session_config.REDIS_AUTH_SECRET}@{configuration.session_config.REDIS_DOMAIN}:{configuration.session_config.REDIS_PORT}?ssl_cert_reqs=none"
    logger.info(f"Redis instance {configuration.session_config.REDIS_DOMAIN}")
else:
    logger.info(f"Redis instance {redis_url}")
redis_client = Redis.from_url(redis_url)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.config = configuration
    ibm_verify_config = app.state.config.ibm_verify_config
    logger.info("Starting IBM Verify Integration API")
    logger.info(f"RELEASE_TAG: {app.state.config.app_info.RELEASE_TAG}")
    logger.info(f"BUILD_TIMESTAMP: {app.state.config.app_info.BUILD_TIMESTAMP}")
    logger.info(f"ECR_REPOSITORY: {app.state.config.app_info.ECR_REPOSITORY}")
    logger.info(f"GITHUB_REF: {app.state.config.app_info.GITHUB_REF}")
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




def create_app():
    app = FastAPI(
        lifespan=lifespan,
        title=configuration.app_info.app_name,
        description=API_DESCRIPTION,
        contact=CONTACT_INFO,
        docs_url="/docs" if is_local_environment else None,
        redoc_url="/redoc" if is_local_environment else None,
        openapi_url="/openapi.json" if is_local_environment else None,
    )

    # Determine session domain
    # ROOT_DOMAIN is .<ROOT_DOMAIN> example: .signin-connexion.cdssandbox.xyz
    session_domain = None
    if configuration.ENVIRONMENT != "local":
        session_domain = f".{configuration.ROOT_DOMAIN}"
    logger.info(f"ROOT_DOMAIN: {session_domain}")

    session_store = RedisStore(
        connection=redis_client,
        prefix=RedisKeys.REDIS_SESSION_KEY.value,
        gc_ttl=configuration.session_config.SESSION_LIFETIME,
    )
    logger.info("Using RedisStore for session management")

    # Determine if cookie should be secure
    cookie_secure = False if configuration.ENVIRONMENT == "local" else True
    logger.info(f"Cookie Secure: {cookie_secure}")

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=configuration.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

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

    app.include_router(
        v1_fido2_router.router,
        prefix=f"{configuration.V1_API_VERSION}/fido2",
        tags=["FIDO2"],
    )

    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(OAuthError, oauth_error_handler)
    app.add_exception_handler(HTTPStatusError, http_status_error_handler)
    app.add_exception_handler(OAuthError, oauth_error_handler)
    app.add_exception_handler(TimeoutException, timeout_error_handler)
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)
    app.add_exception_handler(ValidationError, validation_error_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    return app


app = create_app()