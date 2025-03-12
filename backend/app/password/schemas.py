from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict
from app.utils.schemas import ResponseModel


class IBMVerifyPasswordPolicy(BaseModel):
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
    pwdSafeModify: bool
    passwordMaxConsecutiveRepeatedChars: int
    passwordMinDiffChars: int
    pwdCheckSyntax: int
    ibm_pwdPolicy: bool


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
    pwdMaxLength: int = Field(65, description="Minimum length of the password")
    pwdCheckSyntax: int


class PasswordPolicyResponse(ResponseModel):
    data: Optional[PasswordPolicyResponse] = None
