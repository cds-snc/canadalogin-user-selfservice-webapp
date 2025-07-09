from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl, Field


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


class Settings(BaseSettings):
    app_info: AppInfo = AppInfo()
    ibm_verify_config: IBMVerifyConfig = IBMVerifyConfig()
    ENVIRONMENT: str = Field(default="local")
    V1_API_VERSION: str = "/v1"
    LOADBALANCER_DNS_NAME: Optional[str] = None  # Not required for local development - "DNS name of the FastAPI backend load balancer, used for configuring TrustedHostMiddleware for the backend server (https://www.starlette.io/middleware/#trustedhostmiddleware)"
    ROOT_DOMAIN: Optional[str] = None  # Not required for local development, when deployed env needs to be e.g. ".gc-signin.cdssandbox.xyz"
    PROFILE_MANAGEMENT_DOMAIN: str = (
        "http://localhost:3000"  # For non local environments, set domain to app.gc-signin.cdssandbox.xyz
    )

    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000",
        description="Comma-separated list of CORS origins, Terraform cant pass in a list[str]."
    )

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS_ORIGINS string to list"""
        return [f"https://{origin.strip()}" for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_hosts(self) -> List[str]:
        """Convert comma-separated CORS_ORIGINS string to list"""
        allowed_hosts_value = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

        if self.ROOT_DOMAIN:
            allowed_hosts_value.append(f"*.{self.ROOT_DOMAIN}")
            # allowed_hosts_value.append(f"api.{self.ROOT_DOMAIN}")

        if self.LOADBALANCER_DNS_NAME:
            allowed_hosts_value.append(self.LOADBALANCER_DNS_NAME)

        if self.PROFILE_MANAGEMENT_DOMAIN:
            allowed_hosts_value.append(self.PROFILE_MANAGEMENT_DOMAIN)

        return allowed_hosts_value


@lru_cache
def get_settings():
    return Settings()
