from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class RequestContext(BaseModel):
    """Shared metadata for outbound integration calls."""

    correlation_id: str | None = None


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


# ---------------------------------------------------------------------------
# 1. Subject Schemas
# ---------------------------------------------------------------------------


class SubjectData(BaseModel):
    external_sub: str = Field(..., min_length=1)
    iss: str = Field(..., pattern=r"^https?://")


class SubjectRegisterPayload(BaseModel):
    """Inner payload of the JWE request for POST /v1/subjects."""

    iss: str
    aud: str
    iat: int
    exp: int
    jti: str
    subject: SubjectData


class SubjectResponse(BaseModel):
    subject_id: str
    external_sub: str
    iss: str
    created_at: str


# ---------------------------------------------------------------------------
# 2. Claims Schemas
# ---------------------------------------------------------------------------


class AddressSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    formatted: Optional[str] = None
    street_address: Optional[str] = None
    locality: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None  # ISO 3166 Alpha-3 / ICAO


class PlaceOfBirthSchema(BaseModel):
    model_config = ConfigDict(extra="allow")
    country: Optional[str] = None
    region: Optional[str] = None
    locality: Optional[str] = None


class ClaimsIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    sub: Optional[str] = None
    name: Optional[str] = None
    given_name: Optional[str] = None
    middle_name: Optional[str] = None
    family_name: Optional[str] = None
    birthdate: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    salutation: Optional[str] = None
    title: Optional[str] = None
    birth_family_name: Optional[str] = None
    birth_given_name: Optional[str] = None
    birth_middle_name: Optional[str] = None
    also_known_as: Optional[str] = None
    msisdn: Optional[str] = None
    address: Optional[AddressSchema] = None
    place_of_birth: Optional[PlaceOfBirthSchema] = None
    nationalities: Optional[List[str]] = None


class UpdateClaimsPayload(BaseModel):
    """Inner payload for PATCH /v1/.../claims."""

    iss: str
    aud: str
    iat: int
    exp: int
    jti: str
    claims: ClaimsIn


# ---------------------------------------------------------------------------
# 3. Verification & Evidence Schemas
# ---------------------------------------------------------------------------


class CheckDetailIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    check_method: str
    organization: Optional[str] = None
    check_id: Optional[str] = None
    time: Optional[str] = None  # ISO 8601 datetime string


class DocumentIssuerIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: Optional[str] = None
    formatted: Optional[str] = None
    street_address: Optional[str] = None
    locality: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    jurisdiction: Optional[str] = None


class DocumentDetailIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str
    document_number: Optional[str] = None
    serial_number: Optional[str] = None
    personal_number: Optional[str] = None
    date_of_issuance: Optional[str] = None
    date_of_expiry: Optional[str] = None
    issuer: Optional[DocumentIssuerIn] = None
    derived_claims: Optional[Dict[str, Any]] = None


class RecordSourceIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    name: Optional[str] = None
    street_address: Optional[str] = None
    locality: Optional[str] = None
    region: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    jurisdiction: Optional[str] = None


class RecordDetailIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str
    personal_number: Optional[str] = None
    created_at: Optional[str] = None
    date_of_expiry: Optional[str] = None
    source: Optional[RecordSourceIn] = None
    derived_claims: Optional[Dict[str, Any]] = None


class VouchAttestationIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: Optional[str] = None
    reference_number: Optional[str] = None
    date_of_issuance: Optional[str] = None
    date_of_expiry: Optional[str] = None
    voucher: Optional[Dict[str, Any]] = None
    derived_claims: Optional[Dict[str, Any]] = None


class ElectronicSignatureIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: Optional[str] = None
    issuer: Optional[str] = None
    serial_number: Optional[str] = None
    created_at: Optional[str] = None
    derived_claims: Optional[Dict[str, Any]] = None


class EvidenceIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    type: str
    time: Optional[str] = None
    method: Optional[str] = None  # deprecated field
    organization: Optional[str] = None
    check_details: Optional[List[CheckDetailIn]] = None
    document_details: Optional[DocumentDetailIn] = None
    record_details: Optional[RecordDetailIn] = None
    vouch: Optional[VouchAttestationIn] = None
    electronic_signature: Optional[ElectronicSignatureIn] = None


class EvidenceRefIn(BaseModel):
    check_id: str
    evidence_metadata: Optional[Dict[str, Any]] = None


class AssuranceDetailIn(BaseModel):
    assurance_type: Optional[str] = None
    assurance_classification: Optional[str] = None
    evidence_ref: Optional[List[EvidenceRefIn]] = None


