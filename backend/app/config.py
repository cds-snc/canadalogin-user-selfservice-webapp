from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import BaseModel, Field, AnyUrl


class AppInfo(BaseSettings):
    app_name: str = "GC Sign In Backend API"
    github_url: AnyUrl = "https://github.com/cds-snc/gc-signin-ibm"
    email: str = "gcsignin@cds-snc.ca"


class IBMVerifyConfig(BaseSettings):

    IBM_VERIFY_TENANT_URL: str
    IBM_VERIFY_CLIENT_ID: str
    IBM_VERIFY_CLIENT_SECRET: str
    IBM_VERIFY_REDIRECT_URI: str
    IBM_VERIFY_API_CLIENT_ID: str
    IBM_VERIFY_API_CLIENT_SECRET: str
    IBM_VERIFY_API_CLIENT_ID: str
    IBM_VERIFY_API_CLIENT_SECRET: str
    # Password Source ID for IBM Verify, currently used in mfa_auth and password_auth. I think its for debugging purposes
    PASSWORD_SOURCE_ID: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


class Settings(BaseSettings):

    ENVIRONMENT: str = Field("dev", env="ENVIRONMENT")
    V1_API_PATH: str = '/v1'
    app_info: AppInfo = AppInfo()
    ibm_verify_config: IBMVerifyConfig = IBMVerifyConfig()
    # CORS_ORIGINS - allow all only for demo purposes, should be set to the frontend URL
    # Todo - set cors to frontend URL
    CORS_ORIGINS: List[str] = ["*"]
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_settings():
    return Settings()


print(get_settings().model_dump_json(indent=2))
