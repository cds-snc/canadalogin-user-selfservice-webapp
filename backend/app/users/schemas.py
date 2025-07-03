from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from app.utils.schemas import ResponseModel


class UserLoginRequestData(BaseModel):
    userName: EmailStr
    password: str
    trxnId: str


class NewUserCreationData(BaseModel):
    userName: EmailStr
    password: str
    trxnId: str


class NotifyType(str, Enum):
    EMAIL = "EMAIL"
    NONE = "NONE"


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


class ProfileGetResponseData(BaseModel):
    emails: List[EmailItem]
    preferredLanguage: Optional[str] = None
    meta: Meta
    name: Optional[Name] = None
    active: bool
    id: str
    userName: EmailStr

    class Config:
        populate_by_name = True


class ProfileResponse(ResponseModel):
    data: Optional[ProfileGetResponseData]
