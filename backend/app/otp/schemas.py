from enum import Enum
from typing import Optional

from app.utils.schemas import ResponseModel
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic_extra_types.phone_numbers import PhoneNumber


class UserName(BaseModel):
    userName: EmailStr


class OtpType(str, Enum):
    SMS = "sms"
    EMAIL = "email"
    VOICE = "voice"


class OtpVerification(BaseModel):
    otp: str
    trxnId: str


class AuthenticatedUserData(BaseModel):
    id: str
    assertion: str


class AuthenticatedUserResponse(ResponseModel):
    data: AuthenticatedUserData


class UserOtpInfo(BaseModel):
    phoneNumber: Optional[PhoneNumber] = None
    userName: EmailStr
    otpType: OtpType


class OtpDataResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(alias="trxnId")
    type: str
    created: str
    updated: str
    expiry: str
    state: str
    correlation: str = Field(alias="correlationID")
    phoneNumber: Optional[str] = None
    emailAddress: Optional[str] = None
    attempts: int
    retries: int


class OtpRequestResponse(ResponseModel):
    data: Optional[OtpDataResponse] = None


class UserOtpVerificationInfo(BaseModel):
    otp: str
    trxnId: str
    otpType: OtpType


class RetrievalData(BaseModel):
    trxnId: str
    otpType: OtpType


class OtpEnrollmentRequest(BaseModel):
    phoneNumber: PhoneNumber


class EnrollmentResponseData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    userId: str
    type: str
    phoneNumber: str
    created: str
    updated: str
    enabled: bool
    validated: bool


class EnrollmentResponse(ResponseModel):
    data: Optional[EnrollmentResponseData] = None


class OtpVerificationCreateRequest(BaseModel):
    """Request schema for creating OTP verification"""

    id: str


class VerificationCreateResponseData(BaseModel):
    """Response data for OTP verification creation"""

    model_config = ConfigDict(populate_by_name=True)
    id: str
    userId: str
    type: str
    created: str
    updated: str
    expiry: str
    state: str
    updatedBy: str
    correlation: str
    phoneNumber: str
    attempts: int
    retries: int


class OtpVerificationAttemptRequest(BaseModel):
    """Request schema for attempting OTP verification"""

    id: str
    trxnId: str
    otp: str


class VerificationAttemptResponseData(BaseModel):
    """Response data for OTP verification attempt"""

    model_config = ConfigDict(populate_by_name=True)
    id: str
    userId: str
    created: str
    updated: str
    expiry: str
    state: str
    verified: bool
