from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from app.utils.schemas import ResponseModel


class UserName(BaseModel):
    userName: EmailStr


class OtpType(str, Enum):
    SMSOTP = "smsotp"
    VOICEOTP = "voiceotp"


class FirstStepPasswordUpdatePayload(BaseModel):
    userName: EmailStr
    otpMethod: OtpType


class NextStep(BaseModel):
    method: str
    httpMethod: str
    creationTime: Optional[datetime] = None
    expiryTime: Optional[datetime] = None
    uri: str


class UpdatePasswordIbmApiResponse(BaseModel):
    trxId: str
    stepsRemaining: int
    nextStep: NextStep
    userId: Optional[str] = None


class UpdatePasswordClientResponsePayload(BaseModel):
    trxId: str
    stepsRemaining: int
    expiryTime: Optional[datetime] = None
    method: str
    userId: Optional[str] = None


class UpdatePasswordClientResponse(ResponseModel):
    data: UpdatePasswordClientResponsePayload


class SecondStepPasswordUpdatePayload(BaseModel):
    otp: str
    trxId: str


class ThirdStepPasswordUpdatePayload(BaseModel):
    otp: str
    trxId: str
    password: str = Field(..., min_length=12)


class CompleteUpdatePasswordIbmApiResponse(BaseModel):
    stateId: str
    userId: str


class CompleteUpdatePasswordClientResponse(ResponseModel):
    data: CompleteUpdatePasswordIbmApiResponse
