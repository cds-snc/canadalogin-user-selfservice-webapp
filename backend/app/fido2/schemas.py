"""
FIDO2 schemas for request/response models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.utils.schemas import ResponseModel


class FIDO2RegistrationResponse(BaseModel):
    """Model for FIDO2 registration response from IBM Verify API"""

    id: str
    userId: str
    rpId: str
    enabled: bool
    nickname: Optional[str] = None
    attributes: Dict[str, Any]
    references: Dict[str, Any]
    created: Optional[str] = None


class FIDO2CredentialSummary(BaseModel):
    """Simplified model for FIDO2 credential summary"""

    id: str
    nickname: Optional[str] = None
    enabled: bool
    created: Optional[str] = None
    rpId: Optional[str] = None
    credentialId: Optional[str] = None
    transactions: Optional[List[Dict[str, Any]]] = []


class FIDO2UserResponse(BaseModel):
    """Model for user response with FIDO2 credentials"""

    authenticated: bool
    username: Optional[str] = None
    displayName: Optional[str] = None
    credentials: List[FIDO2CredentialSummary] = []


class FIDO2UserResponseModel(ResponseModel):
    """Response model for FIDO2 user operations"""

    data: Optional[FIDO2UserResponse] = None


class FIDO2RegistrationResponseModel(ResponseModel):
    """Response model for FIDO2 registration operations"""

    data: Optional[FIDO2RegistrationResponse] = None


class FIDO2CredentialsResponseModel(ResponseModel):
    """Response model for FIDO2 credentials list"""

    data: Optional[List[FIDO2CredentialSummary]] = None


class DeleteRegistrationRequest(BaseModel):
    """Request model for deleting a FIDO2 registration"""

    id: str


class UpdateRegistrationRequest(BaseModel):
    """Request model for updating a FIDO2 registration"""

    id: str
    nickname: Optional[str] = None
    enabled: Optional[bool] = None


class FIDO2AttestationResultRequest(BaseModel):
    """Request model for FIDO2 attestation result"""

    id: str
    rawId: str
    type: str
    response: Dict[str, Any]
    nickname: Optional[str] = None
    enabled: bool = True
    getClientExtensionResults: Optional[Dict[str, Any]] = None
    getTransports: Optional[List[str]] = None


class FIDO2AssertionOptionsRequest(BaseModel):
    """Request model for FIDO2 assertion options"""

    userVerification: str = "preferred"
    attestation: Optional[str] = "none"


class FIDO2AssertionResultRequest(BaseModel):
    """Request model for FIDO2 assertion result"""

    id: str
    rawId: str
    type: str
    response: Dict[str, Any]


class FIDO2ServerResponse(BaseModel):
    """Standard FIDO2 server response"""

    status: str = "ok"
    errorMessage: str = ""
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response model"""

    status: str = "failed"
    error: str
