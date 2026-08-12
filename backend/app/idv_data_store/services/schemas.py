from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ClaimsResponse(BaseModel):
    claims: dict[str, Any]


class InPersonVerificationData(BaseModel):
    verification_code: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class InPersonVerificationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[InPersonVerificationData] = None


class LastEmailSentData(BaseModel):
    last_email_sent: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class LastEmailSentResponse(BaseModel):
    success: bool
    message: str
    data: Optional[LastEmailSentData] = None
