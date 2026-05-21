"""FIDO2 schemas for request/response models."""

from typing import Any, Dict, List, Literal, Optional

from app.fido2.assertion_schemas import FIDO2AssertionResultRequest
from pydantic import BaseModel, ConfigDict, field_validator
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
    userVerification: Optional[Literal["required", "preferred", "discouraged"]] = (
        None
    )


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

    id: str  # ID of the passkey to delete
    assertionResult: Optional[FIDO2AssertionResultRequest] = (
        None  # FIDO2 authentication proof (optional if OTP-verified)
    )
    otp: Optional[str] = None  # OTP code (for OTP-verified deletion)
    trxnId: Optional[str] = None  # Transaction ID from OTP request
    otpVerificationType: Optional[OtpType] = None  # OTP type (SMS/VOICE/EMAIL)


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
