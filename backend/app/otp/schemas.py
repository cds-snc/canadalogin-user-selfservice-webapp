from enum import Enum
from typing import Optional

from app.utils.schemas import ResponseModel
from app.utils.mask_user_profile import mask_phone_number, mask_individual_email_address
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator,
    field_validator,
)
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
    factor_id: Optional[str] = None
    user_id: str
    otpType: OtpType
    destination: Optional[str] = None

    @model_validator(mode="after")
    def validate(self):
        if self.factor_id is None and self.destination is None:
            raise ValueError("Must contain factor_id or destination")

        # Validate only phone numbers
        if self.otpType not in {OtpType.SMS, OtpType.VOICE} or self.destination is None:
            return self

        # For non-masked numbers, validate with PhoneNumber using a temporary model
        try:

            class TempPhoneModel(BaseModel):
                phone: PhoneNumber

            temp_model = TempPhoneModel(phone=self.destination)
            self.destination = temp_model.phone
        except Exception as e:
            raise ValueError(f"Invalid phone number format: {self.destination}") from e

        return self


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

    @field_validator("phoneNumber")
    def mask_phone_number(cls, v):
        if v is None:
            return v
        return mask_phone_number(v)

    @field_validator("emailAddress")
    def mask_email_address(cls, v):
        if v is None:
            return v
        return mask_individual_email_address(v)


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
    """Request schema for deleting OTP enrollment with verification"""

    id: str
    otpType: OtpType  # Type of the factor being deleted (SMS/Voice)
    otp: str
    trxnId: str
    otpVerificationType: (
        OtpType  # Type of OTP used for verification (can differ from otpType)
    )
