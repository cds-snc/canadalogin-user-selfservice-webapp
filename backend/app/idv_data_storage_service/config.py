from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class IDVDataServiceConfig(BaseSettings):
	"""Configuration for outbound IDV data service integrations."""

	IDV_DATA_SERVICE_BASE_URL: str | None = Field(default=None)

	# Discovery and key metadata endpoints.
	IDV_DATA_SERVICE_DISCOVERY_PATH: str = Field(
		default="/.well-known/openid-configuration"
	)
	IDV_DATA_SERVICE_JWKS_PATH: str = Field(default="/.well-known/jwks.json")

	# Core resource endpoints.
	IDV_DATA_SERVICE_SUBJECTS_PATH: str = Field(default="/v1/subjects")
	IDV_DATA_SERVICE_SUBJECT_PATH_TEMPLATE: str = Field(
		default="/v1/subjects/{subject_id}"
	)
	IDV_DATA_SERVICE_VALIDATIONS_PATH_TEMPLATE: str = Field(
		default="/v1/subjects/{subject_id}/validations"
	)
	IDV_DATA_SERVICE_CLAIMS_QUERY_PATH: str = Field(default="/v1/claims/query")

	# Transport/auth defaults.
	IDV_DATA_SERVICE_API_KEY: str | None = Field(default=None)
	IDV_DATA_SERVICE_TIMEOUT_SECONDS: int = Field(default=30, ge=1)

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
		case_sensitive=True,
	)
