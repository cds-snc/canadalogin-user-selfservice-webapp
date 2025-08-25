from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.utils.schemas import ResponseModel
from app.password.schemas import OtpType


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


class MetaDataTypeValue(BaseModel):
    type: Optional[str] = None
    value: Optional[str] = None


class SCIMUserDetails(BaseModel):
    emailVerified: Optional[str] = None
    lastLogin: Optional[str] = None
    lastMFA: Optional[List[MetaDataTypeValue]] = None
    twoFactorAuthentication: Optional[bool] = None
    pwdChangedTime: Optional[str] = None


class Meta(BaseModel):
    created: datetime
    location: str
    lastModified: datetime
    resourceType: str


class UserProfileName(BaseModel):
    formatted: Optional[str] = None
    familyName: Optional[str] = None
    givenName: Optional[str] = None


class ProfileGetResponseData(BaseModel):
    emails: List[EmailItem] = None
    preferredLanguage: Optional[str] = None
    meta: Meta
    name: Optional[UserProfileName] = None
    active: bool
    id: str
    userName: EmailStr
    phoneNumbers: Optional[List[MetaDataTypeValue]] = None
    details: Optional[SCIMUserDetails] = Field(
        default=None,
        validation_alias="urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        serialization_alias="details",
    )
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class ProfilePUTData(BaseModel):
    schemas: List[str] = Field(
        default=[
            "urn:ietf:params:scim:schemas:core:2.0:User",
            "urn:ietf:params:scim:schemas:extension:ibm:2.0:User",
        ]
    )
    preferredLanguage: Optional[str] = None
    name: Optional[UserProfileName] = None
    userName: EmailStr
    phoneNumbers: Optional[List[MetaDataTypeValue]] = None
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)


class ProfileResponse(ResponseModel):
    data: Optional[ProfileGetResponseData]


class RelyingPartyInfo(BaseModel):
    icon: str
    id: str
    linkName: str
    url: str


class RelyingPartyResponse(ResponseModel):
    data: Optional[RelyingPartyInfo]


class Attributes(BaseModel):
    phoneNumber: Optional[str] = None

    class Config:
        extra = 'allow'


class Factor(BaseModel):
    id: str
    userId: str
    type: str
    created: datetime
    updated: datetime
    attempted: datetime
    enabled: bool
    validated: bool
    attributes: Attributes


class UserAuthFactorsIbmResponse(BaseModel):
    factors: List[Factor]
    count: int
    limit: int
    page: int
    total: int


class UserPhoneOTP(BaseModel):
    type: OtpType
    phoneNumber: str


class UserPhoneOTPFactors(BaseModel):
    factors: list[UserPhoneOTP]


class UserPhoneAuthFactorsResponse(ResponseModel):
    data: list[UserPhoneOTP]
