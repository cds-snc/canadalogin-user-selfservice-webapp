"""
FIDO2 schemas for request/response models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, field_validator
from app.utils.schemas import ResponseModel


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

    # No additional fields needed - userId is retrieved from session
    pass


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


class AssertionResponse(BaseModel):
    """Response object from the authenticator during assertion"""

    clientDataJSON: str
    signature: str
    authenticatorData: str
    userHandle: Optional[str] = None


class FIDO2AssertionResultRequest(BaseModel):
    """Request model for FIDO2 assertion result (authentication)"""

    model_config = ConfigDict(exclude_none=True)

    response: AssertionResponse
    id: str
    rawId: str
    type: str
    getClientExtensionResults: Optional[Dict[str, Any]] = None
    authenticatorAttachment: Optional[str] = None


class DeleteRegistrationRequest(BaseModel):
    """Request model for deleting a FIDO2 registration"""

    id: str  # ID of the passkey to delete
    assertionResult: Optional[FIDO2AssertionResultRequest] = (
        None  # FIDO2 authentication proof (optional if OTP-verified)
    )


class ErrorResponse(BaseModel):

    status: str = "failed"
    error: str


class FIDO2AuthenticatorMetadata(BaseModel):
    """Metadata for a single FIDO2 authenticator, keyed by AAGUID."""

    aaguid: str
    description: str
    icon: Optional[str] = None
    authenticator_version: Optional[int] = None
    protocol_family: Optional[str] = None
    attestation_types: List[str] = []
    key_protection: List[str] = []
    matcher_protection: List[str] = []
    attachment_hint: List[str] = []
    status_reports: List[Dict[str, Any]] = []
    is_known: bool = True
