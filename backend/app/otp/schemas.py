from enum import Enum
from typing import Optional

from app.fido2.assertion_schemas import FIDO2AssertionResultRequest
from app.utils.schemas import ResponseModel
from app.utils.string_masking import mask_phone_number, mask_email_address
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
        return mask_email_address(v)


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
    destination: str
    otpType: OtpType

    @model_validator(mode="after")
    def validate_destination_for_type(self):
        if self.otpType in {OtpType.SMS, OtpType.VOICE}:
            try:

                class TempPhoneModel(BaseModel):
                    phone: PhoneNumber

                temp_model = TempPhoneModel(phone=self.destination)
                self.destination = str(temp_model.phone)
            except Exception as e:
                raise ValueError(
                    f"Invalid phone number format: {self.destination}"
                ) from e
            return self

        if self.otpType == OtpType.EMAIL:
            try:

                class TempEmailModel(BaseModel):
                    email: EmailStr

                temp_model = TempEmailModel(email=self.destination)
                self.destination = str(temp_model.email).lower()
            except Exception as e:
                raise ValueError(
                    f"Invalid email address format: {self.destination}"
                ) from e
            return self

        raise ValueError(f"Unsupported OTP type: {self.otpType}")


class EnrollmentResponseData(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str
    userId: str
    type: str
    destination: str
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
    """Request schema for deleting OTP enrollment with verification.

    otp, trxnId, and otpVerificationType are optional to support deletion of
    unvalidated factors (which do not require OTP verification).
    """

    id: str
    otpType: OtpType  # Type of the factor being deleted (SMS/Voice)
    otp: Optional[str] = None
    trxnId: Optional[str] = None
    otpVerificationType: Optional[OtpType] = (
        None  # Type of OTP used for verification (can differ from otpType)
    )
    assertionResult: Optional[FIDO2AssertionResultRequest] = None

    @model_validator(mode="after")
    def validate_verification_payload(self):
        otp_fields = (self.otp, self.trxnId, self.otpVerificationType)
        has_any_otp_field = any(field is not None for field in otp_fields)
        has_all_otp_fields = all(field is not None for field in otp_fields)

        if has_any_otp_field and not has_all_otp_fields:
            raise ValueError(
                "otp, trxnId, and otpVerificationType must be provided together"
            )

        return self


class OtpFactorItem(BaseModel):
    """A single MFA factor to be deleted in a batch operation."""

    id: str
    otpType: OtpType


class OtpBatchDeletionRequest(BaseModel):
    """Request schema for batch-deleting multiple OTP factors with a single OTP verification."""

    factors: list[OtpFactorItem]
    otp: Optional[str] = None
    trxnId: Optional[str] = None
    otpVerificationType: Optional[OtpType] = None
    assertionResult: Optional[FIDO2AssertionResultRequest] = None

    @model_validator(mode="after")
    def validate_verification_payload(self):
        otp_fields = (self.otp, self.trxnId, self.otpVerificationType)
        has_any_otp_field = any(field is not None for field in otp_fields)
        has_all_otp_fields = all(field is not None for field in otp_fields)

        if self.assertionResult is None and not has_all_otp_fields:
            raise ValueError(
                "either assertionResult or otp, trxnId, and otpVerificationType must be provided"
            )

        if has_any_otp_field and not has_all_otp_fields:
            raise ValueError(
                "otp, trxnId, and otpVerificationType must be provided together"
            )

        return self
