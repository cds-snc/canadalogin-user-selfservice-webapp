from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import datetime


class InPersonApplicantAddressRequest(BaseModel):
    street_address: str | None = None
    locality: str | None = None
    region: str | None = None
    postal_code: str | None = None
    country: str | None = None


class InPersonApplicantRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    date_of_birth: str | None = None
    address: InPersonApplicantAddressRequest | None = None
    id_type: str | None = None
    id_expiry_date: str | None = None


class CreateInPersonIdentityVerificationRequest(BaseModel):
    required_by_rp_client_id: str | None = None
    verification_provider: str = "service_canada"
    applicant: InPersonApplicantRequest | None = None


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
