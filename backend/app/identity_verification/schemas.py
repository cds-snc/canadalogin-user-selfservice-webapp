from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import datetime


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
