from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from app.utils.schemas import ResponseModel


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


class PasswordPolicyResponse(BaseModel):
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
    data: Optional[PasswordPolicyResponse] = None
