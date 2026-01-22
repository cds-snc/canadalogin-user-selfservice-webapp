"""
FIDO2 schemas for request/response models
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


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


class DeleteRegistrationRequest(BaseModel):
    """Request model for deleting a FIDO2 registration"""

    id: str


class UpdateRegistrationRequest(BaseModel):
    """Request model for updating a FIDO2 registration"""

    id: str
    nickname: Optional[str] = None
    enabled: Optional[bool] = None


class FIDO2AttestationOptionsRequest(BaseModel):
    """Request model for FIDO2 attestation options"""

    attestation: Optional[str] = "none"
    authenticatorSelection: Optional[Dict[str, Any]] = None


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
