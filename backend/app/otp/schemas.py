from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel

class PhoneNumber(BaseModel):
    phoneNumber: str

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


class ViaPhoneOtpResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="trxnId")
    type: str
    created: str
    updated: str
    expiry: str
    state: str
    correlation: str = Field(alias="correlationID")
    phoneNumber: str
    attempts: int
    retries: int


class OtpVerification(BaseModel):
    otp: str
    trxnId: str
    otp_type: str
    flow: str
    userId: str
    trxnId: str
    phoneNumber: str

class AuthenticatedUserData(BaseModel):
    id: str
    assertion: str


class AuthenticatedUserResponse(ResponseModel):
    data: AuthenticatedUserData


class EmailOtpRequestResponse(ResponseModel):
    data: EmailOtpResponse


class SMSOtpRequestResponse(ResponseModel):
    data: ViaPhoneOtpResponse


class VoiceOtpRequestResponse(ResponseModel):
    data: ViaPhoneOtpResponse