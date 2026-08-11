from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyUrl, Field
from app.constants.verify_endpoints import VerifyAPIEndpoint

# Path to the GlobalSign R3 root CA certificate bundled with the repository.
_BUNDLED_GLOBALSIGN_CERT_PATH = str(
    Path(__file__).parent.parent / "certs" / "globalsign-root-r3.crt"
)


class AppInfo(BaseSettings):
    app_name: str = "GC Sign In Backend API"
    github_url: AnyUrl = "https://github.com/cds-snc/gc-signin-user-self-service-webapp"
    email: str = "gcsignin@cds-snc.ca"
    RELEASE_TAG: str = Field(default="unknown", description="CI/CD Release tag")
    ECR_REPOSITORY: str = Field(default="unknown", description="ECR repository name")
    BUILD_TIMESTAMP: str = Field(default="unknown", description="Build timestamp")
    GITHUB_REF: str = Field(
        default="unknown", description="GitHub reference (branch/tag)"
    )
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class IBMVerifyConfig(BaseSettings):

    IBM_VERIFY_TENANT_URL: str
    IBM_VERIFY_PROFILE_MANAGEMENT_API_CLIENT_ID: str
    IBM_VERIFY_PROFILE_MANAGEMENT_API_SECRET: str
    IBM_VERIFY_PROFILE_MANAGEMENT_CLIENT_ID: str
    IBM_VERIFY_PROFILE_MANAGEMENT_SECRET: str
    IBM_VERIFY_PROVINCIAL_PARTNERS_IDENTITY_SOURCE_ID: Optional[str] = None
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class SessionConfig(BaseSettings):
    SESSION_REDIS_URL: str = "redis://localhost:6379/0"
    SESSION_COOKIE_NAME: str = "gc-manage-app"
    SESSION_LIFETIME: int = 60 * 30  # default to 30 minutes in seconds
    REDIS_AUTH_SECRET: str = "test-secret"
    REDIS_DOMAIN: str = "localhost"
    REDIS_PORT: int = 6379
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class FIDO2MDSConfig(BaseSettings):
    """Configuration for the FIDO2 MDS3 metadata service.

    All values can be overridden via environment variables.
    """

    FIDO2_MDS3_URL: str = Field(
        default="https://mds3.fidoalliance.org/",
        description="URL of the FIDO Alliance MDS3 metadata blob.",
    )
    FIDO2_GLOBALSIGN_ROOT_CERT_URL: str = Field(
        default="https://secure.globalsign.com/cacert/root-r3.crt",
        description="URL used to download the GlobalSign R3 root CA certificate for MDS3 JWT verification.",
    )
    FIDO2_MDS_CERT_PATH: Optional[str] = Field(
        default=_BUNDLED_GLOBALSIGN_CERT_PATH,
        description=(
            "Path to a local DER-encoded GlobalSign R3 CA certificate file used for "
            "MDS3 JWT verification. Defaults to the cert bundled with the repository. "
            "Set to an empty string to skip the file and use the live download instead."
        ),
    )
    FIDO2_REDIS_MDS_TTL: Optional[int] = Field(
        default=None,
        description=(
            "Redis TTL in seconds for the MDS metadata cache. "
            "Defaults to None (no expiry) so cached data survives across refresh failures."
        ),
    )
    FIDO2_REFRESH_INTERVAL: int = Field(
        default=24 * 60 * 60,
        description="Background MDS refresh interval in seconds. Default is 24 hours.",
    )
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class BluinkConfig(BaseSettings):
    BLUINK_CLIENT_ID: Optional[str] = None
    BLUINK_CLIENT_SECRET: Optional[str] = None
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class IdvDataStoreConfig(BaseSettings):
    """Configuration for exchanging tokens with, and calling, idv-data-store.

    The credential system used is this app's dedicated IBM Verify STS
    client (IDV_DATA_STORE_STS_CLIENT_ID/SECRET), which performs RFC 8693
    OAuth 2.0 Token Exchange directly against IBM Verify. The exchanged,
    narrowly-scoped token is then used directly as Bearer for idv-data-store
    delegated-user endpoints.
    """

    IDV_DATA_STORE_BASE_URL: str = "https://idv.dev2.login-connexion.alpha.canada.ca"
    IDV_DATA_STORE_STS_CLIENT_ID: str = ""
    IDV_DATA_STORE_STS_CLIENT_SECRET: str = ""
    IDV_DATA_STORE_IN_PERSON_VERIFICATION_SCOPES: str = Field(
        default="idv:in-person-verification:send",
        description=(
            "Space-separated list of idv-data-store scopes requested from the "
            "IBM Verify STS client (token exchange) when calling in-person "
            "verification endpoints."
        ),
    )
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=True
    )


class Configuration(BaseSettings):
    app_info: AppInfo = AppInfo()
    ibm_verify_config: IBMVerifyConfig = IBMVerifyConfig()
    session_config: SessionConfig = SessionConfig()
    idv_data_store_config: IdvDataStoreConfig = IdvDataStoreConfig()
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
        # Use http:// only if environment is local AND using default localhost values
        if (
            self.ENVIRONMENT == "local"
            and self.CORS_ORIGINS == "localhost:3000,localhost:8000"
        ):
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

    @property
    def password_resetter_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.PASSWORD_RESETTER.value}"

    @property
    def introspect_token_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.INTROSPECT_TOKEN.value}"

    @property
    def user_otp_factors_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.USER_OTP_FACTORS.value}"

    @property
    def password_policy_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.PASSWORDPOLICY.value}"

    @property
    def end_session_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.END_SESSION_ENDPOINT.value}"

    @property
    def verify_password_api_endpoint(self) -> str:
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.VERIFY_PASSWORD.value}"

    @property
    def token_api_endpoint(self) -> str:
        """IBM Verify's OAuth2 token endpoint, used for the RFC 8693 Token
        Exchange performed against idv-data-store's dedicated STS client."""
        return f"{self.ibm_verify_config.IBM_VERIFY_TENANT_URL}{VerifyAPIEndpoint.GET_ACCESS_TOKEN.value}"

    @property
    def idv_data_store_in_person_verification_send_endpoint(self) -> str:
        """idv-data-store's endpoint for generating and sending an in-person
        verification code email for an already-exchanged access_token."""
        return f"{self.idv_data_store_config.IDV_DATA_STORE_BASE_URL}/v1/in-person-verification/send"

    @property
    def idv_data_store_in_person_verification_last_email_endpoint(self) -> str:
        """idv-data-store's endpoint for retrieving the last in-person
        verification email sent timestamp for an already-exchanged access_token."""
        return f"{self.idv_data_store_config.IDV_DATA_STORE_BASE_URL}/v1/in-person-verification/last-email-sent"


@lru_cache
def get_configuration():
    return Configuration()
