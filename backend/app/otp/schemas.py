from enum import Enum
from typing import Optional

from app.utils.helpers import is_masked_phone_number
from app.utils.schemas import ResponseModel
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
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
    phoneNumber: Optional[str] = (
        None  # Changed from PhoneNumber to str to handle masked numbers
    )
    userId: str
    emailAddress: Optional[EmailStr] = (
        None  # For sending OTP to a different email address
    )
    otpType: OtpType

    @field_validator("phoneNumber")
    @classmethod
    def validate_phone_number(cls, v):
        if v is None:
            return v

        # Allow masked phone numbers to pass through without validation
        if is_masked_phone_number(v):
            return v

        # For non-masked numbers, validate with PhoneNumber using a temporary model
        try:

            class TempPhoneModel(BaseModel):
                phone: PhoneNumber

            temp_model = TempPhoneModel(phone=v)
            return temp_model.phone  # This will be the tel: formatted string
        except Exception as e:
            raise ValueError(f"Invalid phone number format: {v}") from e


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
    otpType: OtpType


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
    otpType: OtpType


class VerificationCreateResponseData(BaseModel):
    """Response data for OTP verification creation"""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    id: str
    # Make all other fields optional to match IBM Verify's actual response
    userId: Optional[str] = None
    type: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None
    expiry: Optional[str] = None
    state: Optional[str] = None
    correlation: Optional[str] = None
    phoneNumber: Optional[str] = None
    attempts: Optional[int] = 0
    retries: Optional[int] = 0


class OtpVerificationAttemptRequest(BaseModel):
    """Request schema for attempting OTP verification"""

    id: str
    trxnId: str
    otp: str
    otpType: OtpType


class OtpDeletionRequest(BaseModel):
    """Request schema for deleting OTP enrollment"""

    id: str
    otpType: OtpType
