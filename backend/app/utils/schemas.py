from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class ResponseModel(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class AdminTokenResponse(BaseModel):
    access_token: str
    grant_id: str
    expires_in: int
    token_type: str
    scope: str
    created: Optional[datetime] = None
