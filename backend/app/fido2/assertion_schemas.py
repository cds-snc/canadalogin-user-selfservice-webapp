from typing import Any, Dict, Optional

from pydantic import BaseModel


class AssertionResponse(BaseModel):
    """Response object from the authenticator during assertion."""

    clientDataJSON: str
    signature: str
    authenticatorData: str
    userHandle: Optional[str] = None


class FIDO2AssertionResultRequest(BaseModel):
    """Request model for FIDO2 assertion result (authentication)."""

    response: AssertionResponse
    id: str
    rawId: str
    type: str
    getClientExtensionResults: Optional[Dict[str, Any]] = None
    authenticatorAttachment: Optional[str] = None