class AssuranceProcessIn(BaseModel):
    policy: Optional[str] = None
    procedure: Optional[str] = None
    assurance_details: Optional[List[AssuranceDetailIn]] = None


class VerificationIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    trust_framework: str
    assurance_level: Optional[str] = None
    assurance_process: Optional[AssuranceProcessIn] = None
    time: Optional[str] = None
    verification_process: Optional[str] = None
    evidence: Optional[List[EvidenceIn]] = None


class VerifiedClaimsIn(BaseModel):
    verification: VerificationIn
    claims: Optional[ClaimsIn] = None


class SubmitValidationPayload(BaseModel):
    """Inner payload for POST /v1/subjects/{id}/validations."""

    iss: str
    aud: str
    iat: int
    exp: int
    jti: str
    verified_claims: VerifiedClaimsIn


class UpdateVerificationPayload(BaseModel):
    """Inner payload for PUT /v1/.../verification."""

    iss: str
    aud: str
    iat: int
    exp: int
    jti: str
    verification: VerificationIn
    claims: Optional[ClaimsIn] = None


class RevokeValidationPayload(BaseModel):
    """Inner payload for DELETE /v1/.../validations/{id}."""

    iss: str
    aud: str
    iat: int
    exp: int
    jti: str
    revocation: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# 4. Query Schemas
# ---------------------------------------------------------------------------


class FilterConstraint(BaseModel):
    """Filter constraint: value, values, max_age, essential."""

    model_config = ConfigDict(extra="allow")
    value: Optional[Any] = None
    values: Optional[List[Any]] = None
    max_age: Optional[int] = None
    essential: Optional[bool] = None


class VerificationQuery(BaseModel):
    model_config = ConfigDict(extra="allow")
    trust_framework: Optional[Union[FilterConstraint, None]] = Field(
        default=..., exclude=True
    )
    assurance_level: Optional[Union[FilterConstraint, None]] = Field(
        default=..., exclude=True
    )
    time: Optional[Union[FilterConstraint, None]] = Field(default=..., exclude=True)
    verification_process: Optional[Union[FilterConstraint, None]] = Field(
        default=..., exclude=True
    )
    assurance_process: Optional[Dict[str, Any]] = None
    evidence: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def from_dict(cls, data: dict) -> "VerificationQuery":
        return cls.model_validate(data)


class VerifiedClaimsQuery(BaseModel):
    model_config = ConfigDict(extra="allow")
    verification: Optional[Dict[str, Any]] = None
    claims: Optional[Dict[str, Any]] = None


class QueryRequestPayload(BaseModel):
    """Inner payload for POST /v1/claims/query."""

    iss: str
    aud: str
    iat: int
    exp: int
    jti: str
    sub: str  # external_sub of the subject to query
    sub_iss: str  # issuer of the subject identifier
    verified_claims: Union[Dict[str, Any], List[Dict[str, Any]]]


# ---------------------------------------------------------------------------
# 5. Admin Schemas
# ---------------------------------------------------------------------------


class RegistryEntryCreate(BaseModel):
    identifier: str
    display_name: Optional[str] = None
    country: Optional[str] = None


class ClientRegisterRequest(BaseModel):
    client_id: str
    client_name: Optional[str] = None
    signing_public_key_jwk: Optional[str] = None
    encryption_public_key_jwk: Optional[str] = None
    allowed_scopes: Optional[str] = None


# ---------------------------------------------------------------------------
# Utility / Response Schemas
# ---------------------------------------------------------------------------


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
    verified_claims: Optional[ClaimsIn] = None

    model_config = ConfigDict(extra="allow")


class VerifiedClaimsQueryResponse(BaseModel):
    verified_claims: Optional[ClaimsIn] = None

    model_config = ConfigDict(extra="allow")


class EnrichmentVerification(BaseModel):
    trust_framework: Optional[str] = None
    assurance_level: Optional[str] = None
    time: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class EnrichmentVerifiedClaims(BaseModel):
    verification: Optional[EnrichmentVerification] = None
    claims: Optional[ClaimsIn] = None

    model_config = ConfigDict(extra="allow")


class VerificationStatusForEnrichmentResponse(BaseModel):
    subject: str
    status: Literal["found", "not_found"]
    verified_claims: EnrichmentVerifiedClaims = Field(
        default_factory=EnrichmentVerifiedClaims
    )

    model_config = ConfigDict(extra="allow")
