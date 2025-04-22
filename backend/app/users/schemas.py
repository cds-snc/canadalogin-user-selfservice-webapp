from typing import List, Optional
from pydantic import BaseModel, EmailStr
from pydantic_extra_types.phone_numbers import PhoneNumber

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

class TwoFactorEnrollmentUserData(BaseModel):
    userId: str
    phoneNumber: PhoneNumber

class TwofactorEnrollmentResponse(BaseModel):
    id: str
    userId: str
    type: str
    created: str
    updated: str
    enabled: bool
    validated: bool
    attributes: dict[str,str]

class VerifiedTwofactorEnrollmentResponse(ResponseModel):
    data: TwofactorEnrollmentResponse