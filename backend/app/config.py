from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl, Field
from app.constants.verify_endpoints import VerifyAPIEndpoint


class AppInfo(BaseSettings):
    app_name: str = "GC Sign In Backend API"
    github_url: AnyUrl = "https://github.com/cds-snc/gc-signin-user-self-service-webapp"
    email: str = "gcsignin@cds-snc.ca"


class IBMVerifyConfig(BaseSettings):

    IBM_VERIFY_TENANT_URL: str
    IBM_VERIFY_API_CLIENT_ID: str
    IBM_VERIFY_API_CLIENT_SECRET: str
    IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID: str
    IBM_VERIFY_PROFILE_MANAGEMENT_SECRET: str
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )

class SessionConfig(BaseSettings):
    SESSION_STORE_TYPE: str
    SESSION_SECRET: str = Field(..., description="Secret key for signing session cookies")
    SESSION_COOKIE_SECURE: bool = True
    SESSION_COOKIE_DOMAIN: Optional[str] = None
    SESSION_REDIS_URL: Optional[str] = None
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class Configuration(BaseSettings):
    app_info: AppInfo = AppInfo()
    ibm_verify_config: IBMVerifyConfig = IBMVerifyConfig()
    session_config: SessionConfig = SessionConfig()
    ENVIRONMENT: str = Field(default="local")
    V1_API_VERSION: str = "/v1"
    ROOT_DOMAIN: Optional[str] = (
        None  # Not required for local development, value should be ".gc-signin.cdssandbox.xyz"
    )
    PROFILE_MANAGEMENT_DOMAIN: str = (
        "http://localhost:3000"  # Frontend Management App domain to app.gc-signin.cdssandbox.xyz
    )

    CORS_ORIGINS: str = Field(
        default="localhost:3000,localhost:8000",
        description="Comma-separated list of CORS origins, Terraform cant pass in a list[str].",
    )

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS_ORIGINS string to list - Terraform cant pass in a list[str]."""
        http_value = "https://"
        if self.ENVIRONMENT == "local":
            http_value = "http://"
        return [
            f"{http_value}{origin.strip()}" for origin in self.CORS_ORIGINS.split(",")
        ]

    @property
    def profile_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.PROFILE.value}"

    @property
    def oidc_well_known_config(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.OIDC_WELL_KNOWN_CONFIG.value}"

    @property
    def rp_user_applications_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.RP_USER_APPLICATIONS.value}"


@lru_cache
def get_configuration():
    return Configuration()
