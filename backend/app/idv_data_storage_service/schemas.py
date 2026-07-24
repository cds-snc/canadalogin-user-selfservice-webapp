from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ExternalProvider(str, Enum):
	IDV_DATA_SERVICE = "idv_data_service"


class RequestContext(BaseModel):
	"""Shared metadata for outbound integration calls."""

	correlation_id: str | None = None
	provider: ExternalProvider


class ProblemDetails(BaseModel):
	"""RFC 7807 Problem Details payload shape."""

	type: str | None = None
	title: str | None = None
	status: int | None = None
	detail: str | None = None
	instance: str | None = None

	# Keep support for extension fields like error codes.
	model_config = ConfigDict(extra="allow")


class OpenIDConfigurationResponse(BaseModel):
	"""OpenID discovery metadata with OIDC4IDA extension support."""

	issuer: str
	jwks_uri: str
	authorization_endpoint: str | None = None
	token_endpoint: str | None = None
	userinfo_endpoint: str | None = None
	response_types_supported: list[str] | None = None
	subject_types_supported: list[str] | None = None
	id_token_signing_alg_values_supported: list[str] | None = None

	# OIDC4IDA metadata fields described in BRD.
	trust_frameworks_supported: list[str] | None = None
	claims_in_verified_claims_supported: list[str] | None = None
	evidence_supported: list[str] | None = None
	documents_supported: list[str] | None = None
	documents_methods_supported: list[str] | None = None
	documents_check_methods_supported: list[str] | None = None
	electronic_records_supported: list[str] | None = None
	claims_parameter_supported: bool | None = None

	model_config = ConfigDict(extra="allow")


class JwksResponse(BaseModel):
	keys: list[dict[str, Any]]


class RegisterSubjectRequest(BaseModel):
	external_sub: str
	iss: str
	subject_metadata: dict[str, Any] | None = None


class SubjectResponse(BaseModel):
	id: str
	external_sub: str
	iss: str
	created_at: datetime
	updated_at: datetime
	deleted_at: datetime | None = None
	subject_metadata: dict[str, Any] | None = None

	model_config = ConfigDict(extra="allow")


class VerifiedClaimAddress(BaseModel):
	address_type: str | None = None
	formatted: str | None = None
	street_address: str | None = None
	locality: str | None = None
	region: str | None = None
	postal_code: str | None = None
	country: str | None = None
	country_code: str | None = None


class VerifiedClaimPlaceOfBirth(BaseModel):
	country: str | None = None
	region: str | None = None
	locality: str | None = None


class VerifiedClaimNationality(BaseModel):
	nationality_code: str
	sort_order: int = 0


class VerifiedClaimEntry(BaseModel):
	"""Typed verified claims object aligned with core and OpenID4IDA claims."""

	# OpenID Connect Core standard claims.
	sub: str | None = None
	name: str | None = None
	given_name: str | None = None
	middle_name: str | None = None
	family_name: str | None = None
	birthdate: str | None = None
	email: str | None = None
	phone_number: str | None = None

	# OpenID4IDA claims extensions.
	salutation: str | None = None
	title: str | None = None
	birth_family_name: str | None = None
	birth_given_name: str | None = None
	birth_middle_name: str | None = None
	also_known_as: str | None = None
	msisdn: str | None = None

	# Structured claims.
	address: VerifiedClaimAddress | None = None
	place_of_birth: VerifiedClaimPlaceOfBirth | None = None
	nationalities: list[VerifiedClaimNationality] = Field(default_factory=list)

	# Extensible overflow for non-standard claims.
	additional_claims: dict[str, Any] | None = None


class SubjectErasureAcceptedResponse(BaseModel):
	"""Accepted response model for asynchronous subject erasure."""

	job_id: str | None = None
	status: str | None = None

	model_config = ConfigDict(extra="allow")


class ValidationSummary(BaseModel):
	validation_id: str | None = None
	status: str | None = None
	trust_framework: str | None = None
	assurance_level: str | None = None
	created_at: datetime | None = None
	verification_process: str | None = None

	model_config = ConfigDict(extra="allow")


class ValidationListResponse(BaseModel):
	validations: list[ValidationSummary] = Field(default_factory=list)
	next_cursor: str | None = None
	total_count: int | None = None

	model_config = ConfigDict(extra="allow")


class ValidationDetailResponse(BaseModel):
	"""Flexible response model for full validation detail payloads."""

	validation_id: str | None = None
	status: str | None = None
	verified_claims: VerifiedClaimEntry | None = None

	model_config = ConfigDict(extra="allow")


class CreateValidationRequest(BaseModel):
	"""JSON payload for submitting a validation entry."""

	verified_claims: VerifiedClaimEntry
	verification: dict[str, Any] | None = None


class RevokeValidationRequest(BaseModel):
	reason: str | None = None
	notes: str | None = None


class VerifiedClaimsQueryRequest(BaseModel):
	"""JSON request for querying verified claims by subject identity."""

	sub: str
	sub_iss: str
	requested_claims: VerifiedClaimEntry | None = None


class VerifiedClaimsQueryResponse(BaseModel):
	verified_claims: VerifiedClaimEntry | None = None

	model_config = ConfigDict(extra="allow")