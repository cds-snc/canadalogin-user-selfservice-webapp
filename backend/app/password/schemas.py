from datetime import datetime
from enum import Enum
from typing import Literal, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel
from pydantic_extra_types.phone_numbers import PhoneNumber


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


# class OtpVerification(BaseModel):
#     otp: str
#     trxnId: str


# class AuthenticatedUserData(BaseModel):
#     id: str
#     assertion: str


# class AuthenticatedUserResponse(ResponseModel):
#     data: AuthenticatedUserData


# class UserOtpInfo(BaseModel):
#     phoneNumber: Optional[PhoneNumber] = None
#     userName: EmailStr
#     otpType: OtpType


# class UserOtpVerificationInfo(BaseModel):
#     otp: str
#     trxnId: str
#     otpType: OtpType


# class RetrievalData(BaseModel):
#     trxnId: str
#     otpType: OtpType


# class TwoFactorEnrollmentType(str, Enum):
#     SMS = "sms"
#     VOICE = "voice"


# class TwoFactorEnrollmentUserData(BaseModel):
#     userId: str
#     phoneNumber: PhoneNumber
#     enrollmentType: TwoFactorEnrollmentType
#     trxnId: str


# class TwofactorEnrollmentResponse(BaseModel):
#     id: str
#     userId: str
#     type: str
#     created: str
#     updated: str
#     enabled: bool
#     validated: bool
#     attributes: dict[str, str]


# class VerifiedTwofactorEnrollmentResponse(ResponseModel):
#     data: TwofactorEnrollmentResponse
