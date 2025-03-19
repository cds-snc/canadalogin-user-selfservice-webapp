from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel


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
