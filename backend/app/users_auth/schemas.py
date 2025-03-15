from typing import List, Any, Optional
from pydantic import BaseModel, Field, EmailStr
from app.utils.schemas import ResponseModel


class EmailModel(BaseModel):
    value: str
    type: str = "work"


class CoreUser(BaseModel):
    schemas: List[str] = ["urn:ietf:params:scim:schemas:core:2.0:User"]
    userName: str
    emails: List[EmailModel]
    password: str
    active: bool = True


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class IBMCreateUserResponse(BaseModel):
    userName: str
    id: str


class SignUpResponse(ResponseModel):
    data: Optional[IBMCreateUserResponse] = None
