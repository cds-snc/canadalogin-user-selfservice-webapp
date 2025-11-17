from datetime import datetime
from enum import Enum
from typing import Annotated, List, Optional
from pydantic import BaseModel, ConfigDict, Field, EmailStr, StringConstraints
from app.utils.schemas import ResponseModel

UserProvidedOtpValue = Annotated[str, StringConstraints(min_length=6, max_length=6)]


class UserName(BaseModel):
    userName: EmailStr


class OtpType(str, Enum):
    SMSOTP = "smsotp"
    VOICEOTP = "voiceotp"


class FirstStepPasswordUpdatePayload(BaseModel):
    userName: EmailStr
    otpType: OtpType
    enrollmentId: str


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
    otp: UserProvidedOtpValue
    trxId: str


class ThirdStepPasswordUpdatePayload(BaseModel):
    otp: UserProvidedOtpValue
    trxId: str
    password: str = Field(..., min_length=12)


class CompleteUpdatePasswordIbmApiResponse(BaseModel):
    stateId: str
    userId: str


class CompleteUpdatePasswordClientResponse(ResponseModel):
    data: CompleteUpdatePasswordIbmApiResponse


class IBMVerifyPasswordPolicy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    schemas: List[str]
    passwordMinAlphaChars: int
    passwordMinOtherChars: int
    pwdMinAge: int
    pwdExpireWarning: int
    pwdInHistory: int
    pwdLockout: bool
    pwdLockoutDuration: int
    pwdMaxAge: int
    pwdMaxFailure: int
    pwdMinLength: int
    pwdGraceLoginLimit: int
    pwdMustChange: bool
    pwdAllowUserChange: bool
    pwdFailureCountInterval: int
    passwordMaxRepeatedChars: int
    pwdSafeModify: Optional[bool] = None
    passwordMaxConsecutiveRepeatedChars: Optional[int] = 0
    passwordMinDiffChars: Optional[int] = 0
    pwdCheckSyntax: Optional[int] = 0
    ibm_pwdPolicy: Optional[bool] = None


class PasswordPolicy(BaseModel):
    passwordMinAlphaChars: int
    passwordMinOtherChars: int
    pwdMinAge: int
    pwdExpireWarning: int
    pwdInHistory: int
    pwdLockout: bool
    pwdLockoutDuration: int
    pwdMaxAge: int
    pwdMaxFailure: int
    pwdMinLength: int
    pwdMaxLength: int = Field(65, description="Max length of the password")
    pwdCheckSyntax: int


class PasswordPolicyResponse(ResponseModel):
    data: Optional[PasswordPolicy] = None


class UserPassword(BaseModel):
    password: str = Field(..., min_length=12)


class VerifiedUserPassword(BaseModel):
    id: str


class VerifiedUserPasswordResponse(ResponseModel):
    data: VerifiedUserPassword


class IBMIdentitySourceData(BaseModel):
    id: str
    name: str
    type: str
    location: str


class IBMIdentitySourceResponse(BaseModel):
    password: List[IBMIdentitySourceData]
