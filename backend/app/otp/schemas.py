from typing import List, Any, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel

from app.models import ResponseMessage

# OPENAPI_RESPONSE_EMAIL_OTP_NOT_FOUND = {
#     "model": ResponseMessage,
#     "description": "email otp not found"
# }


class UserName(BaseModel):
    userName: EmailStr


class EmailOtpResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="trxnId")
    type: str
    created: str
    updated: str
    expiry: str
    state: str
    correlation: str = Field(alias="correlationID")
    emailAddress: str
    attempts: int
    retries: int


class EmailOtpVerification(BaseModel):
    otp: str
    trxnId: str


class AuthenticatedUserData(BaseModel):
    id: str
    assertion: str


class AuthenticatedUserResponse(ResponseModel):
    data: AuthenticatedUserData


class EmailOtpRequestResponse(ResponseModel):
    data: EmailOtpResponse
