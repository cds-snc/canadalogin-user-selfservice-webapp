from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel
from pydantic_extra_types.phone_numbers import PhoneNumber


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


class EmailOtpRequestResponse(ResponseModel):
    data: EmailOtpResponse


class UserOtpInfo(BaseModel):
    phoneNumber: Optional[PhoneNumber] = None
    userName: EmailStr
    otpType: OtpType


class OtpSentResponse(BaseModel):
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


class OtpRequestResponse(ResponseModel):
    data: OtpSentResponse


class UserOtpVerificationInfo(BaseModel):
    otp: str
    trxnId: str
    otpType: OtpType
