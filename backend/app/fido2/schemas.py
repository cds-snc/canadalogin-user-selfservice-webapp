"""FIDO2 schemas for request/response models."""

from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from app.fido2.assertion_schemas import FIDO2AssertionResultRequest
from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from app.utils.schemas import ResponseModel
from app.otp.schemas import OtpType


class FIDO2RegistrationResponse(BaseModel):
    """Model for FIDO2 registration response from IBM Verify API"""

    id: str
    userId: str
    type: str
    created: str
    updated: str
    attempted: Optional[str] = None
    enabled: bool
    validated: bool
    attributes: Dict[str, Any]
    references: Dict[str, Any]


class FIDO2UserResponse(BaseModel):
    """Model for user response with FIDO2 credentials"""

    fido2: List[FIDO2RegistrationResponse] = []


class FIDO2UserResponseModel(ResponseModel):
    """Response model for FIDO2 user operations"""

    data: Optional[FIDO2UserResponse] = None


class FIDO2RegistrationResponseModel(ResponseModel):
    """Response model for FIDO2 registration operations"""

    data: Optional[FIDO2RegistrationResponse] = None


class AttestationOptionsRequest(BaseModel):
    """Request model for getting FIDO2 attestation options"""

    pass


class AssertionOptionsRequest(BaseModel):
    """Request model for getting FIDO2 assertion options (for authentication)"""

    # userId is retrieved from session; sensitive flows can tighten verification.
    userVerification: Optional[Literal["required", "preferred", "discouraged"]] = None


class UpdateRegistrationRequest(BaseModel):
    """Request model for updating a FIDO2 registration"""

    id: str
    nickname: Optional[str] = None
    enabled: Optional[bool] = None

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("nickname cannot be blank or whitespace only")
        return v.strip() if v is not None else v


class FIDO2AttestationResultRequest(BaseModel):
    """Request model for FIDO2 attestation result"""

    model_config = ConfigDict(exclude_none=True)

    id: str
    rawId: str
    type: str
    response: Dict[str, Any]
    nickname: Optional[str] = None
    enabled: bool = True
    getClientExtensionResults: Optional[Dict[str, Any]] = None
    getTransports: Optional[List[str]] = None

    @field_validator("nickname")
    @classmethod
    def nickname_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("nickname cannot be blank or whitespace only")
        return v.strip() if v is not None else v


class DeleteRegistrationRequest(BaseModel):
    """Request model for deleting a FIDO2 registration"""

    class Action(str, Enum):
        VERIFY = "verify"
        COMMIT = "commit"
        COMMIT_WITH_VERIFICATION = "commit_with_verification"

    id: str  # ID of the passkey to delete
    action: Action = Action.COMMIT_WITH_VERIFICATION
    assertionResult: Optional[FIDO2AssertionResultRequest] = (
        None  # FIDO2 authentication proof (optional if OTP-verified)
    )
    otp: Optional[str] = None  # OTP code (for OTP-verified deletion)
    trxnId: Optional[str] = None  # Transaction ID from OTP request
    otpVerificationType: Optional[OtpType] = None  # OTP type (SMS/VOICE/EMAIL)
    verificationProofId: Optional[str] = None

    @model_validator(mode="after")
    def validate_verification_payload(self):
        otp_fields = (self.otp, self.trxnId, self.otpVerificationType)
        has_any_otp_field = any(field is not None for field in otp_fields)
        has_all_otp_fields = all(field is not None for field in otp_fields)
        has_assertion_result = self.assertionResult is not None

        if self.action == self.Action.VERIFY:
            if has_assertion_result and has_any_otp_field:
                raise ValueError(
                    "Provide either assertionResult or otp, trxnId, and otpVerificationType"
                )

            if not has_assertion_result and not has_all_otp_fields:
                raise ValueError(
                    "either assertionResult or otp, trxnId, and otpVerificationType must be provided"
                )

            if self.verificationProofId is not None:
                raise ValueError("verificationProofId is not allowed for verify action")

            return self

        if self.action == self.Action.COMMIT:
            if not self.verificationProofId:
                raise ValueError("verificationProofId is required for commit action")

            if has_assertion_result or has_any_otp_field:
                raise ValueError(
                    "assertionResult, otp, trxnId, and otpVerificationType are not allowed for commit action"
                )

            return self

        if has_assertion_result and has_any_otp_field:
            raise ValueError(
                "Provide either assertionResult or otp, trxnId, and otpVerificationType"
            )

        if has_any_otp_field and not has_all_otp_fields:
            raise ValueError(
                "otp, trxnId, and otpVerificationType must be provided together"
            )

        if self.verificationProofId is not None:
            raise ValueError(
                "verificationProofId is only supported when action is commit"
            )

        return self


class ErrorResponse(BaseModel):

    status: str = "failed"
    error: str


class FIDO2AuthenticatorMetadata(BaseModel):
    """Full MDS3 metadata for a single FIDO2 authenticator, keyed by AAGUID.

    The required fields (``aaguid``, ``description``, ``is_known``) are always
    present.  All remaining fields from the FIDO Alliance metadata statement are
    passed through as-is via ``extra="allow"``.
    """

    model_config = ConfigDict(extra="allow")

    aaguid: str
    description: str
    is_known: bool = True
