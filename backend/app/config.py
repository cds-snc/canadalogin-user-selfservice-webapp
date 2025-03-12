from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel, Field, AnyUrl


class AppInfo(BaseModel):
    app_name: str = "GC Sign In Backend API"
    github_url: AnyUrl = "https://github.com/cds-snc/gc-signin-ibm"
    email: str = "gcsignin@cds-snc.ca"


class IBMAPI(BaseModel):
    IBM_VERIFY_API_CLIENT_ID: str = Field(
        "53a6abe8-b54e-4164-bfbc-6a98760604e3", env="IBM_VERIFY_API_CLIENT_ID")
    IBM_VERIFY_API_CLIENT_SECRET: str = Field(
        "0", env="IBM_VERIFY_API_CLIENT_SECRET")


class IBMVerify(BaseModel):
    IBM_VERIFY_TENANT_URL: str = Field(
        "https://cds-gcsignin-dev.verify.ibm.com/oauth2/.well-known/openid-configuration", env="IBM_VERIFY_TENANT_URL")

    IBM_VERIFY_CLIENT_ID: str = Field(
        "53a6abe8-b54e-4164-bfbc-6a98760604e3", env="IBM_VERIFY_CLIENT_ID")
    IBM_VERIFY_CLIENT_SECRET: str = Field("0", env="IBM_VERIFY_CLIENT_SECRET")
    IBM_VERIFY_REDIRECT_URI: str = Field(
        "http://localhost:8000", env="IBM_VERIFY_REDIRECT_URI")
    # Password Source ID for IBM Verify, currently used in mfa_auth and password_auth. I think its for debugging purposes
    PASSWORD_SOURCE_ID: str = Field("0", env="PASSWORD_SOURCE_ID")


class Settings(BaseSettings):
    ENVIRONMENT: str = Field("dev", env="ENVIRONMENT")
    app_info: AppInfo = AppInfo()
    ibm_verify: IBMVerify = IBMVerify()
    CORS_ORIGINS: str = Field(
        "http://localhost:3000", env="CORS_ORIGINS")

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True)


@lru_cache
def get_settings():
    return Settings()
