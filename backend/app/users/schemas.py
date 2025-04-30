from typing import List, Any, Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from app.utils.schemas import ResponseModel
from enum import Enum


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
        default=False, description="Notify the user the password they entered. Setting to true will send a email with the password they entered")
    notifyType: NotifyType = Field(
        default=NotifyType.EMAIL, description="Setting to NONE will not send any notification, Setting the value to EMAIL will send a notification email to the user that the account was created")


class IBMUserCreateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True,
                              validate_by_name=True)

    schemas: List[str] = ["urn:ietf:params:scim:schemas:core:2.0:User",
                          "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification"]
    userName: str
    emails: List[EmailModel]
    password: str
    active: bool = True
    notification: IBMNotificationExtension = Field(
        default_factory=IBMNotificationExtension,
        alias="urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification")


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
