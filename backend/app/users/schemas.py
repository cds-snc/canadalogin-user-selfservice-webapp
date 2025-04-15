from enum import Enum
from typing import List, Any, Optional
from pydantic import BaseModel, Field, EmailStr

from app.otp.schemas import PhoneNumber
from app.utils.schemas import ResponseModel


class EmailModel(BaseModel):
    value: str
    type: str = "work"


class UserLoginRequestData(BaseModel):
    userName: EmailStr
    password: str

# Signup Schema


class IBMUserCreateRequest(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:schemas:core:2.0:User"]
    userName: str
    emails: List[EmailModel]
    password: str
    active: bool = True


class IBMUserCreateResponse(BaseModel):
    userName: str
    id: str


class SignUpResponse(ResponseModel):
    data: Optional[IBMUserCreateResponse] = None

# Signin Schema


class IBMUsernamePasswordAuthRequestData(BaseModel):
    username: EmailStr  # Lowercase username is required here -> https://docs.verify.ibm.com/verify/reference/authenticatewithpassword. Signup request requires userName in camelCase
    password: str


class AuthenticatedUserData(BaseModel):
    id: str
    assertion: str


class AuthenticatedUserResponse(ResponseModel):
    data: AuthenticatedUserData


# 2FA enrollment
class TwoFactorEnrollmentUserData(BaseModel):
    userId: str
    phoneNumber: str
    otp_type: str

class VerifyTwofactorEnrollmentResponse(BaseModel):
    id: str
    userId: str
    type: str
    created: str
    updated: str
    enabled: bool
    validated: bool
    attributes: dict[str,str]

class VerifyTwofactorResponse(ResponseModel):
    data: VerifyTwofactorEnrollmentResponse