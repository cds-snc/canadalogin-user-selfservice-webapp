from pydantic import BaseSettings, validator
from typing import List
import os

class Settings(BaseSettings):
    IBM_VERIFY_TENANT_URL: str
    IBM_VERIFY_CLIENT_ID: str
    IBM_VERIFY_CLIENT_SECRET: str
    IBM_VERIFY_REDIRECT_URI: str = "http://localhost:8000"
    CORS_ORIGINS: str = "http://localhost:3000,http://gc-signin-dev-frontend-alb-698661334.ca-central-1.elb.amazonaws.com"

    @validator("CORS_ORIGINS")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        raise ValueError("CORS_ORIGINS must be a comma-separated string")

    class Config:
        env_file = os.environ.get("ENV_FILE", ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings() 