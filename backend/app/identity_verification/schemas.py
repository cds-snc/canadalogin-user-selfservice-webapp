from pydantic import BaseModel, ConfigDict, model_validator
from enum import Enum
from typing import Optional
from datetime import date, datetime


class InPersonVerificationProvider(str, Enum):
    service_canada = "service_canada"
    canada_post = "canada_post"


class InPersonApplicantAddressRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    street_address: str | None = None
    locality: str | None = None
    region: str | None = None
    postal_code: str | None = None
    country: str | None = None


class InPersonApplicantRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str
    last_name: str
    date_of_birth: date
    address: InPersonApplicantAddressRequest | None = None
    id_type: str
    id_expiry_date: date


class CreateInPersonIdentityVerificationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    required_by_rp_client_id: str | None = None
    verification_provider: InPersonVerificationProvider = (
        InPersonVerificationProvider.service_canada
    )
    applicant: InPersonApplicantRequest

    @model_validator(mode="after")
    def validate_canada_post_address(self):
        if (
            self.verification_provider == InPersonVerificationProvider.canada_post
            and self.applicant.address is None
        ):
            raise ValueError(
                "applicant.address is required when verification_provider is canada_post"
            )
        return self


class StoreTargetUrlRequest(BaseModel):
    target_url: str


class CaseStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    verified = "verified"
    failed = "failed"
    cancelled = "cancelled"


class CreateOnlineIdentityVerificationRequest(BaseModel):
    required_by_rp_client_id: Optional[str] = None


class CreateIdentityVerificationResponse(BaseModel):
    case_id: str
    status: CaseStatus
    verification_code_display: Optional[str] = None
    online_verification_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class ReissueOnlineSessionResponse(BaseModel):
    case_id: str
    status: CaseStatus
    online_verification_url: str
