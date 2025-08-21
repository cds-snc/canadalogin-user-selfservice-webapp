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


class FirstStepPasswordUpdate(BaseModel):
    userName: EmailStr
    otpMethod: OtpType


class NextStep(BaseModel):
    method: str
    httpMethod: str
    creationTime: datetime
    expiryTime: datetime
    uri: str


class FirstStepPasswordApiResponse(BaseModel):
    trxId: str
    stepsRemaining: int
    nextStep: NextStep


class FirstStepPasswordResponse(BaseModel):
    trxId: str
    stepsRemaining: int
    expiryTime: datetime
    method: str


class FirstStepPasswordResetClientResponse(ResponseModel):
    data: FirstStepPasswordResponse


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
