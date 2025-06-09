from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from pydantic_extra_types.phone_numbers import PhoneNumber
from datetime import datetime

from app.utils.schemas import ResponseModel


class EmailModel(BaseModel):
    value: str
    type: str = "work"


class UserLoginRequestData(BaseModel):
    userName: EmailStr
    password: str


# Signup Schema


class NotifyType(str, Enum):
    EMAIL = "EMAIL"
    NONE = "NONE"


class IBMNotificationExtension(BaseModel):
    notifyPassword: bool = Field(
        default=False,
        description="Notify the user the password they entered. Setting to true will send a email with the password they entered",
    )
    notifyType: NotifyType = Field(
        default=NotifyType.NONE,
        description="Setting to NONE will not send any notification, Setting the value to EMAIL will send a notification email to the user that the account was created",
    )


class IBMUserCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, validate_by_name=True)

    schemas: List[str] = [
        "urn:ietf:params:scim:schemas:core:2.0:User",
        "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
    ]
    userName: str
    emails: List[EmailModel]
    password: str
    active: bool = True
    notification: IBMNotificationExtension = Field(
        default_factory=IBMNotificationExtension,
        alias="urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification",
    )


class IBMUserCreateResponse(BaseModel):
    userName: str
    id: str


class Operations(BaseModel):
    op: str
    path: str
    value: str


class ProfileCreateRequest(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    Operations: List[Operations]


class ProfileUserData(BaseModel):
    firstName: Optional[str] = None
    lastName: str
    preferredLanguage: str


class PatchUser2faRequest(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    Operations: List[Operations]


# class Operations(BaseModel):
#     op: str
#     path: str
#     value: str


class SignUpResponse(ResponseModel):
    data: Optional[IBMUserCreateResponse] = None


class EmailItem(BaseModel):
    type: str
    value: EmailStr


class Meta(BaseModel):
    created: datetime
    location: str
    lastModified: datetime
    resourceType: str


class Name(BaseModel):
    formatted: str
    familyName: str
    givenName: Optional[str]


class IBMExtension(BaseModel):
    pwdReset: bool
    userCategory: str
    twoFactorAuthentication: bool
    realm: str
    pwdChangedTime: datetime

class CustomAttributes(BaseModel):
    name: str
    values: List[str]

class CustomAttributeValues(BaseModel):
    pwdReset: bool
    userCategory: str
    twoFactorAuthentication : bool
    realm: str
    pwdChangedTime:str
    customAttributes: List[CustomAttributes]

class ProfileGetResponseData(BaseModel):
    emails: List[EmailItem]
    preferredLanguage: Optional[str] = None
    meta: Meta
    name: Optional[Name] = None
    active: bool
    id: str
    userName: EmailStr
    customAttributes: CustomAttributeValues = Field(
        default_factory=CustomAttributeValues,
        alias="urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
    )

    class Config:
        populate_by_name = True


class ProfileResponse(ResponseModel):
    data: Optional[ProfileGetResponseData]


# Signin Schema


class IBMUsernamePasswordAuthRequestData(BaseModel):
    username: EmailStr  # Lowercase username is required here -> https://docs.verify.ibm.com/verify/reference/authenticatewithpassword. Signup request requires userName in camelCase
    password: str


class AuthenticatedUserData(BaseModel):
    id: str
    assertion: str


class AuthenticatedUserResponse(ResponseModel):
    data: AuthenticatedUserData


class TwoFactorEnrollmentType(str, Enum):
    SMS = "sms"
    VOICE = "voice"


class TwoFactorEnrollmentUserData(BaseModel):
    userId: str
    phoneNumber: PhoneNumber
    enrollmentType: TwoFactorEnrollmentType


class TwofactorEnrollmentResponse(BaseModel):
    id: str
    userId: str
    type: str
    created: str
    updated: str
    enabled: bool
    validated: bool
    attributes: dict[str, str]


class VerifiedTwofactorEnrollmentResponse(ResponseModel):
    data: TwofactorEnrollmentResponse
